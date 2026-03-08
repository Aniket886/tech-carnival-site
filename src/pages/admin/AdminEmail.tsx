import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Mail, Send, Eye, Users, Search, X, Loader2, CheckCircle2, Table2, Plus } from "lucide-react";

/* ─── email template definitions ─── */
interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  buildHtml: (vars: TemplateVars) => string;
}

interface TemplateVars {
  recipientName: string;
  customMessage: string;
  eventName?: string;
}

const ACCENT = "#38bdf8";
const PURPLE = "#a855f7";
const PINK = "#ec4899";

const baseHeader = `
<div style="position:relative;background:#0a0e1a;padding:48px 24px 40px;text-align:center;overflow:hidden;">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 20%,rgba(14,165,233,.15) 0%,transparent 70%)"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 50% 70% at 75% 80%,rgba(168,85,247,.12) 0%,transparent 70%)"></div>
  <div style="position:relative;z-index:1">
    <p style="margin:0 0 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};font-family:'Segoe UI',Arial,sans-serif">📅 MARCH 27-28, 2026</p>
    <h1 style="font-size:36px;margin:8px 0 0;font-weight:900;letter-spacing:1px;line-height:1.1;background:linear-gradient(135deg,${ACCENT},${PURPLE},${PINK});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-family:'Segoe UI',Arial,sans-serif">Tech Carnival</h1>
    <p style="font-size:28px;margin:0;font-weight:700;color:rgba(248,250,252,.9);letter-spacing:6px;font-family:'Segoe UI',Arial,sans-serif">2K26</p>
  </div>
</div>`;

const baseFooter = `
<div style="padding:20px 24px;text-align:center;border-top:1px solid #1e293b">
  <p style="color:#64748b;font-size:12px;margin:0;line-height:1.6">Tech Carnival – 2K26 | GM University, Davangere</p>
  <p style="color:#64748b;font-size:12px;margin:4px 0 0"><a href="mailto:support@techcarnival.online" style="color:${ACCENT};text-decoration:none">support@techcarnival.online</a> | +91 8073491988</p>
</div>`;

