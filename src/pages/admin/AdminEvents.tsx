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
import { Pencil, Plus, Trash2, ExternalLink, Link2, Link2Off, Copy, Check, CreditCard, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsOwner } from "@/hooks/useIsOwner";

/* ─── types ─── */
interface Event {
  id: string; name: string; slug: string; category: string; icon: string | null;
  description: string | null; team_size_min: number; team_size_max: number;
  is_active: boolean; date: string | null; time: string | null; venue: string | null;
  prize_pool: string | null; rules: string[] | null; website_url: string | null;
  payment_url: string | null; rulebook_url: string | null; created_at: string; price: number;
}

interface FormData {
  name: string; slug: string; category: string; icon: string; description: string;
  team_size_min: number; team_size_max: number; date: string; time: string;
  venue: string; prize_pool: string; rules: string; website_url: string;
  payment_url: string; rulebook_url: string; price: number;
}

const emptyForm: FormData = {
  name: "", slug: "", category: "technical", icon: "🎯", description: "",
  team_size_min: 1, team_size_max: 1, date: "", time: "", venue: "",
  prize_pool: "", rules: "", website_url: "", payment_url: "", rulebook_url: "", price: 0,
};

const categoryStyles: Record<string, string> = {
  technical: "bg-primary/15 text-primary border-primary/30",
  gaming: "bg-red-500/15 text-red-400 border-red-500/30",
  cultural: "bg-accent/15 text-accent border-accent/30",
};

