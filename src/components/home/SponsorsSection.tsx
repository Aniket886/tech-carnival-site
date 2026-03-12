import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LayoutGrid, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Marquee from "@/components/ui/marquee";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  tier: string;
  display_order: number;
}

const TIER_CONFIG = {
  title: { label: "Title Sponsors", logoSize: "w-[140px] md:w-[180px]", duration: "30s", reverse: false, glow: "shadow-[0_0_20px_hsl(var(--neon-blue)/0.4)] border-yellow-500/60" },
  gold: { label: "Gold Sponsors", logoSize: "w-[90px] md:w-[120px]", duration: "20s", reverse: true, glow: "border-gray-400/40" },
  partner: { label: "Partners & Supporters", logoSize: "w-[60px] md:w-[80px]", duration: "15s", reverse: false, glow: "border-border/30" },
};

type TierKey = keyof typeof TIER_CONFIG;

const MarqueeRow = ({ sponsors, tier }: { sponsors: Sponsor[]; tier: TierKey }) => {
  const config = TIER_CONFIG[tier];

  if (sponsors.length === 0) return null;

  return (
    <div className="mb-8 last:mb-0">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 text-center">
        {config.label}
      </p>
      <Marquee
        pauseOnHover
        reverse={config.reverse}
        repeat={4}
        className="[--duration:var(--tier-duration)] [--gap:2rem]"
        style={{ "--tier-duration": config.duration } as React.CSSProperties}
      >
        {sponsors.map((s) => (
          <SponsorLogo key={s.id} sponsor={s} tier={tier} />
        ))}
      </Marquee>
    </div>
  );
};

const SponsorLogo = ({ sponsor, tier }: { sponsor: Sponsor; tier: TierKey }) => {
  const config = TIER_CONFIG[tier];

  const handleClick = () => {
    if (sponsor.website_url) window.open(sponsor.website_url, "_blank", "noopener");
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className={`flex-shrink-0 ${config.logoSize} aspect-[3/2] rounded-xl border p-3 md:p-4 flex items-center justify-center bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-110 grayscale hover:grayscale-0 ${config.glow} cursor-pointer`}
        >
          <img
            src={sponsor.logo_url}
            alt={sponsor.name}
            className="max-w-full max-h-full object-contain brightness-0 invert opacity-70 hover:opacity-100 transition-opacity"
            loading="lazy"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="font-semibold">{sponsor.name}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const GridView = ({ grouped }: { grouped: Record<TierKey, Sponsor[]> }) => (
  <div className="space-y-10">
    {(["title", "gold", "partner"] as TierKey[]).map((tier) => {
      const sponsors = grouped[tier];
      if (sponsors.length === 0) return null;
      const config = TIER_CONFIG[tier];
      const gridCols = tier === "title" ? "grid-cols-2 md:grid-cols-3" : tier === "gold" ? "grid-cols-3 md:grid-cols-5" : "grid-cols-4 md:grid-cols-6 lg:grid-cols-8";

      return (
        <div key={tier}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 text-center">{config.label}</p>
          <div className={`grid ${gridCols} gap-4 justify-items-center`}>
            {sponsors.map((s) => (
              <SponsorLogo key={s.id} sponsor={s} tier={tier} />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

const SponsorsSection = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [viewMode, setViewMode] = useState<"marquee" | "grid">("marquee");

  useEffect(() => {
    const fetchSponsors = async () => {
      const { data } = await supabase
        .from("sponsors")
        .select("id, name, logo_url, website_url, tier, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (data) setSponsors(data);
    };
    fetchSponsors();

    const channel = supabase
      .channel("sponsors_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sponsors" }, () => fetchSponsors())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const grouped: Record<TierKey, Sponsor[]> = {
    title: sponsors.filter((s) => s.tier === "title"),
    gold: sponsors.filter((s) => s.tier === "gold"),
    partner: sponsors.filter((s) => s.tier === "partner"),
  };

  if (sponsors.length === 0) return null;

  return (
    <section className="py-20 md:py-28 relative" id="sponsors">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="mr-2">🤝</span>
            <span className="gradient-text">Our Sponsors & Partners</span>
          </h2>
          <p className="text-muted-foreground">Proudly supported by</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-1 bg-muted/50 rounded-lg p-1 text-xs">
            <button
              onClick={() => setViewMode("marquee")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${viewMode === "marquee" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Play size={12} /> Marquee
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid size={12} /> Grid
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {viewMode === "marquee" ? (
              <div className="space-y-2">
                {(["title", "gold", "partner"] as TierKey[]).map((tier) => (
                  <MarqueeRow key={tier} sponsors={grouped[tier]} tier={tier} />
                ))}
              </div>
            ) : (
              <GridView grouped={grouped} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </section>
  );
};

export default SponsorsSection;
