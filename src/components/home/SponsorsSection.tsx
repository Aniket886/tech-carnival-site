import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Marquee from "@/components/ui/marquee";
import { cn } from "@/lib/utils";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  tier: string;
  display_order: number;
}

const TIER_CONFIG = {
  title: {
    label: "Title Sponsors",
    badge: "bg-[hsl(45_90%_55%/0.15)] text-[hsl(45_90%_55%)] border-[hsl(45_90%_55%/0.3)]",
    cardClass: "h-24 md:h-28 w-44 md:w-56",
    speed: 30,
  },
  gold: {
    label: "Gold Sponsors",
    badge: "bg-primary/10 text-primary border-primary/30",
    cardClass: "h-20 md:h-24 w-36 md:w-44",
    speed: 25,
  },
  partner: {
    label: "Partners",
    badge: "bg-muted/50 text-muted-foreground border-border/40",
    cardClass: "h-16 md:h-20 w-28 md:w-36",
    speed: 20,
  },
};

type TierKey = keyof typeof TIER_CONFIG;

const SponsorCard = ({ sponsor, tier }: { sponsor: Sponsor; tier: TierKey }) => {
  const config = TIER_CONFIG[tier];

  return (
    <button
      onClick={() => sponsor.website_url && window.open(sponsor.website_url, "_blank", "noopener")}
      className={cn(
        "relative flex-shrink-0 rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-5",
        "transition-all duration-500 ease-out cursor-pointer",
        "hover:bg-card/70 hover:border-primary/30 hover:shadow-[0_0_30px_hsl(var(--primary)/0.12)] hover:scale-105",
        "grayscale hover:grayscale-0",
        config.cardClass
      )}
      title={sponsor.name}
    >
      <img
        src={sponsor.logo_url}
        alt={sponsor.name}
        className="max-w-full max-h-full object-contain brightness-0 invert opacity-60 transition-all duration-500 group-hover:opacity-80"
        loading="lazy"
      />
      {/* Hover name label */}
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-card/90 border border-border/30 text-[10px] text-muted-foreground font-medium whitespace-nowrap opacity-0 transition-all duration-300 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100">
        {sponsor.name}
      </span>
    </button>
  );
};

const SponsorsSection = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

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
    <section className="py-20 md:py-28 relative overflow-hidden" id="sponsors">
      {/* Top / bottom separators */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/30 bg-card/30 backdrop-blur-sm mb-5">
            <span className="text-sm">🤝</span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">Sponsors & Partners</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Proudly Supported By</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            The organizations and partners powering Tech Carnival 2K26
          </p>
        </div>

        {/* Marquee tiers */}
        <div className="space-y-12">
          {(["title", "gold", "partner"] as TierKey[]).map((tier, idx) => {
            const tierSponsors = grouped[tier];
            if (tierSponsors.length === 0) return null;
            const config = TIER_CONFIG[tier];

            return (
              <div key={tier} className="space-y-4">
                {/* Tier badge */}
                <div className="flex justify-center">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] uppercase tracking-widest font-semibold",
                    config.badge
                  )}>
                    {tier === "title" && "⭐"} {config.label}
                  </span>
                </div>

                {/* Marquee with edge fades */}
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                  <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                  <Marquee
                    pauseOnHover
                    reverse={idx % 2 === 1}
                    speed={config.speed}
                    className="[--gap:1rem] md:[--gap:2rem]"
                  >
                    {tierSponsors.map((s) => (
                      <SponsorCard key={s.id} sponsor={s} tier={tier} />
                    ))}
                  </Marquee>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SponsorsSection;
