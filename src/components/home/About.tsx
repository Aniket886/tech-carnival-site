import { Cpu, Users, Trophy, Lightbulb } from "lucide-react";

const features = [
  { icon: Cpu, title: "Tech Talks", desc: "Hear from industry leaders and innovators shaping the future of technology." },
  { icon: Users, title: "Workshops", desc: "Hands-on sessions in AI, Web3, Cloud, and more cutting-edge domains." },
  { icon: Trophy, title: "Competitions", desc: "Hackathons, coding challenges, and robotics battles with exciting prizes." },
  { icon: Lightbulb, title: "Innovation Hub", desc: "Showcase your projects and connect with investors and mentors." },
];

const About = () => {
  return (
    <section id="about" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4">
            About the Event
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Tech Carnival 2K26 is a three-day extravaganza bringing together the brightest minds in
            technology, design, and entrepreneurship. From electrifying hackathons to inspiring keynote
            sessions, this is where future-shapers converge to learn, compete, and celebrate innovation.
          </p>
        </div>

      </div>
    </section>
  );
};

export default About;
