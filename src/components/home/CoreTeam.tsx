import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Member = { name: string; role: string | null; image_url: string | null };

const CoreTeam = () => {
  const [coreTeam, setCoreTeam] = useState<Member[]>([]);

  useEffect(() => {
    const fetch = () => {
      supabase
        .from("team_members")
        .select("name, role, image_url")
        .eq("section", "core_team")
        .eq("is_active", true)
        .order("display_order")
        .then(({ data }) => {
          if (data && data.length > 0) setCoreTeam(data);
        });
    };
    fetch();

    const channel = supabase
      .channel("team_members_core")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_members", filter: "section=eq.core_team" },
        () => fetch(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (coreTeam.length === 0) return null;

  return (
    <section id="core-team" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4 tracking-wide uppercase">Core Team</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
            Meet the brilliant minds behind Tech Carnival 2K26
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-10 md:gap-14">
          {coreTeam.map((member) => (
            <div key={member.name} className="flex flex-col items-center text-center group w-40 sm:w-52">
              {/* Liquid glass avatar ring */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-5">
                {/* Outer glow ring */}
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/30 via-transparent to-accent/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {/* Liquid glass border */}
                <div
                  className="relative w-full h-full rounded-full p-[3px] transition-all duration-500"
                  style={{
                    background: "linear-gradient(135deg, hsl(195 100% 60% / 0.5), hsl(270 91% 65% / 0.3), hsl(195 100% 50% / 0.2))",
                  }}
                >
                  <div
                    className="w-full h-full rounded-full overflow-hidden flex items-center justify-center transition-all duration-500"
                    style={{
                      background: "linear-gradient(160deg, hsl(195 100% 50% / 0.08), hsl(230 20% 10% / 0.6), hsl(270 91% 65% / 0.06))",
                      backdropFilter: "blur(20px) saturate(1.6)",
                      boxShadow: "inset 0 2px 4px 0 hsl(195 100% 80% / 0.1), inset 0 -1px 2px 0 hsl(270 91% 65% / 0.08), 0 4px 24px -4px hsl(195 100% 50% / 0.15)",
                    }}
                  >
                    {member.image_url ? (
                      <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/40" />
                    )}
                  </div>
                </div>
                {/* Refraction highlight */}
                <div
                  className="absolute top-2 left-1/2 -translate-x-1/2 w-3/5 h-4 rounded-full pointer-events-none opacity-60 group-hover:opacity-90 transition-opacity duration-500"
                  style={{
                    background: "linear-gradient(180deg, hsl(195 100% 90% / 0.25) 0%, transparent 100%)",
                    filter: "blur(3px)",
                  }}
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight whitespace-nowrap">
                {member.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreTeam;
