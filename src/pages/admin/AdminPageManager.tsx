import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ChevronDown, ChevronUp, ExternalLink, RotateCcw, Search,
  Wrench, Eye, EyeOff, Activity, Shield,
} from "lucide-react";
import { useIsOwner } from "@/hooks/useIsOwner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ─── types ─── */
interface Section {
  id: string;
  section_key: string;
  section_name: string;
  description: string | null;
  is_visible: boolean;
  display_order: number;
  updated_at: string;
}

interface Card {
  id: string;
  section_key: string;
  card_key: string;
  card_name: string;
  is_visible: boolean;
  display_order: number;
}

interface LogEntry {
  id: string;
  target_type: string;
  target_name: string;
  target_key: string;
  changed_from: boolean;
  changed_to: boolean;
  changed_at: string;
  changed_by: string | null;
}

/* ─── section emoji map ─── */
const sectionIcons: Record<string, string> = {
  hero: "🏠", about: "ℹ️", how_to_register: "🎬", sponsors: "💛", events: "🎯",
  schedule: "📅", registration: "📋", leaderboard: "🏆",
  gallery: "🖼️", faq: "❓", contact: "📞", footer: "❤️", carnibot: "🤖",
};

/* ─── helpers ─── */
const fmtDate = (d: string) => {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
};

