import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Clock, MapPin, Users, Trophy, IndianRupee, Globe, ExternalLink } from "lucide-react";
import type { EventData } from "@/components/events/EventsSection";

interface EventDetailModalProps {
  event: EventData | null;
  onClose: () => void;
  onRegister: (eventName: string) => void;
  categoryStyles: Record<string, { badge: string; accent: string }>;
}

const categoryAccentColors: Record<string, { border: string; glow: string; bg: string }> = {
  technical: {
    border: "border-primary/40",
    glow: "shadow-[0_0_40px_hsl(var(--primary)/0.15)]",
    bg: "bg-primary/5",
  },
  gaming: {
    border: "border-red-500/40",
    glow: "shadow-[0_0_40px_hsl(0_80%_55%/0.15)]",
    bg: "bg-red-500/5",
  },
  cultural: {
    border: "border-accent/40",
    glow: "shadow-[0_0_40px_hsl(var(--accent)/0.15)]",
    bg: "bg-accent/5",
  },
};

const EventDetailModal = ({ event, onClose, onRegister, categoryStyles }: EventDetailModalProps) => {
  useEffect(() => {
    if (event) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [event]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!event) return null;

  const colors = categoryAccentColors[event.category] || categoryAccentColors.technical;
  const badgeStyle = categoryStyles[event.category]?.badge ?? "";

  const formatDate = (d: string | null) => {
    if (!d) return "TBA";
    return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  };

  const details = [
    { icon: Calendar, label: "Date", value: formatDate(event.date) },
    { icon: Clock, label: "Time", value: event.time || "TBA" },
    { icon: MapPin, label: "Venue", value: event.venue || "TBA" },
    { icon: Users, label: "Team Size", value: event.teamSize },
    { icon: Trophy, label: "Prize Pool", value: event.prize_pool || "TBA" },
    { icon: IndianRupee, label: "Registration Fee", value: event.price > 0 ? `₹${event.price}` : "Free" },
  ];

  const eventRules = event.rules?.length ? event.rules : [
    "All participants must carry a valid college ID card.",
    "Decisions of the judges will be final and binding.",
    "Any form of malpractice will lead to immediate disqualification.",
    "Participants must report to the venue 15 minutes before the event starts.",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl glass-strong ${colors.border} ${colors.glow} animate-in zoom-in-95 fade-in duration-300`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="p-6 sm:p-8 pb-0">
          <div className="flex items-start gap-4 mb-4">
            <div className={`text-5xl p-3 rounded-xl ${colors.bg}`}>{event.emoji}</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-foreground mb-2">
                {event.name}
              </h2>
              <Badge variant="outline" className={`text-xs capitalize ${badgeStyle}`}>
                {event.category}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 pt-4 space-y-6">
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-2">
              About This Event
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {event.detailedDescription}
            </p>
          </div>

          <div className={`rounded-xl p-4 ${colors.bg} border ${colors.border}`}>
            <h3 className="font-display text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-3">
              Event Details
            </h3>
            <div className="space-y-3">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <Icon size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{label}:</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
              {event.websiteUrl && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Event Website:</span>
                  <a
                    href={event.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Visit Website <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-2">
              Rules & Guidelines
            </h3>
            <ul className="space-y-2">
              {eventRules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                  <span className="text-primary mt-0.5">•</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <Button
            variant="neon"
            className="w-full"
            onClick={() => onRegister(event.name)}
          >
            Register for {event.name}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
