import { User } from "lucide-react";
import aniketImg from "@/assets/team/aniket.png";
import sonaliImg from "@/assets/team/sonali.png";
import bhanuImg from "@/assets/team/bhanuprakash.png";

const coreTeam = [
  { name: "Adarsh Gouda D", image: null },
  { name: "Aniket Tegginamath", image: aniketImg },
  { name: "Bhanuprakash K S", image: bhanuImg },
  { name: "K Vishwasheetal", image: null },
  { name: "Sonali Meharwade", image: sonaliImg },
];

const CoreTeam = () => {
  return (
    <section id="core-team" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4 tracking-wide uppercase">
            Core Team
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
            The driving force making it all happen
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-10 md:gap-14">
          {coreTeam.map((member) => (
            <div
              key={member.name}
              className="flex flex-col items-center text-center group w-40 sm:w-52"
            >
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-primary/40 bg-muted/60 flex items-center justify-center mb-5 overflow-hidden shadow-[0_0_20px_hsl(var(--primary)/0.15)] group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] group-hover:border-primary/70 transition-all duration-300">
                {member.image ? (
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
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
