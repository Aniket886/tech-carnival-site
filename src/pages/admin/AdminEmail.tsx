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
import { Mail, Send, Eye, Users, Search, X, Loader2, CheckCircle2, Table2 } from "lucide-react";

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
  const [recipientMode, setRecipientMode] = useState<"manual" | "event">("manual");
  const [manualEmails, setManualEmails] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [participants, setParticipants] = useState<{ email: string; name: string }[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<{ email: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [allRegistrations, setAllRegistrations] = useState<{ leader_name: string; leader_email: string; leader_phone: string; event_name: string }[]>([]);
  const [regSearch, setRegSearch] = useState("");

  // load events + all registrations
  useEffect(() => {
    supabase.from("events").select("id,name").eq("is_active", true).order("name").then(({ data }) => {
      if (data) setEvents(data);
      // load registrations with event names
      supabase.from("registrations").select("leader_name,leader_email,leader_phone,event_id").order("created_at", { ascending: false }).then(({ data: regs }) => {
        if (regs && data) {
          const eventMap = new Map(data.map(e => [e.id, e.name]));
          setAllRegistrations(regs.map(r => ({
            leader_name: r.leader_name,
            leader_email: r.leader_email,
            leader_phone: r.leader_phone,
            event_name: eventMap.get(r.event_id) || "Unknown",
          })));
        }
      });
    });
  }, []);

  // load participants when event selected
  useEffect(() => {
    if (recipientMode !== "event" || !selectedEventId) { setParticipants([]); return; }
    supabase.from("registrations").select("leader_email,leader_name").eq("event_id", selectedEventId).then(({ data }) => {
      if (data) {
        const unique = Array.from(new Map(data.map(d => [d.leader_email, { email: d.leader_email, name: d.leader_name }])).values());
        setParticipants(unique);
      }
    });
  }, [selectedEventId, recipientMode]);

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

  const getRecipients = (): { email: string; name: string }[] => {
    if (recipientMode === "event") return selectedParticipants;
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
      const html = currentTemplate.buildHtml({ recipientName: r.name, customMessage: message, eventName });
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
                <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-1.5 block">Message</Label>
                <Textarea rows={6} placeholder="Write your message here…" value={message} onChange={e => setMessage(e.target.value)} className="bg-background border-border resize-none" />
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
              <Tabs value={recipientMode} onValueChange={v => setRecipientMode(v as "manual" | "event")}>
                <TabsList className="w-full">
                  <TabsTrigger value="manual" className="flex-1 text-xs">Manual</TabsTrigger>
                  <TabsTrigger value="event" className="flex-1 text-xs">By Event</TabsTrigger>
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
    </div>
  );
};

export default AdminEmail;
