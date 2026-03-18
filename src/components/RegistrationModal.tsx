import { useState, useEffect, useCallback, useRef } from "react";
import { FileText } from "lucide-react";
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
import CollegePicker from "@/components/registration/CollegePicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Plus, Trash2, Users, User, ChevronRight, ChevronLeft, Clock, Upload, X, AlertTriangle } from "lucide-react";
import {
  validateName, validateEmail, validatePhone,
  validateTeamName, validateCollegeName, sanitizeInput, countErrors,
} from "@/lib/validators";
import OtherCollegeDialog from "@/components/registration/OtherCollegeDialog";

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
  price: number;
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
  amount_paid: string;
  utr_number: string;
  transaction_id: string;
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
  amount_paid: "",
  utr_number: "",
  transaction_id: "",
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
  const [otherCollegeOpen, setOtherCollegeOpen] = useState(false);
  const [paymentScreenshots, setPaymentScreenshots] = useState<File[]>([]);
  const [eventPrices, setEventPrices] = useState<Record<string, number>>({});

  // Refs for abandoned draft capture
  const completedRef = useRef(false);
  const formRef = useRef(form);
  const eventRef = useRef(event);
  const isTeamEventRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { formRef.current = form; }, [form]);
  useEffect(() => { eventRef.current = event; }, [event]);
  useEffect(() => { isTeamEventRef.current = event ? event.team_size_max > 1 : false; }, [event]);

  const fetchColleges = async () => {
    const { data } = await supabase.from("colleges").select("id, name, short_name, approval_status").eq("is_active", true).order("name");
    if (data) setColleges(data.filter((c: any) => c.approval_status === "approved"));
  };

  useEffect(() => {
    fetchColleges();
    // Fetch event prices from DB
    supabase.from("events").select("name, price").eq("is_active", true).then(({ data }) => {
      if (data) {
        const prices: Record<string, number> = {};
        data.forEach((e: any) => { if (e.price > 0) prices[e.name] = e.price; });
        setEventPrices(prices);
      }
    });
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
    // Pre-select event in payment dropdown using event name
    const eventName = ev.name;
    const preselect = eventName;
    if (ev.team_size_max > 1) {
      const minExtra = Math.max(0, ev.team_size_min - 1);
      setForm((prev) => ({
        ...prev,
        amount_paid: preselect,
        members: Array.from({ length: minExtra }, emptyMember),
      }));
    } else {
      setForm((prev) => ({ ...prev, amount_paid: preselect }));
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
        if (!form.amount_paid) e.amount_paid = "Please select an event";
        if (!form.utr_number.trim()) e.utr_number = "UTR Number is required";
        else if (form.utr_number.trim().length < 6) e.utr_number = "UTR number must be at least 6 characters";
        if (!form.transaction_id.trim()) e.transaction_id = "Transaction ID is required";
        else if (form.transaction_id.trim().length < 4) e.transaction_id = "Transaction ID must be at least 4 characters";
        if (paymentScreenshots.length === 0) e.payment_screenshot = "Please upload at least one payment screenshot";
      }
      if (s === 2) {
        if (!form.agreed) e.agreed = "You must agree to the terms";
      }
      return e;
    },
    [form, isTeamEvent, paymentScreenshots]
  );

  const [checkingPayment, setCheckingPayment] = useState(false);

  const saveDraftToDb = async () => {
    if (!event || !form.leader_email.trim()) return;
    try {
      await supabase.from("registration_drafts" as any).upsert({
        event_id: event.id,
        event_name: event.name || "",
        leader_name: form.leader_name.trim(),
        leader_email: form.leader_email.trim().toLowerCase(),
        leader_phone: form.leader_phone.trim(),
        college_name: form.college_name.trim(),
        semester: form.semester || null,
        team_name: isTeamEvent ? form.team_name.trim() || null : null,
        members: isTeamEvent && form.members.length > 0 ? form.members : null,
        status: "abandoned",
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "event_id,leader_email" } as any);
    } catch {}
  };

  const markDraftCompleted = async () => {
    if (!event || !form.leader_email.trim()) return;
    try {
      await supabase.from("registration_drafts" as any)
        .update({ status: "completed", updated_at: new Date().toISOString() } as any)
        .eq("event_id", event.id)
        .eq("leader_email", form.leader_email.trim().toLowerCase());
    } catch {}
  };

  const goNext = async () => {
    const errs = validateStep(step);
    setErrors(errs);
    if (step === 0) {
      setTouched(new Set(Object.keys(errs).length > 0
        ? [...touched, ...["leader_name", "leader_email", "leader_phone", "college_name", ...(isTeamEvent ? ["team_name"] : [])]]
        : touched));
    }
    if (step === 1) {
      setTouched(new Set([...touched, "amount_paid", "utr_number", "transaction_id", "payment_screenshot"]));
    }
    if (countErrors(errs) > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast({ title: `Please fix ${countErrors(errs)} error${countErrors(errs) > 1 ? "s" : ""} before continuing`, variant: "destructive" });
      return;
    }
    // Save draft when moving from Details (step 0) to Payment (step 1)
    if (step === 0) {
      saveDraftToDb();
    }
    // Duplicate payment check on step 1
    if (step === 1) {
      setCheckingPayment(true);
      try {
        const utr = form.utr_number.trim();
        const txn = form.transaction_id.trim();
        const { data: dupes } = await supabase
          .from("registrations")
          .select("id, utr_number, transaction_id")
          .or(`utr_number.eq.${utr},transaction_id.eq.${txn}`);
        if (dupes && dupes.length > 0) {
          const dupErrs: FieldErrors = {};
          if (dupes.some((d) => d.utr_number === utr)) dupErrs.utr_number = "This UTR number has already been used";
          if (dupes.some((d) => d.transaction_id === txn)) dupErrs.transaction_id = "This Transaction ID has already been used";
          setErrors(dupErrs);
          setCheckingPayment(false);
          return;
        }
      } catch {
        toast({ title: "Could not verify payment details. Please try again.", variant: "destructive" });
        setCheckingPayment(false);
        return;
      }
      setCheckingPayment(false);
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
      // Upload payment screenshots (up to 3)
      let screenshotUrl: string | null = null;
      if (paymentScreenshots.length > 0) {
        const regIdForFile = crypto.randomUUID();
        const urls: string[] = [];
        for (let i = 0; i < paymentScreenshots.length; i++) {
          const file = paymentScreenshots[i];
          const ext = file.name.split(".").pop() || "jpg";
          const filePath = `${regIdForFile}_${i + 1}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from("payment-screenshots").upload(filePath, file);
          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from("payment-screenshots").getPublicUrl(filePath);
            urls.push(urlData.publicUrl);
          }
        }
        screenshotUrl = urls.length > 0 ? JSON.stringify(urls) : null;
      }

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
          amount_paid: form.amount_paid && eventPrices[form.amount_paid] ? String(eventPrices[form.amount_paid]) : form.amount_paid,
          utr_number: form.utr_number.trim(),
          transaction_id: form.transaction_id.trim(),
          payment_screenshot_url: screenshotUrl,
        } as any]);

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
        const regId = result?.data?.[0]?.id || crypto.randomUUID().slice(0, 8);
        markDraftCompleted();
        setSuccessData({ id: regId, eventName: event.name });
        supabase.functions.invoke("send-email", {
          body: {
            type: "registration_received",
            to: form.leader_email.trim(),
            leader_name: form.leader_name.trim(),
            team_name: isTeamEvent ? form.team_name.trim() : undefined,
            registration_id: regId,
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
    setPaymentScreenshots([]);
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
                      <CollegePicker
                          colleges={colleges}
                          value={form.college_name}
                          onChange={(name) => {
                            setForm((p) => ({ ...p, college_name: name }));
                            setTouched((prev) => new Set(prev).add("college_name"));
                            // Clear error immediately since we know the value is valid
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.college_name;
                              return next;
                            });
                          }}
                          onOtherClick={() => setOtherCollegeOpen(true)}
                          className={fieldClass("college_name")}
                        />
                        <OtherCollegeDialog
                          open={otherCollegeOpen}
                          onClose={() => setOtherCollegeOpen(false)}
                          onCollegeSaved={(name) => {
                            setForm((p) => ({ ...p, college_name: name }));
                            fetchColleges();
                            setTouched((prev) => new Set(prev).add("college_name"));
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.college_name;
                              return next;
                            });
                          }}
                        />
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
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <motion.div key="step-1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="space-y-5">
                <p className="text-sm font-semibold text-muted-foreground border-b border-border pb-2">💳 Payment Details</p>
                
                <p className="text-xs text-muted-foreground text-center">Complete your payment and fill in the details below.</p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Select Event & Amount <span className="text-destructive">*</span></Label>
                    <Select
                      value={form.amount_paid || undefined}
                      onValueChange={(v) => {
                        setForm((p) => ({ ...p, amount_paid: v }));
                        setErrors((prev) => { const n = { ...prev }; delete n.amount_paid; return n; });
                        setTouched((prev) => new Set([...prev, "amount_paid"]));
                      }}
                    >
                      <SelectTrigger className={fieldClass("amount_paid")}>
                        <SelectValue placeholder="-- Select Event --" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(eventPrices).map(([name, price]) => (
                          <SelectItem key={name} value={name}>{name} — ₹{price}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError field="amount_paid" />
                  </div>
                  {/* Amount to Pay - auto display */}
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center" style={{ boxShadow: "0 0 15px hsl(var(--neon-blue) / 0.15)" }}>
                    <p className="text-[10px] text-muted-foreground mb-0.5">Amount to Pay</p>
                    <p className="text-xl font-bold text-primary">
                      ₹{form.amount_paid && eventPrices[form.amount_paid] ? eventPrices[form.amount_paid] : 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">UTR Number <span className="text-destructive">*</span></Label>
                    <Input placeholder="Enter UTR / Reference Number" value={form.utr_number} onChange={(e) => setForm((p) => ({ ...p, utr_number: e.target.value }))} onBlur={() => onBlur("utr_number")} maxLength={50} className={fieldClass("utr_number")} />
                    <FieldError field="utr_number" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Transaction ID <span className="text-destructive">*</span></Label>
                    <Input placeholder="Enter Transaction ID" value={form.transaction_id} onChange={(e) => setForm((p) => ({ ...p, transaction_id: e.target.value }))} onBlur={() => onBlur("transaction_id")} maxLength={50} className={fieldClass("transaction_id")} />
                    <FieldError field="transaction_id" />
                  </div>

                  {/* Screenshot Upload — up to 3 */}
                  <div className="space-y-1">
                    <Label className="text-xs">Payment Screenshots <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal">(up to 3)</span></Label>
                    {touched.has("payment_screenshot") && errors.payment_screenshot && (
                      <p className="text-xs text-destructive">{errors.payment_screenshot}</p>
                    )}
                    {paymentScreenshots.length > 0 && (
                      <div className="space-y-1.5">
                        {paymentScreenshots.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-3 rounded-lg border border-border bg-muted/10 p-2">
                            <div className="w-10 h-10 rounded overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                              {file.type.startsWith("image/") ? (
                                <img src={URL.createObjectURL(file)} alt={`Screenshot ${idx+1}`} className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-foreground truncate">{file.name}</p>
                              <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => {
                              const updated = paymentScreenshots.filter((_, i) => i !== idx);
                              setPaymentScreenshots(updated);
                              if (updated.length === 0) setErrors((e) => ({ ...e, payment_screenshot: "Please upload at least one payment screenshot" }));
                            }} className="text-destructive hover:text-destructive h-7 px-1.5">
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {paymentScreenshots.length < 3 && (
                      <label className={`flex flex-col items-center gap-1.5 cursor-pointer rounded-lg border border-dashed ${touched.has("payment_screenshot") && errors.payment_screenshot && paymentScreenshots.length === 0 ? "border-destructive" : "border-border hover:border-primary/50"} bg-muted/10 p-3 transition-colors`}>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground text-center">
                          {paymentScreenshots.length === 0 ? "Click to upload screenshot" : `Add another (${paymentScreenshots.length}/3)`}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70">PNG, JPG, PDF, HEIC — Max 5 MB each</span>
                        <input type="file" accept="image/*,.pdf,.heic,.heif" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) { toast({ title: "File size must be under 5 MB", variant: "destructive" }); return; }
                            const allowedTypes = ["image/", "application/pdf"];
                            const allowedExts = [".heic", ".heif"];
                            const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
                            const isAllowed = allowedTypes.some((t) => file.type.startsWith(t)) || allowedExts.includes(ext);
                            if (!isAllowed) { toast({ title: "Unsupported file format", variant: "destructive" }); return; }
                            setPaymentScreenshots((prev) => [...prev, file]);
                            setErrors((prev) => { const n = { ...prev }; delete n.payment_screenshot; return n; });
                            setTouched((prev) => new Set([...prev, "payment_screenshot"]));
                          }
                          e.target.value = "";
                        }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={goBack} className="gap-2">
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <motion.div animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
                  <Button onClick={goNext} className="neon-glow gap-2" disabled={checkingPayment || !form.amount_paid || !form.utr_number.trim() || !form.transaction_id.trim() || paymentScreenshots.length === 0}>
                    {checkingPayment ? "Verifying..." : "Review"} <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.div>
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
                  <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                    <span className="text-muted-foreground">Event</span>
                    <span className="text-foreground">{form.amount_paid}</span>
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="text-foreground">₹{eventPrices[form.amount_paid] || 0}</span>
                    <span className="text-muted-foreground">UTR Number</span>
                    <span className="text-foreground font-mono text-xs">{form.utr_number}</span>
                    <span className="text-muted-foreground">Transaction ID</span>
                    <span className="text-foreground font-mono text-xs">{form.transaction_id}</span>
                  </div>
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
