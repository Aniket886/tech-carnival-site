import { motion } from "framer-motion";
import { Code, Cpu, Gamepad2, Lightbulb, Presentation, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const events = [
  { icon: Code, title: "Hackathon", desc: "24-hour coding marathon to build innovative solutions." },
  { icon: Presentation, title: "Tech Talks", desc: "Inspiring sessions from industry leaders and innovators." },
  { icon: Cpu, title: "Workshop", desc: "Hands-on workshops on AI, Web3, and Cloud technologies." },
  { icon: Gamepad2, title: "Gaming Arena", desc: "Competitive esports tournaments with exciting prizes." },
  { icon: Lightbulb, title: "Idea Pitch", desc: "Pitch your startup idea to a panel of expert judges." },
  { icon: Trophy, title: "Code Wars", desc: "Competitive programming challenges for the sharpest minds." },
];

const Events = () => (
  <section id="events" className="py-24">
    <div className="container mx-auto px-4">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl sm:text-4xl font-bold text-gradient text-center mb-12"
      >
        Events
      </motion.h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {events.map((e, i) => (
          <motion.div
            key={e.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-card/50 border-border hover:border-primary/50 transition-colors group">
              <CardHeader className="flex flex-row items-center gap-3">
                <e.icon className="h-8 w-8 text-primary group-hover:text-accent transition-colors" />
                <CardTitle className="text-lg">{e.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{e.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Events;
