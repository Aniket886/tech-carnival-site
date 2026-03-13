import { useState, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { FileText, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { EventData } from "./EventsSection";

interface CategoryStyle {
  badge: string;
  accent: string;
  border: string;
  glow: string;
  iconBg: string;
  neonColor: string;
  neonGlow: string;
}

interface EventCardProps {
  event: EventData;
  style: CategoryStyle;
  index: number;
  onSelect: () => void;
  onRegister: (e: ReactMouseEvent) => void;
  registrationOpen?: boolean;
}

const EventCard = ({ event, style, index, onSelect, onRegister, registrationOpen = true }: EventCardProps) => {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -12, y: x * 12 });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={onSelect}
        data-cursor-card
        className="relative overflow-hidden rounded-xl border p-4 sm:p-6 group cursor-pointer"
        style={{
          transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${hovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)"}`,
          transition: "transform 0.3s ease-out, box-shadow 0.3s ease-out, border-color 0.3s ease-out",
          boxShadow: hovered
            ? `${style.neonGlow}, inset 0 1px 0 0 hsl(195 100% 80% / 0.12), inset 0 -1px 0 0 hsl(270 80% 60% / 0.06)`
            : "inset 0 1px 0 0 hsl(195 100% 80% / 0.08), 0 8px 32px -8px hsl(195 100% 50% / 0.08), 0 2px 8px -2px hsl(0 0% 0% / 0.25)",
          borderColor: hovered ? style.neonColor : "hsl(195 100% 50% / 0.1)",
          background: hovered
            ? "linear-gradient(135deg, hsl(195 100% 50% / 0.1) 0%, hsl(230 20% 12% / 0.7) 30%, hsl(270 80% 60% / 0.08) 50%, hsl(230 20% 8% / 0.7) 75%, hsl(195 100% 50% / 0.1) 100%)"
            : "linear-gradient(135deg, hsl(195 100% 50% / 0.06) 0%, hsl(230 20% 8% / 0.4) 25%, hsl(270 80% 60% / 0.04) 50%, hsl(230 20% 8% / 0.45) 75%, hsl(195 100% 50% / 0.06) 100%)",
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
        }}
      >
        {/* Top accent bar */}
        <motion.div
          className={`absolute top-0 left-0 right-0 h-[2px] origin-left ${style.badge.includes("primary") ? "bg-primary" : style.badge.includes("red") ? "bg-red-500" : "bg-accent"}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: index * 0.08 + 0.3 }}
          style={{ opacity: hovered ? 1 : 0.6 }}
        />

        {/* Background glow orb */}
        <div
          className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl transition-opacity duration-300 ${style.glow}`}
          style={{ opacity: hovered ? 0.6 : 0.3 }}
        />

        {/* Hover shimmer */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${(tilt.y / 12 + 0.5) * 100}% ${(-tilt.x / 12 + 0.5) * 100}%, ${style.neonColor.replace(")", " / 0.08)")}, transparent 60%)`,
          }}
        />

        {/* Icon */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4 transition-transform duration-300 ${style.iconBg} ${hovered ? "scale-110" : ""}`}>
          {event.emoji}
        </div>

        {/* Title */}
        <h3 className="font-display font-semibold text-foreground text-base sm:text-lg mb-1.5 sm:mb-2">
          {event.name}
        </h3>

        {/* Short description - always visible */}
        <p className="text-xs sm:text-sm text-muted-foreground mb-2 leading-relaxed">
          {event.description}
        </p>

        {/* Expandable detailed description */}
        <AnimatePresence>
          {(hovered || expanded) && event.detailedDescription && event.detailedDescription !== event.description && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <p className="text-xs text-muted-foreground/80 mb-2 leading-relaxed border-t border-border/40 pt-2">
                {event.detailedDescription.length > 120
                  ? event.detailedDescription.substring(0, 120) + "…"
                  : event.detailedDescription}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Team size */}
        <p className="text-xs text-muted-foreground/70 mb-3 sm:mb-4">
          {event.team_size_min === 1 && event.team_size_max === 1
            ? "👤 Solo"
            : event.team_size_min === event.team_size_max
              ? `👥 Team of ${event.team_size_min}`
              : `👥 Team: ${event.team_size_min}–${event.team_size_max} members`}
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={`text-[11px] sm:text-xs capitalize justify-center min-h-[36px] sm:min-h-0 sm:h-auto truncate ${style.badge}`}>
            {event.category}
          </Badge>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (event.rulebookUrl) {
                window.open(event.rulebookUrl, "_blank", "noopener,noreferrer");
              } else {
                toast("Rule book coming soon!", { description: `The rule book for ${event.name} will be available shortly.` });
              }
            }}
            className="btn-golden min-h-[36px] sm:h-9 px-2 sm:px-3 text-[11px] sm:text-sm font-medium inline-flex items-center justify-center gap-1 overflow-hidden rounded-lg"
          >
            <span className="inline-flex items-center gap-1 truncate"><FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" /> Rule Book</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (event.paymentUrl) {
                window.open(event.paymentUrl, "_blank", "noopener,noreferrer");
              } else {
                toast("Payment link coming soon!", { description: `The payment link for ${event.name} will be available shortly.` });
              }
            }}
            className="btn-gold min-h-[36px] sm:h-9 px-2 sm:px-3 text-[11px] sm:text-sm font-medium inline-flex items-center justify-center gap-1 overflow-hidden rounded-lg"
          >
            <span className="truncate">💰 Pay</span>
          </button>
          <button
            onClick={(e) => onRegister(e)}
            className="btn-golden min-h-[36px] sm:h-9 px-2 sm:px-3 text-[11px] sm:text-sm font-medium inline-flex items-center justify-center overflow-hidden rounded-lg"
          >
            <span className="truncate">Register</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
