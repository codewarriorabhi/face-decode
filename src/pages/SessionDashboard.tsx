import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Clock, Share2, Copy, Check, Link2, Loader2,
  AlertCircle, Users, BarChart3, Activity, Sparkles, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EmotionBadge from "@/components/EmotionBadge";
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isPast, format } from "date-fns";

type EmotionEntry = {
  id: string;
  emotion: string;
  confidence: number;
  date_time: string;
};

type Phase = "loading" | "invalid" | "live" | "expired";

const EMOTION_COLORS: Record<string, string> = {
  happy: "hsl(45 95% 55%)",
  sad: "hsl(220 75% 55%)",
  angry: "hsl(0 85% 55%)",
  neutral: "hsl(220 10% 55%)",
  surprised: "hsl(30 95% 55%)",
};

const EMOTION_EMOJI: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  neutral: "😐",
  surprised: "😲",
};

const SessionDashboard = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionData, setSessionData] = useState<any>(null);
  const [emotionLog, setEmotionLog] = useState<EmotionEntry[]>([]);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [copied, setCopied] = useState(false);

  const captureUrl = `${window.location.origin}/session/${sessionId}`;

  // Load session + initial emotion data
  useEffect(() => {
    if (!sessionId) { setPhase("invalid"); return; }

    const load = async () => {
      const [{ data: session, error: sessionError }, { data: history }] = await Promise.all([
        (supabase as any).from("sessions").select("*").eq("session_id", sessionId).single(),
        (supabase as any)
          .from("emotion_history")
          .select("*")
          .filter("session_id", "eq", sessionId)
          .order("date_time", { ascending: true }),
      ]);

      if (sessionError || !session) { setPhase("invalid"); return; }

      setSessionData(session);
      setEmotionLog(history || []);
      setPhase(isPast(new Date(session.expires_at)) ? "expired" : "live");
    };

    load();
  }, [sessionId]);

  // Countdown timer
  useEffect(() => {
    if (!sessionData || ["loading", "invalid"].includes(phase)) return;

    const tick = () => {
      const expiresAt = new Date(sessionData.expires_at);
      if (isPast(expiresAt)) {
        setPhase("expired");
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

  // Realtime subscription
  useEffect(() => {
    if (!sessionId || phase === "invalid" || phase === "loading") return;

    const channel = supabase
      .channel(`dashboard-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emotion_history",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const entry = payload.new as EmotionEntry;
          setEmotionLog((prev) => [...prev, entry]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, phase]);

  // ─── Derived analytics ───
  const latestEmotion = useMemo(() => {
    if (emotionLog.length === 0) return null;
    return emotionLog[emotionLog.length - 1];
  }, [emotionLog]);

  const distribution = useMemo(() => {
    if (emotionLog.length === 0) return [];
    const counts: Record<string, number> = {};
    emotionLog.forEach((e) => {
      const em = e.emotion.toLowerCase();
      counts[em] = (counts[em] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([emotion, count]) => ({
        emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        emotionKey: emotion,
        count,
        percentage: Math.round((count / emotionLog.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [emotionLog]);

  const timelineData = useMemo(() => {
    // Last 20 detections as timeline
    return emotionLog.slice(-20).map((e, i) => ({
      index: i + 1,
      label: format(new Date(e.date_time), "HH:mm:ss"),
      emotion: e.emotion.charAt(0).toUpperCase() + e.emotion.slice(1),
      confidence: Math.round(e.confidence * 100),
      ...Object.fromEntries(
        ["happy", "sad", "angry", "neutral", "surprised"].map((em) => [
          em,
          e.emotion.toLowerCase() === em ? Math.round(e.confidence * 100) : 0,
        ])
      ),
    }));
  }, [emotionLog]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(captureUrl);
    setCopied(true);
    toast.success("Share link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── States ───
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
          <h1 className="text-2xl font-display font-bold mb-3">Session Not Found</h1>
          <p className="text-muted-foreground">This dashboard link is invalid or the session doesn't exist.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold">EmotionAI</span>
              <span className="hidden sm:inline text-muted-foreground text-sm ml-2">
                · Session Dashboard
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {phase === "live" && timeRemaining && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium">
                <Clock className="w-3.5 h-3.5" />
                {timeRemaining}
              </div>
            )}
            {phase === "expired" && (
              <div className="px-3 py-1.5 rounded-full bg-secondary border border-border text-xs text-muted-foreground">
                Session Ended
              </div>
            )}
            {phase === "live" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                LIVE
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs uppercase tracking-widest text-primary font-medium">Live Dashboard</span>
                </div>
                <h1 className="text-3xl font-display font-bold">
                  Session{" "}
                  <span className="font-mono text-primary">{sessionId}</span>
                </h1>
              </div>

              {/* Share link card */}
              <div className="flex items-center gap-2 p-3 rounded-xl glass-card border border-border">
                <div className="flex-1 font-mono text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-[220px]">
                  {captureUrl}
                </div>
                <Button size="sm" variant="outline" onClick={copyToClipboard} className="gap-1.5 shrink-0">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open(captureUrl, "_blank")} className="shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stat cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            {[
              {
                label: "Total Detections",
                value: emotionLog.length,
                icon: Activity,
              },
              {
                label: "Most Common",
                value: distribution[0]
                  ? `${EMOTION_EMOJI[distribution[0].emotionKey] || "🎭"} ${distribution[0].emotion}`
                  : "—",
                icon: Sparkles,
              },
              {
                label: "Top Confidence",
                value: emotionLog.length
                  ? `${Math.round(Math.max(...emotionLog.map((e) => e.confidence)) * 100)}%`
                  : "—",
                icon: BarChart3,
              },
              {
                label: "Status",
                value: phase === "live" ? "Live" : "Ended",
                icon: Users,
                highlight: phase === "live",
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className={`glass-card rounded-xl p-5 ${card.highlight ? "border-primary/30 glow-border" : ""}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                </div>
                <p className="text-2xl font-display font-bold">{card.value}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Current + Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Latest emotion */}
              <AnimatePresence>
                {latestEmotion && (
                  <motion.div
                    key={latestEmotion.date_time}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-xl p-5 glow-border flex items-center gap-5"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl shrink-0">
                      {EMOTION_EMOJI[latestEmotion.emotion.toLowerCase()] || "🎭"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                        Latest Detection
                      </p>
                      <div className="flex items-center gap-3 mb-2">
                        <EmotionBadge
                          emotion={latestEmotion.emotion.charAt(0).toUpperCase() + latestEmotion.emotion.slice(1)}
                          size="lg"
                        />
                        <span className="text-2xl font-display font-bold text-primary">
                          {Math.round(latestEmotion.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(latestEmotion.date_time), "HH:mm:ss")}
                      </p>
                    </div>
                    {phase === "live" && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/10 text-xs text-destructive">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                        Live
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Emotion timeline chart */}
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-display font-semibold mb-1">Emotion Trends</h3>
                <p className="text-xs text-muted-foreground mb-4">Last 20 detection snapshots</p>

                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={timelineData}>
                      <defs>
                        {["happy", "sad", "angry", "neutral", "surprised"].map((em) => (
                          <linearGradient key={em} id={`grad-${em}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={EMOTION_COLORS[em]} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={EMOTION_COLORS[em]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="index" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="%" />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                      />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      {["happy", "sad", "angry", "neutral", "surprised"].map((em) => (
                        <Area
                          key={em}
                          type="monotone"
                          dataKey={em}
                          name={em.charAt(0).toUpperCase() + em.slice(1)}
                          stroke={EMOTION_COLORS[em]}
                          fill={`url(#grad-${em})`}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <Activity className="w-8 h-8 opacity-30" />
                    <p className="text-sm">Waiting for emotion data…</p>
                    <p className="text-xs">Share the capture link to start tracking</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Distribution + Log */}
            <div className="space-y-6">
              {/* Pie chart */}
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-display font-semibold mb-1">Emotion Distribution</h3>
                <p className="text-xs text-muted-foreground mb-4">Session totals</p>

                {distribution.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <Pie
                          data={distribution}
                          dataKey="count"
                          nameKey="emotion"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          strokeWidth={2}
                          stroke="hsl(var(--background))"
                        >
                          {distribution.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={EMOTION_COLORS[entry.emotionKey] || "hsl(var(--muted))"}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: number, name: string) => [`${val} detections`, name]}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-2 mt-2">
                      {distribution.map((d) => (
                        <div key={d.emotionKey} className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: EMOTION_COLORS[d.emotionKey] || "hsl(var(--muted))" }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium">
                                {EMOTION_EMOJI[d.emotionKey] || "🎭"} {d.emotion}
                              </span>
                              <span className="text-xs text-muted-foreground">{d.percentage}%</span>
                            </div>
                            <div className="h-1 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${d.percentage}%`,
                                  background: EMOTION_COLORS[d.emotionKey] || "hsl(var(--muted))",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[170px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <BarChart3 className="w-7 h-7 opacity-30" />
                    <p className="text-xs">No data yet</p>
                  </div>
                )}
              </div>

              {/* Recent detections log */}
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-display font-semibold mb-4">Detection Log</h3>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {emotionLog.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No detections yet
                    </p>
                  ) : (
                    [...emotionLog].reverse().slice(0, 20).map((entry, i) => (
                      <motion.div
                        key={entry.date_time + i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/40"
                      >
                        <span className="text-base">
                          {EMOTION_EMOJI[entry.emotion] || "🎭"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium capitalize">{entry.emotion}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(entry.date_time), "HH:mm:ss")}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-primary">
                          {Math.round(entry.confidence * 100)}%
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SessionDashboard;
