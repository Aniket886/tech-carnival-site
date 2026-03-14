import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Clock, MapPin, Users, Trophy } from "lucide-react";
import { type EventItem } from "@/components/Events";

const categoryGlow: Record<string, string> = {
  technical: "shadow-[0_0_40px_hsl(217_90%_60%/0.2)]",
  gaming: "shadow-[0_0_40px_hsl(0_80%_55%/0.2)]",
  cultural: "shadow-[0_0_40px_hsl(270_80%_60%/0.2)]",
};

const categoryAccent: Record<string, string> = {
  technical: "text-blue-400",
  gaming: "text-red-400",
  cultural: "text-purple-400",
};

const categoryBorder: Record<string, string> = {
  technical: "border-blue-500/20",
  gaming: "border-red-500/20",
  cultural: "border-purple-500/20",
};

interface Props {
  event: EventItem | null;
  onClose: () => void;
  onRegister?: (eventName: string) => void;
  categoryBadge: Record<string, { label: string; className: string }>;
}

const EventDetailModal = ({ event, onClose, onRegister, categoryBadge }: Props) => {
  if (!event) return null;

  const details = [
    { icon: Calendar, label: "Date", value: "September 15-16, 2026" },
    { icon: Clock, label: "Time", value: "10:00 AM onwards" },
    { icon: MapPin, label: "Venue", value: "Main Auditorium, XYZ College" },
    { icon: Users, label: "Team Size", value: event.teamSize },
    { icon: Trophy, label: "Prize Pool", value: "₹10,000+" },
  ];

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border bg-card p-6 sm:p-8 ${categoryBorder[event.category]} ${categoryGlow[event.category]}`}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{event.emoji}</span>
              <div>
                <h3 className="text-2xl font-bold text-foreground">{event.name}</h3>
                <Badge variant="outline" className={`mt-1 ${categoryBadge[event.category].className}`}>
                  {categoryBadge[event.category].label}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed mb-6">
              {event.detailedDesc}
            </p>

            {/* Event Details */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {details.map((d) => (
                <div
                  key={d.label}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border bg-muted/20 ${categoryBorder[event.category]}`}
                >
                  <d.icon className={`h-4 w-4 mt-0.5 shrink-0 ${categoryAccent[event.category]}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{d.label}</p>
                    <p className="text-sm font-medium text-foreground">{d.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Rules */}
            <div className="mb-6">
              <h4 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${categoryAccent[event.category]}`}>
                Rules & Guidelines
              </h4>
              <ul className="space-y-2">
                {event.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${event.category === "technical" ? "bg-blue-400" : event.category === "gaming" ? "bg-red-400" : "bg-purple-400"}`} />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Register Button */}
            <button
              className="w-full py-3.5 px-6 text-base font-bold tracking-wide rounded-xl
                bg-gradient-to-b from-[hsl(190,100%,55%)] via-[hsl(190,100%,45%)] to-[hsl(190,100%,35%)]
                text-[hsl(210,80%,10%)]
                shadow-[0_6px_0_hsl(190,100%,25%),0_8px_16px_rgba(0,0,0,0.4),inset_0_2px_1px_rgba(255,255,255,0.35),inset_0_-2px_1px_rgba(0,0,0,0.15)]
                hover:shadow-[0_4px_0_hsl(190,100%,25%),0_6px_12px_rgba(0,0,0,0.4),inset_0_2px_1px_rgba(255,255,255,0.35),inset_0_-2px_1px_rgba(0,0,0,0.15)]
                hover:translate-y-[2px]
                active:shadow-[0_1px_0_hsl(190,100%,25%),0_2px_4px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)]
                active:translate-y-[5px]
                transition-all duration-150 ease-out
                border border-[hsl(190,100%,60%)]/30"
              onClick={() => {
                onClose();
                onRegister?.(event.name);
              }}
            >
              Register for {event.name}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EventDetailModal;
