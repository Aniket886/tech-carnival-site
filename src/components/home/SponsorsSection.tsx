import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  title: { label: "Title Sponsors", logoSize: "w-[140px] md:w-[180px]", speed: 35, glow: "shadow-[0_0_20px_hsl(var(--neon-blue)/0.4)] border-yellow-500/60" },
  gold: { label: "Gold Sponsors", logoSize: "w-[90px] md:w-[120px]", speed: 25, glow: "border-gray-400/40" },
  partner: { label: "Partners & Supporters", logoSize: "w-[60px] md:w-[80px]", speed: 20, glow: "border-border/30" },
};

type TierKey = keyof typeof TIER_CONFIG;

const SponsorLogo = ({ sponsor, tier }: { sponsor: Sponsor; tier: TierKey }) => {
  const config = TIER_CONFIG[tier];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => sponsor.website_url && window.open(sponsor.website_url, "_blank", "noopener")}
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

        <div className="space-y-10">
          {(["title", "gold", "partner"] as TierKey[]).map((tier, idx) => {
            const tierSponsors = grouped[tier];
            if (tierSponsors.length === 0) return null;
            const config = TIER_CONFIG[tier];

            return (
              <div key={tier}>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 text-center">
                  {config.label}
                </p>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                  <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                  <Marquee
                    pauseOnHover
                    reverse={idx % 2 === 1}
                    speed={config.speed}
                    className="[--gap:1.5rem] md:[--gap:2.5rem]"
                  >
                    {tierSponsors.map((s) => (
                      <SponsorLogo key={s.id} sponsor={s} tier={tier} />
                    ))}
                  </Marquee>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </section>
  );
};

export default SponsorsSection;
