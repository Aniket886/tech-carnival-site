import { motion } from "framer-motion";

const About = () => {
  return (
    <section id="about" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto liquid-glass-intense rounded-2xl p-8 sm:p-12 text-center"
        >
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
