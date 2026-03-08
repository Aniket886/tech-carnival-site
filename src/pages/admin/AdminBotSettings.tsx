import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users, MessageCircle, BarChart3, Save, Trash2, Plus,
  Phone, Bot,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/* ─── Types ─── */
type BotContact = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  event_id: string | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  events?: { name: string } | null;
};

type BotFaq = {
  id: string;
  question_pattern: string;
  answer: string;
  category: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type EventOption = { id: string; name: string };

/* ─── Contacts Tab ─── */
const ContactsTab = () => {
  const [contacts, setContacts] = useState<BotContact[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [edits, setEdits] = useState<Record<string, Partial<BotContact>>>({});

  const fetch_ = useCallback(async () => {
    const [{ data: c }, { data: e }] = await Promise.all([
      supabase.from("bot_contacts").select("*, events(name)").order("role").order("display_order"),
      supabase.from("events").select("id, name").eq("is_active", true).order("name"),
    ]);
    setContacts(c || []);
    setEvents(e || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const getEdit = (id: string, field: keyof BotContact, fallback: any) =>
    edits[id]?.[field] !== undefined ? edits[id][field] : fallback;

  const setEdit = (id: string, field: string, value: any) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const handleSave = async (c: BotContact) => {
    const patch = edits[c.id];
    if (!patch || !Object.keys(patch).length) return;
    setSaving(p => ({ ...p, [c.id]: true }));
    const { error } = await supabase.from("bot_contacts").update(patch).eq("id", c.id);
    if (error) toast.error("Failed to save");
    else {
      toast.success("Contact updated");
      setEdits(prev => { const n = { ...prev }; delete n[c.id]; return n; });
      fetch_();
    }
    setSaving(p => ({ ...p, [c.id]: false }));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("bot_contacts").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Contact deleted"); fetch_(); }
  };

  const handleAdd = async (role: string) => {
    const { error } = await supabase.from("bot_contacts").insert({
      name: role === "core_team" ? "New Organizer" : "Coordinator",
      phone: "0000000000",
      role,
    });
    if (error) toast.error("Failed to add");
    else { toast.success("Contact added"); fetch_(); }
  };

  if (loading) return <p className="text-muted-foreground">Loading contacts…</p>;

  const coreTeam = contacts.filter(c => c.role === "core_team");
  const coordinators = contacts.filter(c => c.role !== "core_team");

  const renderRow = (c: BotContact, showEvent = false) => (
    <div key={c.id} className="flex flex-wrap items-center gap-3 py-3 px-4 border-b border-border last:border-b-0">
      {showEvent && c.events?.name && (
        <Badge variant="secondary" className="text-xs shrink-0">{c.events.name}</Badge>
      )}
      <Input
        value={getEdit(c.id, "name", c.name) as string}
        onChange={e => setEdit(c.id, "name", e.target.value)}
        className="flex-1 min-w-[180px] bg-muted/50"
        placeholder="Name"
      />
      <div className="relative shrink-0">
        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={getEdit(c.id, "phone", c.phone) as string}
          onChange={e => setEdit(c.id, "phone", e.target.value)}
          className="pl-9 w-44 bg-muted/50"
          placeholder="+91 XXXXX XXXXX"
        />
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-muted-foreground hover:text-primary"
        onClick={() => handleSave(c)}
        disabled={saving[c.id] || !edits[c.id]}
        title="Save"
      >
        <Save size={16} />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 size={16} /></Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact?</AlertDialogTitle>
            <AlertDialogDescription>Remove {c.name} from CarniBOT contacts?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Core Team */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Core Team
          </h3>
          <Button size="sm" variant="outline" onClick={() => handleAdd("core_team")}>
            <Plus size={14} className="mr-1.5" /> Add
          </Button>
        </div>
        {coreTeam.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5">No core team contacts yet.</p>
        ) : coreTeam.map(c => renderRow(c))}
      </div>

      {/* Event Coordinators */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            🎪 Event Coordinators
          </h3>
          <Button size="sm" variant="outline" onClick={() => handleAdd("event_coordinator")}>
            <Plus size={14} className="mr-1.5" /> Add
          </Button>
        </div>
        {coordinators.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5">No event coordinators yet.</p>
        ) : coordinators.map(c => renderRow(c, true))}
      </div>
    </div>
  );
};

/* ─── FAQ Tab ─── */
const FaqTab = () => {
  const [faqs, setFaqs] = useState<BotFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [edits, setEdits] = useState<Record<string, Partial<BotFaq>>>({});

  const fetch_ = useCallback(async () => {
    const { data } = await supabase.from("bot_faqs").select("*").order("category").order("created_at");
    setFaqs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const getEdit = (id: string, field: keyof BotFaq, fallback: any) =>
    edits[id]?.[field] !== undefined ? edits[id][field] : fallback;

  const setEdit = (id: string, field: string, value: any) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const handleSave = async (f: BotFaq) => {
    const patch = edits[f.id];
    if (!patch || !Object.keys(patch).length) return;
    setSaving(p => ({ ...p, [f.id]: true }));
    const { error } = await supabase.from("bot_faqs").update(patch).eq("id", f.id);
    if (error) toast.error("Failed to save");
    else {
      toast.success("FAQ updated");
      setEdits(prev => { const n = { ...prev }; delete n[f.id]; return n; });
      fetch_();
    }
    setSaving(p => ({ ...p, [f.id]: false }));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("bot_faqs").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("FAQ deleted"); fetch_(); }
  };

  const handleAdd = async () => {
    const { error } = await supabase.from("bot_faqs").insert({
      question_pattern: "new question keywords",
      answer: "Answer here...",
      category: "general",
    });
    if (error) toast.error("Failed to add FAQ");
    else { toast.success("FAQ added"); fetch_(); }
  };

  const handleToggle = async (f: BotFaq) => {
    const { error } = await supabase.from("bot_faqs").update({ is_active: !f.is_active }).eq("id", f.id);
    if (error) toast.error("Failed to toggle");
    else fetch_();
  };

  if (loading) return <p className="text-muted-foreground">Loading FAQs…</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={handleAdd}>
          <Plus size={14} className="mr-1.5" /> Add FAQ
        </Button>
      </div>

      {faqs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No FAQs configured yet.</div>
      ) : (
        <div className="space-y-4">
          {faqs.map(f => (
            <div key={f.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">{getEdit(f.id, "category", f.category || "general") as string}</Badge>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={f.is_active ?? true}
                      onCheckedChange={() => handleToggle(f)}
                    />
                    <span className={`text-xs ${f.is_active ? "text-green-400" : "text-muted-foreground"}`}>
                      {f.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => handleSave(f)}
                    disabled={saving[f.id] || !edits[f.id]}
                    title="Save"
                  >
                    <Save size={16} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 size={16} /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
                        <AlertDialogDescription>This FAQ will be permanently removed.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(f.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <Input
                value={getEdit(f.id, "question_pattern", f.question_pattern) as string}
                onChange={e => setEdit(f.id, "question_pattern", e.target.value)}
                className="bg-muted/50 text-sm"
                placeholder="Question keywords (comma-separated)"
              />
              <Textarea
                value={getEdit(f.id, "answer", f.answer) as string}
                onChange={e => setEdit(f.id, "answer", e.target.value)}
                className="bg-muted/50 text-sm resize-none"
                rows={2}
                placeholder="Bot response…"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Analytics Tab ─── */
const AnalyticsTab = () => {
  const [faqs, setFaqs] = useState<BotFaq[]>([]);
  const [contacts, setContacts] = useState<BotContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      const [{ data: f }, { data: c }] = await Promise.all([
        supabase.from("bot_faqs").select("*"),
        supabase.from("bot_contacts").select("*"),
      ]);
      setFaqs(f || []);
      setContacts(c || []);
      setLoading(false);
    };
    fetch_();
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading analytics…</p>;

  const categories = faqs.reduce((acc, f) => {
    const cat = f.category || "general";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalFaqs = faqs.length;
  const activeFaqs = faqs.filter(f => f.is_active).length;
  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => c.is_active).length;
  const categoryCount = Object.keys(categories).length;

  const maxCount = Math.max(...Object.values(categories), 1);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total FAQs", value: totalFaqs, sub: `${activeFaqs} active` },
          { label: "FAQ Categories", value: categoryCount },
          { label: "Bot Contacts", value: totalContacts, sub: `${activeContacts} active` },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 text-center">
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-semibold text-foreground">FAQ Categories</h3>
        <div className="space-y-3">
          {Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
            <div key={cat} className="flex items-center gap-3">
              <Badge variant="outline" className="w-24 justify-center text-xs shrink-0">{cat}</Badge>
              <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
const AdminBotSettings = () => {
  const [botActive, setBotActive] = useState(true);
  const [loadingToggle, setLoadingToggle] = useState(false);

  useEffect(() => {
    const fetchSetting = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "bot_active")
        .maybeSingle();
      if (data) setBotActive(data.setting_value === "true");
    };
    fetchSetting();
  }, []);

  const toggleBot = async () => {
    setLoadingToggle(true);
    const newVal = !botActive;
    const { error } = await supabase
      .from("admin_settings")
      .upsert({ setting_key: "bot_active", setting_value: String(newVal) }, { onConflict: "setting_key" });
    if (error) toast.error("Failed to update");
    else {
      setBotActive(newVal);
      toast.success(newVal ? "Bot activated" : "Bot deactivated");
    }
    setLoadingToggle(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bot size={22} className="text-primary" /> CarniBOT Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage chatbot contacts, FAQs, and settings</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2">
          <span className="text-sm text-muted-foreground">Bot Active</span>
          <Switch checked={botActive} onCheckedChange={toggleBot} disabled={loadingToggle} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts" className="gap-1.5">
            <Users size={14} /> Contacts
          </TabsTrigger>
          <TabsTrigger value="faqs" className="gap-1.5">
            <MessageCircle size={14} /> FAQ Responses
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 size={14} /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts"><ContactsTab /></TabsContent>
        <TabsContent value="faqs"><FaqTab /></TabsContent>
        <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBotSettings;
