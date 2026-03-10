import { useEffect, useState, useCallback, useMemo } from "react";
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
  Phone, Bot, Mail, AlertTriangle, CheckCircle2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useIsOwner } from "@/hooks/useIsOwner";

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

type EventOption = { id: string; name: string; category: string };

const EVENT_CATEGORY_COLORS: Record<string, string> = {
  technical: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  gaming: "bg-red-500/20 text-red-400 border-red-500/30",
  cultural: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};
const CORE_TEAM_COLOR = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

const getEventBadgeClass = (category: string | undefined) => {
  if (!category) return CORE_TEAM_COLOR;
  return EVENT_CATEGORY_COLORS[category] || "bg-muted text-muted-foreground border-border";
};

/* ─── Contacts Tab ─── */
const ContactsTab = () => {
  const isOwner = useIsOwner();
  const [contacts, setContacts] = useState<BotContact[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [edits, setEdits] = useState<Record<string, Partial<BotContact>>>({});

  const fetch_ = useCallback(async () => {
    const [{ data: c }, { data: e }] = await Promise.all([
      supabase.from("bot_contacts").select("*, events(name, category)").order("role").order("display_order"),
      supabase.from("events").select("id, name, category").eq("is_active", true).order("name"),
    ]);
    setContacts(c || []);
    setEvents((e || []) as EventOption[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch_();
    const interval = setInterval(fetch_, 10_000);
    return () => clearInterval(interval);
  }, [fetch_]);

  const getEdit = (id: string, field: keyof BotContact, fallback: any) =>
    edits[id]?.[field] !== undefined ? edits[id][field] : fallback;

  const setEdit = (id: string, field: string, value: any) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const validate = (c: BotContact): string | null => {
    const name = (getEdit(c.id, "name", c.name) as string).trim();
    const phone = (getEdit(c.id, "phone", c.phone) as string).trim();
    const email = (getEdit(c.id, "email", c.email || "") as string).trim();
    const role = (getEdit(c.id, "role", c.role) as string);
    const eventId = getEdit(c.id, "event_id", c.event_id);

    if (role === "event_coordinator" && !eventId) return "Please select an event for this coordinator";
    if (!name || name.length < 2) return "Name must be at least 2 characters";
    if (!/^[6-9]\d{9}$/.test(phone)) return "Phone must be a valid 10-digit Indian mobile number";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email address";
    return null;
  };

  const handleSave = async (c: BotContact) => {
    const patch = edits[c.id];
    if (!patch || !Object.keys(patch).length) return;

    const error_msg = validate(c);
    if (error_msg) { toast.error(error_msg); return; }

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

  const handleAdd = async () => {
    const { error } = await supabase.from("bot_contacts").insert({
      name: "New Coordinator",
      phone: "0000000000",
      role: "event_coordinator",
      event_id: null,
    });
    if (error) toast.error("Failed to add");
    else { toast.success("Coordinator added — select an event and fill details"); fetch_(); }
  };

  const handleAddCoreTeam = async () => {
    const { error } = await supabase.from("bot_contacts").insert({
      name: "New Organizer",
      phone: "0000000000",
      role: "core_team",
      event_id: null,
    });
    if (error) toast.error("Failed to add");
    else { toast.success("Core team member added"); fetch_(); }
  };

  const handleEventChange = (contactId: string, value: string) => {
    if (value === "core_team") {
      setEdit(contactId, "role", "core_team");
      setEdit(contactId, "event_id", null);
    } else {
      setEdit(contactId, "role", "event_coordinator");
      setEdit(contactId, "event_id", value);
    }
  };

  // Derived data
  const coreTeam = contacts.filter(c => c.role === "core_team");
  const coordinators = contacts.filter(c => c.role !== "core_team");

  const eventsWithCoordinators = useMemo(() => {
    const map = new Map<string, BotContact[]>();
    for (const c of coordinators) {
      const key = c.event_id || "unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [coordinators]);

  const assignedCount = useMemo(() => {
    const assigned = new Set(coordinators.map(c => c.event_id).filter(Boolean));
    return assigned.size;
  }, [coordinators]);

  const totalEvents = events.length;

  if (loading) return <p className="text-muted-foreground">Loading contacts…</p>;

  const getCurrentEventValue = (c: BotContact) => {
    const editRole = getEdit(c.id, "role", c.role) as string;
    if (editRole === "core_team") return "core_team";
    const editEventId = getEdit(c.id, "event_id", c.event_id);
    return editEventId || "";
  };

  const getEventCategory = (eventId: string | null): string | undefined => {
    if (!eventId) return undefined;
    return events.find(e => e.id === eventId)?.category;
  };

  const renderRow = (c: BotContact) => {
    const currentEventValue = getCurrentEventValue(c);
    const eventCategory = currentEventValue === "core_team"
      ? undefined
      : getEventCategory(currentEventValue || c.event_id);
    const badgeClass = currentEventValue === "core_team" ? CORE_TEAM_COLOR : getEventBadgeClass(eventCategory);

    return (
      <div key={c.id} className="flex flex-wrap items-center gap-3 py-3 px-4 border-b border-border last:border-b-0">
        {/* Event Dropdown */}
        <Select value={currentEventValue} onValueChange={v => handleEventChange(c.id, v)}>
          <SelectTrigger className={`w-44 shrink-0 text-xs border ${badgeClass}`}>
            <SelectValue placeholder="Select event…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="core_team">
              <span className="flex items-center gap-1.5">🏆 Core Team</span>
            </SelectItem>
            {events.map(ev => (
              <SelectItem key={ev.id} value={ev.id}>
                <span className="flex items-center gap-1.5">{ev.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={getEdit(c.id, "name", c.name) as string}
          onChange={e => setEdit(c.id, "name", e.target.value)}
          className="flex-1 min-w-[140px] bg-muted/50"
          placeholder="Name"
        />
        <div className="relative shrink-0">
          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={getEdit(c.id, "phone", c.phone) as string}
            onChange={e => setEdit(c.id, "phone", e.target.value)}
            className="pl-9 w-40 bg-muted/50"
            placeholder="10-digit phone"
          />
        </div>
        <div className="relative shrink-0">
          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={getEdit(c.id, "email", c.email || "") as string}
            onChange={e => setEdit(c.id, "email", e.target.value || null)}
            className="pl-9 w-52 bg-muted/50"
            placeholder="email@example.com"
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
        {isOwner && <AlertDialog>
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
        </AlertDialog>}
      </div>
    );
  };

  // Events without any coordinator
  const unassignedEvents = events.filter(ev => !eventsWithCoordinators.has(ev.id));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-lg border border-border bg-card px-5 py-3 flex items-center gap-3 text-sm">
        {assignedCount >= totalEvents ? (
          <>
            <CheckCircle2 size={16} className="text-green-400 shrink-0" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">{assignedCount}/{totalEvents}</strong> events have coordinators assigned
            </span>
          </>
        ) : (
          <>
            <AlertTriangle size={16} className="text-yellow-400 shrink-0" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">{assignedCount}/{totalEvents}</strong> events have coordinators —{" "}
              {unassignedEvents.map(e => e.name).join(", ")} need{unassignedEvents.length === 1 ? "s" : ""} a coordinator
            </span>
          </>
        )}
      </div>

      {/* Core Team */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Core Team
          </h3>
          <Button size="sm" variant="outline" onClick={handleAddCoreTeam}>
            <Plus size={14} className="mr-1.5" /> Add
          </Button>
        </div>
        {coreTeam.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5">No core team contacts yet.</p>
        ) : coreTeam.map(c => renderRow(c))}
      </div>

      {/* Event Coordinators — Grouped by Event */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            🎪 Event Coordinators
          </h3>
          <Button size="sm" variant="outline" onClick={handleAdd}>
            <Plus size={14} className="mr-1.5" /> Add
          </Button>
        </div>

        {/* Grouped by event */}
        {events.map(ev => {
          const eventCoords = eventsWithCoordinators.get(ev.id) || [];
          const badgeClass = getEventBadgeClass(ev.category);
          return (
            <div key={ev.id}>
              <div className="px-5 py-2 bg-muted/30 border-b border-border flex items-center gap-2">
                <Badge className={`text-xs border ${badgeClass}`}>{ev.name}</Badge>
                {eventCoords.length === 0 && (
                  <span className="text-xs text-yellow-400 flex items-center gap-1">
                    <AlertTriangle size={12} /> No coordinator assigned
                  </span>
                )}
              </div>
              {eventCoords.map(c => renderRow(c))}
            </div>
          );
        })}

        {/* Unassigned coordinators */}
        {eventsWithCoordinators.has("unassigned") && (
          <>
            <div className="px-5 py-2 bg-muted/30 border-b border-border flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Unassigned</Badge>
              <span className="text-xs text-yellow-400 flex items-center gap-1">
                <AlertTriangle size={12} /> Select an event for these coordinators
              </span>
            </div>
            {eventsWithCoordinators.get("unassigned")!.map(c => renderRow(c))}
          </>
        )}
      </div>
    </div>
  );
};

/* ─── FAQ Tab ─── */
const FaqTab = () => {
  const isOwner = useIsOwner();
  const [faqs, setFaqs] = useState<BotFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [edits, setEdits] = useState<Record<string, Partial<BotFaq>>>({});

  const fetch_ = useCallback(async () => {
    const { data } = await supabase.from("bot_faqs").select("*").order("category").order("created_at");
    setFaqs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch_();
    const interval = setInterval(fetch_, 10_000);
    return () => clearInterval(interval);
  }, [fetch_]);

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
                  {isOwner && <AlertDialog>
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
                  </AlertDialog>}
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
    const interval = setInterval(fetch_, 10_000);
    return () => clearInterval(interval);
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
