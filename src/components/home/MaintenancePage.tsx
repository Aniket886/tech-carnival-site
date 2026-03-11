import { motion } from "framer-motion";
import CountdownTimer from "@/components/home/CountdownTimer";
import { Instagram, Linkedin, Youtube, ArrowRight } from "lucide-react";

const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Subtle gradient orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <motion.div
        className="relative z-10 flex flex-col items-center max-w-xl w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Status pill */}
        <motion.div
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm mb-12"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            Under Construction
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground text-center leading-tight tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Something great
          <br />
          <span className="gradient-text">is coming.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-muted-foreground text-center mt-5 text-base sm:text-lg leading-relaxed max-w-md"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
        >
          Tech Carnival – 2K26 is being crafted with care.
          <br className="hidden sm:block" />
          We'll be live before you know it.
        </motion.p>

        {/* Divider */}
        <motion.div
          className="w-12 h-px bg-border my-10"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
        />

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <CountdownTimer />
        </motion.div>

      </motion.div>
    </div>
  );
};

export default MaintenancePage;
