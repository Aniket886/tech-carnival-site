import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Marquee from "@/components/animata/container/marquee";
import { cn } from "@/lib/utils";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  tier: string;
  display_order: number;
}

const SponsorCard = ({ sponsor }: { sponsor: Sponsor }) => {
  return (
    <button
      onClick={() =>
        sponsor.website_url &&
        window.open(sponsor.website_url, "_blank", "noopener")
      }
      className={cn(
        "group/card relative flex h-44 w-64 shrink-0 flex-col justify-between overflow-hidden rounded-2xl p-6",
        "bg-gradient-to-br from-[hsl(0_0%_85%)] via-[hsl(0_0%_78%)] to-[hsl(0_0%_70%)]",
        "shadow-md transition-all duration-300 cursor-pointer",
        "hover:scale-[1.03] hover:shadow-xl"
      )}
    >
      {/* Logo */}
      <div className="flex-1 flex items-center justify-center">
        <img
          src={sponsor.logo_url}
          alt={sponsor.name}
          className="max-h-28 max-w-[90%] object-contain"
          loading="lazy"
          style={{ filter: "brightness(0)" }}
        />
      </div>

      {/* Name centered */}
      <p className="text-sm font-medium leading-snug text-[hsl(0_0%_15%)] text-center mt-2">
        {sponsor.name}
      </p>
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sponsors" },
        () => fetchSponsors()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (sponsors.length === 0) return null;

  return (
    <section className="py-20 md:py-28 relative overflow-hidden" id="sponsors">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/30 bg-card/30 backdrop-blur-sm mb-5">
            <span className="text-sm">🤝</span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Sponsors & Partners
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Proudly Supported By</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            The organizations and partners powering Tech Carnival 2K26
          </p>
        </div>

        <Marquee pauseOnHover applyMask className="[--duration:25s] [--gap:16px]">
          {sponsors.map((s) => (
            <SponsorCard key={s.id} sponsor={s} />
          ))}
        </Marquee>
      </div>
    </section>
  );
};

export default SponsorsSection;