/* ─── main ─── */
const AdminPageManager = () => {
  const isOwner = useIsOwner();
  const [sections, setSections] = useState<Section[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cardFilter, setCardFilter] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [regOpen, setRegOpen] = useState(true);

  /* fetch all data */
  const fetchAll = useCallback(async () => {
    const [{ data: secs }, { data: crds }, { data: logData }, { data: settings }] = await Promise.all([
      supabase.from("site_sections").select("*").order("display_order"),
      supabase.from("section_cards").select("*").order("display_order"),
      supabase.from("visibility_log").select("*").order("changed_at", { ascending: false }).limit(50),
      supabase.from("admin_settings").select("*"),
    ]);
    if (secs) {
      setSections(secs as Section[]);
      const allHidden = (secs as Section[]).filter(s => s.section_key !== "footer").every(s => !s.is_visible);
      setMaintenanceMode(allHidden && secs.length > 1);
    }
    if (crds) setCards(crds as Card[]);
    if (logData) setLogs(logData as LogEntry[]);
    if (settings) {
      const reg = (settings as any[]).find(s => s.setting_key === "registration_open");
      if (reg) setRegOpen(reg.setting_value === "true");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  /* toggle section visibility */
  const toggleSection = async (section: Section) => {
    const newVal = !section.is_visible;
    const { error } = await supabase
      .from("site_sections")
      .update({ is_visible: newVal, updated_at: new Date().toISOString() })
      .eq("id", section.id);
    if (error) { toast.error("Failed to update section"); return; }

    await supabase.from("visibility_log").insert({
      target_type: "section",
      target_key: section.section_key,
      target_name: section.section_name,
      changed_from: section.is_visible,
      changed_to: newVal,
    });

    toast.success(`${section.section_name} ${newVal ? "shown" : "hidden"}`);
    fetchAll();
  };

  /* toggle card visibility */
  const toggleCard = async (card: Card) => {
    const newVal = !card.is_visible;
    const { error } = await supabase
      .from("section_cards")
      .update({ is_visible: newVal, updated_at: new Date().toISOString() })
      .eq("id", card.id);
    if (error) { toast.error("Failed to update card"); return; }

    await supabase.from("visibility_log").insert({
      target_type: "card",
      target_key: card.card_key,
      target_name: card.card_name,
      changed_from: card.is_visible,
      changed_to: newVal,
    });

    toast.success(`${card.card_name} ${newVal ? "shown" : "hidden"}`);
    fetchAll();
  };

  /* maintenance mode */
  const toggleMaintenance = async () => {
    const newMode = !maintenanceMode;
    const updates = sections
      .filter(s => s.section_key !== "footer")
      .map(s => supabase.from("site_sections").update({ is_visible: !newMode, updated_at: new Date().toISOString() }).eq("id", s.id));
    await Promise.all(updates);

    await supabase.from("activity_log").insert({
      action: newMode ? "Maintenance mode enabled" : "Maintenance mode disabled",
    });

    toast.success(newMode ? "Maintenance mode enabled" : "Maintenance mode disabled");
    fetchAll();
  };

  /* registration toggle */
  const toggleRegistration = async () => {
    const newVal = !regOpen;
    const { error } = await supabase
      .from("admin_settings")
      .upsert({ setting_key: "registration_open", setting_value: String(newVal), updated_at: new Date().toISOString() }, { onConflict: "setting_key" });
    if (error) { toast.error("Failed to update"); return; }
    setRegOpen(newVal);
    toast.success(`Registration ${newVal ? "opened" : "closed"}`);
  };

  /* reset to default */
  const resetToDefault = async () => {
    const updates = sections.map(s =>
      supabase.from("site_sections").update({ is_visible: true, updated_at: new Date().toISOString() }).eq("id", s.id)
    );
    const cardUpdates = cards.map(c =>
      supabase.from("section_cards").update({ is_visible: true, updated_at: new Date().toISOString() }).eq("id", c.id)
    );
    await Promise.all([...updates, ...cardUpdates]);
    toast.success("All sections and cards reset to visible");
    fetchAll();
  };

  /* bulk card actions */
  const bulkCards = async (sectionKey: string, visible: boolean) => {
    const sectionCards = cards.filter(c => c.section_key === sectionKey);
    await Promise.all(sectionCards.map(c =>
      supabase.from("section_cards").update({ is_visible: visible, updated_at: new Date().toISOString() }).eq("id", c.id)
    ));
    toast.success(`All cards ${visible ? "shown" : "hidden"}`);
    fetchAll();
  };

  /* filtered cards for expanded section */
  const filteredCards = useMemo(() => {
    if (!expanded) return [];
    const sCards = cards.filter(c => c.section_key === expanded);
    if (!cardFilter.trim()) return sCards;
    const q = cardFilter.toLowerCase();
    return sCards.filter(c => c.card_name.toLowerCase().includes(q));
  }, [cards, expanded, cardFilter]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Page Manager</h2>
          <p className="text-sm text-muted-foreground mt-1">Control visibility of all sections and cards on the public website</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open("/", "_blank")}>
            <ExternalLink size={14} /> Preview Site
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Activity size={14} /> Activity Log
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Visibility Activity Log</DialogTitle></DialogHeader>
              <ScrollArea className="h-80">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No activity recorded yet.</p>
                ) : (
                  <div className="space-y-2 p-1">
                    {logs.map(log => (
                      <div key={log.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium text-foreground">{log.target_name}</span>
                          <span className="text-muted-foreground ml-1 text-xs capitalize">({log.target_type})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={log.changed_to ? "default" : "destructive"} className="text-xs">
                            {log.changed_to ? "Shown" : "Hidden"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{fmtDate(log.changed_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2">
          <Wrench size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Maintenance Mode</span>
          <Switch checked={maintenanceMode} onCheckedChange={toggleMaintenance} />
        </div>
        <div className="h-6 w-px bg-border hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Registration</span>
          <Badge variant={regOpen ? "default" : "destructive"} className="text-xs">{regOpen ? "Open" : "Closed"}</Badge>
          <Switch checked={regOpen} onCheckedChange={toggleRegistration} />
        </div>
        <div className="h-6 w-px bg-border hidden sm:block" />
        {isOwner && <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={resetToDefault}>
          <RotateCcw size={14} /> Reset to Default
        </Button>}
      </div>

      {/* Sections List */}
      <div className="space-y-2">
        {sections.map(section => {
          const sectionCards = cards.filter(c => c.section_key === section.section_key);
          const isExpanded = expanded === section.section_key;
          const hasCards = sectionCards.length > 0;

          return (
            <div key={section.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Section Row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl">{sectionIcons[section.section_key] || "📄"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">{section.section_name}</span>
                    <Badge
                      variant={section.is_visible ? "default" : "destructive"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {section.is_visible ? "● Visible" : "● Hidden"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {hasCards && <span>{sectionCards.length} cards</span>}
                    <span>⏱ {fmtDate(section.updated_at)}</span>
                  </div>
                </div>
                <Switch
                  checked={section.is_visible}
                  onCheckedChange={() => toggleSection(section)}
                />
                {hasCards && (
                  <button
                    onClick={() => { setExpanded(isExpanded ? null : section.section_key); setCardFilter(""); }}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                )}
              </div>

              {/* Expanded Cards */}
              {isExpanded && hasCards && (
                <div className="border-t border-border bg-background/50 px-4 py-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => bulkCards(section.section_key, true)}>
                      <Eye size={12} className="mr-1" /> Show All
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => bulkCards(section.section_key, false)}>
                      <EyeOff size={12} className="mr-1" /> Hide All
                    </Button>
                    <div className="relative flex-1 min-w-[160px] max-w-[250px]">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Filter cards…"
                        value={cardFilter}
                        onChange={e => setCardFilter(e.target.value)}
                        className="h-7 pl-8 text-xs bg-card"
                      />
                    </div>
                  </div>

                  {filteredCards.map(card => (
                    <div key={card.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <span className={`text-sm ${card.is_visible ? "text-foreground" : "text-muted-foreground"}`}>
                        {card.card_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={card.is_visible ? "default" : "destructive"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {card.is_visible ? "Visible" : "Hidden"}
                        </Badge>
                        <Switch
                          checked={card.is_visible}
                          onCheckedChange={() => toggleCard(card)}
                        />
                      </div>
                    </div>
                  ))}

                  {filteredCards.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">No cards match filter</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPageManager;
