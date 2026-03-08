import { motion } from "framer-motion";

const About = () => (
  <section id="about" className="py-24 relative">
    <div className="container mx-auto px-4 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-xl border border-border bg-card/50 p-8 sm:p-12 neon-glow text-center"
      >
        <h2 className="section-heading">About the Event</h2>
        <p className="text-muted-foreground leading-relaxed text-lg">
          Tech Carnival 2K26 is a three-day extravaganza bringing together the brightest minds in technology,
          design, and entrepreneurship. From electrifying hackathons to inspiring keynote sessions,
          this is where future-shapers converge to learn, compete, and celebrate innovation.
        </p>
      </motion.div>
    </div>
  </section>
);

export default About;
