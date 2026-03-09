import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil } from "lucide-react";
import { useAdminRefresh } from "@/components/AdminLayout";
import { useIsOwner } from "@/hooks/useIsOwner";

type ScheduleEvent = {
  id: string;
  emoji: string;
  name: string;
  start_hour: number;
  end_hour: number;
  category: string;
  venue: string;
  team_size: string | null;
  day: number;
  lane: number;
  display_order: number;
  is_active: boolean;
};

const categories = [
  { label: "Technical", value: "technical" },
  { label: "Gaming", value: "gaming" },
  { label: "Cultural", value: "cultural" },
  { label: "Ceremony", value: "ceremony" },
  { label: "Break", value: "break" },
];

const categoryColors: Record<string, string> = {
  technical: "border-primary/50 bg-primary/10",
  gaming: "border-red-500/50 bg-red-500/10",
  cultural: "border-accent/50 bg-accent/10",
  ceremony: "border-amber-400/50 bg-amber-400/10",
  break: "border-foreground/30 bg-foreground/5",
};

const formatTime = (h: number): string => {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:${min.toString().padStart(2, "0")} ${ampm}`;
};

const AdminSchedule = () => {
  const isOwner = useIsOwner();
  const refreshKey = useAdminRefresh();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<1 | 2>(1);

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [emoji, setEmoji] = useState("📌");
  const [name, setName] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [category, setCategory] = useState("technical");
  const [venue, setVenue] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [lane, setLane] = useState("0");

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("schedule_events")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) toast.error("Failed to load schedule");
    else setEvents((data as ScheduleEvent[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [refreshKey]);

  const filtered = events.filter(e => e.day === activeDay);

  const resetForm = () => {
    setEmoji("📌"); setName(""); setStartHour(""); setEndHour("");
    setCategory("technical"); setVenue(""); setTeamSize(""); setLane("0");
  };

  const openAdd = () => { setEditing(null); resetForm(); setShowDialog(true); };

  const openEdit = (ev: ScheduleEvent) => {
    setEditing(ev);
    setEmoji(ev.emoji);
    setName(ev.name);
    setStartHour(String(ev.start_hour));
    setEndHour(String(ev.end_hour));
    setCategory(ev.category);
    setVenue(ev.venue);
    setTeamSize(ev.team_size || "");
    setLane(String(ev.lane));
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !startHour || !endHour) {
      toast.error("Name, start time, and end time are required");
      return;
    }
    const sh = parseFloat(startHour);
    const eh = parseFloat(endHour);
    if (isNaN(sh) || isNaN(eh) || sh >= eh) {
      toast.error("Invalid time range");
      return;
    }
    setSaving(true);

    const payload = {
      emoji: emoji.trim() || "📌",
      name: name.trim(),
      start_hour: sh,
      end_hour: eh,
      category,
      venue: venue.trim(),
      team_size: teamSize.trim() || null,
      day: activeDay,
      lane: parseInt(lane) || 0,
    };

    if (editing) {
      const { error } = await supabase.from("schedule_events").update(payload).eq("id", editing.id);
      if (error) toast.error("Failed to update"); else toast.success("Updated");
    } else {
      const maxOrder = filtered.reduce((max, e) => Math.max(max, e.display_order), 0);
      const { error } = await supabase.from("schedule_events").insert({ ...payload, display_order: maxOrder + 1 });
      if (error) toast.error("Failed to add"); else toast.success("Added");
    }
    setSaving(false);
    setShowDialog(false);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this schedule event?")) return;
    const { error } = await supabase.from("schedule_events").delete().eq("id", id);
    if (error) toast.error("Failed to delete"); else { toast.success("Removed"); fetchEvents(); }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = filtered.findIndex(e => e.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= filtered.length) return;
    const a = filtered[idx], b = filtered[swapIdx];
    await Promise.all([
      supabase.from("schedule_events").update({ display_order: b.display_order }).eq("id", a.id),
      supabase.from("schedule_events").update({ display_order: a.display_order }).eq("id", b.id),
    ]);
    fetchEvents();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <Button variant={activeDay === 1 ? "default" : "outline"} size="sm" onClick={() => setActiveDay(1)}>
            Day 1
          </Button>
          <Button variant={activeDay === 2 ? "default" : "outline"} size="sm" onClick={() => setActiveDay(2)}>
            Day 2
          </Button>
        </div>
        <Button size="sm" onClick={openAdd}><Plus size={16} className="mr-1" /> Add Event</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No events for this day. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((ev, idx) => (
            <Card key={ev.id} className={`border ${categoryColors[ev.category] || ""}`}>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <span className="text-xl shrink-0">{ev.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{ev.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(ev.start_hour)} – {formatTime(ev.end_hour)} · 📍 {ev.venue}
                    {ev.team_size && ` · 👥 ${ev.team_size}`}
                    {` · Lane ${ev.lane}`}
                  </p>
                </div>
                <span className="text-[10px] uppercase font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0">
                  {ev.category}
                </span>
                <div className="flex gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(ev)}>
                    <Pencil size={13} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => handleReorder(ev.id, "up")}>
                    <ArrowUp size={13} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === filtered.length - 1} onClick={() => handleReorder(ev.id, "down")}>
                    <ArrowDown size={13} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(ev.id)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Schedule Event" : "Add Schedule Event"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-[60px_1fr] gap-3">
              <div>
                <Label>Emoji</Label>
                <Input value={emoji} onChange={e => setEmoji(e.target.value)} className="text-center text-lg" maxLength={4} />
              </div>
              <div>
                <Label>Event Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Hack Momentum" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Hour (decimal)</Label>
                <Input type="number" step="0.25" value={startHour} onChange={e => setStartHour(e.target.value)} placeholder="e.g. 10.5" />
                {startHour && !isNaN(parseFloat(startHour)) && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(parseFloat(startHour))}</p>
                )}
              </div>
              <div>
                <Label>End Hour (decimal)</Label>
                <Input type="number" step="0.25" value={endHour} onChange={e => setEndHour(e.target.value)} placeholder="e.g. 17.5" />
                {endHour && !isNaN(parseFloat(endHour)) && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(parseFloat(endHour))}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Venue</Label>
                <Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Main Auditorium" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Team Size (optional)</Label>
                <Input value={teamSize} onChange={e => setTeamSize(e.target.value)} placeholder="e.g. 2-4 or Solo" />
              </div>
              <div>
                <Label>Lane (swim-lane row)</Label>
                <Input type="number" value={lane} onChange={e => setLane(e.target.value)} placeholder="0" min="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSchedule;
