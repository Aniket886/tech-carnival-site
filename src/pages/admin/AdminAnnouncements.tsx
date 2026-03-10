import { useState, useEffect } from "react";
import { logActivity } from "@/lib/logActivity";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRefresh } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Megaphone, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  link_url: string | null;
  link_label: string | null;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

const emptyForm = {
  title: "", message: "", type: "info", link_url: "", link_label: "",
  is_active: true, starts_at: new Date().toISOString().slice(0, 16), expires_at: "",
};

const typeColors: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  urgent: "bg-red-500/10 text-red-400 border-red-500/30",
};

const AdminAnnouncements = () => {
  const refreshKey = useAdminRefresh();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (data) setItems(data as unknown as Announcement[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [refreshKey]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (a: Announcement) => {
    setEditId(a.id);
    setForm({
      title: a.title, message: a.message, type: a.type,
      link_url: a.link_url || "", link_label: a.link_label || "",
      is_active: a.is_active,
      starts_at: a.starts_at ? new Date(a.starts_at).toISOString().slice(0, 16) : "",
      expires_at: a.expires_at ? new Date(a.expires_at).toISOString().slice(0, 16) : "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: "Missing fields", description: "Title and message are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title, message: form.message, type: form.type,
      link_url: form.link_url || null, link_label: form.link_label || null,
      is_active: form.is_active,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    const { error } = editId
      ? await supabase.from("announcements").update(payload).eq("id", editId)
      : await supabase.from("announcements").insert(payload);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editId ? "Updated" : "Created", description: `Announcement "${form.title}" saved.` });
    logActivity(editId ? "Announcement updated" : "Announcement created", form.title);
    setModalOpen(false);
    fetch();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("announcements").delete().eq("id", deleteId);
    toast({ title: "Deleted", description: "Announcement removed." });
    logActivity("Announcement deleted");
    setDeleteId(null);
    fetch();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("announcements").update({ is_active: !current }).eq("id", id);
    fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Megaphone className="text-primary" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Announcements</h2>
            <p className="text-sm text-muted-foreground">Manage banners shown on the public site</p>
          </div>
        </div>
        <Button onClick={openCreate} size="sm"><Plus size={16} className="mr-1" /> New</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No announcements yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(a => {
            const isExpired = a.expires_at && new Date(a.expires_at) < new Date();
            return (
              <Card key={a.id} className={`border-border ${!a.is_active || isExpired ? "opacity-60" : ""}`}>
                <CardContent className="py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={typeColors[a.type] || typeColors.info}>{a.type}</Badge>
                      {isExpired && <Badge variant="outline" className="text-muted-foreground border-muted">Expired</Badge>}
                      {!a.is_active && <Badge variant="outline" className="text-muted-foreground border-muted">Inactive</Badge>}
                    </div>
                    <h3 className="font-semibold text-foreground">{a.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{a.message}</p>
                    {a.link_url && <p className="text-xs text-primary mt-1">{a.link_label || a.link_url}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a.id, a.is_active)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 size={16} /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Message</Label><Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">ℹ️ Info</SelectItem>
                    <SelectItem value="warning">⚠️ Warning</SelectItem>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Label className="mb-2">Active</Label>
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Link URL (optional)</Label><Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="https://..." /></div>
              <div><Label>Link Label</Label><Input value={form.link_label} onChange={e => setForm(f => ({ ...f, link_label: e.target.value }))} placeholder="Learn more" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Starts At</Label><Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} /></div>
              <div><Label>Expires At (optional)</Label><Input type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 size={16} className="mr-1 animate-spin" />}{editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAnnouncements;
