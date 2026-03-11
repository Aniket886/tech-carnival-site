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
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-primary/40 bg-muted/60 flex items-center justify-center mb-5 overflow-hidden shadow-[0_0_20px_hsl(var(--primary)/0.15)] group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] group-hover:border-primary/70 transition-all duration-300">
                {member.image_url ? (
                  <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50" />
                )}
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
