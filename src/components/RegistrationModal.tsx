import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Plus, Trash2, Users, User, ChevronRight, ChevronLeft, QrCode, Clock } from "lucide-react";
import {
  validateName, validateEmail, validatePhone,
  validateTeamName, validateCollegeName, sanitizeInput, countErrors,
} from "@/lib/validators";

// ── Types ──
interface EventOption {
  id: string;
  name: string;
  icon: string | null;
  category: string;
  team_size_min: number;
  team_size_max: number;
}

interface PassedEventData {
  id: string;
  name: string;
  emoji: string;
  category: string;
  team_size_min: number;
  team_size_max: number;
}

interface TeamMember {
  name: string;
  email: string;
  phone: string;
}

interface FormData {
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  college_name: string;
  semester: string;
  team_name: string;
  members: TeamMember[];
  agreed: boolean;
}

interface FieldErrors {
  [key: string]: string;
}

interface RegistrationModalProps {
  eventData: PassedEventData | null;
  onClose: () => void;
}

const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

const STEP_LABELS = ["Details", "Payment", "Review"];

const emptyMember = (): TeamMember => ({ name: "", email: "", phone: "" });

const initialForm: FormData = {
  leader_name: "",
  leader_email: "",
  leader_phone: "",
  college_name: "",
  semester: "",
  team_name: "",
  members: [],
  agreed: false,
};

