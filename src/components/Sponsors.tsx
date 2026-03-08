import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Play } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  tier: string;
  display_order: number;
}

const tierConfig: Record<string, { label: string; emoji: string; logoW: string; logoH: string; speed: string; direction: string; border: string; glow: string }> = {
  title: {
    label: "Title Sponsors",
    emoji: "🥇",
    logoW: "w-[160px] sm:w-[180px]",
    logoH: "h-[72px] sm:h-[80px]",
    speed: "60s",
    direction: "normal",
    border: "border-yellow-500/40",
    glow: "shadow-[0_0_24px_hsl(45_100%_50%/0.2)]",
  },
  gold: {
    label: "Gold Sponsors",
    emoji: "🥈",
    logoW: "w-[100px] sm:w-[120px]",
    logoH: "h-[50px] sm:h-[60px]",
    speed: "40s",
    direction: "reverse",
    border: "border-gray-400/30",
    glow: "",
  },
  partner: {
    label: "Partners & Supporters",
    emoji: "🥉",
    logoW: "w-[70px] sm:w-[80px]",
    logoH: "h-[35px] sm:h-[40px]",
    speed: "30s",
    direction: "normal",
    border: "border-border",
    glow: "",
  },
};

const MarqueeRow = ({ sponsors, tier }: { sponsors: Sponsor[]; tier: string }) => {
  const cfg = tierConfig[tier];
  const doubled = [...sponsors, ...sponsors];

  return (
    <div className="relative overflow-hidden group">
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

      <div
        className="flex gap-8 sm:gap-12 py-4 group-hover:[animation-play-state:paused]"
        style={{
          animation: `marquee-scroll ${cfg.speed} linear infinite`,
          animationDirection: cfg.direction as "normal" | "reverse",
          width: "max-content",
        }}
      >
        {doubled.map((s, i) => (
          <Tooltip key={`${s.id}-${i}`}>
            <TooltipTrigger asChild>
              <a
                href={s.website_url || "#"}
                target={s.website_url ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={(e) => !s.website_url && e.preventDefault()}
                className={`shrink-0 rounded-lg border ${cfg.border} bg-card/40 flex items-center justify-center px-4 transition-all duration-300 hover:scale-110 ${cfg.glow} grayscale hover:grayscale-0 ${cfg.logoW} ${cfg.logoH}`}
              >
                <img
                  src={s.logo_url}
                  alt={s.name}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{s.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

const GridView = ({ grouped }: { grouped: Record<string, Sponsor[]> }) => (
  <div className="space-y-10">
    {(["title", "gold", "partner"] as const).map((tier) => {
      const cfg = tierConfig[tier];
      const items = grouped[tier] || [];
      if (items.length === 0) return null;
      return (
        <div key={tier}>
          <p className="text-sm text-muted-foreground text-center mb-4">
            {cfg.emoji} {cfg.label}
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {items.map((s) => (
              <Tooltip key={s.id}>
                <TooltipTrigger asChild>
                  <a
                    href={s.website_url || "#"}
                    target={s.website_url ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    onClick={(e) => !s.website_url && e.preventDefault()}
                    className={`rounded-lg border ${cfg.border} bg-card/40 flex items-center justify-center px-4 transition-all duration-300 hover:scale-105 ${cfg.glow} grayscale hover:grayscale-0 ${cfg.logoW} ${cfg.logoH}`}
                  >
                    <img src={s.logo_url} alt={s.name} className="max-w-full max-h-full object-contain" loading="lazy" />
                  </a>
                </TooltipTrigger>
                <TooltipContent><p className="font-medium">{s.name}</p></TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

const Sponsors = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [view, setView] = useState<"marquee" | "grid">("marquee");

  useEffect(() => {
    supabase
      .from("sponsors")
      .select("id, name, logo_url, website_url, tier, display_order")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => { if (data) setSponsors(data); });
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, Sponsor[]> = { title: [], gold: [], partner: [] };
    sponsors.forEach((s) => {
      if (map[s.tier]) map[s.tier].push(s);
    });
    return map;
  }, [sponsors]);

  const hasSponsors = sponsors.length > 0;

  return (
    <section id="sponsors" className="py-20 relative">
      {/* Top divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            🤝 Our Sponsors & Partners
          </h2>
          <p className="text-muted-foreground">Proudly supported by</p>

          {/* View toggle */}
          {hasSponsors && (
            <div className="flex justify-center mt-6">
              <div className="inline-flex rounded-full border border-border bg-card/40 p-1 gap-1">
                <button
                  onClick={() => setView("marquee")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    view === "marquee"
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Play className="h-3 w-3" /> Marquee
                </button>
                <button
                  onClick={() => setView("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    view === "grid"
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="h-3 w-3" /> Grid
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {!hasSponsors && (
          <p className="text-center text-muted-foreground py-12">Sponsors coming soon!</p>
        )}

        <AnimatePresence mode="wait">
          {hasSponsors && view === "marquee" && (
            <motion.div
              key="marquee"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8 max-w-5xl mx-auto"
            >
              {(["title", "gold", "partner"] as const).map((tier) => {
                const items = grouped[tier];
                if (items.length === 0) return null;
                return (
                  <div key={tier}>
                    <p className="text-xs text-muted-foreground text-center mb-2">
                      {tierConfig[tier].emoji} {tierConfig[tier].label}
                    </p>
                    <MarqueeRow sponsors={items} tier={tier} />
                  </div>
                );
              })}
            </motion.div>
          )}

          {hasSponsors && view === "grid" && (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <GridView grouped={grouped} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </section>
  );
};

export default Sponsors;
