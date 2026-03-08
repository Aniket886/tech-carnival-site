import { useState, useEffect, useRef, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

type Category = "technical" | "gaming" | "cultural" | "ceremony" | "break";
type FilterCategory = "all" | Category;

interface ScheduleEvent {
  name: string;
  icon: string;
  startHour: number;
  endHour: number;
  category: Category;
  venue: string;
}

interface DaySchedule {
  label: string;
  startHour: number;
  endHour: number;
  events: ScheduleEvent[];
}

const days: DaySchedule[] = [
  {
    label: "Day 1",
    startHour: 8,
    endHour: 20,
    events: [
      { name: "Assemble", icon: "🏁", startHour: 8.75, endHour: 9, category: "ceremony", venue: "Main Gate" },
      { name: "Inauguration + Flash Mob + Banner Drop", icon: "🎤", startHour: 9, endHour: 10, category: "ceremony", venue: "Main Auditorium" },
      { name: "Hack Momentum (6hr Hackathon)", icon: "⚡", startHour: 10.5, endHour: 17.5, category: "technical", venue: "Main Auditorium" },
      { name: "Brain Quest (Mega Quiz)", icon: "🧠", startHour: 10.5, endHour: 13.5, category: "technical", venue: "Seminar Hall A" },
      { name: "Poster Presentation", icon: "📊", startHour: 10.5, endHour: 13.5, category: "technical", venue: "Exhibition Hall" },
      { name: "Lunch Break", icon: "🍽️", startHour: 13.5, endHour: 14.5, category: "break", venue: "Food Court" },
      { name: "Pitch Perfect", icon: "🎯", startHour: 14.5, endHour: 17, category: "technical", venue: "Seminar Hall B" },
      { name: "Battle Ground – Free Fire", icon: "🎮", startHour: 14.5, endHour: 17.5, category: "gaming", venue: "Gaming Arena" },
      { name: "Dance Mania (Group Dance)", icon: "💃", startHour: 17, endHour: 20, category: "cultural", venue: "Main Stage" },
    ],
  },
  {
    label: "Day 2",
    startHour: 9,
    endHour: 18,
    events: [
      { name: "Code Compass", icon: "🧭", startHour: 9, endHour: 11, category: "technical", venue: "Computer Lab 1" },
      { name: "Scitopia (Skit Play)", icon: "🎬", startHour: 11.5, endHour: 14, category: "cultural", venue: "Main Stage" },
      { name: "Lunch Break", icon: "🍽️", startHour: 14, endHour: 15, category: "break", venue: "Food Court" },
      { name: "Valedictory + Special Band Performance", icon: "🏆", startHour: 15.25, endHour: 18, category: "ceremony", venue: "Main Auditorium" },
    ],
  },
];

const filters: { label: string; value: FilterCategory; icon: string }[] = [
  { label: "All", value: "all", icon: "🎯" },
  { label: "Technical", value: "technical", icon: "💻" },
  { label: "Gaming", value: "gaming", icon: "🎮" },
  { label: "Cultural", value: "cultural", icon: "🎭" },
  { label: "Ceremonies", value: "ceremony", icon: "🎤" },
  { label: "Breaks", value: "break", icon: "🍽️" },
];

const categoryColors: Record<Category, { bg: string; border: string; text: string }> = {
  technical: { bg: "bg-primary/20", border: "border-primary/50", text: "text-primary" },
  gaming: { bg: "bg-red-500/20", border: "border-red-500/50", text: "text-red-400" },
  cultural: { bg: "bg-accent/20", border: "border-accent/50", text: "text-accent" },
  ceremony: { bg: "bg-amber-400/20", border: "border-amber-400/50", text: "text-amber-400" },
  break: { bg: "bg-foreground/10", border: "border-foreground/30", text: "text-muted-foreground" },
};

function formatHour(h: number): string {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const ampm = hr >= 12 ? "PM" : "AM";
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return min > 0 ? `${display}:${min.toString().padStart(2, "0")} ${ampm}` : `${display} ${ampm}`;
}

function assignLanes(events: ScheduleEvent[]): { event: ScheduleEvent; lane: number }[] {
  const sorted = [...events].sort((a, b) => a.startHour - b.startHour || a.endHour - b.endHour);
  const lanes: number[][] = [];
  return sorted.map((ev) => {
    let assigned = -1;
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i].every((end) => ev.startHour >= end)) {
        assigned = i;
        break;
      }
    }
    if (assigned === -1) {
      assigned = lanes.length;
      lanes.push([]);
    }
    lanes[assigned].push(ev.endHour);
    return { event: ev, lane: assigned };
  });
}

