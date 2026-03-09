import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Camera, Upload, BarChart3, Shield, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const features = [
  { icon: Camera, title: "Real-Time Detection", description: "Analyze emotions from your webcam feed with instant AI-powered recognition." },
  { icon: Upload, title: "Image Upload", description: "Upload any photo to detect emotions across multiple faces simultaneously." },
  { icon: BarChart3, title: "Analytics Dashboard", description: "Track emotion patterns over time with beautiful visualizations." },
  { icon: Shield, title: "Privacy First", description: "All processing happens securely. Your data stays private and encrypted." },
  { icon: Zap, title: "Lightning Fast", description: "Get results in milliseconds with our optimized AI inference pipeline." },
  { icon: Brain, title: "7 Core Emotions", description: "Detect happiness, sadness, anger, surprise, fear, disgust, and neutral states." },
];

const steps = [
  { num: "01", title: "Capture", description: "Use your webcam or upload an image for analysis." },
  { num: "02", title: "Analyze", description: "Our AI model processes facial expressions in real-time." },
  { num: "03", title: "Results", description: "View detailed emotion breakdown with confidence scores." },
];

const Landing = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    {/* Hero */}
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
      <div className="container mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" /> Powered by Advanced AI
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
            Understand Emotions with{" "}
            <span className="gradient-text">EmotionAI</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Detect and analyze human emotions from facial expressions using cutting-edge AI. 
            Real-time webcam analysis and image uploads for instant insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8">
                Start Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/detect">
              <Button size="lg" variant="outline" className="gap-2 px-8">
                Try Demo
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-6 glow-border">
            <div className="bg-secondary/50 rounded-xl aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                  <Brain className="w-10 h-10 text-primary" />
                </div>
                <p className="text-muted-foreground font-medium">Live Emotion Detection Preview</p>
                <div className="flex gap-2 justify-center mt-4 flex-wrap">
                  {["😊 Happy 72%", "😲 Surprise 18%", "😐 Neutral 10%"].map((e) => (
                    <span key={e} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">{e}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Features */}
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Powerful Features</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to understand emotions at scale.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-xl p-6 hover:glow-border transition-shadow"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* How it works */}
    <section id="how-it-works" className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground">Three simple steps to emotion insights.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="text-5xl font-display font-bold gradient-text mb-3">{s.num}</div>
              <h3 className="font-display font-semibold text-xl mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-10 md:p-16 text-center glow-border"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Join thousands of users analyzing emotions with our AI platform.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>

    {/* Footer */}
    <footer className="border-t border-border py-8 px-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <span className="font-display font-semibold">EmotionAI</span>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 EmotionAI. All rights reserved.</p>
      </div>
    </footer>
  </div>
);

export default Landing;
