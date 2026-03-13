import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ExternalLink, RotateCcw, Wrench, Eye, EyeOff, Activity,
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Section, Card, LogEntry, fmtDate } from "@/components/admin/page-manager/types";
import SortableSectionRow from "@/components/admin/page-manager/SortableSectionRow";

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
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);
    setSections(reordered);
    const updates = reordered.map((s, i) =>
      supabase.from("site_sections").update({ display_order: i, updated_at: new Date().toISOString() }).eq("id", s.id)
    );
    await Promise.all(updates);
    toast.success("Section order updated");
    fetchAll();
  };

  const handleCardDragEnd = async (sectionKey: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sectionCards = cards.filter(c => c.section_key === sectionKey);
    const oldIndex = sectionCards.findIndex(c => c.id === active.id);
    const newIndex = sectionCards.findIndex(c => c.id === over.id);
    const reordered = arrayMove(sectionCards, oldIndex, newIndex);
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