function DesktopTimetable({ day, activeCategory }: { day: DaySchedule; activeCategory: FilterCategory }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [nowPct, setNowPct] = useState<number | null>(null);

  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, [day.label, activeCategory]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      if (currentHour >= day.startHour && currentHour <= day.endHour) {
        setNowPct(((currentHour - day.startHour) / (day.endHour - day.startHour)) * 100);
      } else {
        setNowPct(null);
      }
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [day.startHour, day.endHour]);

  const hours: number[] = [];
  for (let h = day.startHour; h <= day.endHour; h++) hours.push(h);

  const laneData = useMemo(() => assignLanes(day.events), [day]);
  const laneCount = Math.max(1, ...laneData.map((d) => d.lane + 1));
  const LANE_H = 44;

  const pct = (h: number) => ((h - day.startHour) / (day.endHour - day.startHour)) * 100;

  return (
    <div ref={sectionRef} className="hidden md:block">
      <div className="relative h-8 mb-1">
        {hours.map((h) => (
          <span
            key={h}
            className="absolute text-[11px] font-mono text-muted-foreground -translate-x-1/2"
            style={{ left: `${pct(h)}%` }}
          >
            {formatHour(h)}
          </span>
        ))}
      </div>

      <div
        className="relative schedule-grid-bg rounded-xl border border-border/40 overflow-hidden"
        style={{ height: laneCount * LANE_H + 8 }}
      >
        {hours.map((h) => (
          <div
            key={h}
            className="absolute top-0 bottom-0 w-px bg-foreground/[0.06]"
            style={{ left: `${pct(h)}%` }}
          />
        ))}

        {nowPct !== null && (
          <div
            className="absolute top-0 bottom-0 z-30 flex flex-col items-center pointer-events-none"
            style={{ left: `${nowPct}%` }}
          >
            <span className="text-[9px] font-bold text-red-500 bg-red-500/20 px-1.5 rounded-b-md">NOW</span>
            <div className="w-0.5 flex-1 bg-red-500/80 animate-pulse" />
          </div>
        )}

        <TooltipProvider delayDuration={150}>
          {laneData.map(({ event: ev, lane }, i) => {
            const left = pct(ev.startHour);
            const width = pct(ev.endHour) - left;
            const dimmed = activeCategory !== "all" && ev.category !== activeCategory;
            const colors = categoryColors[ev.category];

            return (
              <Tooltip key={`${ev.name}-${i}`}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => document.getElementById("events")?.scrollIntoView({ behavior: "smooth" })}
                    className={`absolute flex items-center gap-1.5 px-2.5 rounded-lg border text-[12px] font-medium truncate cursor-pointer
                      transition-all duration-300 hover:scale-[1.04] hover:z-20
                      ${colors.bg} ${colors.border} ${colors.text}
                      ${dimmed ? "opacity-20 pointer-events-none" : "opacity-100"}
                      ${visible ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"}
                    `}
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 3)}%`,
                      top: lane * LANE_H + 4,
                      height: LANE_H - 8,
                      transitionDelay: `${i * 40}ms`,
                    }}
                  >
                    <span className="shrink-0">{ev.icon}</span>
                    <span className="truncate">{ev.name}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="glass-strong text-xs max-w-[220px]">
                  <p className="font-semibold">{ev.icon} {ev.name}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {formatHour(ev.startHour)} – {formatHour(ev.endHour)}
                  </p>
                  <p className="text-muted-foreground">📍 {ev.venue}</p>
                  <Badge variant="outline" className={`mt-1 text-[10px] capitalize ${colors.text} ${colors.border}`}>
                    {ev.category}
                  </Badge>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}

function MobileScheduleList({ day, activeCategory }: { day: DaySchedule; activeCategory: FilterCategory }) {
  const sorted = useMemo(
    () => [...day.events].sort((a, b) => a.startHour - b.startHour),
    [day]
  );
  const maxDuration = Math.max(...sorted.map((e) => e.endHour - e.startHour));

  return (
    <div className="md:hidden space-y-2">
      {sorted.map((ev, i) => {
        const dimmed = activeCategory !== "all" && ev.category !== activeCategory;
        const colors = categoryColors[ev.category];
        const barWidth = ((ev.endHour - ev.startHour) / maxDuration) * 100;

        return (
          <div
            key={`${ev.name}-${i}`}
            className={`transition-opacity duration-300 ${dimmed ? "opacity-20" : "opacity-100"}`}
          >
            <div className="flex items-center justify-between gap-2 py-1.5 px-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{ev.icon}</span>
                <span className={`text-sm font-medium truncate ${colors.text}`}>{ev.name}</span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                {formatHour(ev.startHour)} – {formatHour(ev.endHour)}
              </span>
            </div>
            <div className="h-1 rounded-full bg-foreground/5 ml-8 mr-1">
              <div
                className={`h-full rounded-full ${colors.bg} ${colors.border} border`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const ScheduleSection = () => {
  const [activeDay, setActiveDay] = useState(0);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");

  const day = days[activeDay];

  return (
    <section id="schedule" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text mb-3">
            ⚡ Event Flow
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Your 2-day schedule at a glance
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {days.map((d, i) => (
            <button
              key={d.label}
              onClick={() => { setActiveDay(i); setActiveCategory("all"); }}
              className={`h-11 px-7 text-base font-sans font-semibold tracking-wide inline-flex items-center justify-center rounded-lg border transition-all duration-300
                ${activeDay === i
                  ? "bg-amber-500/20 border-amber-400/60 text-amber-400 shadow-[0_0_16px_hsl(45_90%_55%/0.3)]"
                  : "bg-primary/10 border-primary/40 text-primary hover:bg-primary/20"
                }`}
            >
              <span className="font-sans">{d.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveCategory(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${activeCategory === f.value
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-foreground/5 text-muted-foreground hover:text-foreground border border-transparent"
                }`}
            >
              <span className="mr-1">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        <DesktopTimetable day={day} activeCategory={activeCategory} />
        <MobileScheduleList day={day} activeCategory={activeCategory} />
      </div>
    </section>
  );
};

export default ScheduleSection;
