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

import { Search, Plus, Pencil, Trash2, Upload, Building2, CheckCircle2, Clock, UserPlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useIsOwner } from "@/hooks/useIsOwner";

interface College {
  id: string;
  name: string;
  short_name: string | null;
  city: string | null;
  state: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  source: string;
  approval_status: string;
  affiliated_university: string | null;
  website_url: string | null;
  manual_registration_count: number | null;
}

interface FormData {
  name: string;
  short_name: string;
  city: string;
  state: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  logo_url: string;
  affiliated_university: string;
  website_url: string;
  manual_registration_count: string;
}

const emptyForm: FormData = {
  name: "", short_name: "", city: "", state: "",
  contact_person: "", contact_email: "", contact_phone: "", logo_url: "",
  affiliated_university: "", website_url: "", manual_registration_count: "",
};

type FilterStatus = "all" | "pending" | "approved";

const AdminColleges = () => {
  const isOwner = useIsOwner();
  const [colleges, setColleges] = useState<College[]>([]);
  const [regCounts, setRegCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [{ data: cols }, { data: regs }] = await Promise.all([
      supabase.from("colleges").select("*").order("created_at", { ascending: false }),
      supabase.from("registrations").select("college_id"),
    ]);
    setColleges((cols || []) as College[]);
    const counts = new Map<string, number>();
    (regs || []).forEach((r: any) => {
      if (r.college_id) counts.set(r.college_id, (counts.get(r.college_id) || 0) + 1);
    });
    setRegCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const pendingCount = useMemo(() => colleges.filter(c => c.approval_status === "pending").length, [colleges]);

  const filtered = useMemo(() => {
    let list = colleges;
    if (filterStatus !== "all") {
      list = list.filter(c => c.approval_status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.short_name && c.short_name.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
      );
    }
    return list;
  }, [colleges, search, filterStatus]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (c: College) => {
    setEditingId(c.id);
    setForm({
      name: c.name, short_name: c.short_name || "", city: c.city || "", state: c.state || "",
      contact_person: c.contact_person || "", contact_email: c.contact_email || "",
      contact_phone: c.contact_phone || "", logo_url: c.logo_url || "",
      affiliated_university: c.affiliated_university || "", website_url: c.website_url || "",
      manual_registration_count: c.manual_registration_count != null ? String(c.manual_registration_count) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("College name is required"); return; }
    setSaving(true);
    const payload: any = {
      name: form.name.trim(),
      short_name: form.short_name.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      contact_person: form.contact_person.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      logo_url: form.logo_url.trim() || null,
      affiliated_university: form.affiliated_university.trim() || null,
      website_url: form.website_url.trim() || null,
      manual_registration_count: form.manual_registration_count.trim() ? parseInt(form.manual_registration_count.trim(), 10) : null,
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("colleges").update(payload).eq("id", editingId));
    } else {
      payload.source = "admin";
      payload.approval_status = "approved";
      ({ error } = await supabase.from("colleges").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "College updated" : "College added");
    
    setDialogOpen(false);
    fetchData();
  };

  const toggleActive = async (c: College) => {
    const { error } = await supabase.from("colleges").update({ is_active: !c.is_active } as any).eq("id", c.id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`${c.name} ${!c.is_active ? "activated" : "deactivated"}`);
    fetchData();
  };

  const toggleApproval = async (c: College) => {
    const newStatus = c.approval_status === "approved" ? "pending" : "approved";
    const { error } = await supabase.from("colleges").update({ approval_status: newStatus } as any).eq("id", c.id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`${c.name} ${newStatus === "approved" ? "approved" : "set to pending"}`);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("colleges").delete().eq("id", deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success("College deleted");
    
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
      if (lines.length < 2) { toast.error("CSV must have a header row and data"); return; }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
      const nameIdx = headers.indexOf("name");
      if (nameIdx === -1) { toast.error("CSV must have a 'name' column"); return; }
      const cityIdx = headers.indexOf("city");
      const stateIdx = headers.indexOf("state");
      const shortIdx = headers.findIndex(h => h.includes("short"));

      const rows = lines.slice(1).map(line => {
        const cols = line.split(",").map(c => c.trim().replace(/"/g, ""));
        return {
          name: cols[nameIdx] || "",
          short_name: shortIdx >= 0 ? cols[shortIdx] || null : null,
          city: cityIdx >= 0 ? cols[cityIdx] || null : null,
          state: stateIdx >= 0 ? cols[stateIdx] || null : null,
          source: "admin",
          approval_status: "approved",
        };
      }).filter(r => r.name);

      if (rows.length === 0) { toast.error("No valid rows found"); return; }
      const { error } = await supabase.from("colleges").insert(rows as any);
      if (error) { toast.error(error.message); return; }
      toast.success(`${rows.length} colleges imported`);
      fetchData();
    };
    input.click();
  };

  const updateField = (key: keyof FormData, value: string) => setForm(f => ({ ...f, [key]: value }));

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <Building2 size={22} className="text-primary" /> College Management ({colleges.length})
          {pendingCount > 0 && (
            <Badge variant="outline" className="ml-2 text-xs bg-amber-500/15 text-amber-400 border-amber-500/30">
              {pendingCount} pending
            </Badge>
          )}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={importCSV}>
            <Upload size={14} /> Import CSV
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus size={14} /> Add College
          </Button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search colleges…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <div className="flex gap-1.5">
          {(["all", "pending", "approved"] as FilterStatus[]).map(s => (
            <Button
              key={s}
              size="sm"
              variant={filterStatus === s ? "default" : "outline"}
              onClick={() => setFilterStatus(s)}
              className="capitalize gap-1.5 text-xs"
            >
              {s === "pending" && <Clock size={12} />}
              {s === "approved" && <CheckCircle2 size={12} />}
              {s}
              {s === "pending" && pendingCount > 0 && (
                <span className="ml-0.5 bg-amber-500/20 text-amber-400 px-1.5 rounded-full text-[10px]">{pendingCount}</span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground font-medium">College</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">City / State</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Source</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Registrations</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Active</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No colleges found.</TableCell></TableRow>
              ) : filtered.map(c => (
                <TableRow key={c.id} className="border-border">
                  <TableCell>
                    <div>
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      {c.short_name && <span className="text-xs text-muted-foreground ml-1.5">({c.short_name})</span>}
                      {c.affiliated_university && (
                        <p className="text-xs text-muted-foreground mt-0.5">{c.affiliated_university}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        c.source === "user_submitted"
                          ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {c.source === "user_submitted" ? (
                        <><UserPlus size={10} className="mr-1" /> User</>
                      ) : "Admin"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleApproval(c)}
                      className="cursor-pointer"
                      title={`Click to ${c.approval_status === "approved" ? "set pending" : "approve"}`}
                    >
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          c.approval_status === "approved"
                            ? "bg-green-500/15 text-green-400 border-green-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse"
                        }`}
                      >
                        {c.approval_status === "approved" ? (
                          <><CheckCircle2 size={10} className="mr-1" /> Approved</>
                        ) : (
                          <><Clock size={10} className="mr-1" /> Pending</>
                        )}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="cursor-pointer px-2 py-1 rounded-md hover:bg-muted/50 transition-colors">
                                <span className={`text-sm font-semibold ${((regCounts.get(c.id) || 0) + (c.manual_registration_count || 0)) > 0 ? "text-primary" : "text-muted-foreground"}`}>
                                  {(regCounts.get(c.id) || 0) + (c.manual_registration_count || 0)}
                                </span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-3">
                              <Label className="text-xs text-muted-foreground">Manual Count</Label>
                              <Input
                                type="number"
                                min={0}
                                className="mt-1 bg-card border-border"
                                defaultValue={c.manual_registration_count ?? ""}
                                onBlur={async (e) => {
                                  const val = e.target.value.trim() ? parseInt(e.target.value, 10) : null;
                                  const { error } = await supabase.from("colleges").update({ manual_registration_count: val } as any).eq("id", c.id);
                                  if (error) { toast.error("Failed to update"); return; }
                                  toast.success("Count updated");
                                  fetchData();
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Auto: {regCounts.get(c.id) || 0} | Manual: {c.manual_registration_count || 0}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                        <Pencil size={15} />
                      </button>
                      {isOwner && <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
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
            <DialogTitle>{editingId ? "Edit College" : "Add College"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Name *</Label>
              <Input value={form.name} onChange={e => updateField("name", e.target.value)} className="bg-card border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Short Name</Label>
                <Input value={form.short_name} onChange={e => updateField("short_name", e.target.value)} placeholder="e.g. GMU" className="bg-card border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">City</Label>
                <Input value={form.city} onChange={e => updateField("city", e.target.value)} className="bg-card border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">State</Label>
                <Input value={form.state} onChange={e => updateField("state", e.target.value)} className="bg-card border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Affiliated University</Label>
                <Input value={form.affiliated_university} onChange={e => updateField("affiliated_university", e.target.value)} className="bg-card border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">College Website</Label>
              <Input value={form.website_url} onChange={e => updateField("website_url", e.target.value)} placeholder="https://..." className="bg-card border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Contact Person</Label>
              <Input value={form.contact_person} onChange={e => updateField("contact_person", e.target.value)} className="bg-card border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input type="email" value={form.contact_email} onChange={e => updateField("contact_email", e.target.value)} className="bg-card border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <Input value={form.contact_phone} onChange={e => updateField("contact_phone", e.target.value)} className="bg-card border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Logo URL</Label>
              <Input value={form.logo_url} onChange={e => updateField("logo_url", e.target.value)} className="bg-card border-border" />
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
            <AlertDialogTitle>Delete college?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this college record.</AlertDialogDescription>
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

export default AdminColleges;