const wrap = (body: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
    <div style="max-width:600px;margin:40px auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid #1e293b;box-shadow:0 20px 60px rgba(0,0,0,.3)">
      ${baseHeader}${body}${baseFooter}
    </div>
  </body></html>`;

const templates: EmailTemplate[] = [
  {
    id: "announcement",
    name: "📢 General Announcement",
    description: "Send a general announcement or update to participants",
    subject: "Important Update – Tech Carnival 2K26",
    buildHtml: ({ recipientName, customMessage }) => wrap(`
      <div style="padding:32px 28px">
        <h2 style="color:#f8fafc;font-size:22px;margin:0 0 20px;font-weight:700">📢 Announcement</h2>
        <p style="color:#cbd5e1;line-height:1.7;margin:0 0 12px;font-size:15px">Hi <strong style="color:#f8fafc">${recipientName}</strong>,</p>
        <div style="color:#cbd5e1;line-height:1.8;font-size:15px;margin:0 0 28px;white-space:pre-line">${customMessage}</div>
        <div style="background:linear-gradient(135deg,#0c4a6e,#1e3a5f);border-left:4px solid #0ea5e9;padding:18px 20px;border-radius:0 10px 10px 0">
          <p style="color:#7dd3fc;margin:0;font-size:14px;line-height:1.6">Stay tuned for more updates. We can't wait to see you there! 🚀</p>
        </div>
      </div>`),
  },
  {
    id: "reminder",
    name: "⏰ Event Reminder",
    description: "Remind participants about an upcoming event",
    subject: "Reminder: Don't Miss Out – Tech Carnival 2K26",
    buildHtml: ({ recipientName, customMessage, eventName }) => wrap(`
      <div style="padding:32px 28px">
        <h2 style="color:#f8fafc;font-size:22px;margin:0 0 20px;font-weight:700">⏰ Friendly Reminder</h2>
        <p style="color:#cbd5e1;line-height:1.7;margin:0 0 12px;font-size:15px">Hi <strong style="color:#f8fafc">${recipientName}</strong>,</p>
        <p style="color:#cbd5e1;line-height:1.7;margin:0 0 20px;font-size:15px">
          This is a reminder about ${eventName ? `<strong style="color:${ACCENT}">${eventName}</strong>` : "your registered event"} at Tech Carnival 2K26.
        </p>
        <div style="color:#cbd5e1;line-height:1.8;font-size:15px;margin:0 0 28px;white-space:pre-line">${customMessage}</div>
        <div style="background:linear-gradient(135deg,#422006,#78350f);border-left:4px solid #f59e0b;padding:18px 20px;border-radius:0 10px 10px 0">
          <p style="color:#fcd34d;margin:0;font-size:14px;line-height:1.6">📋 <strong>Remember:</strong> Bring your College ID, laptop &amp; charger (if applicable), and your enthusiasm!</p>
        </div>
      </div>`),
  },
  {
    id: "thankyou",
    name: "🙏 Thank You",
    description: "Thank participants after the event",
    subject: "Thank You for Participating – Tech Carnival 2K26 🎉",
    buildHtml: ({ recipientName, customMessage }) => wrap(`
      <div style="padding:32px 28px">
        <h2 style="color:#f8fafc;font-size:22px;margin:0 0 20px;font-weight:700">🙏 Thank You!</h2>
        <p style="color:#cbd5e1;line-height:1.7;margin:0 0 12px;font-size:15px">Dear <strong style="color:#f8fafc">${recipientName}</strong>,</p>
        <p style="color:#cbd5e1;line-height:1.7;margin:0 0 20px;font-size:15px">
          Thank you for being part of <strong style="color:#4ade80">Tech Carnival 2K26</strong>! Your participation made this event truly special.
        </p>
        <div style="color:#cbd5e1;line-height:1.8;font-size:15px;margin:0 0 28px;white-space:pre-line">${customMessage}</div>
        <div style="background:linear-gradient(135deg,#14532d,#166534);border-left:4px solid #4ade80;padding:18px 20px;border-radius:0 10px 10px 0">
          <p style="color:#86efac;margin:0;font-size:14px;line-height:1.6">We hope you had an amazing experience. See you next year! 🎊</p>
        </div>
      </div>`),
  },
  {
    id: "custom",
    name: "✉️ Custom Email",
    description: "Fully custom email with your own message",
    subject: "Tech Carnival 2K26 – Message",
    buildHtml: ({ recipientName, customMessage }) => wrap(`
      <div style="padding:32px 28px">
        <p style="color:#cbd5e1;line-height:1.7;margin:0 0 12px;font-size:15px">Hi <strong style="color:#f8fafc">${recipientName}</strong>,</p>
        <div style="color:#cbd5e1;line-height:1.8;font-size:15px;margin:0 0 10px;white-space:pre-line">${customMessage}</div>
      </div>`),
  },
];

/* ─── main component ─── */
const AdminEmail = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("announcement");
  const [subject, setSubject] = useState(templates[0].subject);
  const [message, setMessage] = useState("");
  const [recipientMode, setRecipientMode] = useState<"manual" | "event" | "table">("manual");
  const [manualEmails, setManualEmails] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [participants, setParticipants] = useState<{ email: string; name: string; phone?: string; team_name?: string; college?: string; event?: string }[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<{ email: string; name: string; phone?: string; team_name?: string; college?: string; event?: string }[]>([]);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [customField, setCustomField] = useState("");

  const PLACEHOLDERS = [
    { label: "Name", value: "{{name}}" },
    { label: "Team Name", value: "{{team_name}}" },
    { label: "Email", value: "{{email}}" },
    { label: "Phone", value: "{{phone}}" },
    { label: "College", value: "{{college}}" },
    { label: "Event", value: "{{event}}" },
  ];

  const insertPlaceholder = (placeholder: string) => {
    const el = document.querySelector<HTMLTextAreaElement>("#email-message-textarea");
    if (el) {
      const start = el.selectionStart ?? message.length;
      const end = el.selectionEnd ?? message.length;
      const newMsg = message.slice(0, start) + placeholder + message.slice(end);
      setMessage(newMsg);
      setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = start + placeholder.length; }, 0);
    } else {
      setMessage(prev => prev + placeholder);
    }
  };

  const resolveMessage = (msg: string, recipient: { name: string; email: string; phone?: string; team_name?: string; college?: string; event?: string }) => {
    return msg
      .replace(/\{\{name\}\}/gi, recipient.name || "")
      .replace(/\{\{team_name\}\}/gi, recipient.team_name || "")
      .replace(/\{\{email\}\}/gi, recipient.email || "")
      .replace(/\{\{phone\}\}/gi, recipient.phone || "")
      .replace(/\{\{college\}\}/gi, recipient.college || "")
      .replace(/\{\{event\}\}/gi, recipient.event || eventName || "");
  };
  const [allRegistrations, setAllRegistrations] = useState<{ leader_name: string; leader_email: string; leader_phone: string; event_name: string; team_name: string; college_name: string }[]>([]);
  const [tableSelected, setTableSelected] = useState<Set<string>>(new Set());
  const [regSearch, setRegSearch] = useState("");

  // load events + all registrations
  useEffect(() => {
    supabase.from("events").select("id,name").eq("is_active", true).order("name").then(({ data }) => {
      if (data) setEvents(data);
      // load registrations with event names
      supabase.from("registrations").select("leader_name,leader_email,leader_phone,team_name,college_name,event_id").order("created_at", { ascending: false }).then(({ data: regs }) => {
        if (regs && data) {
          const eventMap = new Map(data.map(e => [e.id, e.name]));
          setAllRegistrations(regs.map(r => ({
            leader_name: r.leader_name,
            leader_email: r.leader_email,
            leader_phone: r.leader_phone,
            team_name: r.team_name || "",
            college_name: r.college_name,
            event_name: eventMap.get(r.event_id) || "Unknown",
          })));
        }
      });
    });
  }, []);

  // load participants when event selected
  useEffect(() => {
    if (recipientMode !== "event" || !selectedEventId) { setParticipants([]); return; }
    supabase.from("registrations").select("leader_email,leader_name,leader_phone,team_name,college_name").eq("event_id", selectedEventId).then(({ data }) => {
      if (data) {
        const evtName = events.find(e => e.id === selectedEventId)?.name || "";
        const unique = Array.from(new Map(data.map(d => [d.leader_email, {
          email: d.leader_email, name: d.leader_name,
          phone: d.leader_phone, team_name: d.team_name || "", college: d.college_name, event: evtName,
        }])).values());
        setParticipants(unique);
      }
    });
  }, [selectedEventId, recipientMode, events]);

  // update subject when template changes
  useEffect(() => {
    const tpl = templates.find(t => t.id === selectedTemplate);
    if (tpl) setSubject(tpl.subject);
  }, [selectedTemplate]);

  const currentTemplate = templates.find(t => t.id === selectedTemplate)!;
  const eventName = events.find(e => e.id === selectedEventId)?.name;

  const generatePreview = () => {
    const html = currentTemplate.buildHtml({ recipientName: "Participant", customMessage: message || "Your message will appear here…", eventName });
    setPreviewHtml(html);
  };

  const getRecipients = (): { email: string; name: string; phone?: string; team_name?: string; college?: string; event?: string }[] => {
    if (recipientMode === "event") return selectedParticipants;
    if (recipientMode === "table") {
      return allRegistrations
        .filter((_, i) => tableSelected.has(String(i)))
        .map(r => ({ email: r.leader_email, name: r.leader_name, phone: r.leader_phone, team_name: r.team_name, college: r.college_name, event: r.event_name }));
    }
    return manualEmails.split(/[,;\n]/).map(e => e.trim()).filter(Boolean).map(e => ({ email: e, name: e.split("@")[0] }));
  };

  const handleSend = async () => {
    const recipients = getRecipients();
    if (!recipients.length) { toast({ title: "No recipients", description: "Add at least one recipient.", variant: "destructive" }); return; }
    if (!message.trim()) { toast({ title: "Empty message", description: "Write a message before sending.", variant: "destructive" }); return; }

    setSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const r of recipients) {
      const resolvedMsg = resolveMessage(message, r);
      const html = currentTemplate.buildHtml({ recipientName: r.name, customMessage: resolvedMsg, eventName: r.event || eventName });
      try {
        const { error } = await supabase.functions.invoke("send-email", {
          body: { type: "custom", to: r.email, leader_name: r.name, registration_id: "-", event_name: eventName || "Tech Carnival 2K26", custom_html: html, custom_subject: subject },
        });
        if (error) failCount++; else successCount++;
      } catch { failCount++; }
    }

    setSending(false);
    if (successCount > 0) {
      setSent(true);
      toast({ title: "Emails sent!", description: `${successCount} email(s) sent successfully.${failCount ? ` ${failCount} failed.` : ""}` });
      setTimeout(() => setSent(false), 3000);
    } else {
      toast({ title: "Send failed", description: "Could not send emails. Check your configuration.", variant: "destructive" });
    }
  };

  const toggleParticipant = (p: { email: string; name: string }) => {
    setSelectedParticipants(prev => prev.some(s => s.email === p.email) ? prev.filter(s => s.email !== p.email) : [...prev, p]);
  };

  const selectAll = () => setSelectedParticipants([...participants]);
  const deselectAll = () => setSelectedParticipants([]);

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Mail className="text-primary" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Email Composer</h2>
          <p className="text-sm text-muted-foreground">Send custom emails to participants using templates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT: Template + Compose */}
        <div className="xl:col-span-2 space-y-5">
          {/* Template Picker */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Choose Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${selectedTemplate === t.id ? "border-primary bg-primary/5 shadow-[0_0_15px_hsl(var(--primary)/0.15)]" : "border-border hover:border-muted-foreground/30 bg-card"}`}
                  >
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compose */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Compose</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 block">Subject</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} className="bg-background border-border" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Message</Label>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-muted-foreground text-[10px] mr-1">Insert:</span>
                    {PLACEHOLDERS.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => insertPlaceholder(p.value)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors"
                      >
                        <Plus size={10} /> {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea id="email-message-textarea" rows={6} placeholder="Write your message here… Use {{name}}, {{team_name}}, etc. for personalization" value={message} onChange={e => setMessage(e.target.value)} className="bg-background border-border resize-none" />
              </div>

              {selectedTemplate === "reminder" && (
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 block">Event (for reminder context)</Label>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select event" /></SelectTrigger>
                    <SelectContent>{events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="neon-outline" onClick={generatePreview} className="gap-2"><Eye size={16} /> Preview</Button>
                <Button variant="neon" onClick={handleSend} disabled={sending || sent} className="gap-2">
                  {sending ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : sent ? <><CheckCircle2 size={16} /> Sent!</> : <><Send size={16} /> Send Email</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Recipients + Preview */}
        <div className="space-y-5">
          {/* Recipients */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Users size={16} /> Recipients</CardTitle>
              <CardDescription className="text-xs">Choose who receives this email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={recipientMode} onValueChange={v => setRecipientMode(v as "manual" | "event" | "table")}>
                <TabsList className="w-full">
                  <TabsTrigger value="manual" className="flex-1 text-xs">Manual</TabsTrigger>
                  <TabsTrigger value="event" className="flex-1 text-xs">By Event</TabsTrigger>
                  <TabsTrigger value="table" className="flex-1 text-xs">From Table</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="mt-3">
                  <Textarea rows={4} placeholder={"Enter emails (comma or newline separated)\ne.g. abc@gmail.com, xyz@gmail.com"} value={manualEmails} onChange={e => setManualEmails(e.target.value)} className="bg-background border-border text-xs resize-none" />
                  {manualEmails.trim() && (
                    <p className="text-xs text-muted-foreground mt-2">{manualEmails.split(/[,;\n]/).filter(e => e.trim()).length} recipient(s)</p>
                  )}
                </TabsContent>

                <TabsContent value="event" className="mt-3 space-y-3">
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="bg-background border-border text-xs"><SelectValue placeholder="Select event" /></SelectTrigger>
                    <SelectContent>{events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>

                  {participants.length > 0 && (
                    <>
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                        <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 bg-background border-border text-xs h-8" />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll}>Select All</Button>
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={deselectAll}>Deselect All</Button>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {filteredParticipants.map(p => {
                          const isSelected = selectedParticipants.some(s => s.email === p.email);
                          return (
                            <button key={p.email} onClick={() => toggleParticipant(p)} className={`w-full text-left flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50 border border-transparent"}`}>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                                {isSelected && <CheckCircle2 size={10} className="text-primary-foreground" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-foreground truncate">{p.name}</p>
                                <p className="text-muted-foreground truncate">{p.email}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">{selectedParticipants.length} of {participants.length} selected</p>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="table" className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Select participants from the table below, then come back here to send.</p>
                  <p className="text-sm text-foreground font-medium">{tableSelected.size} participant(s) selected</p>
                  {tableSelected.size > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Array.from(tableSelected).slice(0, 8).map(idx => {
                        const r = allRegistrations[Number(idx)];
                        return r ? (
                          <Badge key={idx} variant="secondary" className="text-xs gap-1 pr-1">
                            {r.leader_name}
                            <button onClick={() => setTableSelected(prev => { const n = new Set(prev); n.delete(idx); return n; })} className="hover:text-destructive"><X size={12} /></button>
                          </Badge>
                        ) : null;
                      })}
                      {tableSelected.size > 8 && <Badge variant="outline" className="text-xs">+{tableSelected.size - 8} more</Badge>}
                    </div>
                  )}
                  {tableSelected.size > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 mt-2" onClick={() => setTableSelected(new Set())}>Clear All</Button>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Selected Recipients Tags */}
          {recipientMode === "event" && selectedParticipants.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedParticipants.slice(0, 10).map(p => (
                <Badge key={p.email} variant="secondary" className="text-xs gap-1 pr-1">
                  {p.name}
                  <button onClick={() => toggleParticipant(p)} className="hover:text-destructive"><X size={12} /></button>
                </Badge>
              ))}
              {selectedParticipants.length > 10 && <Badge variant="outline" className="text-xs">+{selectedParticipants.length - 10} more</Badge>}
            </div>
          )}

          {/* Preview */}
          {previewHtml && (
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border border-border">
                  <iframe title="Email Preview" srcDoc={previewHtml} className="w-full h-[400px] bg-white" sandbox="" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* ─── Registered Participants Table ─── */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Table2 size={18} className="text-primary" />
              <CardTitle className="text-base">Registered Participants</CardTitle>
              <Badge variant="secondary" className="text-xs">{allRegistrations.length}</Badge>
              {tableSelected.size > 0 && (
                <Badge className="text-xs bg-primary/20 text-primary border-primary/30">{tableSelected.size} selected</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {tableSelected.size > 0 && (
                <Button variant="neon-outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => { setRecipientMode("table"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  <Send size={12} /> Email Selected
                </Button>
              )}
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input placeholder="Search name, email, event…" value={regSearch} onChange={e => setRegSearch(e.target.value)} className="pl-8 bg-background border-border text-xs h-9" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-muted-foreground/30 accent-[hsl(var(--primary))]"
                      checked={allRegistrations.length > 0 && tableSelected.size === allRegistrations.length}
                      onChange={e => {
                        if (e.target.checked) setTableSelected(new Set(allRegistrations.map((_, i) => String(i))));
                        else setTableSelected(new Set());
                      }}
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = allRegistrations.map((r, origIdx) => ({ ...r, origIdx })).filter(r => {
                    if (!regSearch.trim()) return true;
                    const q = regSearch.toLowerCase();
                    return r.leader_name.toLowerCase().includes(q) || r.leader_email.toLowerCase().includes(q) || r.event_name.toLowerCase().includes(q) || r.leader_phone.includes(q);
                  });
                  if (filtered.length === 0) return (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No registrations found</td></tr>
                  );
                  return filtered.map((r, i) => {
                    const key = String(r.origIdx);
                    const isChecked = tableSelected.has(key);
                    return (
                      <tr
                        key={`${r.leader_email}-${r.event_name}-${r.origIdx}`}
                        className={`border-b border-border last:border-0 transition-colors cursor-pointer ${isChecked ? "bg-primary/5" : "hover:bg-muted/30"}`}
                        onClick={() => setTableSelected(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; })}
                      >
                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded border-muted-foreground/30 accent-[hsl(var(--primary))]"
                            checked={isChecked}
                            onChange={() => setTableSelected(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; })}
                          />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                        <td className="px-4 py-3 text-foreground font-medium">{r.leader_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.leader_email}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.leader_phone}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{r.event_name}</Badge></td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmail;
