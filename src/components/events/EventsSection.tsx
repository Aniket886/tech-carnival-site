import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EventDetailModal from "@/components/events/EventDetailModal";
import EventCard from "@/components/events/EventCard";
import RegistrationModal from "@/components/RegistrationModal";
import { supabase } from "@/integrations/supabase/client";
import { fallbackEvents } from "@/data/events";

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

export const categoryStyles: Record<Exclude<Category, "all">, { badge: string; accent: string; border: string; glow: string; iconBg: string; neonColor: string; neonGlow: string }> = {
  technical: {
    badge: "bg-primary/15 text-primary border-primary/30",
    accent: "group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.25)]",
    border: "border-primary/20",
    glow: "bg-primary/5",
    iconBg: "bg-primary/10 ring-1 ring-primary/20",
    neonColor: "hsl(195 100% 50%)",
    neonGlow: "0 0 15px hsl(195 100% 50% / 0.4), 0 0 45px hsl(195 100% 50% / 0.15)",
  },
  gaming: {
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    accent: "group-hover:shadow-[0_0_30px_hsl(0_80%_55%/0.25)]",
    border: "border-red-500/20",
    glow: "bg-red-500/5",
    iconBg: "bg-red-500/10 ring-1 ring-red-500/20",
    neonColor: "hsl(0 80% 55%)",
    neonGlow: "0 0 15px hsl(0 80% 55% / 0.4), 0 0 45px hsl(0 80% 55% / 0.15)",
  },
  cultural: {
    badge: "bg-accent/15 text-accent border-accent/30",
    accent: "group-hover:shadow-[0_0_30px_hsl(var(--accent)/0.25)]",
    border: "border-accent/20",
    glow: "bg-accent/5",
    iconBg: "bg-accent/10 ring-1 ring-accent/20",
    neonColor: "hsl(270 80% 60%)",
    neonGlow: "0 0 15px hsl(270 80% 60% / 0.4), 0 0 45px hsl(270 80% 60% / 0.15)",
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
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [payButtonVisible, setPayButtonVisible] = useState(true);

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
        if (error) console.error("Failed to fetch events:", error);
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
              rulebookUrl: e.rulebook_url || null,
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

    const fetchSettings = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["registration_open", "pay_button_visible"]);
      if (!cancelled && data) {
        const reg = data.find(s => s.setting_key === "registration_open");
        if (reg) setRegistrationOpen(reg.setting_value === "true");
        const pay = data.find(s => s.setting_key === "pay_button_visible");
        if (pay) setPayButtonVisible(pay.setting_value === "true");
      }
    };

    const timeout = setTimeout(() => { if (!cancelled) setLoading(false); }, 8000);
    fetchEvents();
    fetchSettings();

    const channel = supabase
      .channel("events_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => fetchEvents())
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_settings" }, () => fetchSettings())
      .subscribe();

    return () => { cancelled = true; clearTimeout(timeout); supabase.removeChannel(channel); };
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
        <div className="grid grid-cols-2 gap-2 px-4 sm:px-0 sm:flex sm:flex-wrap sm:justify-center sm:gap-2 mb-12 max-w-md sm:max-w-none mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActive(tab.value)}
              className={`${tab.btnClass} min-h-[36px] h-9 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm font-semibold tracking-wider inline-flex items-center justify-center transition-all duration-300 whitespace-nowrap w-full sm:w-auto ${
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
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6" layout>
            <AnimatePresence mode="popLayout">
              {filtered.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  style={categoryStyles[event.category]}
                  index={index}
                  onSelect={() => setSelectedEvent(event)}
                  onRegister={(e) => {
                    e.stopPropagation();
                    setRegisterEvent(event);
                  }}
                  registrationOpen={registrationOpen}
                />
              ))}
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
