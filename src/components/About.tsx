import { motion } from "framer-motion";

const About = () => (
  <section id="about" className="py-24">
    <div className="container mx-auto px-4 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-xl border border-border bg-card/50 p-8 sm:p-12 neon-glow"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-gradient mb-6">About the Event</h2>
        <p className="text-muted-foreground leading-relaxed text-lg">
          Tech Carnival 2K26 is the ultimate celebration of technology, creativity, and innovation.
          Hosted annually by our college, this two-day extravaganza brings together students, developers,
          designers, and tech enthusiasts from across the country. With exciting hackathons, hands-on
          workshops, insightful talks, and thrilling competitions, Tech Carnival is your gateway to
          pushing boundaries and building the future.
        </p>
      </motion.div>
    </div>
  </section>
);

export default About;
