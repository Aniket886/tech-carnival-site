import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

import { Search, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useIsOwner } from "@/hooks/useIsOwner";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  tier: string;
  display_order: number;
  is_active: boolean;
  website_url: string | null;
  created_at: string;
}

interface FormData {
  name: string;
  logo_url: string;
  tier: string;
  display_order: number;
  website_url: string;
}

const emptyForm: FormData = { name: "", logo_url: "", tier: "partner", display_order: 0, website_url: "" };

const tierStyles: Record<string, string> = {
  "title sponsor": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "gold sponsor": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  partner: "bg-primary/15 text-primary border-primary/30",
};

const tierEmoji: Record<string, string> = {
  "title sponsor": "👑", "gold sponsor": "🥇", partner: "🤝",
};

const AdminSponsors = () => {
  const isOwner = useIsOwner();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from("sponsors").select("*").order("tier").order("display_order");
    setSponsors(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sponsors;
    const q = search.toLowerCase();
    return sponsors.filter(s => s.name.toLowerCase().includes(q) || s.tier.toLowerCase().includes(q));
  }, [sponsors, search]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (s: Sponsor) => {
    setEditingId(s.id);
    setForm({
      name: s.name, logo_url: s.logo_url, tier: s.tier,
      display_order: s.display_order, website_url: s.website_url || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.logo_url.trim()) { toast.error("Name and logo URL are required"); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      logo_url: form.logo_url.trim(),
      tier: form.tier,
      display_order: form.display_order,
      website_url: form.website_url.trim() || null,
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("sponsors").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("sponsors").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Sponsor updated" : "Sponsor added");
    
    setDialogOpen(false);
    fetchData();
  };

  const toggleActive = async (s: Sponsor) => {
    const { error } = await supabase.from("sponsors").update({ is_active: !s.is_active }).eq("id", s.id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`${s.name} ${!s.is_active ? "activated" : "deactivated"}`);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("sponsors").delete().eq("id", deleteId);
    if (error) { toast.error(error.message); return; }
    const s = sponsors.find(sp => sp.id === deleteId);
    toast.success("Sponsor deleted");
    
    setDeleteId(null);
    fetchData();
  };

  const updateField = (key: keyof FormData, value: any) => setForm(f => ({ ...f, [key]: value }));

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search sponsors…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Button size="sm" className="gap-2" onClick={openCreate}>
          <Plus size={14} /> Add Sponsor
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground font-medium w-16">Logo</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Name</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Tier</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Order</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Active</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No sponsors found.</TableCell></TableRow>
              ) : filtered.map(s => (
                <TableRow key={s.id} className="border-border">
                  <TableCell>
                    <div className="w-12 h-8 rounded bg-muted/50 flex items-center justify-center overflow-hidden">
                      <img src={s.logo_url} alt={s.name} className="max-w-full max-h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">{s.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] capitalize ${tierStyles[s.tier] || "bg-muted text-muted-foreground border-border"}`}>
                      {tierEmoji[s.tier] || "🤝"} {s.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.display_order}</TableCell>
                  <TableCell>
                    <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {s.website_url && (
                        <button onClick={() => window.open(s.website_url!, "_blank")} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                          <ExternalLink size={15} />
                        </button>
                      )}
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                        <Pencil size={15} />
                      </button>
                      {isOwner && <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 size={15} />
                      </button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Sponsor" : "Add Sponsor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Name *</Label>
              <Input value={form.name} onChange={e => updateField("name", e.target.value)} className="bg-card border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Logo URL *</Label>
              <Input value={form.logo_url} onChange={e => updateField("logo_url", e.target.value)} className="bg-card border-border" />
              {form.logo_url && (
                <div className="mt-2 w-16 h-10 rounded bg-muted/50 flex items-center justify-center overflow-hidden">
                  <img src={form.logo_url} alt="preview" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Tier</Label>
                <Select value={form.tier} onValueChange={v => updateField("tier", v)}>
                  <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title sponsor">Title Sponsor</SelectItem>
                    <SelectItem value="gold sponsor">Gold Sponsor</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Display Order</Label>
                <Input type="number" min={0} value={form.display_order} onChange={e => updateField("display_order", parseInt(e.target.value) || 0)} className="bg-card border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Website URL</Label>
              <Input value={form.website_url} onChange={e => updateField("website_url", e.target.value)} className="bg-card border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editingId ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sponsor?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this sponsor.</AlertDialogDescription>
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

export default AdminSponsors;
