import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Camera, BarChart3, Clock, Code2, ArrowRight, Check, Scan, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const features = [
  { icon: Camera, title: "Real-Time Emotion Detection", description: "Instantly analyze facial expressions through your webcam with sub-second latency and high accuracy." },
  { icon: BarChart3, title: "AI-Powered Analytics", description: "Deep insights into emotional patterns with interactive dashboards and trend visualizations." },
  { icon: Clock, title: "Emotion History Tracking", description: "Comprehensive logs of every detection session, searchable and filterable by date or emotion." },
  { icon: Code2, title: "API Integration", description: "RESTful API with SDKs for Python, JavaScript, and Go. Integrate emotion detection into any workflow." },
];

const steps = [
  { num: "01", icon: Camera, title: "Open Camera", description: "Grant webcam access or upload a photo. Our interface works across all modern browsers and devices." },
  { num: "02", icon: Scan, title: "AI Detects Face", description: "Our neural network identifies facial landmarks and maps micro-expressions in real time." },
  { num: "03", icon: Sparkles, title: "Emotion is Predicted", description: "Get instant results with confidence scores for 7 core emotions — happy, sad, angry, surprise, fear, disgust, neutral." },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For exploring and personal use.",
    features: ["50 detections/month", "Webcam detection", "Basic emotion results", "Community support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For professionals and small teams.",
    features: ["Unlimited detections", "Image upload analysis", "Full analytics dashboard", "Emotion history & export", "Priority support", "API access"],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations at scale.",
    features: ["Everything in Pro", "Dedicated infrastructure", "Custom AI model tuning", "SSO & team management", "SLA & 24/7 support", "On-premise deployment"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const Landing = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    {/* ─── Hero ─── */}
    <section className="relative pt-24 mobile:pt-36 pb-24 px-4 overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(var(--primary)/0.09),transparent)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.06),transparent_70%)] pointer-events-none" />

      <div className="container mx-auto relative max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/60 text-sm text-muted-foreground mb-8">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Now with real-time multi-face detection
          </div>

          <h1 className="text-3xl mobile:text-4xl tablet:text-5xl laptop:text-6xl desktop:text-7xl font-display font-bold leading-[1.08] tracking-tight mb-6">
            Detect Human Emotions{" "}
            <span className="gradient-text">with AI</span>
          </h1>

          <p className="text-base mobile:text-lg tablet:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time facial emotion detection using advanced AI. Understand how people feel — instantly, accurately, privately.
          </p>

          <div className="flex flex-col mobile:flex-row gap-3 justify-center">
            <Link to="/generate">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full px-4 py-3 mobile:px-6 mobile:py-3 tablet:px-8 tablet:h-12 text-base">
                Generate Share Link <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/detect">
              <Button size="lg" variant="outline" className="gap-2 w-full px-4 py-3 mobile:px-6 mobile:py-3 tablet:px-8 tablet:h-12 text-base">
                Try Emotion Detection
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Hero preview card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="mt-20"
        >
          <div className="glass-card rounded-2xl p-1 glow-border">
            <div className="bg-secondary/40 rounded-xl aspect-[4/3] laptop:aspect-[16/8] flex items-center justify-center relative overflow-hidden">
              {/* Decorative grid */}
              <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:48px_48px]" />
              <div className="relative text-center z-10">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 animate-pulse-glow">
                  <Brain className="w-10 h-10 text-primary" />
                </div>
                <p className="text-foreground font-display font-semibold text-lg mb-4">Live Analysis Preview</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {[
                    { label: "😊 Happy", value: "72%" },
                    { label: "😲 Surprise", value: "18%" },
                    { label: "😐 Neutral", value: "10%" },
                  ].map((e) => (
                    <span key={e.label} className="px-4 py-2 rounded-lg bg-card border border-border text-sm font-medium">
                      {e.label} <span className="text-primary ml-1">{e.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>

    {/* ─── Features ─── */}
    <section id="features" className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div {...fadeUp} className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest text-primary font-medium mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Everything you need for emotion intelligence</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A complete platform for detecting, analyzing, and understanding human emotions at scale.
          </p>
        </motion.div>

        <div className="grid mobile:grid-cols-2 gap-3 mobile:gap-4 tablet:gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ delay: i * 0.08 }}
              className="group glass-card rounded-xl p-4 mobile:p-5 tablet:p-6 laptop:p-7 hover:glow-border transition-all duration-300"
            >
              <div className="w-9 h-9 mobile:w-10 mobile:h-10 tablet:w-11 tablet:h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <f.icon className="w-4 h-4 mobile:w-5 mobile:h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ─── How It Works ─── */}
    <section id="how-it-works" className="py-24 px-4 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <motion.div {...fadeUp} className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest text-primary font-medium mb-3">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Three steps to emotion insight</h2>
          <p className="text-muted-foreground">No setup required. Get results in seconds.</p>
        </motion.div>

        <div className="grid tablet:grid-cols-3 gap-4 mobile:gap-6 tablet:gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              {...fadeUp}
              transition={{ delay: i * 0.12 }}
              className="text-center relative"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden tablet:block absolute top-12 left-[60%] w-[80%] h-px border-t border-dashed border-border" />
              )}
              <div className="w-12 h-12 mobile:w-14 mobile:h-14 tablet:w-16 tablet:h-16 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-5 relative z-10">
                <s.icon className="w-6 h-6 mobile:w-7 mobile:h-7 text-primary" />
              </div>
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Step {s.num}</span>
              <h3 className="font-display font-semibold text-xl mt-2 mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ─── Pricing ─── */}
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div {...fadeUp} className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest text-primary font-medium mb-3">Pricing</p>
          <h2 className="text-2xl mobile:text-3xl tablet:text-4xl font-display font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground">Start free. Scale as you grow.</p>
        </motion.div>

        <div className="grid tablet:grid-cols-3 gap-3 mobile:gap-4 tablet:gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              {...fadeUp}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl p-4 mobile:p-5 tablet:p-6 laptop:p-7 flex flex-col ${
                plan.highlighted
                  ? "glass-card glow-border ring-1 ring-primary/20 relative"
                  : "glass-card"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  Most Popular
                </span>
              )}
              <div className="mb-6">
                <h3 className="font-display font-semibold text-lg">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link to={plan.name === "Enterprise" ? "/auth" : "/auth?mode=signup"}>
                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : ""
                  }`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ─── CTA ─── */}
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          {...fadeUp}
          className="glass-card rounded-2xl p-6 mobile:p-8 tablet:p-12 laptop:p-16 text-center glow-border relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to understand emotions?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
              Join thousands of researchers, designers, and developers using EmotionAI to unlock emotional intelligence.
            </p>
            <Link to="/detect">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full px-4 py-3 mobile:px-6 mobile:py-3 tablet:px-8 tablet:h-12 text-base">
                Try Emotion Detection <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>

    {/* ─── Footer ─── */}
    <footer className="border-t border-border py-10 px-4">
      <div className="container mx-auto flex flex-col tablet:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">EmotionAI</span>
        </div>
        <div className="flex gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
          <Link to="/auth" className="hover:text-foreground transition-colors">Login</Link>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 EmotionAI. All rights reserved.</p>
      </div>
    </footer>
  </div>
);

export default Landing;
