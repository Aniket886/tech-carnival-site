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
          <span className="inline-block text-xs font-display uppercase tracking-[0.3em] text-primary/70 mb-3">🎯 Who We Are</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black gradient-text mb-5 leading-tight">
            About the Event
          </h2>
          <div className="w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-primary to-secondary mb-5" />
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Tech Carnival – 2K26 is a grand inter-collegiate technical and cultural fest designed to ignite the spirit of innovation, creativity, and competition among students across India. Spanning across 2 action-packed days, this carnival brings together the brightest minds to compete, collaborate, and celebrate technology and talent under one roof.
          </p>
        </div>

      </div>
    </section>
  );
};

export default About;
