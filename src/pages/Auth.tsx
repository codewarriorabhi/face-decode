import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, User, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { toast } from "sonner";

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (mode === "forgot") {
        const result = z.string().trim().email().safeParse(form.email);
        if (!result.success) {
          setErrors({ email: "Please enter a valid email" });
          setLoading(false);
          return;
        }
        await resetPassword(form.email.trim());
        setMode("login");
      } else if (mode === "signup") {
        const result = signupSchema.safeParse(form);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((e) => {
            if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }
        await signUp(form.email.trim(), form.password, form.firstName.trim(), form.lastName.trim());
      } else {
        const result = loginSchema.safeParse(form);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((e) => {
            if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }
        await signIn(form.email.trim(), form.password);
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    login: { heading: "Welcome back", sub: "Log in to your EmotionAI dashboard." },
    signup: { heading: "Create your account", sub: "Start detecting emotions in seconds." },
    forgot: { heading: "Reset password", sub: "We'll send a reset link to your email." },
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center bg-secondary/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.1),transparent_70%)]" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative text-center p-12">
          <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-float">
            <Brain className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-3">EmotionAI</h2>
          <p className="text-muted-foreground max-w-sm">
            Unlock the power of AI-driven emotion detection for research, UX, and personal insight.
          </p>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <Brain className="w-7 h-7 text-primary" />
            <span className="font-display text-xl font-bold">EmotionAI</span>
          </Link>

          <h1 className="text-2xl font-display font-bold mb-1">{titles[mode].heading}</h1>
          <p className="text-muted-foreground mb-8">{titles[mode].sub}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="firstName" placeholder="John" className="pl-10" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
                  </div>
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="lastName" placeholder="Doe" className="pl-10" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
                  </div>
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" className="pl-10" value={form.password} onChange={(e) => update("password", e.target.value)} />
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="confirmPassword" type="password" placeholder="••••••••" className="pl-10" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} />
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>
            )}

            {mode === "login" && (
              <div className="text-right">
                <button type="button" onClick={() => setMode("forgot")} className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</>
              ) : mode === "forgot" ? (
                <>Send Reset Link <ArrowRight className="w-4 h-4" /></>
              ) : mode === "signup" ? (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Log In <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            {mode === "forgot" ? (
              <button onClick={() => setMode("login")} className="text-primary hover:underline font-medium">
                Back to login
              </button>
            ) : mode === "signup" ? (
              <>Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-primary hover:underline font-medium">Log in</button>
              </>
            ) : (
              <>Don't have an account?{" "}
                <button onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">Sign up</button>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
