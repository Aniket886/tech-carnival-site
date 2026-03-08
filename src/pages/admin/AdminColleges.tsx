import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Upload } from "lucide-react";
import { validateName, validateEmail, validatePhone, validateCollegeName, sanitizeInput } from "@/lib/validators";

interface College {
  id: string;
  name: string;
  short_name: string | null;
  city: string | null;
  state: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  regCount?: number;
}

interface FieldErrors { [key: string]: string }

const emptyForm = { name: "", short_name: "", city: "", state: "", contact_person: "", contact_email: "", contact_phone: "" };

const AdminColleges = () => {
  const { toast } = useToast();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [{ data: cols }, { data: regs }] = await Promise.all([
      supabase.from("colleges").select("*").order("name"),
      supabase.from("registrations").select("college_name"),
    ]);
    if (cols) {
      const countMap = new Map<string, number>();
      regs?.forEach((r) => {
        const key = r.college_name.toLowerCase();
        countMap.set(key, (countMap.get(key) || 0) + 1);
      });
      setColleges(cols.map((c) => ({ ...c, regCount: countMap.get(c.name.toLowerCase()) || 0 })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    if (!search) return colleges;
    const s = search.toLowerCase();
    return colleges.filter((c) =>
      c.name.toLowerCase().includes(s) ||
      c.short_name?.toLowerCase().includes(s) ||
      c.city?.toLowerCase().includes(s)
    );
  }, [colleges, search]);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setFormErrors({}); setDialogOpen(true); };
  const openEdit = (c: College) => {
    setEditId(c.id);
    setForm({ name: c.name, short_name: c.short_name || "", city: c.city || "", state: c.state || "", contact_person: c.contact_person || "", contact_email: c.contact_email || "", contact_phone: c.contact_phone || "" });
    setFormErrors({});
    setDialogOpen(true);
  };

  const validateForm = (): FieldErrors => {
    const e: FieldErrors = {};
    const nameV = validateCollegeName(form.name);
    if (!nameV.valid) e.name = nameV.error!;
    if (form.contact_person) {
      const cpV = validateName(form.contact_person);
      if (!cpV.valid) e.contact_person = cpV.error!;
    }
    if (form.contact_email) {
      const ceV = validateEmail(form.contact_email);
      if (!ceV.valid) e.contact_email = ceV.error!;
    }
    if (form.contact_phone) {
      const cpV = validatePhone(form.contact_phone);
      if (!cpV.valid) e.contact_phone = cpV.error!;
    }
    return e;
  };

  const handleSave = async () => {
    const errs = validateForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast({ title: `Please fix ${Object.keys(errs).length} error(s)`, variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: sanitizeInput(form.name),
      short_name: form.short_name.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      contact_person: form.contact_person ? sanitizeInput(form.contact_person) : null,
      contact_email: form.contact_email ? form.contact_email.trim().toLowerCase() : null,
      contact_phone: form.contact_phone ? form.contact_phone.trim() : null,
    };
    if (editId) {
      const { error } = await supabase.from("colleges").update(payload).eq("id", editId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "College updated" });
    } else {
      const { error } = await supabase.from("colleges").insert([payload]);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "College added" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const deleteCollege = async (id: string) => {
    const { error } = await supabase.from("colleges").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setColleges((prev) => prev.filter((c) => c.id !== id)); toast({ title: "College deleted" }); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("colleges").update({ is_active: !current }).eq("id", id);
    setColleges((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !current } : c)));
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
      return { name: obj.name || "", short_name: obj.short_name || "", city: obj.city || "", state: obj.state || "" };
    }).filter((r) => r.name);
    if (rows.length === 0) { toast({ title: "No valid rows found", variant: "destructive" }); return; }
    const { error } = await supabase.from("colleges").upsert(rows, { onConflict: "name" });
    if (error) toast({ title: "Import failed", description: error.message, variant: "destructive" });
    else { toast({ title: `${rows.length} colleges imported` }); fetchData(); }
    e.target.value = "";
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">College Management ({colleges.length})</h2>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
            <Button variant="outline" size="sm" className="gap-2" asChild><span><Upload className="h-4 w-4" /> Import CSV</span></Button>
          </label>
          <Button size="sm" className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> Add College</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search colleges..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">College</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium hidden md:table-cell">City</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium hidden lg:table-cell">Contact</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Regs</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Active</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-muted/10">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{c.name}</p>
                  {c.short_name && <p className="text-xs text-muted-foreground">{c.short_name}</p>}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.city}{c.state ? `, ${c.state}` : ""}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{c.contact_person}</td>
                <td className="px-4 py-3 text-foreground font-semibold">{c.regCount}</td>
                <td className="px-4 py-3"><Switch checked={c.is_active} onCheckedChange={() => toggleActive(c.id, c.is_active)} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteCollege(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No colleges found</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit College" : "Add College"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>College Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} className={formErrors.name ? "border-destructive" : ""} />
                {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
              </div>
              <div className="space-y-1.5"><Label>Short Name</Label><Input value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Contact Person</Label>
                <Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} maxLength={20} className={formErrors.contact_person ? "border-destructive" : ""} />
                {formErrors.contact_person && <p className="text-xs text-destructive">{formErrors.contact_person}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} maxLength={50} className={formErrors.contact_email ? "border-destructive" : ""} />
                {formErrors.contact_email && <p className="text-xs text-destructive">{formErrors.contact_email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} maxLength={10} className={formErrors.contact_phone ? "border-destructive" : ""} />
                {formErrors.contact_phone && <p className="text-xs text-destructive">{formErrors.contact_phone}</p>}
              </div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminColleges;
