import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ChevronDown, ChevronUp, ExternalLink, RotateCcw, Search,
  Wrench, Eye, EyeOff, Activity, GripVertical,
} from "lucide-react";
import { useIsOwner } from "@/hooks/useIsOwner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  organizing_committee: "👥", core_team: "🎓",
};

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
};

/* ─── Sortable Card Row ─── */
const SortableCardRow = ({
  card, onToggleCard,
}: {
  card: Card;
  onToggleCard: (c: Card) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground flex-shrink-0 touch-none"
        >
          <GripVertical size={14} />
        </button>
        <span className={`text-sm ${card.is_visible ? "text-foreground" : "text-muted-foreground"}`}>
          {card.card_name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={card.is_visible ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
          {card.is_visible ? "Visible" : "Hidden"}
        </Badge>
        <Switch checked={card.is_visible} onCheckedChange={() => onToggleCard(card)} />
      </div>
    </div>
  );
};

/* ─── Sortable Section Row ─── */
const SortableSectionRow = ({
  section, cards, expanded, onToggleExpand, onToggleSection,
  onToggleCard, onBulkCards, cardFilter, onCardFilterChange, filteredCards,
  onReorderCards, cardSensors,
}: {
  section: Section;
  cards: Card[];
  expanded: string | null;
  onToggleExpand: (key: string) => void;
  onToggleSection: (s: Section) => void;
  onToggleCard: (c: Card) => void;
  onBulkCards: (key: string, visible: boolean) => void;
  cardFilter: string;
  onCardFilterChange: (v: string) => void;
  filteredCards: Card[];
  onReorderCards: (sectionKey: string, event: DragEndEvent) => void;
  cardSensors: ReturnType<typeof useSensors>;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const sectionCards = cards.filter(c => c.section_key === section.section_key);
  const isExpanded = expanded === section.section_key;
  const hasCards = sectionCards.length > 0;

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground flex-shrink-0 touch-none"
        >
          <GripVertical size={16} />
        </button>
        <span className="text-xl">{sectionIcons[section.section_key] || "📄"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">{section.section_name}</span>
            <Badge variant={section.is_visible ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
              {section.is_visible ? "● Visible" : "● Hidden"}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            {hasCards && <span>{sectionCards.length} cards</span>}
            <span>⏱ {fmtDate(section.updated_at)}</span>
          </div>
        </div>
        <Switch checked={section.is_visible} onCheckedChange={() => onToggleSection(section)} />
        {hasCards && (
          <button
            onClick={() => onToggleExpand(section.section_key)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        )}
      </div>

      {isExpanded && hasCards && (
        <div className="border-t border-border bg-background/50 px-4 py-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onBulkCards(section.section_key, true)}>
              <Eye size={12} className="mr-1" /> Show All
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onBulkCards(section.section_key, false)}>
              <EyeOff size={12} className="mr-1" /> Hide All
            </Button>
            <div className="relative flex-1 min-w-[160px] max-w-[250px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter cards…"
                value={cardFilter}
                onChange={e => onCardFilterChange(e.target.value)}
                className="h-7 pl-8 text-xs bg-card"
              />
            </div>
          </div>

          <DndContext sensors={cardSensors} collisionDetection={closestCenter} onDragEnd={(e) => onReorderCards(section.section_key, e)}>
            <SortableContext items={filteredCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {filteredCards.map(card => (
                <SortableCardRow key={card.id} card={card} onToggleCard={onToggleCard} />
              ))}
            </SortableContext>
          </DndContext>

          {filteredCards.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No cards match filter</p>
          )}
        </div>
      )}
    </div>
  );
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
  const [payVisible, setPayVisible] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
      const pay = (settings as any[]).find(s => s.setting_key === "pay_button_visible");
      if (pay) setPayVisible(pay.setting_value === "true");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  /* drag end → reorder sections */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);

    // Optimistic update
    setSections(reordered);

    // Persist new display_order values
    const updates = reordered.map((s, i) =>
      supabase.from("site_sections").update({ display_order: i, updated_at: new Date().toISOString() }).eq("id", s.id)
    );
    await Promise.all(updates);
    toast.success("Section order updated");
    fetchAll();
  };

  /* drag end → reorder cards within a section */
  const handleCardDragEnd = async (sectionKey: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sectionCards = cards.filter(c => c.section_key === sectionKey);
    const oldIndex = sectionCards.findIndex(c => c.id === active.id);
    const newIndex = sectionCards.findIndex(c => c.id === over.id);
    const reordered = arrayMove(sectionCards, oldIndex, newIndex);

    // Optimistic update
    const otherCards = cards.filter(c => c.section_key !== sectionKey);
    setCards([...otherCards, ...reordered.map((c, i) => ({ ...c, display_order: i }))]);

    const updates = reordered.map((c, i) =>
      supabase.from("section_cards").update({ display_order: i, updated_at: new Date().toISOString() }).eq("id", c.id)
    );
    await Promise.all(updates);
    toast.success("Card order updated");
    fetchAll();
  };

  const toggleSection = async (section: Section) => {
    const newVal = !section.is_visible;
    const { error } = await supabase
      .from("site_sections")
      .update({ is_visible: newVal, updated_at: new Date().toISOString() })
      .eq("id", section.id);
    if (error) { toast.error("Failed to update section"); return; }
    await supabase.from("visibility_log").insert({
      target_type: "section", target_key: section.section_key,
      target_name: section.section_name, changed_from: section.is_visible, changed_to: newVal,
    });
    toast.success(`${section.section_name} ${newVal ? "shown" : "hidden"}`);
    fetchAll();
  };

  const toggleCard = async (card: Card) => {
    const newVal = !card.is_visible;
    const { error } = await supabase
      .from("section_cards")
      .update({ is_visible: newVal, updated_at: new Date().toISOString() })
      .eq("id", card.id);
    if (error) { toast.error("Failed to update card"); return; }
    await supabase.from("visibility_log").insert({
      target_type: "card", target_key: card.card_key,
      target_name: card.card_name, changed_from: card.is_visible, changed_to: newVal,
    });
    toast.success(`${card.card_name} ${newVal ? "shown" : "hidden"}`);
    fetchAll();
  };

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

  const toggleRegistration = async () => {
    const newVal = !regOpen;
    const { error } = await supabase
      .from("admin_settings")
      .upsert({ setting_key: "registration_open", setting_value: String(newVal), updated_at: new Date().toISOString() }, { onConflict: "setting_key" });
    if (error) { toast.error("Failed to update"); return; }
    setRegOpen(newVal);
    toast.success(`Registration ${newVal ? "opened" : "closed"}`);
  };

  const togglePayButton = async () => {
    const newVal = !payVisible;
    const { error } = await supabase
      .from("admin_settings")
      .upsert({ setting_key: "pay_button_visible", setting_value: String(newVal), updated_at: new Date().toISOString() }, { onConflict: "setting_key" });
    if (error) { toast.error("Failed to update"); return; }
    setPayVisible(newVal);
    toast.success(`Pay button ${newVal ? "shown" : "hidden"}`);
  };

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

  const bulkCards = async (sectionKey: string, visible: boolean) => {
    const sectionCards = cards.filter(c => c.section_key === sectionKey);
    await Promise.all(sectionCards.map(c =>
      supabase.from("section_cards").update({ is_visible: visible, updated_at: new Date().toISOString() }).eq("id", c.id)
    ));
    toast.success(`All cards ${visible ? "shown" : "hidden"}`);
    fetchAll();
  };

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
          <p className="text-sm text-muted-foreground mt-1">Drag to reorder sections · Toggle visibility · Changes update the site live</p>
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
          <span className="text-sm font-medium text-foreground">Pay Button</span>
          <Badge variant={payVisible ? "default" : "destructive"} className="text-xs">{payVisible ? "Visible" : "Hidden"}</Badge>
          <Switch checked={payVisible} onCheckedChange={togglePayButton} />
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

      {/* Sortable Sections List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map(section => (
              <SortableSectionRow
                key={section.id}
                section={section}
                cards={cards}
                expanded={expanded}
                onToggleExpand={(key) => { setExpanded(expanded === key ? null : key); setCardFilter(""); }}
                onToggleSection={toggleSection}
                onToggleCard={toggleCard}
                onBulkCards={bulkCards}
                cardFilter={cardFilter}
                onCardFilterChange={setCardFilter}
                filteredCards={expanded === section.section_key ? filteredCards : []}
                onReorderCards={handleCardDragEnd}
                cardSensors={sensors}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default AdminPageManager;
