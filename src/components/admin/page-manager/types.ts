export interface Section {
  id: string;
  section_key: string;
  section_name: string;
  description: string | null;
  is_visible: boolean;
  display_order: number;
  updated_at: string;
}

export interface Card {
  id: string;
  section_key: string;
  card_key: string;
  card_name: string;
  is_visible: boolean;
  display_order: number;
}

export interface LogEntry {
  id: string;
  target_type: string;
  target_name: string;
  target_key: string;
  changed_from: boolean;
  changed_to: boolean;
  changed_at: string;
  changed_by: string | null;
}

export const sectionIcons: Record<string, string> = {
  hero: "🏠", about: "ℹ️", how_to_register: "🎬", sponsors: "💛", events: "🎯",
  schedule: "📅", registration: "📋", leaderboard: "🏆",
  gallery: "🖼️", faq: "❓", contact: "📞", footer: "❤️", carnibot: "🤖",
  organizing_committee: "👥", core_team: "🎓",
};

export const fmtDate = (d: string) => {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
};
