import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, ExternalLink } from "lucide-react";

interface SponsorRow {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  tier: string;
  display_order: number;
  is_active: boolean;
}

const emptyForm = { name: "", logo_url: "", website_url: "", tier: "partner", display_order: 0 };

const tierLabel: Record<string, string> = { title: "Title Sponsor", gold: "Gold Sponsor", partner: "Partner" };
const tierColor: Record<string, string> = {
  title: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  gold: "bg-gray-400/15 text-gray-300 border-gray-400/30",
  partner: "bg-muted/30 text-muted-foreground border-border",
};

const AdminSponsors = () => {
  const { toast } = useToast();
  const [sponsors, setSponsors] = useState<SponsorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from("sponsors").select("*").order("tier").order("display_order");
    if (data) setSponsors(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    if (!search) return sponsors;
    const s = search.toLowerCase();
    return sponsors.filter((sp) => sp.name.toLowerCase().includes(s));
  }, [sponsors, search]);

  const grouped = useMemo(() => {
    const map: Record<string, SponsorRow[]> = { title: [], gold: [], partner: [] };
    filtered.forEach((s) => { if (map[s.tier]) map[s.tier].push(s); });
    return map;
  }, [filtered]);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: SponsorRow) => {
    setEditId(s.id);
    setForm({ name: s.name, logo_url: s.logo_url, website_url: s.website_url || "", tier: s.tier, display_order: s.display_order });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.logo_url.trim()) {
      toast({ title: "Name and Logo URL are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      logo_url: form.logo_url,
      website_url: form.website_url || null,
      tier: form.tier,
      display_order: form.display_order,
    };
    if (editId) {
      const { error } = await supabase.from("sponsors").update(payload).eq("id", editId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Sponsor updated" });
    } else {
      const { error } = await supabase.from("sponsors").insert([payload]);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Sponsor added" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const deleteSponsor = async (id: string) => {
    const { error } = await supabase.from("sponsors").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setSponsors((prev) => prev.filter((s) => s.id !== id)); toast({ title: "Sponsor deleted" }); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("sponsors").update({ is_active: !current }).eq("id", id);
    setSponsors((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s)));
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Sponsor Management ({sponsors.length})</h2>
        <Button size="sm" className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> Add Sponsor</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search sponsors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {(["title", "gold", "partner"] as const).map((tier) => {
        const items = grouped[tier];
        if (items.length === 0) return null;
        return (
          <div key={tier}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{tierLabel[tier]}s</h3>
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 text-left text-muted-foreground font-medium">Logo</th>
                    <th className="px-4 py-3 text-left text-muted-foreground font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-muted-foreground font-medium hidden md:table-cell">Tier</th>
                    <th className="px-4 py-3 text-left text-muted-foreground font-medium hidden md:table-cell">Order</th>
                    <th className="px-4 py-3 text-left text-muted-foreground font-medium">Active</th>
                    <th className="px-4 py-3 text-left text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/10">
                      <td className="px-4 py-3">
                        <img src={s.logo_url} alt={s.name} className="h-8 w-auto max-w-[80px] object-contain rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{s.name}</p>
                        {s.website_url && (
                          <a href={s.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> Website
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant="outline" className={tierColor[s.tier]}>{tierLabel[s.tier]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.display_order}</td>
                      <td className="px-4 py-3"><Switch checked={s.is_active} onCheckedChange={() => toggleActive(s.id, s.is_active)} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteSponsor(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {sponsors.length === 0 && <p className="text-center py-8 text-muted-foreground">No sponsors yet</p>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Sponsor" : "Add Sponsor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Sponsor Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Logo URL *</Label>
              <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
              {form.logo_url && (
                <div className="mt-2 p-2 bg-muted/20 rounded flex justify-center">
                  <img src={form.logo_url} alt="Preview" className="h-12 max-w-[160px] object-contain" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Website URL</Label>
              <Input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tier *</Label>
                <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title Sponsor</SelectItem>
                    <SelectItem value="gold">Gold Sponsor</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Display Order</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSponsors;