const AdminEvents = () => {
  const isOwner = useIsOwner();
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
      supabase.from("events").select("*, rulebook_url" as any).order("name") as any,
      supabase.from("registrations").select("event_id"),
    ]);
    setEvents(evts || []);
    const counts = new Map<string, number>();
    (regs || []).forEach((r: any) => counts.set(r.event_id, (counts.get(r.event_id) || 0) + 1));
    setRegCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (ev: Event) => {
    setEditingId(ev.id);
    setForm({
      name: ev.name, slug: ev.slug, category: ev.category, icon: ev.icon || "🎯",
      description: ev.description || "", team_size_min: ev.team_size_min, team_size_max: ev.team_size_max,
      date: ev.date || "", time: ev.time || "", venue: ev.venue || "",
      prize_pool: ev.prize_pool || "", rules: (ev.rules || []).join("\n"), website_url: ev.website_url || "", payment_url: ev.payment_url || "", rulebook_url: (ev as any).rulebook_url || "",
      price: ev.price || 0,
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
      payment_url: form.payment_url || null,
      rulebook_url: form.rulebook_url || null,
      price: form.price || 0,
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
    const ev = events.find(e => e.id === deleteId);
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

  /* ─── Event Links state ─── */
  const [editLinkEvent, setEditLinkEvent] = useState<Event | null>(null);
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const [savingLink, setSavingLink] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* ─── Payment Links state ─── */
  const [editPayEvent, setEditPayEvent] = useState<Event | null>(null);
  const [editPayUrl, setEditPayUrl] = useState("");
  const [savingPayLink, setSavingPayLink] = useState(false);
  const [copiedPayId, setCopiedPayId] = useState<string | null>(null);

  const handleSaveLink = async () => {
    if (!editLinkEvent) return;
    setSavingLink(true);
    const url = editLinkUrl.trim() || null;
    const { error } = await supabase.from("events").update({ website_url: url }).eq("id", editLinkEvent.id);
    setSavingLink(false);
    if (error) { toast.error("Failed to update link"); return; }
    toast.success(`Link updated for ${editLinkEvent.name}`);
    setEditLinkEvent(null);
    fetchData();
  };

  const clearLink = async (ev: Event) => {
    const { error } = await supabase.from("events").update({ website_url: null }).eq("id", ev.id);
    if (error) { toast.error("Failed to remove link"); return; }
    toast.success(`Link removed for ${ev.name}`);
    fetchData();
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const linkedCount = events.filter(e => e.website_url).length;

  /* ─── Payment Links helpers ─── */
  const handleSavePayLink = async () => {
    if (!editPayEvent) return;
    setSavingPayLink(true);
    const url = editPayUrl.trim() || null;
    const { error } = await supabase.from("events").update({ payment_url: url }).eq("id", editPayEvent.id);
    setSavingPayLink(false);
    if (error) { toast.error("Failed to update payment link"); return; }
    toast.success(`Payment link updated for ${editPayEvent.name}`);
    setEditPayEvent(null);
    fetchData();
  };

  const clearPayLink = async (ev: Event) => {
    const { error } = await supabase.from("events").update({ payment_url: null }).eq("id", ev.id);
    if (error) { toast.error("Failed to remove payment link"); return; }
    toast.success(`Payment link removed for ${ev.name}`);
    fetchData();
  };

  const copyPayUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedPayId(id);
    setTimeout(() => setCopiedPayId(null), 1500);
  };

  const payLinkedCount = events.filter(e => e.payment_url).length;

  /* ─── Rulebook Links state ─── */
  const [editRulebookEvent, setEditRulebookEvent] = useState<Event | null>(null);
  const [editRulebookUrl, setEditRulebookUrl] = useState("");
  const [savingRulebookLink, setSavingRulebookLink] = useState(false);
  const [copiedRulebookId, setCopiedRulebookId] = useState<string | null>(null);

  const handleSaveRulebookLink = async () => {
    if (!editRulebookEvent) return;
    setSavingRulebookLink(true);
    const url = editRulebookUrl.trim() || null;
    const { error } = await supabase.from("events").update({ rulebook_url: url } as any).eq("id", editRulebookEvent.id);
    setSavingRulebookLink(false);
    if (error) { toast.error("Failed to update rulebook link"); return; }
    toast.success(`Rulebook link updated for ${editRulebookEvent.name}`);
    setEditRulebookEvent(null);
    fetchData();
  };

  const clearRulebookLink = async (ev: Event) => {
    const { error } = await supabase.from("events").update({ rulebook_url: null } as any).eq("id", ev.id);
    if (error) { toast.error("Failed to remove rulebook link"); return; }
    toast.success(`Rulebook link removed for ${ev.name}`);
    fetchData();
  };

  const copyRulebookUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedRulebookId(id);
    setTimeout(() => setCopiedRulebookId(null), 1500);
  };

  const rulebookLinkedCount = events.filter(e => (e as any).rulebook_url).length;

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-5">
      <Tabs defaultValue="events">
        <div className="flex items-center justify-between">
           <TabsList>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="links" className="gap-1.5">
              <Link2 size={14} /> Event Links
            </TabsTrigger>
             <TabsTrigger value="payment-links" className="gap-1.5">
               <CreditCard size={14} /> Payment Links
             </TabsTrigger>
             <TabsTrigger value="rulebook-links" className="gap-1.5">
               <BookOpen size={14} /> Rulebook Links
             </TabsTrigger>
           </TabsList>
        </div>

        {/* ════ Events Tab ════ */}
        <TabsContent value="events" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-foreground">Event Management</h2>
            <Button size="sm" className="gap-2" onClick={openCreate}>
              <Plus size={14} /> Add Event
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground font-medium">Event</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Category</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Team Size</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Price (₹)</TableHead>
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
                      <TableCell className="text-sm font-medium text-foreground">₹{ev.price || 0}</TableCell>
                      <TableCell>
                        <span className={`text-sm font-semibold ${(regCounts.get(ev.id) || 0) > 0 ? "text-primary" : "text-muted-foreground"}`}>
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
                          {isOwner && <button onClick={() => setDeleteId(ev.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 size={15} />
                          </button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {events.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">No events yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* ════ Event Links Tab ════ */}
        <TabsContent value="links" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Event Links</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage external website URLs for each event</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1"><Link2 size={14} /> {linkedCount} linked</Badge>
              <Badge variant="outline" className="gap-1"><Link2Off size={14} /> {events.length - linkedCount} unlinked</Badge>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground font-medium">Event</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Category</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Website URL</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map(ev => (
                  <TableRow key={ev.id} className="border-border">
                    <TableCell className="font-medium text-foreground text-sm">{ev.icon} {ev.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] capitalize ${categoryStyles[ev.category] || ""}`}>{ev.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      {ev.website_url ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground truncate">{ev.website_url}</span>
                          <button onClick={() => copyUrl(ev.id, ev.website_url!)} className="text-muted-foreground hover:text-foreground shrink-0">
                            {copiedId === ev.id ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground/50 italic">No link set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ev.website_url ? (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Linked</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Unlinked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditLinkEvent(ev); setEditLinkUrl(ev.website_url || ""); }} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                          <Pencil size={15} />
                        </button>
                        {ev.website_url && (
                          <>
                            <a href={ev.website_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                              <ExternalLink size={15} />
                            </a>
                            {isOwner && <button onClick={() => clearLink(ev)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                              <Link2Off size={15} />
                            </button>}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        {/* ════ Payment Links Tab ════ */}
        <TabsContent value="payment-links" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Payment Links</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage payment URLs for each event's Pay button</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1"><CreditCard size={14} /> {payLinkedCount} linked</Badge>
              <Badge variant="outline" className="gap-1"><Link2Off size={14} /> {events.length - payLinkedCount} unlinked</Badge>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground font-medium">Event</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Category</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Payment URL</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map(ev => (
                  <TableRow key={ev.id} className="border-border">
                    <TableCell className="font-medium text-foreground text-sm">{ev.icon} {ev.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] capitalize ${categoryStyles[ev.category] || ""}`}>{ev.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      {ev.payment_url ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground truncate">{ev.payment_url}</span>
                          <button onClick={() => copyPayUrl(ev.id, ev.payment_url!)} className="text-muted-foreground hover:text-foreground shrink-0">
                            {copiedPayId === ev.id ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground/50 italic">No link set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ev.payment_url ? (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Linked</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Unlinked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditPayEvent(ev); setEditPayUrl(ev.payment_url || ""); }} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                          <Pencil size={15} />
                        </button>
                        {ev.payment_url && (
                          <>
                            <a href={ev.payment_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                              <ExternalLink size={15} />
                            </a>
                            {isOwner && <button onClick={() => clearPayLink(ev)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                              <Link2Off size={15} />
                            </button>}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ════ Rulebook Links Tab ════ */}
        <TabsContent value="rulebook-links" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Rulebook Links</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage rulebook / document URLs for each event</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1"><BookOpen size={14} /> {rulebookLinkedCount} linked</Badge>
              <Badge variant="outline" className="gap-1"><Link2Off size={14} /> {events.length - rulebookLinkedCount} unlinked</Badge>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground font-medium">Event</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Category</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Rulebook URL</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map(ev => {
                  const rbUrl = (ev as any).rulebook_url as string | null;
                  return (
                    <TableRow key={ev.id} className="border-border">
                      <TableCell className="font-medium text-foreground text-sm">{ev.icon} {ev.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] capitalize ${categoryStyles[ev.category] || ""}`}>{ev.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        {rbUrl ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground truncate">{rbUrl}</span>
                            <button onClick={() => copyRulebookUrl(ev.id, rbUrl)} className="text-muted-foreground hover:text-foreground shrink-0">
                              {copiedRulebookId === ev.id ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground/50 italic">No link set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {rbUrl ? (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Linked</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Unlinked</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditRulebookEvent(ev); setEditRulebookUrl(rbUrl || ""); }} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                            <Pencil size={15} />
                          </button>
                          {rbUrl && (
                            <>
                              <a href={rbUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                <ExternalLink size={15} />
                              </a>
                              {isOwner && <button onClick={() => clearRulebookLink(ev)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                <Link2Off size={15} />
                              </button>}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create / Edit Event Dialog */}
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
              <div>
                <Label className="text-xs text-muted-foreground">Registration Price (₹)</Label>
                <Input type="number" min={0} value={form.price} onChange={e => updateField("price", parseInt(e.target.value) || 0)} placeholder="e.g. 200" className="bg-card border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Website / Rulebook URL</Label>
              <Input value={form.website_url} onChange={e => updateField("website_url", e.target.value)} className="bg-card border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Payment URL</Label>
              <Input value={form.payment_url} onChange={e => updateField("payment_url", e.target.value)} placeholder="https://payment-link.com" className="bg-card border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Rulebook URL</Label>
              <Input value={form.rulebook_url} onChange={e => updateField("rulebook_url", e.target.value)} placeholder="https://docs.google.com/..." className="bg-card border-border" />
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

      {/* Edit Link Dialog */}
      <Dialog open={!!editLinkEvent} onOpenChange={open => !open && setEditLinkEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Link — {editLinkEvent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-sm font-medium text-foreground">Website URL</Label>
            <Input placeholder="https://event-website.com" value={editLinkUrl} onChange={e => setEditLinkUrl(e.target.value)} />
            <p className="text-xs text-muted-foreground">Leave empty to remove the link. Use full URL including https://</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLinkEvent(null)}>Cancel</Button>
            <Button onClick={handleSaveLink} disabled={savingLink}>{savingLink ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Link Dialog */}
      <Dialog open={!!editPayEvent} onOpenChange={open => !open && setEditPayEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment Link — {editPayEvent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-sm font-medium text-foreground">Payment URL</Label>
            <Input placeholder="https://payment-link.com" value={editPayUrl} onChange={e => setEditPayUrl(e.target.value)} />
            <p className="text-xs text-muted-foreground">Leave empty to remove the link. Use full URL including https://</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPayEvent(null)}>Cancel</Button>
            <Button onClick={handleSavePayLink} disabled={savingPayLink}>{savingPayLink ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rulebook Link Dialog */}
      <Dialog open={!!editRulebookEvent} onOpenChange={open => !open && setEditRulebookEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Rulebook Link — {editRulebookEvent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-sm font-medium text-foreground">Rulebook URL</Label>
            <Input placeholder="https://docs.google.com/..." value={editRulebookUrl} onChange={e => setEditRulebookUrl(e.target.value)} />
            <p className="text-xs text-muted-foreground">Leave empty to remove the link. Use full URL including https://</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRulebookEvent(null)}>Cancel</Button>
            <Button onClick={handleSaveRulebookLink} disabled={savingRulebookLink}>{savingRulebookLink ? "Saving…" : "Save"}</Button>
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