const RegistrationModal = ({ eventData, onClose }: RegistrationModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [event, setEvent] = useState<EventOption | null>(null);
  const [form, setForm] = useState<FormData>({ ...initialForm });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string; eventName: string } | null>(null);
  const [colleges, setColleges] = useState<{ id: string; name: string; short_name: string | null }[]>([]);

  useEffect(() => {
    supabase.from("colleges").select("id, name, short_name").eq("is_active", true).order("name")
      .then(({ data }) => { if (data) setColleges(data); });
  }, []);

  const isTeamEvent = event ? event.team_size_max > 1 : false;
  const isOpen = !!eventData;

  // Set event from passed data or fetch from Supabase as fallback
  useEffect(() => {
    if (!eventData) {
      setEvent(null);
      setForm({ ...initialForm });
      setStep(0);
      setErrors({});
      setTouched(new Set());
      setSuccessData(null);
      return;
    }
    // Use passed data directly — no async fetch needed
    const ev: EventOption = {
      id: eventData.id,
      name: eventData.name,
      icon: eventData.emoji || null,
      category: eventData.category,
      team_size_min: eventData.team_size_min,
      team_size_max: eventData.team_size_max,
    };
    setEvent(ev);
    if (ev.team_size_max > 1) {
      const minExtra = Math.max(0, ev.team_size_min - 1);
      setForm((prev) => ({
        ...prev,
        members: Array.from({ length: minExtra }, emptyMember),
      }));
    }
  }, [eventData]);

  const onBlur = (field: string) => {
    setTouched((prev) => new Set(prev).add(field));
    const errs = validateStep(step);
    setErrors((prev) => {
      const next = { ...prev };
      if (errs[field]) next[field] = errs[field];
      else delete next[field];
      return next;
    });
  };

  const fieldClass = (field: string) => {
    if (!touched.has(field)) return "";
    return errors[field] ? "border-destructive focus-visible:ring-destructive" : "border-green-500/50 focus-visible:ring-green-500/50";
  };

  const validateStep = useCallback(
    (s: number): FieldErrors => {
      const e: FieldErrors = {};
      if (s === 0) {
        const nameV = validateName(form.leader_name);
        if (!nameV.valid) e.leader_name = nameV.error!;
        const emailV = validateEmail(form.leader_email);
        if (!emailV.valid) e.leader_email = emailV.error!;
        const phoneV = validatePhone(form.leader_phone);
        if (!phoneV.valid) e.leader_phone = phoneV.error!;
        const collegeV = validateCollegeName(form.college_name);
        if (!collegeV.valid) e.college_name = collegeV.error!;
        if (isTeamEvent) {
          const teamV = validateTeamName(form.team_name);
          if (!teamV.valid) e.team_name = teamV.error!;
        }
        const allEmails = [form.leader_email.trim().toLowerCase()];
        form.members.forEach((m, i) => {
          const mnV = validateName(m.name);
          if (!mnV.valid) e[`member_${i}_name`] = mnV.error!;
          const meV = validateEmail(m.email);
          if (!meV.valid) e[`member_${i}_email`] = meV.error!;
          const mpV = validatePhone(m.phone);
          if (!mpV.valid) e[`member_${i}_phone`] = mpV.error!;
          const memberEmail = m.email.trim().toLowerCase();
          if (memberEmail && allEmails.includes(memberEmail)) {
            e[`member_${i}_email`] = "Duplicate email found in team members";
          }
          allEmails.push(memberEmail);
        });
      }
      if (s === 1) {
        // Payment step - no validation needed for now (coming soon)
      }
      if (s === 2) {
        if (!form.agreed) e.agreed = "You must agree to the terms";
      }
      return e;
    },
    [form, isTeamEvent]
  );

  const goNext = () => {
    const errs = validateStep(step);
    setErrors(errs);
    if (step === 0) {
      setTouched(new Set(Object.keys(errs).length > 0
        ? [...touched, ...["leader_name", "leader_email", "leader_phone", "college_name", ...(isTeamEvent ? ["team_name"] : [])]]
        : touched));
    }
    if (countErrors(errs) > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast({ title: `Please fix ${countErrors(errs)} error${countErrors(errs) > 1 ? "s" : ""} before continuing`, variant: "destructive" });
      return;
    }
    setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => s - 1);

  const addMember = () => {
    if (!event) return;
    if (form.members.length + 1 < event.team_size_max) {
      setForm((prev) => ({ ...prev, members: [...prev.members, emptyMember()] }));
    }
  };

  const removeMember = (idx: number) => {
    if (!event) return;
    const minExtra = Math.max(0, event.team_size_min - 1);
    if (form.members.length > minExtra) {
      setForm((prev) => ({ ...prev, members: prev.members.filter((_, i) => i !== idx) }));
    }
  };

  const updateMember = (idx: number, field: keyof TeamMember, value: string) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };

  const handleSubmit = async () => {
    const errs = validateStep(2);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!event) return;

    setLoading(true);

    try {
      const insertPromise = supabase
        .from("registrations")
        .insert([{
          event_id: event.id,
          leader_name: sanitizeInput(form.leader_name),
          leader_email: form.leader_email.trim().toLowerCase(),
          leader_phone: form.leader_phone.trim(),
          college_name: sanitizeInput(form.college_name),
          semester: form.semester || null,
          team_name: isTeamEvent ? sanitizeInput(form.team_name) : null,
          members: isTeamEvent && form.members.length > 0
            ? form.members.map((m) => ({ name: sanitizeInput(m.name), email: m.email.trim().toLowerCase(), phone: m.phone.trim() } as Record<string, string>))
            : null,
        }]);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 15000)
      );

      const result = await Promise.race([insertPromise, timeoutPromise]) as any;
      
      setLoading(false);

      if (result?.error) {
        const error = result.error;
        if (error.message?.includes("duplicate") || error.code === "23505") {
          setErrors({ leader_email: "This email is already registered for this event" });
          setStep(0);
        } else {
          toast({ title: "Registration failed", description: error.message, variant: "destructive" });
        }
      } else {
        setSuccessData({ id: crypto.randomUUID().slice(0, 8), eventName: event.name });
        supabase.functions.invoke("send-email", {
          body: {
            type: "registration_received",
            to: form.leader_email.trim(),
            leader_name: form.leader_name.trim(),
            team_name: isTeamEvent ? form.team_name.trim() : undefined,
            event_name: event.name,
          },
        }).catch(() => {});
      }
    } catch (err: any) {
      setLoading(false);
      toast({ title: "Registration failed", description: err?.message || "An unexpected error occurred. Please try again.", variant: "destructive" });
    }
  };

  const resetAndClose = () => {
    setForm({ ...initialForm });
    setStep(0);
    setErrors({});
    setTouched(new Set());
    setSuccessData(null);
    onClose();
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="text-xs text-destructive mt-1">{errors[field]}</p>
    ) : touched.has(field) ? (
      <p className="text-xs text-green-400 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Valid</p>
    ) : null;

  const stepVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  // Success state
  if (successData) {
    return (
      <Dialog open={true} onOpenChange={resetAndClose}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-gradient">
              Registration Successful! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              You're all set for Tech Carnival – 2K26
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registration ID</span>
                <span className="font-mono text-primary text-xs">{successData.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event</span>
                <span className="text-foreground font-medium">{successData.eventName}</span>
              </div>
              {form.team_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team</span>
                  <span className="text-foreground">{form.team_name}</span>
                </div>
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground">📧 You will receive a confirmation email shortly.</p>
            <Button onClick={resetAndClose} className="w-full">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetAndClose(); }}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-gradient">
            Register for {event?.icon} {event?.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {event && event.team_size_min === 1 && event.team_size_max === 1
              ? "👤 Solo participation"
              : event && event.team_size_min === 1 && event.team_size_max === 2
              ? "👥 Solo or Duo participation"
              : event && event.team_size_min === event.team_size_max
              ? `👥 Team of ${event.team_size_min} members`
              : event
              ? `👥 Team of ${event.team_size_min}–${event.team_size_max} members`
              : "Loading..."}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 my-4">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  i < step ? "bg-primary text-primary-foreground border-primary"
                    : i === step ? "bg-primary/20 text-primary border-primary"
                    : "bg-muted/30 text-muted-foreground border-border"
                }`}>
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-[10px] mt-1 ${i <= step ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`w-12 h-0.5 transition-colors ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Details */}
          {step === 0 && (
            <motion.div key="step-0" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="space-y-4">
                <p className="text-sm font-semibold text-muted-foreground border-b border-border pb-2">
                  {isTeamEvent ? "👤 Team Leader" : "👤 Participant"}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Full Name *</Label>
                    <Input placeholder="John Doe" value={form.leader_name} onChange={(e) => setForm((p) => ({ ...p, leader_name: e.target.value }))} onBlur={() => onBlur("leader_name")} maxLength={20} className={fieldClass("leader_name")} />
                    <FieldError field="leader_name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email *</Label>
                    <Input type="email" placeholder="john@example.com" value={form.leader_email} onChange={(e) => setForm((p) => ({ ...p, leader_email: e.target.value }))} onBlur={() => onBlur("leader_email")} maxLength={50} className={fieldClass("leader_email")} />
                    <FieldError field="leader_email" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Phone *</Label>
                    <Input placeholder="9876543210" value={form.leader_phone} onChange={(e) => setForm((p) => ({ ...p, leader_phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} onBlur={() => onBlur("leader_phone")} maxLength={10} className={fieldClass("leader_phone")} />
                    <FieldError field="leader_phone" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">College *</Label>
                    {colleges.length > 0 ? (
                      <>
                        <Select
                          value={colleges.some(c => c.name === form.college_name) ? form.college_name : form.college_name ? "__other" : ""}
                          onValueChange={(v) => {
                            if (v === "__other") {
                              setForm((p) => ({ ...p, college_name: "" }));
                            } else {
                              setForm((p) => ({ ...p, college_name: v }));
                              onBlur("college_name");
                            }
                          }}
                        >
                          <SelectTrigger className={fieldClass("college_name")}><SelectValue placeholder="Select college" /></SelectTrigger>
                          <SelectContent>
                            {colleges.map((c) => (
                              <SelectItem key={c.id} value={c.name}>
                                {c.name}{c.short_name ? ` (${c.short_name})` : ""}
                              </SelectItem>
                            ))}
                            <SelectItem value="__other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {!colleges.some(c => c.name === form.college_name) && (
                          <Input placeholder="Enter college name" value={form.college_name} onChange={(e) => setForm((p) => ({ ...p, college_name: e.target.value }))} onBlur={() => onBlur("college_name")} maxLength={100} className={`mt-1.5 ${fieldClass("college_name")}`} />
                        )}
                      </>
                    ) : (
                      <Input placeholder="College name" value={form.college_name} onChange={(e) => setForm((p) => ({ ...p, college_name: e.target.value }))} onBlur={() => onBlur("college_name")} maxLength={100} className={fieldClass("college_name")} />
                    )}
                    <FieldError field="college_name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Semester</Label>
                    <Select value={form.semester} onValueChange={(v) => setForm((p) => ({ ...p, semester: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                      <SelectContent>
                        {SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s} Semester</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {isTeamEvent && (
                    <div className="space-y-1">
                      <Label className="text-xs">Team Name *</Label>
                      <Input placeholder="Team Alpha" value={form.team_name} onChange={(e) => setForm((p) => ({ ...p, team_name: e.target.value }))} onBlur={() => onBlur("team_name")} maxLength={30} className={fieldClass("team_name")} />
                      <FieldError field="team_name" />
                    </div>
                  )}
                </div>

                {/* Team members */}
                {isTeamEvent && event && (
                  <>
                    <div className="flex items-center justify-between border-b border-border pb-2 mt-4">
                      <p className="text-sm font-semibold text-muted-foreground">
                        👥 Team Members ({form.members.length + 1}/{event.team_size_max})
                      </p>
                      {form.members.length + 1 < event.team_size_max && (
                        <Button type="button" variant="outline" size="sm" onClick={addMember} className="gap-1 text-primary border-primary/30">
                          <Plus className="h-3.5 w-3.5" /> Add
                        </Button>
                      )}
                    </div>
                    {form.members.map((m, i) => (
                      <div key={i} className="relative rounded-lg border border-border bg-muted/10 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-foreground">Member {i + 2}</p>
                          {form.members.length > Math.max(0, event.team_size_min - 1) && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeMember(i)} className="text-destructive hover:text-destructive h-6 px-1.5">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Input placeholder="Name" value={m.name} onChange={(e) => updateMember(i, "name", e.target.value)} maxLength={100} className="text-sm" />
                            <FieldError field={`member_${i}_name`} />
                          </div>
                          <div className="space-y-1">
                            <Input type="email" placeholder="Email" value={m.email} onChange={(e) => updateMember(i, "email", e.target.value)} maxLength={255} className="text-sm" />
                            <FieldError field={`member_${i}_email`} />
                          </div>
                          <div className="space-y-1">
                            <Input placeholder="Phone" value={m.phone} onChange={(e) => updateMember(i, "phone", e.target.value)} maxLength={15} className="text-sm" />
                            <FieldError field={`member_${i}_phone`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <motion.div animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
                  <Button onClick={goNext} className="neon-glow gap-2">
                    Review <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <motion.div key="step-1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="space-y-6">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <QrCode className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Payment Gateway</h3>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Coming Soon</span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    QR code payment will be available here shortly. For now, you can complete your registration and pay later.
                  </p>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    Free Registration (for now)
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={goBack} className="gap-2">
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={goNext} className="neon-glow gap-2">
                  Review <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <motion.div key="step-2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/10 p-3">
                  <p className="text-xs text-muted-foreground mb-1">{isTeamEvent ? "Team Leader" : "Participant"}</p>
                  <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span className="text-foreground">{form.leader_name}</span>
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground text-xs">{form.leader_email}</span>
                    <span className="text-muted-foreground">Phone</span>
                    <span className="text-foreground">{form.leader_phone}</span>
                    <span className="text-muted-foreground">College</span>
                    <span className="text-foreground">{form.college_name}</span>
                    {form.semester && (
                      <>
                        <span className="text-muted-foreground">Semester</span>
                        <span className="text-foreground">{form.semester}</span>
                      </>
                    )}
                  </div>
                </div>

                {isTeamEvent && (
                  <div className="rounded-lg border border-border bg-muted/10 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Team</p>
                    <p className="font-semibold text-foreground mb-2 text-sm">{form.team_name}</p>
                    {form.members.map((m, i) => (
                      <div key={i} className="text-sm border-t border-border pt-1.5 mt-1.5 grid grid-cols-2 gap-y-1">
                        <span className="text-muted-foreground">Member {i + 2}</span>
                        <span className="text-foreground">{m.name}</span>
                        <span className="text-muted-foreground">Email</span>
                        <span className="text-foreground text-xs">{m.email}</span>
                        <span className="text-muted-foreground">Phone</span>
                        <span className="text-foreground">{m.phone}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-lg border border-border bg-muted/10 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Payment</p>
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs">Free (Payment coming soon)</Badge>
                </div>

                <div className="flex items-start gap-3 mt-3">
                  <Checkbox id="terms" checked={form.agreed} onCheckedChange={(v) => setForm((p) => ({ ...p, agreed: v === true }))} />
                  <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                    I agree to the event rules, terms & conditions, and confirm all information provided is accurate.
                  </Label>
                </div>
                <FieldError field="agreed" />
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={goBack} className="gap-2">
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={handleSubmit} className="neon-glow" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationModal;
