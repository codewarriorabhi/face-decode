import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Link2, Copy, Check, Share2, ArrowRight,
  Sparkles, Clock, Shield, Loader2, BarChart3, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Phase = "initial" | "generating" | "generated";

const SHARE_PLATFORMS = [
  {
    name: "WhatsApp",
    color: "hsl(142 70% 45%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    getUrl: (url: string) =>
      `https://wa.me/?text=${encodeURIComponent(`🎭 Join my live emotion tracking session on EmotionAI!\n\nOpen this link to start: ${url}\n\nNo sign-up required. Your camera detects emotions in real-time!`)}`,
  },
  {
    name: "Telegram",
    color: "hsl(200 85% 55%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    getUrl: (url: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent("🎭 Join my live emotion tracking session on EmotionAI! No sign-up required.")}`,
  },
  {
    name: "Facebook",
    color: "hsl(220 80% 52%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    getUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "Instagram",
    color: "hsl(340 82% 52%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    getUrl: () => null, // Instagram: copy link instead
  },
  {
    name: "X / Twitter",
    color: "hsl(0 0% 8%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
    getUrl: (url: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent("🎭 Join my live emotion tracking session on EmotionAI! No sign-up required.")}`,
  },
];

const Generate = () => {
  const [phase, setPhase] = useState<Phase>("initial");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateSessionId = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  const handleGenerate = async () => {
    setPhase("generating");
    const newId = generateSessionId();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    try {
      const { error } = await (supabase as any)
        .from("sessions")
        .insert({ session_id: newId, expires_at: expiresAt.toISOString(), status: "active" });

      if (error) throw error;
      setSessionId(newId);
      setPhase("generated");

      // Automatically open the tracking link so the user can immediately see the camera view.
      const redirectUrl = `${window.location.origin}/session/${newId}`;
      window.open(redirectUrl, "_blank");
    } catch (err: any) {
      toast.error("Failed to generate link. Please try again.");
      setPhase("initial");
    }
  };

  const captureUrl = sessionId
    ? `${window.location.origin}/session/${sessionId}`
    : "";
  const dashboardUrl = sessionId
    ? `${window.location.origin}/session/${sessionId}/dashboard`
    : "";

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: (typeof SHARE_PLATFORMS)[0]) => {
    const url = platform.getUrl ? platform.getUrl(captureUrl) : null;
    if (!url) {
      // Instagram: copy link
      copyToClipboard(captureUrl);
      toast.info("Link copied! Paste it in Instagram DM or Story.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/60 text-sm text-muted-foreground mb-6">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              No account required
            </div>
            <h1 className="text-3xl mobile:text-4xl tablet:text-5xl font-display font-bold mb-4">
              Emotion Tracking{" "}
              <span className="gradient-text">Share Link</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Generate a unique link. Share it. Watch live emotional reactions in
              real-time — no login needed.
            </p>
          </motion.div>

          {/* Info badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {[
              { icon: Clock, label: "30 min session" },
              { icon: Shield, label: "No identity stored" },
              { icon: Share2, label: "Share anywhere" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 border border-border text-sm text-muted-foreground"
              >
                <item.icon className="w-3.5 h-3.5 text-primary" />
                {item.label}
              </div>
            ))}
          </motion.div>

          {/* Main Card */}
          <AnimatePresence mode="wait">
            {phase !== "generated" ? (
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="glass-card rounded-2xl p-8 md:p-12 text-center glow-border relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.04),transparent_70%)]" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Link2 className="w-9 h-9 text-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-3">
                    Create Emotion Tracking Link
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                    Click below to generate your unique tracking link. Share it
                    with anyone — they'll be asked for camera access to track
                    emotions live.
                  </p>

                  <Button
                    size="lg"
                    onClick={handleGenerate}
                    disabled={phase === "generating"}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-10 h-13 text-base"
                  >
                    {phase === "generating" ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Tracking Link
                      </>
                    )}
                  </Button>

                  {/* Features list */}
                  <div className="mt-10 grid grid-cols-1 mobile:grid-cols-3 gap-4 text-center">
                    {[
                      { icon: Brain, text: "AI-powered detection" },
                      { icon: BarChart3, text: "Live dashboard" },
                      { icon: Shield, text: "Auto-expires in 30m" },
                    ].map((f) => (
                      <div key={f.text} className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                          <f.icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-xs leading-tight">{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Success header */}
                <div className="glass-card rounded-2xl p-6 glow-border text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-1">Link Generated!</h2>
                  <p className="text-muted-foreground text-sm">
                    Session ID: <span className="font-mono text-foreground font-semibold">{sessionId}</span>
                    <span className="ml-2 text-xs text-muted-foreground">· Expires in 30 min</span>
                  </p>
                </div>

                {/* Capture link */}
                <div className="glass-card rounded-2xl p-6">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
                    Share with others — they open this link
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/60 border border-border font-mono text-sm text-foreground overflow-hidden">
                      <Link2 className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">{captureUrl}</span>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(captureUrl)}
                      variant="outline"
                      className="shrink-0 gap-2"
                    >
                      {copied ? (
                        <><Check className="w-4 h-4" /> Copied</>
                      ) : (
                        <><Copy className="w-4 h-4" /> Copy</>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Share buttons */}
                <div className="glass-card rounded-2xl p-6">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">
                    Share via
                  </p>
                  <div className="grid grid-cols-3 tablet:grid-cols-5 gap-3">
                    {SHARE_PLATFORMS.map((platform) => (
                      <button
                        key={platform.name}
                        onClick={() => handleShare(platform)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary/80 hover:border-primary/30 transition-all duration-200 group"
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground group-hover:scale-110 transition-transform"
                          style={{ background: `${platform.color}22`, color: platform.color }}
                        >
                          {platform.icon}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium leading-tight text-center">
                          {platform.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dashboard link */}
                <div className="glass-card rounded-2xl p-6 border border-primary/20 bg-primary/5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold mb-1">Your Live Dashboard</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Watch real-time emotions as your recipients use the link. See charts, timelines, and live updates.
                      </p>
                      <div className="flex gap-2">
                        <Link to={`/session/${sessionId}/dashboard`} className="flex-1">
                          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                            Open Dashboard <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(dashboardUrl, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generate another */}
                <div className="text-center pt-2">
                  <button
                    onClick={() => { setPhase("initial"); setSessionId(null); setCopied(false); }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                  >
                    Generate another link
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Generate;
