import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brain, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const isLanding = location.pathname === "/";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">EmotionAI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {!session ? (
            <>
              {isLanding && (
                <>
                  <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
                  <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
                </>
              )}
              <Link to="/generate" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Generate Link</Link>
              <Link to="/auth">
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              <Link to="/detect" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Detect</Link>
              <Link to="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors">History</Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Log Out</Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden glass-card border-t border-border overflow-hidden"
          >
            <div className="flex flex-col gap-2 p-4">
              {!session ? (
                <>
                  {isLanding && (
                    <>
                      <a href="#features" className="py-2 text-sm" onClick={() => setMobileOpen(false)}>Features</a>
                      <a href="#how-it-works" className="py-2 text-sm" onClick={() => setMobileOpen(false)}>How it Works</a>
                    </>
                  )}
                  <Link to="/generate" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Generate Link</Button>
                  </Link>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full">Log In</Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-primary text-primary-foreground">Get Started</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="py-2 text-sm" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <Link to="/detect" className="py-2 text-sm" onClick={() => setMobileOpen(false)}>Detect</Link>
                  <Link to="/history" className="py-2 text-sm" onClick={() => setMobileOpen(false)}>History</Link>
                  <Button variant="ghost" className="w-full" onClick={() => { handleLogout(); setMobileOpen(false); }}>Log Out</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
