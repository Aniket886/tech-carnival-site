import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, Upload, Trophy } from "lucide-react";

interface Score {
  id: string;
  college_name: string;
  event_id: string;
  event_name: string;
  category: string;
  team_name: string | null;
  points: number;
  position: string | null;
  updated_at: string;
}

interface EventInfo { id: string; name: string; category: string; }
interface CollegeInfo { id: string; name: string; }

interface FormData {
  college_name: string;
  event_id: string;
  team_name: string;
  points: number;
}

const emptyForm: FormData = { college_name: "", event_id: "", team_name: "", points: 0 };

const getPositionFromPoints = (points: number): string => {
  if (points >= 100) return "1st";
  if (points >= 75) return "2nd";
  if (points >= 50) return "3rd";
  return "participant";
};

const positionStyles: Record<string, { label: string; cls: string }> = {
  "1st": { label: "🥇 1st", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  "2nd": { label: "2nd", cls: "bg-muted text-muted-foreground border-border" },
  "3rd": { label: "3rd", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  participant: { label: "Participant", cls: "bg-muted text-muted-foreground border-border" },
};

const AdminScores = () => {
  const [scores, setScores] = useState<Score[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [colleges, setColleges] = useState<CollegeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [{ data: sc }, { data: evts }, { data: cols }] = await Promise.all([
      supabase.from("college_scores").select("*").order("points", { ascending: false }),
      supabase.from("events").select("id, name, category"),
      supabase.from("colleges").select("id, name").eq("is_active", true).order("name"),
    ]);
    setScores(sc || []);
    setEvents(evts || []);
    setColleges((cols || []) as CollegeInfo[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const eventMap = useMemo(() => {
    const m = new Map<string, EventInfo>();
    events.forEach(e => m.set(e.id, e));
    return m;
  }, [events]);

  const filtered = useMemo(() => {
    if (!search.trim()) return scores;
    const q = search.toLowerCase();
    return scores.filter(s =>
      s.college_name.toLowerCase().includes(q) ||
      s.event_name.toLowerCase().includes(q) ||
      (s.team_name && s.team_name.toLowerCase().includes(q))
    );
  }, [scores, search]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (s: Score) => {
    setEditingId(s.id);
    setForm({
      college_name: s.college_name, event_id: s.event_id, team_name: s.team_name || "",
      points: s.points,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.college_name.trim() || !form.event_id) { toast.error("College and event are required"); return; }
    const ev = eventMap.get(form.event_id);
    if (!ev) { toast.error("Invalid event"); return; }
    setSaving(true);
    const payload = {
      college_name: form.college_name.trim(),
      event_id: form.event_id,
      event_name: ev.name,
      category: ev.category,
      team_name: form.team_name.trim() || null,
      points: form.points,
      position: form.position || "participant",
      updated_at: new Date().toISOString(),
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("college_scores").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("college_scores").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Score updated" : "Score added");
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("college_scores").delete().eq("id", deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success("Score deleted");
    setDeleteId(null);
    fetchData();
  };

  const importCSV = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { toast.error("CSV must have header + data"); return; }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
      const colIdx = headers.indexOf("college");
      const evIdx = headers.indexOf("event");
      const teamIdx = headers.indexOf("team");
      const ptsIdx = headers.indexOf("points");
      const posIdx = headers.indexOf("position");
      if (colIdx === -1 || evIdx === -1) { toast.error("CSV needs 'college' and 'event' columns"); return; }

      const eventByName = new Map<string, EventInfo>();
      events.forEach(ev => eventByName.set(ev.name.toLowerCase(), ev));

      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim().replace(/"/g, ""));
        const evName = cols[evIdx]?.toLowerCase();
        const ev = eventByName.get(evName || "");
        if (!cols[colIdx] || !ev) continue;
        rows.push({
          college_name: cols[colIdx],
          event_id: ev.id,
          event_name: ev.name,
          category: ev.category,
          team_name: teamIdx >= 0 ? cols[teamIdx] || null : null,
          points: ptsIdx >= 0 ? parseInt(cols[ptsIdx]) || 0 : 0,
          position: posIdx >= 0 ? cols[posIdx] || "participant" : "participant",
        });
      }
      if (rows.length === 0) { toast.error("No valid rows"); return; }
      const { error } = await supabase.from("college_scores").insert(rows);
      if (error) { toast.error(error.message); return; }
      toast.success(`${rows.length} scores imported`);
      fetchData();
    };
    input.click();
  };

  const updateField = (key: keyof FormData, value: any) => setForm(f => ({ ...f, [key]: value }));

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Trophy size={22} className="text-primary" /> Score Management ({scores.length})
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={importCSV}>
            <Upload size={14} /> Import CSV
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus size={14} /> Add Score
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search college, event, team…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground font-medium">College</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Event</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Team</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Points</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Position</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No scores found.</TableCell></TableRow>
              ) : filtered.map(s => {
                const ps = positionStyles[s.position || "participant"] || positionStyles.participant;
                return (
                  <TableRow key={s.id} className="border-border">
                    <TableCell className="text-sm font-semibold text-foreground">{s.college_name}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.event_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{s.category}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.team_name || "—"}</TableCell>
                    <TableCell className="text-sm font-bold text-primary">{s.points}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${ps.cls}`}>{ps.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Score" : "Add Score"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">College Name *</Label>
              <Input value={form.college_name} onChange={e => updateField("college_name", e.target.value)} className="bg-card border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Event *</Label>
              <Select value={form.event_id} onValueChange={v => updateField("event_id", v)}>
                <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Select event" /></SelectTrigger>
                <SelectContent>
                  {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Team Name</Label>
              <Input value={form.team_name} onChange={e => updateField("team_name", e.target.value)} className="bg-card border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Points</Label>
                <Input type="number" min={0} value={form.points} onChange={e => updateField("points", parseInt(e.target.value) || 0)} className="bg-card border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Position</Label>
                <Select value={form.position} onValueChange={v => updateField("position", v)}>
                  <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">🥇 1st</SelectItem>
                    <SelectItem value="2nd">2nd</SelectItem>
                    <SelectItem value="3rd">3rd</SelectItem>
                    <SelectItem value="participant">Participant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editingId ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete score?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this score entry.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminScores;
