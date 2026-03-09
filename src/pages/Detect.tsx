import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Loader2, RotateCcw, Video, ImagePlus, Sparkles, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import EmotionBadge from "@/components/EmotionBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type EmotionResult = {
  emotion: string;
  confidence: number;
};

const EMOTIONS = ["Happy", "Sad", "Angry", "Neutral", "Surprised"];

const analyzeImage = async (imageBase64: string): Promise<EmotionResult[]> => {
  const { data, error } = await supabase.functions.invoke("emotion-detect", {
    body: { image: imageBase64 },
  });

  if (error) throw new Error(error.message || "Analysis failed");
  if (data?.error) throw new Error(data.error);

  if (!data?.face_detected) {
    toast.warning("No face detected in the image. Try a clearer photo.");
  }

  // Map API response to our format (API returns 0-1, we want 0-100)
  return (data.all_emotions || []).map((e: { emotion: string; confidence: number }) => ({
    emotion: e.emotion.charAt(0).toUpperCase() + e.emotion.slice(1),
    confidence: Math.round(e.confidence * 100),
  }));
};

const Detect = () => {
  const [mode, setMode] = useState<"webcam" | "upload">("webcam");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<EmotionResult[] | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setWebcamActive(true);
        setCapturedImage(null);
        setResults(null);
      }
    } catch {
      toast.error("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setWebcamActive(false);
    }
  }, []);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);
    stopWebcam();
    runAnalysis(dataUrl);
  };

  const runAnalysis = async (imageData?: string) => {
    const image = imageData || uploadedImage;
    if (!image) {
      toast.error("No image to analyze.");
      return;
    }
    setIsAnalyzing(true);
    setResults(null);
    try {
      const emotionResults = await analyzeImage(image);
      setResults(emotionResults);

      // Save dominant result to database
      if (emotionResults.length > 0) {
        const dominant = emotionResults[0];
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("emotion_history").insert({
            user_id: user.id,
            emotion: dominant.emotion.toLowerCase(),
            confidence: dominant.confidence / 100,
          });
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setResults(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setResults(null);
    setUploadedImage(null);
    setCapturedImage(null);
    stopWebcam();
  };

  const currentImage = mode === "webcam" ? capturedImage : uploadedImage;
  const dominant = results?.[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <canvas ref={canvasRef} className="hidden" />

      <main className="pt-20 pb-10 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-widest text-primary font-medium">AI-Powered</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold">Emotion Detection</h1>
            <p className="text-muted-foreground mt-1">Detect facial emotions in real-time via webcam or by uploading a photo.</p>
          </motion.div>

          {/* Mode tabs */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-2 mb-6">
            <Button
              variant={mode === "webcam" ? "default" : "outline"}
              onClick={() => { setMode("webcam"); reset(); }}
              className={mode === "webcam" ? "bg-primary text-primary-foreground gap-2" : "gap-2"}
            >
              <Video className="w-4 h-4" /> Webcam Detection
            </Button>
            <Button
              variant={mode === "upload" ? "default" : "outline"}
              onClick={() => { setMode("upload"); reset(); }}
              className={mode === "upload" ? "bg-primary text-primary-foreground gap-2" : "gap-2"}
            >
              <ImagePlus className="w-4 h-4" /> Image Upload
            </Button>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* ─── Left: Input Area ─── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-3"
            >
              <div className="glass-card rounded-2xl overflow-hidden glow-border">
                {mode === "webcam" ? (
                  <div className="aspect-video bg-secondary/30 relative flex items-center justify-center overflow-hidden">
                    {/* Live video */}
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`w-full h-full object-cover ${webcamActive ? "block" : "hidden"}`}
                    />
                    {/* Captured still */}
                    {capturedImage && !webcamActive && (
                      <img src={capturedImage} alt="Captured frame" className="w-full h-full object-cover" />
                    )}
                    {/* Webcam overlay: face guide */}
                    {webcamActive && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-48 h-60 md:w-56 md:h-72 rounded-[50%] border-2 border-dashed border-primary/40" />
                        </div>
                        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/90 text-destructive-foreground text-xs font-medium">
                          <CircleDot className="w-3 h-3 animate-pulse" /> LIVE
                        </div>
                      </>
                    )}
                    {/* Placeholder */}
                    {!webcamActive && !capturedImage && (
                      <div className="text-center p-8">
                        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-5">
                          <Camera className="w-9 h-9 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground font-medium mb-2">Camera feed will appear here</p>
                        <p className="text-xs text-muted-foreground mb-6">Position your face within the guide for best results</p>
                        <Button onClick={startWebcam} size="lg" className="bg-primary text-primary-foreground gap-2">
                          <Camera className="w-4 h-4" /> Start Camera
                        </Button>
                      </div>
                    )}
                    {/* Controls */}
                    {webcamActive && (
                      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                        <Button onClick={captureFrame} disabled={isAnalyzing} size="lg" className="flex-1 bg-primary text-primary-foreground gap-2">
                          {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Capture & Detect</>}
                        </Button>
                        <Button variant="outline" onClick={() => { stopWebcam(); setCapturedImage(null); }} size="icon" className="h-11 w-11 bg-card/80 backdrop-blur">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {/* Recapture */}
                    {capturedImage && !webcamActive && !isAnalyzing && (
                      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                        <Button onClick={startWebcam} size="lg" variant="outline" className="flex-1 bg-card/80 backdrop-blur gap-2">
                          <RotateCcw className="w-4 h-4" /> Retake
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`aspect-video bg-secondary/30 relative flex items-center justify-center overflow-hidden transition-colors ${dragOver ? "bg-primary/5 ring-2 ring-primary/30 ring-inset" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    {uploadedImage ? (
                      <>
                        <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-contain p-2" />
                        <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                          <Button onClick={() => runAnalysis()} disabled={isAnalyzing} size="lg" className="flex-1 bg-primary text-primary-foreground gap-2">
                            {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Detect Emotion</>}
                          </Button>
                          <Button variant="outline" onClick={reset} size="icon" className="h-11 w-11 bg-card/80 backdrop-blur">
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div
                        className="text-center p-8 cursor-pointer w-full h-full flex flex-col items-center justify-center group"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/10 transition-colors">
                          <Upload className="w-9 h-9 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-muted-foreground font-medium mb-2">
                          {dragOver ? "Drop your image here" : "Drag & drop an image or click to browse"}
                        </p>
                        <p className="text-xs text-muted-foreground">Supports JPG, PNG, WebP • Max 10MB</p>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* ─── Right: Results Panel ─── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
                <h3 className="font-display font-semibold text-lg mb-1">Detection Results</h3>
                <p className="text-xs text-muted-foreground mb-5">Confidence scores for detected emotions</p>

                <AnimatePresence mode="wait">
                  {isAnalyzing ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center py-10"
                    >
                      <div className="relative mb-5">
                        <div className="w-16 h-16 rounded-full border-2 border-primary/20" />
                        <Loader2 className="w-16 h-16 text-primary animate-spin absolute inset-0" />
                      </div>
                      <p className="text-muted-foreground text-sm font-medium">Detecting facial expressions...</p>
                      <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
                    </motion.div>
                  ) : results ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex-1 flex flex-col"
                    >
                      {/* Dominant result card */}
                      {dominant && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                          className="rounded-xl bg-primary/5 border border-primary/15 p-5 mb-5 text-center"
                        >
                          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Emotion Detected</p>
                          <EmotionBadge emotion={dominant.emotion} size="lg" />
                          <div className="mt-3">
                            <span className="text-3xl font-display font-bold text-primary">{dominant.confidence}%</span>
                            <p className="text-xs text-muted-foreground mt-0.5">Confidence Score</p>
                          </div>
                        </motion.div>
                      )}

                      {/* All emotions breakdown */}
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Full Breakdown</p>
                      <div className="space-y-3 flex-1">
                        {results.map((r, i) => (
                          <motion.div
                            key={r.emotion}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.06 }}
                            className="flex items-center gap-3"
                          >
                            <div className="w-20 shrink-0">
                              <EmotionBadge emotion={r.emotion} size="sm" />
                            </div>
                            <div className="flex-1">
                              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${r.confidence}%` }}
                                  transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease: "easeOut" }}
                                  className={`h-full rounded-full ${i === 0 ? "bg-primary" : "bg-primary/40"}`}
                                />
                              </div>
                            </div>
                            <span className={`text-sm font-mono font-semibold w-12 text-right ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                              {r.confidence}%
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Timestamp */}
                      <div className="mt-5 pt-4 border-t border-border text-center">
                        <p className="text-[10px] text-muted-foreground">
                          Analyzed at {new Date().toLocaleTimeString()} • {mode === "webcam" ? "Webcam capture" : "Image upload"}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-1 flex flex-col items-center justify-center py-10 text-center"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                        <Sparkles className="w-7 h-7 text-muted-foreground/40" />
                      </div>
                      <p className="text-muted-foreground font-medium text-sm mb-1">No results yet</p>
                      <p className="text-xs text-muted-foreground max-w-[200px]">
                        {mode === "webcam"
                          ? "Start the camera and capture a frame to detect emotions"
                          : "Upload an image and click detect to analyze emotions"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Supported emotions legend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 glass-card rounded-xl p-5"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Supported Emotions</p>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((e) => (
                <EmotionBadge key={e} emotion={e} size="md" />
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Detect;
