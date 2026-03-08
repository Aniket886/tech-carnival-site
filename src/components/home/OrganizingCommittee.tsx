import shwetaImg from "@/assets/team/shweta.png";
import rajashekharImg from "@/assets/team/rajashekhar.png";
import shaminaImg from "@/assets/team/shamina.png";
import manjulaImg from "@/assets/team/manjula.png";
import sugandhaImg from "@/assets/team/sugandha.png";

const committee = [
  { name: "Dr. Shweta Marigoudar", role: "Dean, FCIT", image: shwetaImg },
  { name: "Prof. Rajashekhar G. C", role: "Director, SCA, FCIT", image: rajashekharImg },
  { name: "Prof. Shamina Attar", role: "Director, SCS, FCIT", image: shaminaImg },
  { name: "Prof. Manjula K", role: "Organizing Secretary", image: manjulaImg },
  { name: "Prof. Sugandha M S", role: "Program Co-ordinator", image: sugandhaImg },
];

const OrganizingCommittee = () => {
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
          {committee.map((member) => (
            <div
              key={member.name}
              className="flex flex-col items-center text-center group w-40 sm:w-48 min-w-0"
            >
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-primary/40 bg-muted/60 flex items-center justify-center mb-4 overflow-hidden shadow-[0_0_20px_hsl(var(--primary)/0.15)] group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] group-hover:border-primary/70 transition-all duration-300">
                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
              </div>

              <h3 className="text-sm sm:text-base font-semibold text-foreground leading-tight whitespace-nowrap">
                {member.name}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {member.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OrganizingCommittee;