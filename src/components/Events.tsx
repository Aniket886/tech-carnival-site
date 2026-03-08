import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EventDetailModal from "@/components/EventDetailModal";

type Category = "all" | "technical" | "gaming" | "cultural";

export interface EventItem {
  emoji: string;
  name: string;
  desc: string;
  category: Exclude<Category, "all">;
  teamSize: string;
  detailedDesc: string;
  rules: string[];
  rulebookUrl?: string;
}

const events: EventItem[] = [
  {
    emoji: "⚡", name: "Hack Momentum", desc: "6-hour hackathon to build, innovate, and win!", category: "technical",
    teamSize: "2-4 members",
    detailedDesc: "Hack Momentum is a high-energy 6-hour hackathon where teams race against the clock to ideate, design, and build innovative tech solutions. Whether it's a web app, mobile tool, or an AI-powered prototype — bring your A-game and compete for glory. Mentors and industry experts will be on-site to guide you through the process.",
    rules: ["Teams must consist of 2-4 members", "All code must be written during the event", "Pre-built templates or boilerplates are not allowed", "Projects must be submitted before the deadline", "Judges' decision is final and binding"],
    rulebookUrl: "", // Add Google Drive PDF link here
  },
  {
    emoji: "🧠", name: "Brain Quest", desc: "A Quiz to test your tech knowledge", category: "technical",
    teamSize: "2 members",
    detailedDesc: "Brain Quest is a thrilling multi-round quiz competition that tests your knowledge across technology, science, current affairs, and general trivia. From rapid-fire buzzer rounds to tricky visual puzzles, each round brings a new challenge. Team up with a partner and prove you're the sharpest minds at Tech Carnival.",
    rules: ["Teams of exactly 2 members", "No electronic devices allowed during the quiz", "Multiple rounds with elimination", "Tie-breakers will be conducted if necessary", "Quiz master's decision is final"],
    rulebookUrl: "",
  },
  {
    emoji: "📊", name: "Pixel Perfect", desc: "Present your ideas visually on a poster", category: "technical",
    teamSize: "1-2 members",
    detailedDesc: "Pixel Perfect challenges you to present complex technical ideas through visually compelling posters. Whether it's a research concept, a product idea, or a social impact project — your poster should tell the story. Creativity, clarity, and technical depth are all key evaluation criteria.",
    rules: ["Individual or team of 2 members", "Posters must be original and created by participants", "Standard poster size: A1 or A2", "Digital and hand-drawn posters both accepted", "Presentation time: 5 minutes per team"],
    rulebookUrl: "",
  },
  {
    emoji: "🧭", name: "Code Compass", desc: "Navigate coding challenges and prove your skills", category: "technical",
    teamSize: "Solo",
    detailedDesc: "Code Compass is a competitive programming event that puts your algorithmic thinking and coding speed to the test. Solve a series of increasingly difficult problems across data structures, algorithms, and logic. The fastest and most accurate coder takes the crown.",
    rules: ["Solo participation only", "Languages allowed: C, C++, Java, Python", "Online judge will auto-evaluate submissions", "No internet access during the contest", "Time limit: 2 hours for all problems"],
    rulebookUrl: "",
  },
  {
    emoji: "🔍", name: "Myth Busters", desc: "Bust the myths with facts and logic", category: "technical",
    teamSize: "Solo",
    detailedDesc: "Myth Busters is a unique event where participants are presented with common tech and science myths. Your job? Research, analyze, and either bust or confirm them with solid evidence and logical reasoning. It's a battle of wits, critical thinking, and presentation skills.",
    rules: ["Solo participation only", "Topics will be assigned on the spot", "Preparation time: 15 minutes", "Presentation time: 5 minutes per participant", "Judging based on logic, evidence, and delivery"],
  },
  {
    emoji: "🔥", name: "Battle Ground", desc: "BGMI tournament – last team standing wins!", category: "gaming",
    teamSize: "4 members (squad)",
    detailedDesc: "Battle Ground brings the ultimate BGMI (Battlegrounds Mobile India) esports experience to Tech Carnival. Assemble your squad, strategize your drops, and fight your way to the chicken dinner. Multiple rounds of intense battle royale action await — only the best squad survives.",
    rules: ["Squad of exactly 4 members required", "Players must use their own mobile devices", "Emulators and triggers are strictly prohibited", "Multiple match rounds; points-based scoring", "Fair play policy enforced — cheating leads to disqualification"],
  },
  {
    emoji: "💃", name: "Dance Mania", desc: "Group dance competition to set the stage on fire", category: "cultural",
    teamSize: "6-12 members",
    detailedDesc: "Dance Mania is the ultimate group dance showdown at Tech Carnival. Bring your crew, choreograph a stunning routine, and set the stage ablaze with your moves. Any dance style is welcome — Bollywood, hip-hop, contemporary, folk, or fusion. Energy, synchronization, and creativity are what the judges are looking for.",
    rules: ["Group size: 6-12 members", "Performance duration: 5-8 minutes", "Music track must be submitted 24 hours prior", "Props are allowed but must be managed by the team", "Vulgarity or offensive content leads to disqualification"],
  },
  {
    emoji: "🎬", name: "Scitopia", desc: "Skit play – drama, comedy, and creativity combined", category: "cultural",
    teamSize: "5-10 members",
    detailedDesc: "Scitopia is a theatrical extravaganza where teams perform short skits blending drama, comedy, and social commentary. Choose a theme, write your script, and bring your characters to life on stage. Whether it's a hilarious parody or a thought-provoking narrative — the stage is yours.",
    rules: ["Team size: 5-10 members", "Skit duration: 8-12 minutes", "Scripts must be original", "Basic stage props and costumes are allowed", "Content must be appropriate for all audiences"],
  },
];

