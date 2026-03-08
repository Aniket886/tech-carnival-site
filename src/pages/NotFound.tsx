import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)), hsl(var(--secondary)))" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center relative z-10 px-6"
      >
        {/* Big 404 */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 100 }}
          className="mb-6"
        >
          <span className="text-[120px] sm:text-[160px] font-extrabold leading-none text-gradient select-none">
            404
          </span>
        </motion.div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Lost in the Carnival!
          </h1>
          <Sparkles className="h-5 w-5 text-secondary" />
        </div>

        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Looks like you wandered into an area that doesn't exist.
          Don't worry — the main stage is just a click away! 🎪
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="gap-2 neon-glow">
            <Link to="/">
              <Home className="h-4 w-4" /> Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <a href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4" /> Go Back
            </a>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-10 opacity-60">
          Tried to access: <code className="text-primary/70">{location.pathname}</code>
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;
