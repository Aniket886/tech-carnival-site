import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ── Types ──
type CategoryType = "technical" | "gaming" | "cultural" | "break" | "ceremony";
type FilterType = "all" | CategoryType;

interface ScheduleEvent {
  emoji: string;
  name: string;
  startHour: number; // decimal hours from midnight, e.g. 8.75 = 8:45
  endHour: number;
  category: CategoryType;
  venue?: string;
  teamSize?: string;
  day: 1 | 2;
  lane: number; // swim lane index
}

// ── Schedule Data ──
const scheduleData: ScheduleEvent[] = [
  // Day 1
  { emoji: "🏁", name: "Assemble", startHour: 8.75, endHour: 9, category: "ceremony", venue: "Main Ground", day: 1, lane: 0 },
  { emoji: "🎤", name: "Inauguration + Flash Mob", startHour: 9, endHour: 10, category: "ceremony", venue: "Main Auditorium", day: 1, lane: 0 },
  { emoji: "⚡", name: "Hack Momentum", startHour: 10.5, endHour: 17.5, category: "technical", venue: "CS Lab Block", teamSize: "2-4", day: 1, lane: 0 },
  { emoji: "🧠", name: "Brain Quest", startHour: 10.5, endHour: 13.5, category: "technical", venue: "Seminar Hall A", teamSize: "2", day: 1, lane: 1 },
  { emoji: "📊", name: "Pixel Perfect", startHour: 10.5, endHour: 13.5, category: "technical", venue: "Exhibition Hall", teamSize: "1-2", day: 1, lane: 2 },
  { emoji: "🔍", name: "Myth Busters", startHour: 9, endHour: 11, category: "technical", venue: "Seminar Hall B", teamSize: "Solo", day: 1, lane: 3 },
  { emoji: "🍽️", name: "Lunch Break", startHour: 13.5, endHour: 14.5, category: "break", venue: "Cafeteria", day: 1, lane: 1 },
  { emoji: "🎮", name: "Battle Ground – BGMI", startHour: 14.5, endHour: 17.5, category: "gaming", venue: "Gaming Arena", teamSize: "4 (squad)", day: 1, lane: 1 },
  { emoji: "💃", name: "Dance Mania", startHour: 18, endHour: 20, category: "cultural", venue: "Main Auditorium", teamSize: "6-12", day: 1, lane: 0 },
  // Day 2
  { emoji: "🧭", name: "Code Compass", startHour: 9, endHour: 11, category: "technical", venue: "CS Lab 1", teamSize: "Solo", day: 2, lane: 0 },
  { emoji: "🎬", name: "Scitopia", startHour: 11.5, endHour: 14, category: "cultural", venue: "Main Auditorium", teamSize: "5-10", day: 2, lane: 0 },
  { emoji: "🍽️", name: "Lunch Break", startHour: 14, endHour: 15, category: "break", venue: "Cafeteria", day: 2, lane: 1 },
  { emoji: "🏆", name: "Valedictory + Band", startHour: 15.25, endHour: 18, category: "ceremony", venue: "Main Auditorium", day: 2, lane: 0 },
];

const HOUR_START = 8;
const HOUR_END = 21;
const TOTAL_HOURS = HOUR_END - HOUR_START;

const categoryStyle: Record<CategoryType, { bg: string; border: string; text: string; dot: string }> = {
  technical: { bg: "bg-blue-500/15", border: "border-blue-500/40", text: "text-blue-300", dot: "bg-blue-400" },
  gaming: { bg: "bg-red-500/15", border: "border-red-500/40", text: "text-red-300", dot: "bg-red-400" },
  cultural: { bg: "bg-purple-500/15", border: "border-purple-500/40", text: "text-purple-300", dot: "bg-purple-400" },
  break: { bg: "bg-zinc-500/10", border: "border-zinc-500/30", text: "text-zinc-400", dot: "bg-zinc-400" },
  ceremony: { bg: "bg-yellow-500/15", border: "border-yellow-500/40", text: "text-yellow-300", dot: "bg-yellow-400" },
};

const filterChips: { label: string; value: FilterType; emoji: string }[] = [
  { label: "All", value: "all", emoji: "✨" },
  { label: "Technical", value: "technical", emoji: "💻" },
  { label: "Gaming", value: "gaming", emoji: "🎮" },
  { label: "Cultural", value: "cultural", emoji: "🎭" },
  { label: "Ceremonies", value: "ceremony", emoji: "🎤" },
];

