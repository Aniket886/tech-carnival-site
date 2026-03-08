import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Bot, Phone, Users, MessageSquare } from "lucide-react";

interface BotContact {
  id: string;
  role: string;
  name: string;
  event_id: string | null;
  phone: string;
  email: string | null;
  display_order: number;
  is_active: boolean;
  events?: { name: string } | null;
}

interface BotFaq {
  id: string;
  question_pattern: string;
  answer: string;
  category: string;
  is_active: boolean;
}

const AdminBotSettings = () => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<BotContact[]>([]);
  const [faqs, setFaqs] = useState<BotFaq[]>([]);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"contacts" | "faqs">("contacts");

  // Contact form
  const [contactDialog, setContactDialog] = useState(false);
  const [editContact, setEditContact] = useState<BotContact | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", role: "event_coordinator", event_id: "", display_order: 0 });

  // FAQ form
  const [faqDialog, setFaqDialog] = useState(false);
  const [editFaq, setEditFaq] = useState<BotFaq | null>(null);
  const [faqForm, setFaqForm] = useState({ question_pattern: "", answer: "", category: "general" });

  const fetchData = async () => {
    const [{ data: c }, { data: f }, { data: e }] = await Promise.all([
      supabase.from("bot_contacts").select("*, events(name)").order("display_order"),
      supabase.from("bot_faqs").select("*").order("created_at"),
      supabase.from("events").select("id, name").eq("is_active", true).order("name"),
    ]);
    if (c) setContacts(c as BotContact[]);
    if (f) setFaqs(f);
    if (e) setEvents(e);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // ── Contact CRUD ──
  const openAddContact = () => {
    setEditContact(null);
    setContactForm({ name: "", phone: "", email: "", role: "event_coordinator", event_id: "", display_order: contacts.length });
    setContactDialog(true);
  };

  const openEditContact = (c: BotContact) => {
    setEditContact(c);
    setContactForm({ name: c.name, phone: c.phone, email: c.email || "", role: c.role, event_id: c.event_id || "", display_order: c.display_order });
    setContactDialog(true);
  };

  const saveContact = async () => {
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      toast({ title: "Name and phone are required", variant: "destructive" });
      return;
    }
    const payload = {
      name: contactForm.name.trim(),
      phone: contactForm.phone.trim(),
      email: contactForm.email.trim() || null,
      role: contactForm.role,
      event_id: contactForm.event_id || null,
      display_order: contactForm.display_order,
    };
    if (editContact) {
      await supabase.from("bot_contacts").update(payload).eq("id", editContact.id);
      toast({ title: "Contact updated" });
    } else {
      await supabase.from("bot_contacts").insert([payload]);
      toast({ title: "Contact added" });
    }
    setContactDialog(false);
    fetchData();
  };

  const deleteContact = async (id: string) => {
    await supabase.from("bot_contacts").delete().eq("id", id);
    toast({ title: "Contact deleted" });
    fetchData();
  };

  const toggleContact = async (id: string, active: boolean) => {
    await supabase.from("bot_contacts").update({ is_active: !active }).eq("id", id);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, is_active: !active } : c));
  };

  // ── FAQ CRUD ──
  const openAddFaq = () => {
    setEditFaq(null);
    setFaqForm({ question_pattern: "", answer: "", category: "general" });
    setFaqDialog(true);
  };

  const openEditFaq = (f: BotFaq) => {
    setEditFaq(f);
    setFaqForm({ question_pattern: f.question_pattern, answer: f.answer, category: f.category });
    setFaqDialog(true);
  };

  const saveFaq = async () => {
    if (!faqForm.question_pattern.trim() || !faqForm.answer.trim()) {
      toast({ title: "Pattern and answer are required", variant: "destructive" });
      return;
    }
    const payload = { question_pattern: faqForm.question_pattern.trim(), answer: faqForm.answer.trim(), category: faqForm.category };
    if (editFaq) {
      await supabase.from("bot_faqs").update(payload).eq("id", editFaq.id);
      toast({ title: "FAQ updated" });
    } else {
      await supabase.from("bot_faqs").insert([payload]);
      toast({ title: "FAQ added" });
    }
    setFaqDialog(false);
    fetchData();
  };

  const deleteFaq = async (id: string) => {
    await supabase.from("bot_faqs").delete().eq("id", id);
    toast({ title: "FAQ deleted" });
    fetchData();
  };

  const toggleFaq = async (id: string, active: boolean) => {
    await supabase.from("bot_faqs").update({ is_active: !active }).eq("id", id);
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, is_active: !active } : f));
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">CarniBOT Settings</h2>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <Button variant={tab === "contacts" ? "default" : "outline"} size="sm" className="gap-2" onClick={() => setTab("contacts")}>
          <Phone className="h-4 w-4" /> Contacts ({contacts.length})
        </Button>
        <Button variant={tab === "faqs" ? "default" : "outline"} size="sm" className="gap-2" onClick={() => setTab("faqs")}>
          <MessageSquare className="h-4 w-4" /> FAQs ({faqs.length})
        </Button>
      </div>

      {/* Contacts Tab */}
      {tab === "contacts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Core team and event coordinator contacts shown by the bot</p>
            <Button size="sm" className="gap-2" onClick={openAddContact}><Plus className="h-4 w-4" /> Add Contact</Button>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/20">
                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Name</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-medium hidden sm:table-cell">Role</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Phone</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Active</th>
                <th className="px-4 py-3 text-left text-muted-foreground font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{c.name}</p>
                      {c.events?.name && <p className="text-xs text-muted-foreground">{c.events.name}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="outline" className="text-[10px]">{c.role === "core_team" ? "🎯 Core" : "🎪 Coordinator"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                    <td className="px-4 py-3"><Switch checked={c.is_active} onCheckedChange={() => toggleContact(c.id, c.is_active)} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditContact(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteContact(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAQs Tab */}
      {tab === "faqs" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Custom Q&A pairs the bot uses to answer questions</p>
            <Button size="sm" className="gap-2" onClick={openAddFaq}><Plus className="h-4 w-4" /> Add FAQ</Button>
          </div>
          <div className="space-y-2">
            {faqs.map(f => (
              <div key={f.id} className={`rounded-lg border border-border p-4 ${f.is_active ? "" : "opacity-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{f.category}</Badge>
                      <span className="text-xs text-muted-foreground">Patterns: {f.question_pattern}</span>
                    </div>
                    <p className="text-sm text-foreground">{f.answer}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch checked={f.is_active} onCheckedChange={() => toggleFaq(f.id, f.is_active)} />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditFaq(f)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteFaq(f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Dialog */}
      <Dialog open={contactDialog} onOpenChange={setContactDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle>{editContact ? "Edit Contact" : "Add Contact"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} maxLength={10} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select value={contactForm.role} onChange={e => setContactForm({ ...contactForm, role: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="core_team">Core Team</option>
                <option value="event_coordinator">Event Coordinator</option>
              </select>
            </div>
            {contactForm.role === "event_coordinator" && (
              <div className="space-y-1.5">
                <Label>Event</Label>
                <select value={contactForm.event_id} onChange={e => setContactForm({ ...contactForm, event_id: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">None</option>
                  {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            )}
            <Button onClick={saveContact} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAQ Dialog */}
      <Dialog open={faqDialog} onOpenChange={setFaqDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle>{editFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Keywords/Patterns * <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
              <Input value={faqForm.question_pattern} onChange={e => setFaqForm({ ...faqForm, question_pattern: e.target.value })} placeholder="certificate,certificates,cert" />
            </div>
            <div className="space-y-1.5">
              <Label>Answer *</Label>
              <Textarea value={faqForm.answer} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })} rows={4} placeholder="Bot's response..." />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select value={faqForm.category} onChange={e => setFaqForm({ ...faqForm, category: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="general">General</option>
                <option value="events">Events</option>
                <option value="registration">Registration</option>
                <option value="schedule">Schedule</option>
              </select>
            </div>
            <Button onClick={saveFaq} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBotSettings;
