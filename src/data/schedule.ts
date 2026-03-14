// ── Canonical schedule data — single source of truth for frontend + CarniBOT ──

export type ScheduleCategory = "technical" | "gaming" | "cultural" | "break" | "ceremony";

export interface ScheduleEvent {
  emoji: string;
  name: string;
  startHour: number; // decimal hours from midnight, e.g. 8.75 = 8:45 AM
  endHour: number;
  category: ScheduleCategory;
  venue: string;
  teamSize?: string;
  day: 1 | 2;
  lane: number; // swim-lane index for timetable layout
}

export const scheduleData: ScheduleEvent[] = [
  // ─── Day 1 ───
  {
    emoji: "🏁",
    name: "Assemble",
    startHour: 8.75,
    endHour: 9,
    category: "ceremony",
    venue: "Main Auditorium",
    day: 1,
    lane: 0,
  },
  {
    emoji: "🎤",
    name: "Inauguration + Flash Mob + Banner Drop",
    startHour: 9,
    endHour: 10,
    category: "ceremony",
    venue: "Main Auditorium",
    day: 1,
    lane: 0,
  },
  {
    emoji: "⚡",
    name: "Hack Momentum (6hr Hackathon)",
    startHour: 10.5,
    endHour: 17.5,
    category: "technical",
    venue: "Main Auditorium",
    teamSize: "2-4",
    day: 1,
    lane: 0,
  },
  {
    emoji: "🧠",
    name: "Brain Quest",
    startHour: 10.5,
    endHour: 13.5,
    category: "technical",
    venue: "Seminar Hall A",
    teamSize: "2",
    day: 1,
    lane: 1,
  },
  {
    emoji: "📊",
    name: "Pixel Perfect",
    startHour: 10.5,
    endHour: 13.5,
    category: "technical",
    venue: "Exhibition Hall",
    teamSize: "1-2",
    day: 1,
    lane: 2,
  },
  {
    emoji: "🍽️",
    name: "Lunch Break",
    startHour: 13.5,
    endHour: 14.5,
    category: "break",
    venue: "Food Court",
    day: 1,
    lane: 1,
  },
  {
    emoji: "🎮",
    name: "Battle Ground – BGMI",
    startHour: 14.5,
    endHour: 17,
    category: "gaming",
    venue: "Gaming Arena",
    teamSize: "4 (squad)",
    day: 1,
    lane: 1,
  },
  {
    emoji: "🔍",
    name: "Myth Busters",
    startHour: 14.5,
    endHour: 17,
    category: "technical",
    venue: "Seminar Hall B",
    teamSize: "Solo",
    day: 1,
    lane: 3,
  },
  {
    emoji: "💃",
    name: "Dance Mania (Group Dance)",
    startHour: 18,
    endHour: 20,
    category: "cultural",
    venue: "Auditorium",
    teamSize: "6-12",
    day: 1,
    lane: 0,
  },

  // ─── Day 2 ───
  {
    emoji: "🧭",
    name: "Code Compass",
    startHour: 9,
    endHour: 11,
    category: "technical",
    venue: "Computer Lab 1",
    teamSize: "Solo",
    day: 2,
    lane: 0,
  },
  {
    emoji: "🎬",
    name: "Scitopia (Skit Play)",
    startHour: 11.5,
    endHour: 14,
    category: "cultural",
    venue: "Main Auditorium",
    teamSize: "5-10",
    day: 2,
    lane: 0,
  },
  {
    emoji: "🍽️",
    name: "Lunch Break",
    startHour: 14,
    endHour: 15,
    category: "break",
    venue: "Food Court",
    day: 2,
    lane: 1,
  },
  {
    emoji: "🏆",
    name: "Valedictory + Special Band Performance",
    startHour: 15.25,
    endHour: 18,
    category: "ceremony",
    venue: "Main Auditorium",
    day: 2,
    lane: 0,
  },
];

/** Format decimal hour to readable string, e.g. 14.5 → "2:30 PM" */
export const formatTime = (h: number): string => {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:${min.toString().padStart(2, "0")} ${ampm}`;
};

/** Build a plain-text schedule summary for CarniBOT / AI context */
export const buildScheduleText = (): string => {
  const lines: string[] = ["FULL EVENT SCHEDULE:"];

  for (const day of [1, 2] as const) {
    lines.push(`\nDay ${day}:`);
    const dayEvents = scheduleData.filter((e) => e.day === day).sort((a, b) => a.startHour - b.startHour);

    for (const ev of dayEvents) {
      const time = `${formatTime(ev.startHour)} – ${formatTime(ev.endHour)}`;
      const team = ev.teamSize ? ` | Team: ${ev.teamSize}` : "";
      lines.push(`  ${ev.emoji} ${ev.name} — ${time} — 📍 ${ev.venue}${team} [${ev.category}]`);
    }
  }

  return lines.join("\n");
};
