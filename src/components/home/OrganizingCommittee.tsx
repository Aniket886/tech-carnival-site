import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Member = { name: string; role: string | null; image_url: string | null };

const OrganizingCommittee = () => {
  const [committee, setCommittee] = useState<Member[]>([]);

  useEffect(() => {
    const fetch = () => {
      supabase
        .from("team_members")
        .select("name, role, image_url")
        .eq("section", "organizing_committee")
        .eq("is_active", true)
        .order("display_order")
        .then(({ data }) => {
          if (data && data.length > 0) setCommittee(data);
        });
    };
    fetch();

    const channel = supabase
      .channel("team_members_committee")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_members", filter: "section=eq.organizing_committee" },
        () => fetch(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (committee.length === 0) return null;

  return (
    <section id="committee" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4 tracking-wide uppercase">
            Organizing Committee
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
            The driving force making it all happen
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {committee.map((member) => (
            <div key={member.name} className="flex flex-col items-center text-center group w-40 sm:w-48 min-w-0">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-primary/40 bg-muted/60 flex items-center justify-center mb-4 overflow-hidden shadow-[0_0_20px_hsl(var(--primary)/0.15)] group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] group-hover:border-primary/70 transition-all duration-300">
                {member.image_url ? (
                  <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground/50" />
                )}
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground leading-tight whitespace-nowrap">
                {member.name}
              </h3>
              {member.role && <p className="text-xs sm:text-sm text-muted-foreground mt-1">{member.role}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OrganizingCommittee;
