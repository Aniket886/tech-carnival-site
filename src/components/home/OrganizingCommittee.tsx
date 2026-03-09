import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Fallback static imports
import shwetaImg from "@/assets/team/shweta.png";
import rajashekharImg from "@/assets/team/rajashekhar.png";
import shaminaImg from "@/assets/team/shamina.png";
import manjulaImg from "@/assets/team/manjula.png";
import sugandhaImg from "@/assets/team/sugandha.png";

const fallbackImages: Record<string, string> = {
  "Dr. Shweta Marigoudar": shwetaImg,
  "Prof. Rajashekhar G. C": rajashekharImg,
  "Prof. Shamina Attar": shaminaImg,
  "Prof. Manjula K": manjulaImg,
  "Prof. Sugandha M S": sugandhaImg,
};

type Member = { name: string; role: string | null; image_url: string | null };

const OrganizingCommittee = () => {
  const [committee, setCommittee] = useState<Member[]>([]);

  useEffect(() => {
    supabase
      .from("team_members")
      .select("name, role, image_url")
      .eq("section", "organizing_committee")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        if (data && data.length > 0) setCommittee(data);
      });
  }, []);

  const getImage = (member: Member) => member.image_url || fallbackImages[member.name];

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
            Meet the brilliant minds behind Tech Carnival 2K26
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {committee.map((member) => {
            const img = getImage(member);
            return (
              <div key={member.name} className="flex flex-col items-center text-center group w-40 sm:w-48 min-w-0">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-primary/40 bg-muted/60 flex items-center justify-center mb-4 overflow-hidden shadow-[0_0_20px_hsl(var(--primary)/0.15)] group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] group-hover:border-primary/70 transition-all duration-300">
                  {img ? (
                    <img src={img} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground/50" />
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground leading-tight whitespace-nowrap">
                  {member.name}
                </h3>
                {member.role && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{member.role}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default OrganizingCommittee;