const formatTime = (h: number) => {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:${min.toString().padStart(2, "0")} ${ampm}`;
};

const hourMarkers = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i);

// ── Component ──
const EventFlow = () => {
  const [day, setDay] = useState<1 | 2>(1);
  const [filter, setFilter] = useState<FilterType>("all");

  const dayEvents = useMemo(
    () => scheduleData.filter((e) => e.day === day),
    [day]
  );

  const filteredEvents = useMemo(
    () => (filter === "all" ? dayEvents : dayEvents.filter((e) => e.category === filter)),
    [dayEvents, filter]
  );

  const maxLane = useMemo(
    () => Math.max(...dayEvents.map((e) => e.lane), 0),
    [dayEvents]
  );

  const getPillStyle = (ev: ScheduleEvent) => {
    const left = ((ev.startHour - HOUR_START) / TOTAL_HOURS) * 100;
    const width = ((ev.endHour - ev.startHour) / TOTAL_HOURS) * 100;
    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  const isVisible = (ev: ScheduleEvent) =>
    filter === "all" || ev.category === filter;

  return (
    <section id="schedule" className="py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gradient mb-2">
            ⚡ Event Flow
          </h2>
          <p className="text-muted-foreground text-lg">
            Your 2-day schedule at a glance
          </p>
        </motion.div>

        {/* Day Tabs */}
        <div className="flex justify-center gap-3 mb-6">
          {([1, 2] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold border-2 transition-all duration-300 ${
                day === d
                  ? "border-primary bg-primary/15 text-primary neon-glow"
                  : "border-border bg-muted/10 text-muted-foreground hover:border-primary/30"
              }`}
            >
              🔷 Day {d}
            </button>
          ))}
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {filterChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setFilter(chip.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                filter === chip.value
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-muted/5 text-muted-foreground hover:border-primary/20"
              }`}
            >
              {chip.emoji} {chip.label}
            </button>
          ))}
        </div>

        {/* ── Desktop Timetable ── */}
        <div className="hidden md:block">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card/30 p-4 overflow-hidden"
          >
            {/* Hour ruler */}
            <div className="relative h-6 mb-1 ml-0">
              {hourMarkers.map((h) => {
                const left = ((h - HOUR_START) / TOTAL_HOURS) * 100;
                return (
                  <span
                    key={h}
                    className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
                    style={{ left: `${left}%` }}
                  >
                    {h > 12 ? h - 12 : h}
                    {h >= 12 ? "PM" : "AM"}
                  </span>
                );
              })}
            </div>

            {/* Grid lines */}
            <div className="relative">
              {/* Vertical grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                {hourMarkers.map((h) => {
                  const left = ((h - HOUR_START) / TOTAL_HOURS) * 100;
                  return (
                    <div
                      key={h}
                      className="absolute top-0 bottom-0 w-px bg-border/30"
                      style={{ left: `${left}%` }}
                    />
                  );
                })}
              </div>

              {/* Swim lanes */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${day}-${filter}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {Array.from({ length: maxLane + 1 }, (_, lane) => (
                    <div
                      key={lane}
                      className="relative h-14 border-b border-border/15"
                    >
                      {dayEvents
                        .filter((e) => e.lane === lane)
                        .map((ev, i) => {
                          const style = getPillStyle(ev);
                          const cs = categoryStyle[ev.category];
                          const visible = isVisible(ev);
                          return (
                            <Tooltip key={`${ev.name}-${i}`}>
                              <TooltipTrigger asChild>
                                <motion.button
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{
                                    opacity: visible ? 1 : 0.15,
                                    x: 0,
                                    scale: visible ? 1 : 0.97,
                                  }}
                                  transition={{ duration: 0.3, delay: i * 0.05 }}
                                  className={`absolute top-1.5 h-10 rounded-lg border ${cs.bg} ${cs.border} flex items-center gap-1.5 px-2.5 overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:z-10 hover:shadow-[0_0_15px_hsl(var(--primary)/0.2)] group`}
                                  style={{
                                    left: style.left,
                                    width: style.width,
                                    minWidth: "60px",
                                  }}
                                  onClick={() => {
                                    if (ev.category !== "break" && ev.category !== "ceremony") {
                                      const el = document.getElementById("events");
                                      if (el) el.scrollIntoView({ behavior: "smooth" });
                                    }
                                  }}
                                >
                                  <span className="text-sm shrink-0">{ev.emoji}</span>
                                  <span
                                    className={`text-xs font-medium ${cs.text} truncate`}
                                  >
                                    {ev.name}
                                  </span>
                                </motion.button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="bg-card border-border max-w-xs"
                              >
                                <div className="space-y-1">
                                  <p className="font-semibold text-foreground">
                                    {ev.emoji} {ev.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    🕐 {formatTime(ev.startHour)} –{" "}
                                    {formatTime(ev.endHour)}
                                  </p>
                                  {ev.venue && (
                                    <p className="text-xs text-muted-foreground">
                                      📍 {ev.venue}
                                    </p>
                                  )}
                                  {ev.teamSize && (
                                    <p className="text-xs text-muted-foreground">
                                      👥 {ev.teamSize} members
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-border/20">
              {Object.entries(categoryStyle).map(([cat, cs]) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${cs.dot}`} />
                  <span className="text-xs text-muted-foreground capitalize">{cat}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Mobile List ── */}
        <div className="md:hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${day}-${filter}-mobile`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {filteredEvents
                .sort((a, b) => a.startHour - b.startHour)
                .map((ev, i) => {
                  const cs = categoryStyle[ev.category];
                  const durationPct =
                    ((ev.endHour - ev.startHour) / TOTAL_HOURS) * 100;
                  return (
                    <motion.div
                      key={`${ev.name}-${i}`}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`rounded-lg border ${cs.border} ${cs.bg} p-3 cursor-pointer`}
                      onClick={() => {
                        if (ev.category !== "break" && ev.category !== "ceremony") {
                          const el = document.getElementById("events");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{ev.emoji}</span>
                          <span className={`text-sm font-medium ${cs.text} truncate`}>
                            {ev.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatTime(ev.startHour)} – {formatTime(ev.endHour)}
                        </span>
                      </div>
                      {/* Duration bar */}
                      <div className="h-1 rounded-full bg-border/20 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cs.dot}`}
                          style={{ width: `${Math.max(durationPct, 8)}%` }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default EventFlow;
