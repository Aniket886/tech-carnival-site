import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Upload } from "lucide-react";
import { validateCollegeName, sanitizeInput } from "@/lib/validators";

interface ScoreRow {
  id: string;
  college_name: string;
  event_id: string;
  event_name: string;
  category: string;
  points: number;
  position: string;
  team_name: string | null;
  updated_at: string;
}

interface EventOption { id: string; name: string; category: string }

const emptyForm = { college_name: "", event_id: "", points: 0, position: "participant", team_name: "" };

const AdminScores = () => {
  const { toast } = useToast();
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [{ data: s }, { data: e }] = await Promise.all([
      supabase.from("college_scores").select("*").order("points", { ascending: false }),
      supabase.from("events").select("id, name, category"),
    ]);
    if (s) setScores(s);
    if (e) setEvents(e);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    if (!search) return scores;
    const s = search.toLowerCase();
    return scores.filter((r) =>
      r.college_name.toLowerCase().includes(s) ||
      r.event_name.toLowerCase().includes(s) ||
      r.team_name?.toLowerCase().includes(s)
    );
  }, [scores, search]);

  const selectedEvent = events.find((e) => e.id === form.event_id);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: ScoreRow) => {
    setEditId(s.id);
    setForm({ college_name: s.college_name, event_id: s.event_id, points: s.points, position: s.position, team_name: s.team_name || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.college_name.trim() || !form.event_id) {
      toast({ title: "College and Event are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const ev = events.find((e) => e.id === form.event_id);
    const payload = {
      college_name: form.college_name,
      event_id: form.event_id,
      event_name: ev?.name || "",
      category: ev?.category || "",
      points: form.points,
      position: form.position,
      team_name: form.team_name || null,
      updated_at: new Date().toISOString(),
    };

    if (editId) {
      const { error } = await supabase.from("college_scores").update(payload).eq("id", editId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Score updated" });
    } else {
      const { error } = await supabase.from("college_scores").insert([payload]);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Score added" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const deleteScore = async (id: string) => {
    const { error } = await supabase.from("college_scores").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setScores((prev) => prev.filter((s) => s.id !== id)); toast({ title: "Score deleted" }); }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ""; });
      const ev = events.find((ev) => ev.name.toLowerCase() === (obj.event_name || "").toLowerCase());
      return {
        college_name: obj.college_name || "",
        event_id: ev?.id || "",
        event_name: ev?.name || obj.event_name || "",
        category: ev?.category || obj.category || "",
        points: parseInt(obj.points) || 0,
        position: obj.position || "participant",
        team_name: obj.team_name || null,
      };
    }).filter((r) => r.college_name && r.event_id);

    if (rows.length === 0) { toast({ title: "No valid rows", variant: "destructive" }); return; }
    const { error } = await supabase.from("college_scores").insert(rows);
    if (error) toast({ title: "Import failed", description: error.message, variant: "destructive" });
    else { toast({ title: `${rows.length} scores imported` }); fetchData(); }
    e.target.value = "";
  };

  const catColor: Record<string, string> = {
    technical: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    gaming: "bg-red-500/15 text-red-400 border-red-500/30",
    cultural: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Score Management</h2>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
            <Button variant="outline" size="sm" className="gap-2" asChild><span><Upload className="h-4 w-4" /> Import CSV</span></Button>
          </label>
          <Button size="sm" className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> Add Score</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search college or event..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">College</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Event</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium hidden md:table-cell">Category</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Points</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Position</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/10">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{s.college_name}</p>
                  {s.team_name && <p className="text-xs text-muted-foreground">{s.team_name}</p>}
                </td>
                <td className="px-4 py-3 text-foreground">{s.event_name}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <Badge variant="outline" className={catColor[s.category] || ""}>{s.category}</Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">{s.points}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{s.position}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteScore(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No scores found</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Score" : "Add Score"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>College Name *</Label>
              <Input value={form.college_name} onChange={(e) => setForm({ ...form, college_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Event *</Label>
              <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                <SelectContent>
                  {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Points</Label>
                <Input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st</SelectItem>
                    <SelectItem value="2nd">2nd</SelectItem>
                    <SelectItem value="3rd">3rd</SelectItem>
                    <SelectItem value="participant">Participant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Team Name</Label>
              <Input value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminScores;
