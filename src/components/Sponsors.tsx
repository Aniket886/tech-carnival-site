import { motion } from "framer-motion";
import { Award, Star, Trophy } from "lucide-react";

const tiers = [
  {
    name: "Gold Sponsors",
    icon: Trophy,
    color: "text-yellow-400",
    borderColor: "border-yellow-400/30",
    bgGlow: "shadow-[0_0_30px_hsl(45_100%_50%/0.15)]",
    sponsors: ["TechCorp", "InnovateLabs", "FutureStack"],
  },
  {
    name: "Silver Sponsors",
    icon: Award,
    color: "text-gray-300",
    borderColor: "border-gray-400/30",
    bgGlow: "shadow-[0_0_20px_hsl(0_0%_70%/0.1)]",
    sponsors: ["CloudNine", "DevSphere", "ByteWorks", "PixelForge"],
  },
  {
    name: "Bronze Sponsors",
    icon: Star,
    color: "text-orange-400",
    borderColor: "border-orange-400/30",
    bgGlow: "shadow-[0_0_20px_hsl(30_80%_50%/0.1)]",
    sponsors: ["CodeCraft", "DataFlow", "NetPulse", "AppVista", "QuantumBit"],
  },
];

const SponsorLogo = ({ name }: { name: string }) => (
  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg bg-muted/40 border border-border flex items-center justify-center hover:border-primary/40 transition-colors">
    <span className="text-sm font-semibold text-muted-foreground">{name}</span>
  </div>
);

const Sponsors = () => (
  <section id="sponsors" className="py-24">
    <div className="container mx-auto px-4">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl sm:text-4xl font-bold text-gradient text-center mb-16"
      >
        Our Sponsors
      </motion.h2>

      <div className="space-y-16 max-w-4xl mx-auto">
        {tiers.map((tier, ti) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: ti * 0.15 }}
            className={`rounded-xl border ${tier.borderColor} bg-card/30 p-8 ${tier.bgGlow}`}
          >
            <div className="flex items-center justify-center gap-2 mb-8">
              <tier.icon className={`h-6 w-6 ${tier.color}`} />
              <h3 className={`text-xl font-bold ${tier.color}`}>{tier.name}</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {tier.sponsors.map((s) => (
                <SponsorLogo key={s} name={s} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Sponsors;
