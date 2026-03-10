import { motion } from "framer-motion";

const floatingOrbs = [
  { size: "w-72 h-72", color: "bg-primary/20", x: "-left-20", y: "-top-20", delay: 0, duration: 7 },
  { size: "w-96 h-96", color: "bg-secondary/15", x: "-right-24", y: "-bottom-24", delay: 2, duration: 9 },
  { size: "w-48 h-48", color: "bg-primary/10", x: "left-1/3", y: "top-1/4", delay: 4, duration: 8 },
];

const About = () => {
  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />

      {/* Floating glow orbs */}
      {floatingOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute ${orb.size} ${orb.color} rounded-full blur-3xl ${orb.x} ${orb.y} pointer-events-none`}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            delay: orb.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto glass rounded-2xl p-8 sm:p-12 neon-border text-center relative"
        >
          {/* Corner glow accents */}
          <div className="absolute -top-1 -left-1 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-1 -right-1 w-24 h-24 bg-secondary/20 rounded-full blur-2xl pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-6">About the Event</h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Tech Carnival 2K26 is a prestigious two-day national-level technical competition designed to ignite
            innovation, creativity and a spirit of healthy competition among BCA and MCA students across India. Over two
            action-packed days, this event unites the nation's brightest young minds to collaborate, compete and
            celebrate technological excellence under one roof.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
