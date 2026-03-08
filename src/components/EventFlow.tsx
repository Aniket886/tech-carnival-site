import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { scheduleData, formatTime, type ScheduleCategory } from "@/data/schedule";

type FilterType = "all" | ScheduleCategory;

const HOUR_START = 8;
const HOUR_END = 21;
const TOTAL_HOURS = HOUR_END - HOUR_START;

const categoryStyle: Record<ScheduleCategory, { bg: string; border: string; text: string; dot: string }> = {
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

const hourMarkers = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i);

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

  const getPillStyle = (ev: typeof scheduleData[0]) => {
    const left = ((ev.startHour - HOUR_START) / TOTAL_HOURS) * 100;
    const width = ((ev.endHour - ev.startHour) / TOTAL_HOURS) * 100;
    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  const isVisible = (ev: typeof scheduleData[0]) =>
    filter === "all" || ev.category === filter;

  return (
    <section id="schedule" className="py-24">
      <div className="container mx-auto px-4">
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
            27th & 28th March 2026 — Your 2-day schedule at a glance
          </p>
        </motion.div>

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

        {/* Desktop Timetable */}
        <div className="hidden md:block">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card/30 p-4 overflow-hidden"
          >
            <div className="relative h-6 mb-1 ml-0">
              {hourMarkers.map((h) => {
                const left = ((h - HOUR_START) / TOTAL_HOURS) * 100;
                return (
                  <span key={h} className="absolute text-[10px] text-muted-foreground -translate-x-1/2" style={{ left: `${left}%` }}>
                    {h > 12 ? h - 12 : h}{h >= 12 ? "PM" : "AM"}
                  </span>
                );
              })}
            </div>

            <div className="relative">
              <div className="absolute inset-0 pointer-events-none">
                {hourMarkers.map((h) => {
                  const left = ((h - HOUR_START) / TOTAL_HOURS) * 100;
                  return <div key={h} className="absolute top-0 bottom-0 w-px bg-border/30" style={{ left: `${left}%` }} />;
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={`${day}-${filter}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  {Array.from({ length: maxLane + 1 }, (_, lane) => (
                    <div key={lane} className="relative h-14 border-b border-border/15">
                      {dayEvents.filter((e) => e.lane === lane).map((ev, i) => {
                        const style = getPillStyle(ev);
                        const cs = categoryStyle[ev.category];
                        const visible = isVisible(ev);
                        return (
                          <Tooltip key={`${ev.name}-${i}`}>
                            <TooltipTrigger asChild>
                              <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: visible ? 1 : 0.15, x: 0, scale: visible ? 1 : 0.97 }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                                className={`absolute top-1.5 h-10 rounded-lg border ${cs.bg} ${cs.border} flex items-center gap-1.5 px-2.5 overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:z-10 hover:shadow-[0_0_15px_hsl(var(--primary)/0.2)] group`}
                                style={{ left: style.left, width: style.width, minWidth: "60px" }}
                                onClick={() => {
                                  if (ev.category !== "break" && ev.category !== "ceremony") {
                                    document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
                                  }
                                }}
                              >
                                <span className="text-sm shrink-0">{ev.emoji}</span>
                                <span className={`text-xs font-medium ${cs.text} truncate`}>{ev.name}</span>
                              </motion.button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-card border-border max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold text-foreground">{ev.emoji} {ev.name}</p>
                                <p className="text-xs text-muted-foreground">🕐 {formatTime(ev.startHour)} – {formatTime(ev.endHour)}</p>
                                {ev.venue && <p className="text-xs text-muted-foreground">📍 {ev.venue}</p>}
                                {ev.teamSize && <p className="text-xs text-muted-foreground">👥 {ev.teamSize} members</p>}
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

        {/* Mobile List */}
        <div className="md:hidden">
          <AnimatePresence mode="wait">
            <motion.div key={`${day}-${filter}-mobile`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              {filteredEvents.sort((a, b) => a.startHour - b.startHour).map((ev, i) => {
                const cs = categoryStyle[ev.category];
                const durationPct = ((ev.endHour - ev.startHour) / TOTAL_HOURS) * 100;
                return (
                  <motion.div
                    key={`${ev.name}-${i}`}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`rounded-lg border ${cs.border} ${cs.bg} p-3 cursor-pointer`}
                    onClick={() => {
                      if (ev.category !== "break" && ev.category !== "ceremony") {
                        document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{ev.emoji}</span>
                        <span className={`text-sm font-medium ${cs.text} truncate`}>{ev.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatTime(ev.startHour)} – {formatTime(ev.endHour)}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-border/20 overflow-hidden">
                      <div className={`h-full rounded-full ${cs.dot}`} style={{ width: `${Math.max(durationPct, 8)}%` }} />
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
