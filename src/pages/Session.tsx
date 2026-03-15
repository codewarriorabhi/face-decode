import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Brain, Shield, Clock, AlertCircle, Loader2,
  CheckCircle2, Eye, CircleDot, RotateCcw, Scan,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EmotionBadge from "@/components/EmotionBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow, isPast } from "date-fns";

type Phase =
  | "loading"
  | "invalid"
  | "consent"
  | "requesting-camera"
  | "detecting"
  | "expired";

type EmotionResult = { emotion: string; confidence: number };

const EMOTION_EMOJI: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  neutral: "😐",
  surprised: "😲",
};

const Session = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionData, setSessionData] = useState<any>(null);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionResult | null>(null);
  const [recentEmotions, setRecentEmotions] = useState<EmotionResult[]>([]);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [totalDetections, setTotalDetections] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isDetectingRef = useRef(false);

  // Load session
  useEffect(() => {
    if (!sessionId) { setPhase("invalid"); return; }

    const load = async () => {
      const { data, error } = await (supabase as any)
        .from("sessions")
        .select("*")
        .eq("session_id", sessionId)
        .single();

      if (error || !data) { setPhase("invalid"); return; }

      setSessionData(data);
      if (isPast(new Date(data.expires_at))) {
        setPhase("expired");
      } else {
        setPhase("consent");
      }
    };

    load();
  }, [sessionId]);

  // Countdown timer
  useEffect(() => {
    if (!sessionData || ["loading", "invalid", "expired"].includes(phase)) return;

    const tick = () => {
      const expiresAt = new Date(sessionData.expires_at);
      if (isPast(expiresAt)) {
        setPhase("expired");
        stopWebcam();
        return;
      }
      const diffMs = expiresAt.getTime() - Date.now();
      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      setTimeRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionData, phase]);

  const stopWebcam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startWebcam = useCallback(async () => {
    setPhase("requesting-camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user", 
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setPhase("detecting");
      }
    } catch {
      toast.error("Camera access denied. Please allow camera permissions to continue.");
      setPhase("consent");
    }
  }, []);

  const runDetection = useCallback(async () => {
    if (isDetectingRef.current || !videoRef.current || !canvasRef.current) return;
    if (!videoRef.current.videoWidth) return;

    isDetectingRef.current = true;
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.7);

      const { data, error } = await supabase.functions.invoke("emotion-detect", {
        body: { image: imageData },
      });

      if (error || !data) return;
      if (!data.face_detected) return;

      const all: Array<{ emotion: string; confidence: number }> = data.all_emotions || [];
      if (all.length === 0) return;

      const top = all[0];
      const emotion = top.emotion.charAt(0).toUpperCase() + top.emotion.slice(1);
      const confidence = Math.round(top.confidence * 100);

      setCurrentEmotion({ emotion, confidence });
      setRecentEmotions((prev) => [{ emotion, confidence }, ...prev].slice(0, 5));
      setTotalDetections((n) => n + 1);

      // Save to DB (anonymous session insert — no user_id)
      await (supabase as any).from("emotion_history").insert({
        session_id: sessionId,
        emotion: top.emotion,
        confidence: top.confidence,
      });
    } catch (e) {
      console.error("Detection error:", e);
    } finally {
      isDetectingRef.current = false;
    }
  }, [sessionId]);

  // Detection interval: every 3 seconds
  useEffect(() => {
    if (phase !== "detecting") return;
    const id = setInterval(runDetection, 3000);
    return () => clearInterval(id);
  }, [phase, runDetection]);

  // Cleanup
  useEffect(() => () => stopWebcam(), [stopWebcam]);

  // ─── Render phases ───

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
      </div>
    );
  }

  if (phase === "invalid") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-12 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-3">Invalid Link</h1>
          <p className="text-muted-foreground">
            This emotion tracking link doesn't exist or has been removed.
          </p>
        </motion.div>
      </div>
    );
  }

  if (phase === "expired") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-12 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-3">Session Ended</h1>
          <p className="text-muted-foreground mb-4">
            Emotion tracking session has ended. This link has expired.
          </p>
          <div className="px-4 py-3 rounded-xl bg-secondary/60 border border-border text-sm text-muted-foreground">
            Session ID: <span className="font-mono font-semibold text-foreground">{sessionId}</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === "consent") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">EmotionAI</h1>
            <p className="text-muted-foreground text-sm">Emotion Tracking Session</p>
          </div>

          <div className="glass-card rounded-2xl p-6 mb-4 glow-border">
            <p className="font-semibold text-center mb-5 leading-relaxed">
              EmotionAI wants to analyze facial expressions to measure emotional reactions during conversation.
            </p>

            <div className="space-y-3 mb-6">
              {[
                { icon: Eye, text: "This tool analyzes facial expressions for emotional insights." },
                { icon: Shield, text: "No personal identity data is stored. Only emotion labels and confidence." },
                { icon: Clock, text: "Session expires automatically in 30 minutes or when camera stops." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                  <item.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col mobile:flex-row gap-3">
              <Button
                onClick={startWebcam}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                size="lg"
              >
                <Camera className="w-4 h-4" /> Allow Camera
              </Button>
              <Button
                variant="outline"
                onClick={startWebcam}
                className="flex-1 gap-2"
                size="lg"
              >
                Continue
              </Button>
            </div>
          </div>

          {/* Session info */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/40 border border-border text-xs text-muted-foreground">
            <span>Session: <span className="font-mono font-semibold text-foreground">{sessionId}</span></span>
            {timeRemaining && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {timeRemaining} remaining
              </span>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === "requesting-camera") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Requesting camera access…</p>
        </motion.div>
      </div>
    );
  }

  // Detecting phase
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <canvas ref={canvasRef} className="hidden" />

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">EmotionAI</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {timeRemaining && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {timeRemaining}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <CircleDot className="w-3.5 h-3.5 text-destructive animate-pulse" />
              LIVE
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-14 flex flex-col laptop:flex-row overflow-hidden">
        {/* Webcam panel */}
        <div className="flex-1 relative bg-secondary/30 min-h-[50vh] laptop:min-h-0">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Face guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-40 mobile:w-40 mobile:h-52 tablet:w-48 tablet:h-60 laptop:w-56 laptop:h-72 rounded-[50%] border-2 border-dashed border-primary/50" />
          </div>

          {/* Scanning indicator */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur text-xs font-medium border border-border">
            <Scan className="w-3.5 h-3.5 text-primary animate-pulse" />
            Scanning every 3s
          </div>
        </div>

        {/* Results panel */}
        <div className="laptop:w-80 desktop:w-96 bg-background border-t laptop:border-t-0 laptop:border-l border-border p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Current emotion */}
          <div className="glass-card rounded-xl p-5 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              Current Emotion
            </p>
            <AnimatePresence mode="wait">
              {currentEmotion ? (
                <motion.div
                  key={currentEmotion.emotion}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-4xl mobile:text-5xl mb-3">
                    {EMOTION_EMOJI[currentEmotion.emotion.toLowerCase()] || "🎭"}
                  </span>
                  <EmotionBadge emotion={currentEmotion.emotion} size="lg" />
                  <div className="mt-3">
                    <span className="text-3xl font-display font-bold text-primary">
                      {currentEmotion.confidence}%
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">Confidence</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-4"
                >
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                    <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                  </div>
                  <p className="text-sm text-muted-foreground">Detecting emotions…</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stats */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Detections</span>
              <span className="font-display font-bold text-primary">{totalDetections}</span>
            </div>
          </div>

          {/* Recent emotions */}
          {recentEmotions.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
                Recent
              </p>
              <div className="space-y-2">
                {recentEmotions.map((e, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-lg">{EMOTION_EMOJI[e.emotion.toLowerCase()] || "🎭"}</span>
                    <EmotionBadge emotion={e.emotion} size="sm" />
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${e.confidence}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono w-9 text-right">
                      {e.confidence}%
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy notice */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/40 border border-border">
            <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              No identity data is stored. Only emotion labels. Session ends automatically.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Session;
