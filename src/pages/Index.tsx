import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteVisibility } from "@/hooks/useSiteVisibility";
import MaintenancePage from "@/components/MaintenancePage";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Sponsors from "@/components/Sponsors";
import Events from "@/components/Events";
import EventFlow from "@/components/EventFlow";
import Registration from "@/components/Registration";
import Leaderboard from "@/components/Leaderboard";
import Contact from "@/components/Contact";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import { ArrowUp } from "lucide-react";

const sectionComponents: { key: string; Component: React.ComponentType }[] = [
  { key: "hero", Component: Hero },
  { key: "about", Component: About },
  { key: "sponsors", Component: Sponsors },
  { key: "events", Component: Events },
  { key: "schedule", Component: EventFlow },
  { key: "registration", Component: Registration },
  { key: "leaderboard", Component: Leaderboard },
  { key: "faq", Component: FAQ },
  { key: "contact", Component: Contact },
  { key: "footer", Component: Footer },
];

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center neon-glow hover:scale-110 transition-transform"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="text-4xl font-extrabold text-gradient mb-3">Tech Carnival</div>
      <div className="flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
      </div>
    </motion.div>
  </div>
);

const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const Index = () => {
  const { maintenanceMode, isSectionVisible, loading } = useSiteVisibility();

  if (loading) return <LoadingSkeleton />;
  if (maintenanceMode) return <MaintenancePage />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {sectionComponents.map(({ key, Component }) =>
        isSectionVisible(key) ? (
          <SectionWrapper key={key}>
            <Component />
          </SectionWrapper>
        ) : null
      )}
      <ScrollToTop />
    </div>
  );
};

export default Index;