const tabs: { label: string; value: Category; emoji: string; accent: string }[] = [
  { label: "All Events", value: "all", emoji: "🌟", accent: "bg-primary/10 text-primary border-primary/30 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground" },
  { label: "Technical", value: "technical", emoji: "💻", accent: "bg-blue-500/10 text-blue-400 border-blue-500/30 data-[active=true]:bg-blue-500 data-[active=true]:text-white" },
  { label: "Gaming", value: "gaming", emoji: "🎮", accent: "bg-red-500/10 text-red-400 border-red-500/30 data-[active=true]:bg-red-500 data-[active=true]:text-white" },
  { label: "Cultural", value: "cultural", emoji: "🎭", accent: "bg-purple-500/10 text-purple-400 border-purple-500/30 data-[active=true]:bg-purple-500 data-[active=true]:text-white" },
];

const categoryBadge: Record<string, { label: string; className: string }> = {
  technical: { label: "Technical", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  gaming: { label: "Gaming", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  cultural: { label: "Cultural", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
};

export const handleRegisterClick = (eventName: string) => {
  const el = document.getElementById("register");
  if (el) el.scrollIntoView({ behavior: "smooth" });
  window.dispatchEvent(new CustomEvent("preselect-event", { detail: eventName }));
};

const Events = () => {
  const [active, setActive] = useState<Category>("all");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const filtered = active === "all" ? events : events.filter((e) => e.category === active);

  return (
    <section id="events" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gradient mb-3">Explore Our Events</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From intense hackathons to electrifying cultural performances — find your arena.
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              data-active={active === tab.value}
              onClick={() => setActive(tab.value)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${tab.accent}`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Event Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <AnimatePresence mode="popLayout">
            {filtered.map((e) => (
              <motion.div
                key={e.name}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className="bg-card/50 border-border hover:border-primary/40 transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_25px_hsl(var(--primary)/0.15)] group h-full flex flex-col cursor-pointer"
                  onClick={() => setSelectedEvent(e)}
                >
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <span className="text-3xl">{e.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{e.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 gap-4">
                    <p className="text-muted-foreground text-sm line-clamp-1">{e.desc}</p>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <Badge variant="outline" className={categoryBadge[e.category].className}>
                        {categoryBadge[e.category].label}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setSelectedEvent(e);
                          }}
                        >
                          Rule Book
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleRegisterClick(e.name);
                          }}
                        >
                          Register
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        categoryBadge={categoryBadge}
      />
    </section>
  );
};

export default Events;
