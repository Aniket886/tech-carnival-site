import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Pencil, Plus, Trash2 } from "lucide-react";

/* ─── types ─── */
interface Event {
  id: string;
  name: string;
  slug: string;
  category: string;
  icon: string | null;
  description: string | null;
  team_size_min: number;
  team_size_max: number;
  is_active: boolean;
  date: string | null;
  time: string | null;
  venue: string | null;
  prize_pool: string | null;
  rules: string[] | null;
  website_url: string | null;
  created_at: string;
}

interface FormData {
  name: string;
  slug: string;
  category: string;
  icon: string;
  description: string;
  team_size_min: number;
  team_size_max: number;
  date: string;
  time: string;
  venue: string;
  prize_pool: string;
  rules: string;
  website_url: string;
}

const emptyForm: FormData = {
  name: "", slug: "", category: "technical", icon: "🎯", description: "",
  team_size_min: 1, team_size_max: 1, date: "", time: "", venue: "",
  prize_pool: "", rules: "", website_url: "",
};

const categoryStyles: Record<string, string> = {
  technical: "bg-primary/15 text-primary border-primary/30",
  gaming: "bg-red-500/15 text-red-400 border-red-500/30",
  cultural: "bg-accent/15 text-accent border-accent/30",
};

const AdminEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [regCounts, setRegCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [{ data: evts }, { data: regs }] = await Promise.all([
      supabase.from("events").select("*").order("name"),
      supabase.from("registrations").select("event_id"),
    ]);
    setEvents(evts || []);
    const counts = new Map<string, number>();
    (regs || []).forEach((r: any) => counts.set(r.event_id, (counts.get(r.event_id) || 0) + 1));
    setRegCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (ev: Event) => {
    setEditingId(ev.id);
    setForm({
      name: ev.name, slug: ev.slug, category: ev.category, icon: ev.icon || "🎯",
      description: ev.description || "", team_size_min: ev.team_size_min, team_size_max: ev.team_size_max,
      date: ev.date || "", time: ev.time || "", venue: ev.venue || "",
      prize_pool: ev.prize_pool || "", rules: (ev.rules || []).join("\n"), website_url: ev.website_url || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) { toast.error("Name and slug are required"); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      category: form.category,
      icon: form.icon || null,
      description: form.description || null,
      team_size_min: form.team_size_min,
      team_size_max: form.team_size_max,
      date: form.date || null,
      time: form.time || null,
      venue: form.venue || null,
      prize_pool: form.prize_pool || null,
      rules: form.rules.trim() ? form.rules.split("\n").map(r => r.trim()).filter(Boolean) : null,
      website_url: form.website_url || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("events").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("events").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Event updated" : "Event created");
    setDialogOpen(false);
    fetchData();
  };

  const toggleActive = async (ev: Event) => {
    const { error } = await supabase.from("events").update({ is_active: !ev.is_active }).eq("id", ev.id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`${ev.name} ${!ev.is_active ? "activated" : "deactivated"}`);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("events").delete().eq("id", deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success("Event deleted");
    setDeleteId(null);
    fetchData();
  };

  const teamSizeLabel = (min: number, max: number) => {
    if (min === 1 && max === 1) return "Solo";
    if (min === max) return `${min}`;
    return `${min}-${max}`;
  };

  const updateField = (key: keyof FormData, value: any) => setForm(f => ({ ...f, [key]: value }));

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-foreground">Event Management</h2>
        <Button size="sm" className="gap-2" onClick={openCreate}>
          <Plus size={14} /> Add Event
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground font-medium">Event</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Category</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Team Size</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Registrations</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Active</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(ev => (
                <TableRow key={ev.id} className="border-border">
                  <TableCell>
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <span className="text-base">{ev.icon || "🎯"}</span>
                      {ev.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] capitalize ${categoryStyles[ev.category] || "bg-muted text-muted-foreground border-border"}`}>
                      {ev.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{teamSizeLabel(ev.team_size_min, ev.team_size_max)}</TableCell>
                  <TableCell>
                    <span className={`text-sm font-semibold ${(regCounts.get(ev.id) || 0) > 0 ? "text-primary" : "text-emerald-400"}`}>
                      {regCounts.get(ev.id) || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Switch checked={ev.is_active} onCheckedChange={() => toggleActive(ev)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(ev)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteId(ev.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No events yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Event" : "Create Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-[60px_1fr] gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Icon</Label>
                <Input value={form.icon} onChange={e => updateField("icon", e.target.value)} className="text-center text-lg bg-card border-border" maxLength={4} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Name *</Label>
                <Input value={form.name} onChange={e => { updateField("name", e.target.value); if (!editingId) updateField("slug", autoSlug(e.target.value)); }} className="bg-card border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Slug *</Label>
              <Input value={form.slug} onChange={e => updateField("slug", e.target.value)} className="bg-card border-border font-mono text-xs" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={form.category} onValueChange={v => updateField("category", v)}>
                  <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Min Size</Label>
                <Input type="number" min={1} value={form.team_size_min} onChange={e => updateField("team_size_min", parseInt(e.target.value) || 1)} className="bg-card border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Max Size</Label>
                <Input type="number" min={1} value={form.team_size_max} onChange={e => updateField("team_size_max", parseInt(e.target.value) || 1)} className="bg-card border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={e => updateField("description", e.target.value)} rows={3} className="bg-card border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input type="date" value={form.date} onChange={e => updateField("date", e.target.value)} className="bg-card border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Time</Label>
                <Input value={form.time} onChange={e => updateField("time", e.target.value)} placeholder="e.g. 10:00 AM" className="bg-card border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Venue</Label>
                <Input value={form.venue} onChange={e => updateField("venue", e.target.value)} className="bg-card border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Prize Pool</Label>
                <Input value={form.prize_pool} onChange={e => updateField("prize_pool", e.target.value)} className="bg-card border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Website / Rulebook URL</Label>
              <Input value={form.website_url} onChange={e => updateField("website_url", e.target.value)} className="bg-card border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Rules (one per line)</Label>
              <Textarea value={form.rules} onChange={e => updateField("rules", e.target.value)} rows={4} className="bg-card border-border font-mono text-xs" placeholder="Rule 1&#10;Rule 2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editingId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the event. Existing registrations linked to it will remain but show no event name.</AlertDialogDescription>
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

export default AdminEvents;
