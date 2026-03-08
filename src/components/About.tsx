import { motion } from "framer-motion";
import { Mic, Wrench, Trophy, Lightbulb } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Tech Talks",
    desc: "Hear from industry leaders and innovators shaping the future of technology.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: Wrench,
    title: "Workshops",
    desc: "Hands-on sessions in AI, Web3, Cloud, and more cutting-edge domains.",
    gradient: "from-accent/20 to-accent/5",
  },
  {
    icon: Trophy,
    title: "Competitions",
    desc: "Hackathons, coding challenges, and robotics battles with exciting prizes.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: Lightbulb,
    title: "Innovation Hub",
    desc: "Showcase your projects and connect with investors and mentors.",
    gradient: "from-accent/20 to-accent/5",
  },
];

const About = () => (
  <section id="about" className="py-24 relative">
    <div className="container mx-auto px-4 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="section-heading">About the Event</h2>
        <p className="text-muted-foreground leading-relaxed text-lg max-w-3xl mx-auto">
          Tech Carnival 2K26 is a three-day extravaganza bringing together the brightest minds in technology,
          design, and entrepreneurship. From electrifying hackathons to inspiring keynote sessions,
          this is where future-shapers converge to learn, compete, and celebrate innovation.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`rounded-xl border border-border bg-gradient-to-br ${f.gradient} p-6 sm:p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)] group`}
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <f.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default About;
