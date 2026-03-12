import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { Search, Plus, Pencil, Trash2, ExternalLink, Crown, Medal, Handshake, Upload, X } from "lucide-react";
import { useIsOwner } from "@/hooks/useIsOwner";

/* ── Types ── */
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

const BUCKET = "sponsor-logos";

const uploadLogo = async (file: File): Promise<string | null> => {
  const ext = file.name.split(".").pop() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) { toast.error("Upload failed: " + error.message); return null; }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

/* ── Tier config ── */
const tierConfig: Record<string, { label: string; icon: typeof Crown; badge: string; accent: string }> = {
  "title sponsor": {
    label: "Title Sponsor",
    icon: Crown,
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    accent: "from-amber-500/20 to-amber-500/5",
  },
  "gold sponsor": {
    label: "Gold Sponsor",
    icon: Medal,
    badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    accent: "from-yellow-500/20 to-yellow-500/5",
  },
  partner: {
    label: "Partner",
    icon: Handshake,
    badge: "bg-primary/10 text-primary border-primary/20",
    accent: "from-primary/20 to-primary/5",
  },
};

/* ── Sponsor Card ── */
const SponsorCardAdmin = ({
  sponsor,
  isOwner,
  onEdit,
  onToggle,
  onDelete,
}: {
  sponsor: Sponsor;
  isOwner: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) => {
  const tier = tierConfig[sponsor.tier] || tierConfig.partner;
  const TierIcon = tier.icon;

  return (
    <div className={`group relative rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-border/80 hover:shadow-sm ${!sponsor.is_active ? "opacity-50" : ""}`}>
      {/* Top row: logo + actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 shrink-0 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden">
            {sponsor.logo_url ? (
              <img
                src={sponsor.logo_url}
                alt={sponsor.name}
                className="h-7 w-7 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <TierIcon size={18} className="text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{sponsor.name}</h3>
            {sponsor.website_url && (
              <a
                href={sponsor.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 truncate"
              >
                <ExternalLink size={10} />
                <span className="truncate">{sponsor.website_url.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <Pencil size={14} />
          </button>
          {isOwner && (
            <button onClick={onDelete} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: tier badge + toggle */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={`text-[10px] font-medium ${tier.badge}`}>
          <TierIcon size={10} className="mr-1" />
          {tier.label}
        </Badge>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">#{sponsor.display_order}</span>
          <Switch checked={sponsor.is_active} onCheckedChange={onToggle} className="scale-75" />
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const AdminSponsors = () => {
  const isOwner = useIsOwner();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from("sponsors").select("*").order("display_order");
    setSponsors(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* Derived */
  const filtered = useMemo(() => {
    let list = sponsors;
    if (filterTier !== "all") list = list.filter((s) => s.tier === filterTier);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [sponsors, search, filterTier]);

  const stats = useMemo(() => ({
    total: sponsors.length,
    active: sponsors.filter((s) => s.is_active).length,
    title: sponsors.filter((s) => s.tier === "title sponsor").length,
    gold: sponsors.filter((s) => s.tier === "gold sponsor").length,
    partners: sponsors.filter((s) => s.tier === "partner").length,
  }), [sponsors]);

  /* Handlers */
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
    const { error } = editingId
      ? await supabase.from("sponsors").update(payload).eq("id", editingId)
      : await supabase.from("sponsors").insert(payload);
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
    toast.success("Sponsor deleted");
    setDeleteId(null);
    fetchData();
  };

  const updateField = (key: keyof FormData, value: any) => setForm((f) => ({ ...f, [key]: value }));

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Active", value: stats.active, color: "text-emerald-400" },
          { label: "Title / Gold", value: `${stats.title} / ${stats.gold}`, color: "text-amber-400" },
          { label: "Partners", value: stats.partners, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3.5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sponsors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-card border-border text-sm"
            />
          </div>
          <Select value={filterTier} onValueChange={setFilterTier}>
            <SelectTrigger className="w-[140px] h-9 bg-card border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="title sponsor">Title Sponsor</SelectItem>
              <SelectItem value="gold sponsor">Gold Sponsor</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="gap-2 h-9" onClick={openCreate}>
          <Plus size={14} /> Add Sponsor
        </Button>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center py-16">
          <Handshake size={32} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No sponsors found</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={openCreate}>
            Add your first sponsor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <SponsorCardAdmin
              key={s.id}
              sponsor={s}
              isOwner={isOwner}
              onEdit={() => openEdit(s)}
              onToggle={() => toggleActive(s)}
              onDelete={() => setDeleteId(s.id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{editingId ? "Edit Sponsor" : "Add Sponsor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Name *</Label>
              <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="bg-card border-border" placeholder="e.g. Google" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Logo URL *</Label>
              <Input value={form.logo_url} onChange={(e) => updateField("logo_url", e.target.value)} className="bg-card border-border" placeholder="https://..." />
              {form.logo_url && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden">
                    <img src={form.logo_url} alt="preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <span className="text-[11px] text-muted-foreground">Preview</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Tier</Label>
                <Select value={form.tier} onValueChange={(v) => updateField("tier", v)}>
                  <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title sponsor">👑 Title Sponsor</SelectItem>
                    <SelectItem value="gold sponsor">🥇 Gold Sponsor</SelectItem>
                    <SelectItem value="partner">🤝 Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Display Order</Label>
                <Input type="number" min={0} value={form.display_order} onChange={(e) => updateField("display_order", parseInt(e.target.value) || 0)} className="bg-card border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Website URL</Label>
              <Input value={form.website_url} onChange={(e) => updateField("website_url", e.target.value)} className="bg-card border-border" placeholder="https://..." />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editingId ? "Update" : "Add Sponsor"}</Button>
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
