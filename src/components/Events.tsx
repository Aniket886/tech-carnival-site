import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Category = "all" | "technical" | "gaming" | "cultural";

interface EventItem {
  emoji: string;
  name: string;
  desc: string;
  category: Exclude<Category, "all">;
}

const events: EventItem[] = [
  { emoji: "⚡", name: "Hack Momentum", desc: "6-hour hackathon to build, innovate, and win!", category: "technical" },
  { emoji: "🧠", name: "Brain Quest", desc: "A Quiz to test your tech knowledge", category: "technical" },
  { emoji: "📊", name: "Pixel Perfect", desc: "Present your ideas visually on a poster", category: "technical" },
  { emoji: "🧭", name: "Code Compass", desc: "Navigate coding challenges and prove your skills", category: "technical" },
  { emoji: "🔍", name: "Myth Busters", desc: "Bust the myths with facts and logic", category: "technical" },
  { emoji: "🔥", name: "Battle Ground", desc: "BGMI tournament – last team standing wins!", category: "gaming" },
  { emoji: "💃", name: "Dance Mania", desc: "Group dance competition to set the stage on fire", category: "cultural" },
  { emoji: "🎬", name: "Scitopia", desc: "Skit play – drama, comedy, and creativity combined", category: "cultural" },
];

const tabs: { label: string; value: Category; emoji: string; accent: string }[] = [
  { label: "All Events", value: "all", emoji: "🌟", accent: "bg-primary/10 text-primary border-primary/30 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground" },
  { label: "Technical", value: "technical", emoji: "💻", accent: "bg-blue-500/10 text-blue-400 border-blue-500/30 data-[active=true]:bg-blue-500 data-[active=true]:text-white" },
  { label: "Gaming", value: "gaming", emoji: "🎮", accent: "bg-red-500/10 text-red-400 border-red-500/30 data-[active=true]:bg-red-500 data-[active=true]:text-white" },
  { label: "Cultural", value: "cultural", emoji: "🎭", accent: "bg-purple-500/10 text-purple-400 border-purple-500/30 data-[active=true]:bg-purple-500 data-[active=true]:text-white" },
];

const categoryBadge: Record<string, { label: string; className: string }> = {
  technical: { label: "Technical", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  gaming: { label: "Gaming", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  cultural: { label: "Cultural", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
};

const handleRegisterClick = (eventName: string) => {
  const el = document.getElementById("register");
  if (el) el.scrollIntoView({ behavior: "smooth" });
  // Dispatch custom event so Registration can pick it up
  window.dispatchEvent(new CustomEvent("preselect-event", { detail: eventName }));
};

const Events = () => {
  const [active, setActive] = useState<Category>("all");
  const filtered = active === "all" ? events : events.filter((e) => e.category === active);

  return (
    <section id="events" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gradient mb-3">Explore Our Events</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From intense hackathons to electrifying cultural performances — find your arena.
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              data-active={active === tab.value}
              onClick={() => setActive(tab.value)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${tab.accent}`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Event Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <AnimatePresence mode="popLayout">
            {filtered.map((e) => (
              <motion.div
                key={e.name}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-card/50 border-border hover:border-primary/40 transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_25px_hsl(var(--primary)/0.15)] group h-full flex flex-col">
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <span className="text-3xl">{e.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{e.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 gap-4">
                    <p className="text-muted-foreground text-sm line-clamp-1">{e.desc}</p>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <Badge variant="outline" className={categoryBadge[e.category].className}>
                        {categoryBadge[e.category].label}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleRegisterClick(e.name)}
                      >
                        Register
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default Events;
