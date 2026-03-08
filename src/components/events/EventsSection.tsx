import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import EventDetailModal from "@/components/events/EventDetailModal";
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
  detailedDescription: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  prize_pool: string | null;
  rules: string[] | null;
  rulebookUrl: string | null;
}

const tabs: { label: string; value: Category; icon: string }[] = [
  { label: "All Events", value: "all", icon: "🎯" },
  { label: "Technical", value: "technical", icon: "💻" },
  { label: "Gaming", value: "gaming", icon: "🎮" },
  { label: "Cultural", value: "cultural", icon: "🎭" },
];

const categoryStyles: Record<Exclude<Category, "all">, { badge: string; accent: string }> = {
  technical: {
    badge: "bg-primary/15 text-primary border-primary/30",
    accent: "group-hover:shadow-[0_0_25px_hsl(var(--primary)/0.2)]",
  },
  gaming: {
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    accent: "group-hover:shadow-[0_0_25px_hsl(0_80%_55%/0.2)]",
  },
  cultural: {
    badge: "bg-accent/15 text-accent border-accent/30",
    accent: "group-hover:shadow-[0_0_25px_hsl(var(--accent)/0.2)]",
  },
};

const formatTeamSize = (min: number, max: number): string => {
  if (min === max) return min === 1 ? "Solo" : `${min} members`;
  return `${min}-${max} members`;
};

const EventsSection = () => {
  const [active, setActive] = useState<Category>("all");
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [registerEventName, setRegisterEventName] = useState<string | null>(null);
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
              detailedDescription: e.description || "",
              date: e.date,
              time: e.time,
              venue: e.venue,
              prize_pool: e.prize_pool,
              rules: e.rules,
              rulebookUrl: e.website_url || null,
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
    <section id="events" className="py-24 relative">
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
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActive(tab.value)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all duration-300 ${
                active === tab.value
                  ? "bg-primary/15 text-primary neon-border"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading events...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No events found. Check back soon!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event) => {
              const style = categoryStyles[event.category];
              return (
                <div
                  key={event.id}
                  data-cursor-card
                  onClick={() => setSelectedEvent(event)}
                  className={`glass rounded-xl p-6 group hover:scale-[1.03] transition-all duration-300 cursor-pointer ${style.accent}`}
                >
                  <div className="text-4xl mb-4">{event.emoji}</div>
                  <h3 className="font-display font-semibold text-foreground text-lg mb-2">
                    {event.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {event.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-xs capitalize ${style.badge}`}>
                      {event.category}
                    </Badge>
                    <Button
                      variant="neon-outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRegisterEventName(event.name);
                      }}
                    >
                      Register
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onRegister={(name) => {
          setSelectedEvent(null);
          setRegisterEventName(name);
        }}
        categoryStyles={categoryStyles}
      />

      <RegistrationModal
        eventName={registerEventName}
        onClose={() => setRegisterEventName(null)}
      />
    </section>
  );
};

export default EventsSection;
