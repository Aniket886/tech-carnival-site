import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import EventDetailModal from "@/components/events/EventDetailModal";
import RegistrationModal from "@/components/RegistrationModal";
import { supabase } from "@/integrations/supabase/client";
import { fallbackEvents } from "@/data/events";
import { toast } from "sonner";

type Category = "all" | "technical" | "gaming" | "cultural";

export interface EventData {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: Exclude<Category, "all">;
  teamSize: string;
  team_size_min: number;
  team_size_max: number;
  detailedDescription: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  prize_pool: string | null;
  rules: string[] | null;
  rulebookUrl: string | null;
  paymentUrl: string | null;
  price: number;
}

const tabs: { label: string; value: Category; icon: string; btnClass: string; ringColor: string }[] = [
  { label: "All Events", value: "all", icon: "🎯", btnClass: "btn-gold", ringColor: "ring-[hsl(45_90%_55%/0.5)]" },
  { label: "Technical", value: "technical", icon: "💻", btnClass: "btn-golden", ringColor: "ring-primary/50" },
  { label: "Gaming", value: "gaming", icon: "🎮", btnClass: "btn-red", ringColor: "ring-[hsl(0_80%_55%/0.5)]" },
  { label: "Cultural", value: "cultural", icon: "🎭", btnClass: "btn-purple", ringColor: "ring-[hsl(270_80%_60%/0.5)]" },
];

const categoryStyles: Record<Exclude<Category, "all">, { badge: string; accent: string; border: string; glow: string; iconBg: string }> = {
  technical: {
    badge: "bg-primary/15 text-primary border-primary/30",
    accent: "group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.25)]",
    border: "border-primary/20 hover:border-primary/40",
    glow: "bg-primary/5",
    iconBg: "bg-primary/10 ring-1 ring-primary/20",
  },
  gaming: {
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    accent: "group-hover:shadow-[0_0_30px_hsl(0_80%_55%/0.25)]",
    border: "border-red-500/20 hover:border-red-500/40",
    glow: "bg-red-500/5",
    iconBg: "bg-red-500/10 ring-1 ring-red-500/20",
  },
  cultural: {
    badge: "bg-accent/15 text-accent border-accent/30",
    accent: "group-hover:shadow-[0_0_30px_hsl(var(--accent)/0.25)]",
    border: "border-accent/20 hover:border-accent/40",
    glow: "bg-accent/5",
    iconBg: "bg-accent/10 ring-1 ring-accent/20",
  },
};

const formatTeamSize = (min: number, max: number): string => {
  if (min === max) return min === 1 ? "Solo" : `${min} members`;
  return `${min}-${max} members`;
};

const EventsSection = () => {
  const [active, setActive] = useState<Category>("all");
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [registerEvent, setRegisterEvent] = useState<EventData | null>(null);
  const [events, setEvents] = useState<EventData[]>(fallbackEvents);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (cancelled) return;
        if (error) {
          console.error("Failed to fetch events:", error);
        }
        if (data && data.length > 0) {
          setEvents(
            data.map((e: any) => ({
              id: e.id,
              emoji: e.icon || "🎯",
              name: e.name,
              description: e.description ? (e.description.length > 60 ? e.description.substring(0, 60) + "..." : e.description) : "No description available",
              category: e.category as Exclude<Category, "all">,
              teamSize: formatTeamSize(e.team_size_min || 1, e.team_size_max || 1),
              team_size_min: e.team_size_min || 1,
              team_size_max: e.team_size_max || 1,
              detailedDescription: e.description || "",
              date: e.date,
              time: e.time,
              venue: e.venue,
              prize_pool: e.prize_pool,
              rules: e.rules,
              rulebookUrl: e.website_url || null,
              paymentUrl: e.payment_url || null,
              price: e.price || 0,
            }))
          );
        }
      } catch (err) {
        console.error("Events fetch exception:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    fetchEvents();
    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  const filtered = active === "all" ? events : events.filter((e) => e.category === active);

  return (
    <section id="events" className="py-24 pb-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text mb-4">
            Explore Our Events
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From high-intensity hackathons to electrifying cultural performances — there's something for everyone.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-start sm:justify-center gap-2 mb-12 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActive(tab.value)}
              className={`${tab.btnClass} h-9 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm font-semibold tracking-wider inline-flex items-center justify-center transition-all duration-300 whitespace-nowrap shrink-0 ${
                active === tab.value ? `ring-2 ${tab.ringColor}` : "opacity-70"
              }`}
            >
              <span>{tab.icon} {tab.label}</span>
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading events...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No events found. Check back soon!</div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((event, index) => {
                const style = categoryStyles[event.category];
                return (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.08,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    data-cursor-card
                    onClick={() => setSelectedEvent(event)}
                    className={`relative overflow-hidden rounded-xl border p-4 sm:p-6 group hover:scale-[1.03] transition-all duration-300 cursor-pointer bg-card/40 backdrop-blur-sm ${style.border} ${style.accent}`}
                  >
                    {/* Category glow accent */}
                    <motion.div
                      className={`absolute top-0 left-0 right-0 h-1 origin-left ${style.badge.includes("primary") ? "bg-primary/60" : style.badge.includes("red") ? "bg-red-500/60" : "bg-accent/60"}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.08 + 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                    <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 ${style.glow}`} />
                    
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4 ${style.iconBg}`}>{event.emoji}</div>
                    <h3 className="font-display font-semibold text-foreground text-base sm:text-lg mb-1.5 sm:mb-2">
                      {event.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                      {event.description}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mb-3 sm:mb-4">
                      {event.team_size_min === 1 && event.team_size_max === 1
                        ? "👤 Solo"
                        : event.team_size_min === event.team_size_max
                          ? `👥 Team of ${event.team_size_min}`
                          : `👥 Team: ${event.team_size_min}–${event.team_size_max} members`}
                    </p>
                    {/* Button row: 2x2 grid on mobile, horizontal on sm+ */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between gap-2">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setRegisterEvent(event);
                        }}
                        className="btn-golden min-h-[36px] sm:h-9 px-2 sm:px-3 text-[11px] sm:text-sm font-medium inline-flex items-center justify-center overflow-hidden rounded-lg"
                      >
                        <span className="truncate">Register</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onRegister={(name) => {
          setSelectedEvent(null);
          const ev = events.find(e => e.name === name);
          if (ev) setRegisterEvent(ev);
        }}
        categoryStyles={categoryStyles}
      />

      <RegistrationModal
        eventData={registerEvent}
        onClose={() => setRegisterEvent(null)}
      />
    </section>
  );
};

export default EventsSection;
