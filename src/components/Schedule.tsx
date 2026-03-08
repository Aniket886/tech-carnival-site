import { motion } from "framer-motion";

const schedule = [
  { time: "09:00 AM", day: "Day 1", event: "Opening Ceremony & Keynote", color: "primary" },
  { time: "10:30 AM", day: "Day 1", event: "Hackathon Kickoff", color: "accent" },
  { time: "02:00 PM", day: "Day 1", event: "Workshop: AI & Machine Learning", color: "primary" },
  { time: "04:00 PM", day: "Day 1", event: "Gaming Arena Begins", color: "accent" },
  { time: "09:00 AM", day: "Day 2", event: "Tech Talks & Panels", color: "primary" },
  { time: "11:00 AM", day: "Day 2", event: "Idea Pitch Competition", color: "accent" },
  { time: "02:00 PM", day: "Day 2", event: "Code Wars Finals", color: "primary" },
  { time: "05:00 PM", day: "Day 2", event: "Closing Ceremony & Prizes", color: "accent" },
];

const Schedule = () => (
  <section id="schedule" className="py-24">
    <div className="container mx-auto px-4 max-w-3xl">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl sm:text-4xl font-bold text-gradient text-center mb-12"
      >
        Schedule
      </motion.h2>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-6">
          {schedule.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4 sm:gap-6 items-start relative"
            >
              <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 z-10 bg-${item.color}`} />
              <div className="bg-card/50 border border-border rounded-lg p-4 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {item.day}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
                <p className="text-foreground font-medium">{item.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default Schedule;
