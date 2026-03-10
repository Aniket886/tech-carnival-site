import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAdminRefresh } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  link_url: string | null;
  link_label: string | null;
  is_visible: boolean;
  display_order: number;
}

const emptyForm = { question: "", answer: "", link_url: "", link_label: "", is_visible: true, display_order: 0 };

const AdminFAQ = () => {
  const refreshKey = useAdminRefresh();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchFaqs = async () => {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) {
      console.error(error);
      toast.error("Failed to load FAQs");
    } else {
      setFaqs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFaqs(); }, [refreshKey]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, display_order: faqs.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      link_url: faq.link_url || "",
      link_label: faq.link_label || "",
      is_visible: faq.is_visible,
      display_order: faq.display_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Question and Answer are required");
      return;
    }
    setSaving(true);
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      link_url: form.link_url.trim() || null,
      link_label: form.link_label.trim() || null,
      is_visible: form.is_visible,
      display_order: form.display_order,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("faqs").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("faqs").insert(payload));
    }

    if (error) {
      toast.error("Failed to save FAQ");
      console.error(error);
    } else {
      toast.success(editingId ? "FAQ updated" : "FAQ added");
      
      setDialogOpen(false);
      fetchFaqs();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("faqs").delete().eq("id", deleteId);
    if (error) {
      toast.error("Failed to delete FAQ");
    } else {
      toast.success("FAQ deleted");
      
      fetchFaqs();
    }
    setDeleteId(null);
  };

  const toggleVisibility = async (faq: FAQ) => {
    const { error } = await supabase
      .from("faqs")
      .update({ is_visible: !faq.is_visible, updated_at: new Date().toISOString() })
      .eq("id", faq.id);
    if (error) {
      toast.error("Failed to update visibility");
    } else {
      fetchFaqs();
    }
  };

  const moveOrder = async (faq: FAQ, direction: "up" | "down") => {
    const idx = faqs.findIndex(f => f.id === faq.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= faqs.length) return;

    const other = faqs[swapIdx];
    await Promise.all([
      supabase.from("faqs").update({ display_order: other.display_order }).eq("id", faq.id),
      supabase.from("faqs").update({ display_order: faq.display_order }).eq("id", other.id),
    ]);
    fetchFaqs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">FAQ Manager</h2>
          <p className="text-sm text-muted-foreground">Add, edit, reorder, and manage frequently asked questions.</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus size={16} /> Add FAQ
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Loading…</p>
      ) : faqs.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No FAQs yet. Click "Add FAQ" to get started.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="hidden md:table-cell">Answer</TableHead>
                <TableHead className="hidden lg:table-cell">Link</TableHead>
                <TableHead className="w-20">Visible</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.map((faq, idx) => (
                <TableRow key={faq.id} className={!faq.is_visible ? "opacity-50" : ""}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{faq.display_order}</TableCell>
                  <TableCell className="font-medium text-sm max-w-[200px] truncate">{faq.question}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[250px] truncate">{faq.answer}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs">
                    {faq.link_url ? (
                      <a href={faq.link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        {faq.link_label || "Link"} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggleVisibility(faq)} className="text-muted-foreground hover:text-foreground">
                      {faq.is_visible ? <Eye size={16} className="text-green-500" /> : <EyeOff size={16} />}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => moveOrder(faq, "up")} disabled={idx === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => moveOrder(faq, "down")} disabled={idx === faqs.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <ArrowDown size={14} />
                      </button>
                      <button onClick={() => openEdit(faq)} className="p-1 text-muted-foreground hover:text-primary">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(faq.id)} className="p-1 text-muted-foreground hover:text-destructive">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Question *</Label>
              <Input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="e.g. Who can participate?" />
            </div>
            <div>
              <Label>Answer *</Label>
              <Textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} placeholder="Write the answer..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Link URL</Label>
                <Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <Label>Link Label</Label>
                <Input value={form.link_label} onChange={e => setForm(f => ({ ...f, link_label: e.target.value }))} placeholder="e.g. Learn More" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_visible} onCheckedChange={v => setForm(f => ({ ...f, is_visible: v }))} />
              <Label>Visible on website</Label>
            </div>
            <div>
              <Label>Display Order</Label>
              <Input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this FAQ. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminFAQ;
