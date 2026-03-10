import { useState, useEffect, useMemo, useRef, useCallback } from "react";

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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronRight, ChevronLeft, Users, User, Plus, Trash2, PartyPopper, X, AlertTriangle, Upload, ImageIcon, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Tables } from "@/integrations/supabase/types";
import {
  validateName,
  validateEmail,
  validatePhone,
  validateTeamName,
  validateCollegeName,
  sanitizeInput,
  checkDuplicateEmails,
} from "@/lib/validators";
import OtherCollegeDialog from "@/components/registration/OtherCollegeDialog";
import CollegePicker from "@/components/registration/CollegePicker";

type EventRow = Tables<"events">;

interface RegisterSectionProps {
  selectedEvent?: string;
}

interface TeamMember {
  name: string;
  email: string;
  phone: string;
}

interface FormData {
  eventId: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  collegeName: string;
  semester: string;
  teamName: string;
  members: TeamMember[];
  agreedTerms: boolean;
  amountPaid: string;
  utrNumber: string;
  transactionId: string;
}

const initialForm: FormData = {
  eventId: "",
  leaderName: "",
  leaderEmail: "",
  leaderPhone: "",
  collegeName: "",
  semester: "",
  teamName: "",
  members: [],
  agreedTerms: false,
  amountPaid: "",
  utrNumber: "",
  transactionId: "",
};

const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

const EVENT_PRICES: Record<string, number> = {
  "Battle Ground": 400,
  "Brain Quest": 200,
  "Code Compass": 200,
  "Dance Mania": 500,
  "Hack Momentum": 1000,
  "Myth Busters": 200,
  "Pixel Perfect (Poster Presentation)": 200,
  "Scitopia (Skit Play)": 500,
};

const categoryLabels: Record<string, string> = {
  technical: "💻 Technical Events",
  gaming: "🎮 Gaming Events",
  cultural: "🎭 Cultural Events",
};

const steps = ["Select Event", "Details", "Payment", "Review"];

const RegisterSection = ({ selectedEvent }: RegisterSectionProps) => {
  const [form, setForm] = useState<FormData>(initialForm);
  const [step, setStep] = useState(0);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [successData, setSuccessData] = useState<{ id: string; eventName: string } | null>(null);
  const [shakeSubmit, setShakeSubmit] = useState(false);
  const [colleges, setColleges] = useState<{ id: string; name: string; short_name: string | null }[]>([]);
  const [otherCollegeOpen, setOtherCollegeOpen] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<{ upi_id: string; upi_name: string; instructions: string; qr_url: string }>({ upi_id: "", upi_name: "", instructions: "", qr_url: "" });
  const [utrStatus, setUtrStatus] = useState<"idle" | "checking" | "valid" | "duplicate">("idle");
  const [txnStatus, setTxnStatus] = useState<"idle" | "checking" | "valid" | "duplicate">("idle");
  const [emailDupStatus, setEmailDupStatus] = useState<"idle" | "checking" | "clear" | "duplicate">("idle");
  const [phoneDupStatus, setPhoneDupStatus] = useState<"idle" | "checking" | "clear" | "duplicate">("idle");
  const utrTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const txnTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const emailDupTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const phoneDupTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const checkDuplicateField = useCallback(async (field: "utr_number" | "transaction_id", value: string, setStatus: (s: "idle" | "checking" | "valid" | "duplicate") => void) => {
    const trimmed = value.trim();
    if (!trimmed) { setStatus("idle"); return; }
    setStatus("checking");
    try {
      const { data } = await supabase
        .from("registrations")
        .select("id")
        .eq(field, trimmed)
        .limit(1);
      setStatus(data && data.length > 0 ? "duplicate" : "valid");
    } catch {
      setStatus("idle");
    }
  }, []);

  // Live duplicate registration check by email for the selected event
  const checkDuplicateRegistration = useCallback(async (
    field: "leader_email" | "leader_phone",
    value: string,
    eventId: string,
    setStatus: (s: "idle" | "checking" | "clear" | "duplicate") => void
  ) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || !eventId) { setStatus("idle"); return; }
    // Basic validation before checking
    if (field === "leader_email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setStatus("idle"); return; }
    if (field === "leader_phone" && !/^[6-9]\d{9}$/.test(trimmed)) { setStatus("idle"); return; }
    setStatus("checking");
    try {
      const { data, error } = await supabase.rpc("check_registration_duplicate", {
        _event_id: eventId,
        _field: field,
        _value: trimmed,
      });
      if (error) { setStatus("idle"); return; }
      setStatus(data === true ? "duplicate" : "clear");
    } catch {
      setStatus("idle");
    }
  }, []);

  const handleUtrChange = (v: string) => {
    setForm((f) => ({ ...f, utrNumber: v }));
    setErrors((e) => { const n = { ...e }; delete n.utrNumber; return n; });
    clearTimeout(utrTimerRef.current);
    if (!v.trim()) { setUtrStatus("idle"); return; }
    utrTimerRef.current = setTimeout(() => checkDuplicateField("utr_number", v, setUtrStatus), 500);
  };

  const handleTxnChange = (v: string) => {
    setForm((f) => ({ ...f, transactionId: v }));
    setErrors((e) => { const n = { ...e }; delete n.transactionId; return n; });
    clearTimeout(txnTimerRef.current);
    if (!v.trim()) { setTxnStatus("idle"); return; }
    txnTimerRef.current = setTimeout(() => checkDuplicateField("transaction_id", v, setTxnStatus), 500);
  };

  // Reset duplicate statuses when event changes
  useEffect(() => {
    setEmailDupStatus("idle");
    setPhoneDupStatus("idle");
  }, [form.eventId]);

  // Debounced email duplicate check
  useEffect(() => {
    clearTimeout(emailDupTimerRef.current);
    const email = form.leaderEmail.trim().toLowerCase();
    if (!email || !form.eventId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailDupStatus("idle"); return; }
    emailDupTimerRef.current = setTimeout(() => checkDuplicateRegistration("leader_email", email, form.eventId, setEmailDupStatus), 600);
    return () => clearTimeout(emailDupTimerRef.current);
  }, [form.leaderEmail, form.eventId, checkDuplicateRegistration]);

  // Debounced phone duplicate check
  useEffect(() => {
    clearTimeout(phoneDupTimerRef.current);
    const phone = form.leaderPhone.trim();
    if (!phone || !form.eventId || !/^[6-9]\d{9}$/.test(phone)) { setPhoneDupStatus("idle"); return; }
    phoneDupTimerRef.current = setTimeout(() => checkDuplicateRegistration("leader_phone", phone, form.eventId, setPhoneDupStatus), 600);
    return () => clearTimeout(phoneDupTimerRef.current);
  }, [form.leaderPhone, form.eventId, checkDuplicateRegistration]);

  const fetchColleges = async () => {
    const { data } = await supabase.from("colleges").select("id, name, short_name, approval_status").eq("is_active", true).order("name");
    if (data) setColleges(data.filter((c: any) => c.approval_status === "approved"));
  };

  useEffect(() => { fetchColleges(); }, []);

  // Fetch payment instructions from admin_settings
  useEffect(() => {
    supabase
      .from("admin_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["payment_upi_id", "payment_upi_name", "payment_instructions", "payment_qr_url"])
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((r) => (map[r.setting_key] = r.setting_value));
          setPaymentSettings({
            upi_id: map.payment_upi_id || "",
            upi_name: map.payment_upi_name || "",
            instructions: map.payment_instructions || "",
            qr_url: map.payment_qr_url || "",
          });
        }
      });
  }, []);

  useEffect(() => {
    supabase
      .from("events")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("name")
      .then(({ data }) => {
        if (data) setEvents(data);
      });
  }, []);

  useEffect(() => {
    if (selectedEvent && events.length) {
      const match = events.find((e) => e.name === selectedEvent);
      if (match) {
        setForm((f) => ({ ...f, eventId: match.id }));
        setStep(0);
      }
    }
  }, [selectedEvent, events]);

  const selectedEventData = useMemo(
    () => events.find((e) => e.id === form.eventId) || null,
    [events, form.eventId]
  );

  const isSolo = selectedEventData
    ? (selectedEventData.team_size_max || 1) === 1
    : false;

  const minMembers = selectedEventData ? Math.max((selectedEventData.team_size_min || 1) - 1, 0) : 0;
  const maxMembers = selectedEventData ? Math.max((selectedEventData.team_size_max || 1) - 1, 0) : 0;

  const grouped = useMemo(() => {
    const g: Record<string, EventRow[]> = {};
    events.forEach((e) => {
      if (!g[e.category]) g[e.category] = [];
      g[e.category].push(e);
    });
    return g;
  }, [events]);

  const handleBlur = (fieldId: string) => {
    setTouched((t) => ({ ...t, [fieldId]: true }));
    const errs = { ...errors };
    validateField(fieldId, errs);
    setErrors(errs);
  };

  const validateField = (fieldId: string, errs: Record<string, string>) => {
    delete errs[fieldId];
    switch (fieldId) {
      case "leaderName": { const r = validateName(form.leaderName); if (!r.valid) errs.leaderName = r.error!; break; }
      case "leaderEmail": { const r = validateEmail(form.leaderEmail); if (!r.valid) errs.leaderEmail = r.error!; break; }
      case "leaderPhone": { const r = validatePhone(form.leaderPhone); if (!r.valid) errs.leaderPhone = r.error!; break; }
      case "collegeName": { const r = validateCollegeName(form.collegeName); if (!r.valid) errs.collegeName = r.error!; break; }
      case "teamName": { if (!isSolo) { const r = validateTeamName(form.teamName); if (!r.valid) errs.teamName = r.error!; } break; }
      default: {
        const memberMatch = fieldId.match(/^member_(\d+)_(name|email|phone)$/);
        if (memberMatch) {
          const idx = parseInt(memberMatch[1]);
          const field = memberMatch[2];
          const m = form.members[idx];
          if (m) {
            if (field === "name") { const r = validateName(m.name); if (!r.valid) errs[fieldId] = r.error!; }
            else if (field === "email") { const r = validateEmail(m.email); if (!r.valid) errs[fieldId] = r.error!; }
            else if (field === "phone") { const r = validatePhone(m.phone); if (!r.valid) errs[fieldId] = r.error!; }
          }
        }
      }
    }
  };

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 0) { if (!form.eventId) errs.eventId = "Please select an event"; }
    if (s === 1) {
      const nameV = validateName(form.leaderName); if (!nameV.valid) errs.leaderName = nameV.error!;
      const emailV = validateEmail(form.leaderEmail); if (!emailV.valid) errs.leaderEmail = emailV.error!;
      else if (emailDupStatus === "duplicate") errs.leaderEmail = "This email is already registered for this event";
      const phoneV = validatePhone(form.leaderPhone); if (!phoneV.valid) errs.leaderPhone = phoneV.error!;
      else if (phoneDupStatus === "duplicate") errs.leaderPhone = "This phone number is already registered for this event";
      const collegeV = validateCollegeName(form.collegeName); if (!collegeV.valid) errs.collegeName = collegeV.error!;
      if (!form.semester) errs.semester = "Select your semester";
      if (!isSolo) {
        const teamV = validateTeamName(form.teamName); if (!teamV.valid) errs.teamName = teamV.error!;
        if (form.members.length < minMembers) errs.members = `Minimum ${minMembers + 1} total members required (including you)`;
        form.members.forEach((m, i) => {
          const nv = validateName(m.name); if (!nv.valid) errs[`member_${i}_name`] = nv.error!;
          const ev = validateEmail(m.email); if (!ev.valid) errs[`member_${i}_email`] = ev.error!;
          const pv = validatePhone(m.phone); if (!pv.valid) errs[`member_${i}_phone`] = pv.error!;
        });
        const dupErr = checkDuplicateEmails(form.leaderEmail, form.members);
        if (dupErr) errs.leaderEmail = dupErr;
      }
    }
    if (s === 2) {
      if (!form.amountPaid) errs.amountPaid = "Please select an event";
      if (!form.utrNumber.trim()) errs.utrNumber = "Enter your UTR number";
      else if (utrStatus === "duplicate") errs.utrNumber = "This UTR number has already been used";
      if (!form.transactionId.trim()) errs.transactionId = "Enter your transaction ID";
      else if (txnStatus === "duplicate") errs.transactionId = "This Transaction ID has already been used";
      if (!paymentScreenshot) errs.paymentScreenshot = "Please upload your payment screenshot";
    }
    if (s === 3) { if (!form.agreedTerms) errs.terms = "You must accept the terms"; }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error(`Please fix ${Object.keys(errs).length} error(s) before continuing`);
      return false;
    }
    return true;
  };

  const [checkingPayment, setCheckingPayment] = useState(false);

  const next = async () => {
    // Mark all current step fields as touched so errors display
    if (step === 1) {
      const fields: Record<string, boolean> = { leaderName: true, leaderEmail: true, leaderPhone: true, collegeName: true, semester: true };
      if (!isSolo) {
        fields.teamName = true;
        form.members.forEach((_, i) => { fields[`member_${i}_name`] = true; fields[`member_${i}_email`] = true; fields[`member_${i}_phone`] = true; });
      }
      setTouched(t => ({ ...t, ...fields }));
    } else if (step === 2) {
      setTouched(t => ({ ...t, amountPaid: true, utrNumber: true, transactionId: true, paymentScreenshot: true }));
    }
    if (!validateStep(step)) {
      setShakeSubmit(true);
      setTimeout(() => setShakeSubmit(false), 500);
      return;
    }
    if (step === 2) {
      setCheckingPayment(true);
      try {
        const utr = form.utrNumber.trim();
        const txn = form.transactionId.trim();
        const { data: dupes } = await supabase
          .from("registrations")
          .select("id, utr_number, transaction_id")
          .or(`utr_number.eq.${utr},transaction_id.eq.${txn}`);
        if (dupes && dupes.length > 0) {
          const errs: Record<string, string> = {};
          if (dupes.some((d) => d.utr_number === utr)) errs.utrNumber = "This UTR number has already been used";
          if (dupes.some((d) => d.transaction_id === txn)) errs.transactionId = "This Transaction ID has already been used";
          setErrors(errs);
          setCheckingPayment(false);
          return;
        }
      } catch {
        toast.error("Could not verify payment details. Please try again.");
        setCheckingPayment(false);
        return;
      }
      setCheckingPayment(false);
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const addMember = () => { if (form.members.length < maxMembers) setForm((f) => ({ ...f, members: [...f.members, { name: "", email: "", phone: "" }] })); };
  const removeMember = (idx: number) => { setForm((f) => ({ ...f, members: f.members.filter((_, i) => i !== idx) })); };
  const updateMember = (idx: number, field: keyof TeamMember, value: string) => {
    setForm((f) => ({ ...f, members: f.members.map((m, i) => (i === idx ? { ...m, [field]: value } : m)) }));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) { setShakeSubmit(true); setTimeout(() => setShakeSubmit(false), 500); return; }
    setLoading(true);
    try {
      const leaderEmail = sanitizeInput(form.leaderEmail).toLowerCase();
      const leaderPhone = form.leaderPhone.replace(/\s/g, "");
      // Check duplicate email via RPC
      const { data: emailDup } = await supabase.rpc("check_registration_duplicate", { _event_id: form.eventId, _field: "leader_email", _value: leaderEmail });
      if (emailDup === true) { setErrors({ leaderEmail: "This email is already registered for this event" }); setStep(1); setLoading(false); return; }
      // Check duplicate phone via RPC
      const { data: phoneDup } = await supabase.rpc("check_registration_duplicate", { _event_id: form.eventId, _field: "leader_phone", _value: leaderPhone });
      if (phoneDup === true) { setErrors({ leaderPhone: "This phone number is already registered for this event" }); setStep(1); setLoading(false); return; }
      const utr = form.utrNumber.trim();
      const txn = form.transactionId.trim();
      const { data: dupes } = await supabase.from("registrations").select("id, utr_number, transaction_id").or(`utr_number.eq.${utr},transaction_id.eq.${txn}`);
      if (dupes && dupes.length > 0) {
        const errs: Record<string, string> = {};
        if (dupes.some((d) => d.utr_number === utr)) errs.utrNumber = "This UTR number has already been used";
        if (dupes.some((d) => d.transaction_id === txn)) errs.transactionId = "This Transaction ID has already been used";
        setErrors(errs); setStep(2); setLoading(false); return;
      }
      const regId = crypto.randomUUID();
      // Upload payment screenshot if provided
      let screenshotUrl: string | null = null;
      if (paymentScreenshot) {
        const ext = paymentScreenshot.name.split(".").pop() || "jpg";
        const filePath = `${regId}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("payment-screenshots").upload(filePath, paymentScreenshot);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("payment-screenshots").getPublicUrl(filePath);
          screenshotUrl = urlData.publicUrl;
        }
      }
      const { error } = await supabase.from("registrations").insert({
        id: regId,
        event_id: form.eventId,
        leader_name: sanitizeInput(form.leaderName),
        leader_email: leaderEmail,
        leader_phone: leaderPhone,
        college_name: sanitizeInput(form.collegeName),
        semester: form.semester,
        team_name: isSolo ? null : sanitizeInput(form.teamName),
        members: isSolo ? null : (form.members.map((m) => ({ name: sanitizeInput(m.name), email: sanitizeInput(m.email).toLowerCase(), phone: m.phone.replace(/\s/g, "") })) as any),
        amount_paid: form.amountPaid.trim(),
        utr_number: utr,
        transaction_id: txn,
        payment_screenshot_url: screenshotUrl,
      } as any);
      if (error) {
        if (error.code === "23505") {
          if (error.message.includes("email")) { setErrors({ leaderEmail: "This email is already registered for this event" }); setStep(1); }
          else if (error.message.includes("phone")) { setErrors({ leaderPhone: "This phone number is already registered for this event" }); setStep(1); }
          else { toast.error("Duplicate registration detected. Please check your details."); }
          setLoading(false); return;
        }
        throw error;
      }
      setSuccessData({ id: regId, eventName: selectedEventData?.name || "" });
      setForm(initialForm);
      setPaymentScreenshot(null);
      setTouched({});
      setStep(0);
      supabase.functions.invoke("send-email", {
        body: {
          type: "registration_received",
          to: leaderEmail,
          leader_name: sanitizeInput(form.leaderName),
          team_name: isSolo ? undefined : sanitizeInput(form.teamName),
          registration_id: regId,
          event_name: selectedEventData?.name || "",
        },
      }).catch((err) => console.error("Email send error:", err));
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getFieldClass = (fieldId: string) => {
    const base = "bg-muted/50 text-foreground placeholder:text-muted-foreground transition-colors";
    if (errors[fieldId] && touched[fieldId]) return `${base} border-destructive focus:border-destructive focus:ring-destructive/30`;
    if (touched[fieldId] && !errors[fieldId]) return `${base} border-green-500/50 focus:border-green-500 focus:ring-green-500/30`;
    return `${base} border-border focus:border-primary focus:ring-primary/30`;
  };

  const renderField = (id: string, label: string, value: string, onChange: (v: string) => void, opts?: { type?: string; placeholder?: string }) => (
    <div className="space-y-1.5" key={id}>
      <Label htmlFor={id} className="text-sm text-foreground font-medium">{label}</Label>
      <Input id={id} type={opts?.type || "text"} placeholder={opts?.placeholder} value={value} onChange={(e) => onChange(e.target.value)} onBlur={() => handleBlur(id)} className={getFieldClass(id)} />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]}</p>}
    </div>
  );

  return (
    <section id="register" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="relative z-10 container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text mb-3">Register for Tech Carnival – 2K26</h2>
          <p className="text-muted-foreground">Secure your spot now!</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${i < step ? "bg-primary text-primary-foreground" : i === step ? "neon-border bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span className={`text-[11px] mt-1.5 font-medium ${i <= step ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-colors duration-300 ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="glass-strong rounded-2xl p-6 sm:p-8">
          {/* STEP 0 */}
          {step === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="font-display text-lg font-semibold text-foreground">Step 1 — Select Event</h3>
              <div className="space-y-4">
                {Object.entries(grouped).map(([cat, evts]) => (
                  <div key={cat}>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{categoryLabels[cat] || cat}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {evts.map((ev) => {
                        const selected = form.eventId === ev.id;
                        return (
                          <button key={ev.id} type="button" onClick={() => setForm((f) => ({ ...f, eventId: ev.id, members: [] }))}
                            className={`flex items-center gap-3 rounded-lg p-3 text-left transition-all duration-200 border ${selected ? "neon-border bg-primary/10" : "border-border bg-muted/30 hover:border-primary/30"}`}>
                            <span className="text-2xl">{ev.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{ev.name}</p>
                              <p className="text-xs text-muted-foreground">{(ev.team_size_max || 1) === 1 ? "Solo" : `${ev.team_size_min}-${ev.team_size_max} members`}</p>
                            </div>
                            {selected && <Check size={16} className="text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {errors.eventId && <p className="text-xs text-destructive">{errors.eventId}</p>}
              {selectedEventData && (
                <div className="glass rounded-lg p-4 flex items-center gap-3">
                  {isSolo ? <User size={18} className="text-primary" /> : <Users size={18} className="text-primary" />}
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{selectedEventData.name}</span> — {isSolo ? "Solo participation" : `Team of ${selectedEventData.team_size_min}-${selectedEventData.team_size_max} members`}
                  </p>
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="neon" onClick={next} className={shakeSubmit ? "animate-shake" : ""}>Next <ChevronRight size={16} className="ml-1" /></Button>
              </div>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="font-display text-lg font-semibold text-foreground">Step 2 — {isSolo ? "Your" : "Team"} Details</h3>
              {(emailDupStatus === "duplicate" || phoneDupStatus === "duplicate") && (
                <Alert className="border-destructive/30 bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive text-sm">
                    A registration with this {emailDupStatus === "duplicate" && phoneDupStatus === "duplicate" ? "email and phone number" : emailDupStatus === "duplicate" ? "email" : "phone number"} already exists for the selected event. Please use different details or contact the organizing team.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">{isSolo ? "Participant Info" : "Team Leader"}</p>
                {!isSolo && renderField("teamName", "Team Name", form.teamName, (v) => setForm((f) => ({ ...f, teamName: v })), { placeholder: "e.g. Code Warriors" })}
                {renderField("leaderName", "Full Name", form.leaderName, (v) => setForm((f) => ({ ...f, leaderName: v })), { placeholder: "John Doe" })}
                {/* Email with live duplicate check */}
                <div className="space-y-1.5">
                  <Label htmlFor="leaderEmail" className="text-sm text-foreground font-medium">Email</Label>
                  <div className="relative">
                    <Input id="leaderEmail" type="email" placeholder="john@example.com" value={form.leaderEmail} onChange={(e) => setForm((f) => ({ ...f, leaderEmail: e.target.value }))} onBlur={() => handleBlur("leaderEmail")} className={getFieldClass("leaderEmail")} />
                    {emailDupStatus === "checking" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">Checking…</span>}
                    {emailDupStatus === "clear" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-500">✅ Available</span>}
                    {emailDupStatus === "duplicate" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-destructive">⚠️ Already registered</span>}
                  </div>
                  {errors.leaderEmail && <p className="text-xs text-destructive">{errors.leaderEmail}</p>}
                  {emailDupStatus === "duplicate" && !errors.leaderEmail && <p className="text-xs text-destructive">This email is already registered for this event</p>}
                </div>
                {/* Phone with live duplicate check */}
                <div className="space-y-1.5">
                  <Label htmlFor="leaderPhone" className="text-sm text-foreground font-medium">Phone Number</Label>
                  <div className="relative">
                    <Input id="leaderPhone" type="tel" placeholder="9876543210" value={form.leaderPhone} onChange={(e) => setForm((f) => ({ ...f, leaderPhone: e.target.value }))} onBlur={() => handleBlur("leaderPhone")} className={getFieldClass("leaderPhone")} />
                    {phoneDupStatus === "checking" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">Checking…</span>}
                    {phoneDupStatus === "clear" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-500">✅ Available</span>}
                    {phoneDupStatus === "duplicate" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-destructive">⚠️ Already registered</span>}
                  </div>
                  {errors.leaderPhone && <p className="text-xs text-destructive">{errors.leaderPhone}</p>}
                  {phoneDupStatus === "duplicate" && !errors.leaderPhone && <p className="text-xs text-destructive">This phone number is already registered for this event</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="collegeName" className="text-sm text-foreground font-medium">College / Organization *</Label>
                  {colleges.length > 0 ? (
                    <>
                      <CollegePicker
                        colleges={colleges}
                        value={form.collegeName}
                        onChange={(name) => {
                          setForm((f) => ({ ...f, collegeName: name }));
                          setTouched((t) => ({ ...t, collegeName: true }));
                          setErrors((e) => { const n = { ...e }; delete n.collegeName; return n; });
                        }}
                        onOtherClick={() => setOtherCollegeOpen(true)}
                        className={getFieldClass("collegeName")}
                      />
                      <OtherCollegeDialog
                        open={otherCollegeOpen}
                        onClose={() => setOtherCollegeOpen(false)}
                        onCollegeSaved={(name) => {
                          setForm((f) => ({ ...f, collegeName: name }));
                          setTouched((t) => ({ ...t, collegeName: true }));
                          setErrors((e) => { const n = { ...e }; delete n.collegeName; return n; });
                          fetchColleges();
                        }}
                      />
                    </>
                  ) : (
                    <Input id="collegeName" placeholder="ABC College of Engineering" value={form.collegeName} onChange={(e) => setForm((f) => ({ ...f, collegeName: e.target.value }))} onBlur={() => handleBlur("collegeName")} className={getFieldClass("collegeName")} />
                  )}
                  {errors.collegeName && <p className="text-xs text-destructive">{errors.collegeName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="semester" className="text-sm text-foreground font-medium">Semester</Label>
                  <Select value={form.semester} onValueChange={(v) => setForm((f) => ({ ...f, semester: v }))}>
                    <SelectTrigger className={getFieldClass("semester")}><SelectValue placeholder="Select semester" /></SelectTrigger>
                    <SelectContent>{SEMESTERS.map((s) => (<SelectItem key={s} value={s}>{s} Semester</SelectItem>))}</SelectContent>
                  </Select>
                  {errors.semester && <p className="text-xs text-destructive">{errors.semester}</p>}
                </div>
              </div>
              {!isSolo && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Team Members ({form.members.length}/{maxMembers})</p>
                    <Badge variant="outline" className="text-xs text-primary border-primary/30">Min {minMembers + 1} – Max {maxMembers + 1} total</Badge>
                  </div>
                  {errors.members && <p className="text-xs text-destructive">{errors.members}</p>}
                  {form.members.map((m, i) => (
                    <div key={i} className="glass rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">Member {i + 1}</p>
                        <Button variant="ghost" size="sm" onClick={() => removeMember(i)} className="text-destructive hover:text-destructive h-7 px-2"><Trash2 size={14} className="mr-1" /> Remove</Button>
                      </div>
                      {renderField(`member_${i}_name`, "Full Name", m.name, (v) => updateMember(i, "name", v), { placeholder: "Member name" })}
                      {renderField(`member_${i}_email`, "Email", m.email, (v) => updateMember(i, "email", v), { type: "email", placeholder: "member@example.com" })}
                      {renderField(`member_${i}_phone`, "Phone", m.phone, (v) => updateMember(i, "phone", v), { type: "tel", placeholder: "9876543210" })}
                    </div>
                  ))}
                  {form.members.length < maxMembers && (
                    <Button variant="neon-outline" size="sm" onClick={addMember} className="w-full"><Plus size={14} className="mr-1" /> Add Member</Button>
                  )}
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev} className="text-muted-foreground"><ChevronLeft size={16} className="mr-1" /> Back</Button>
                <Button variant="neon" onClick={next} className={shakeSubmit ? "animate-shake" : ""}>Payment <ChevronRight size={16} className="ml-1" /></Button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="font-display text-lg font-semibold text-foreground">Step 3 — Payment</h3>
              <Alert className="border-yellow-500/30 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200/90 text-sm">
                  Each UTR Number and Transaction ID can only be used once. Duplicate payment details will be rejected.
                </AlertDescription>
              </Alert>
              {/* Dynamic payment info from admin settings — NO QR code */}
              {(paymentSettings.upi_id || paymentSettings.upi_name || paymentSettings.instructions) && (
                <div className="glass rounded-lg p-5 space-y-3">
                  {(paymentSettings.upi_id || paymentSettings.upi_name) && (
                    <div className="text-center space-y-1">
                      {paymentSettings.upi_id && <p className="text-xs text-muted-foreground">UPI ID: <span className="font-mono text-foreground select-all">{paymentSettings.upi_id}</span></p>}
                      {paymentSettings.upi_name && <p className="text-xs text-muted-foreground">Name: <span className="font-medium text-foreground">{paymentSettings.upi_name}</span></p>}
                    </div>
                  )}
                  {paymentSettings.instructions && (
                    <p className="text-sm text-muted-foreground text-center pt-2 border-t border-border">{paymentSettings.instructions}</p>
                  )}
                </div>
              )}
              <div className="space-y-4">
                {/* Select Event & Amount */}
                <div className="space-y-1.5">
                  <Label htmlFor="paymentEvent" className="text-sm text-foreground font-medium">Select Event & Amount <span className="text-destructive">*</span></Label>
                  <Select
                    value={form.amountPaid ? form.amountPaid : undefined}
                    onValueChange={(v) => {
                      setForm((f) => ({ ...f, amountPaid: v }));
                      setErrors((er) => { const n = { ...er }; delete n.amountPaid; return n; });
                      setTouched((t) => ({ ...t, amountPaid: true }));
                    }}
                  >
                    <SelectTrigger className={`bg-muted/50 text-foreground transition-colors ${touched.amountPaid && errors.amountPaid ? "border-destructive" : "border-border focus:border-primary"}`}>
                      <SelectValue placeholder="-- Select Event --" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EVENT_PRICES).map(([name, price]) => (
                        <SelectItem key={name} value={name}>{name} — ₹{price}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {touched.amountPaid && errors.amountPaid && <p className="text-xs text-destructive">{errors.amountPaid}</p>}
                </div>

                {/* Amount to Pay - auto display */}
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center" style={{ boxShadow: "0 0 15px hsl(var(--neon-blue) / 0.15)" }}>
                  <p className="text-xs text-muted-foreground mb-1">Amount to Pay</p>
                  <p className="text-2xl font-bold text-primary">
                    ₹{form.amountPaid && EVENT_PRICES[form.amountPaid] ? EVENT_PRICES[form.amountPaid] : 0}
                  </p>
                </div>
                
                {/* UTR Number with live check */}
                <div className="space-y-1.5">
                  <Label htmlFor="utrNumber" className="text-sm text-foreground font-medium">UTR Number <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input id="utrNumber" placeholder="Enter UTR number from payment confirmation" value={form.utrNumber} onChange={(e) => handleUtrChange(e.target.value)} onBlur={() => handleBlur("utrNumber")}
                      className={`${utrStatus === "duplicate" || (errors.utrNumber && touched.utrNumber) ? "border-destructive focus:border-destructive focus:ring-destructive/30" : utrStatus === "valid" ? "border-green-500/50 focus:border-green-500 focus:ring-green-500/30" : ""} bg-muted/50 text-foreground placeholder:text-muted-foreground transition-colors pr-10`} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {utrStatus === "checking" && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                      {utrStatus === "valid" && <Check size={16} className="text-green-500" />}
                      {utrStatus === "duplicate" && <AlertTriangle size={16} className="text-destructive" />}
                    </div>
                  </div>
                  {utrStatus === "valid" && form.utrNumber.trim() && <p className="text-xs text-green-500 flex items-center gap-1"><Check size={12} /> UTR number is valid</p>}
                  {utrStatus === "duplicate" && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle size={12} /> This UTR number has already been used</p>}
                  {errors.utrNumber && touched.utrNumber && utrStatus !== "duplicate" && <p className="text-xs text-destructive">{errors.utrNumber}</p>}
                </div>

                {/* Transaction ID with live check */}
                <div className="space-y-1.5">
                  <Label htmlFor="transactionId" className="text-sm text-foreground font-medium">Transaction ID <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input id="transactionId" placeholder="Enter transaction ID" value={form.transactionId} onChange={(e) => handleTxnChange(e.target.value)} onBlur={() => handleBlur("transactionId")}
                      className={`${txnStatus === "duplicate" || (errors.transactionId && touched.transactionId) ? "border-destructive focus:border-destructive focus:ring-destructive/30" : txnStatus === "valid" ? "border-green-500/50 focus:border-green-500 focus:ring-green-500/30" : ""} bg-muted/50 text-foreground placeholder:text-muted-foreground transition-colors pr-10`} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {txnStatus === "checking" && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                      {txnStatus === "valid" && <Check size={16} className="text-green-500" />}
                      {txnStatus === "duplicate" && <AlertTriangle size={16} className="text-destructive" />}
                    </div>
                  </div>
                  {txnStatus === "valid" && form.transactionId.trim() && <p className="text-xs text-green-500 flex items-center gap-1"><Check size={12} /> Transaction ID is valid</p>}
                  {txnStatus === "duplicate" && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle size={12} /> This Transaction ID has already been used</p>}
                  {errors.transactionId && touched.transactionId && txnStatus !== "duplicate" && <p className="text-xs text-destructive">{errors.transactionId}</p>}
                </div>
                
                {/* Payment Screenshot Upload */}
                <div className="space-y-1.5">
                   <Label className="text-sm text-foreground font-medium">Payment Screenshot <span className="text-destructive">*</span></Label>
                   {touched.paymentScreenshot && errors.paymentScreenshot && <p className="text-xs text-destructive">{errors.paymentScreenshot}</p>}
                  <div className="relative">
                    {paymentScreenshot ? (
                      <div className={`glass rounded-lg p-3 flex items-center gap-3 ${touched.paymentScreenshot && errors.paymentScreenshot ? "border border-destructive" : ""}`}>
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                          {paymentScreenshot.type.startsWith("image/") ? (
                            <img src={URL.createObjectURL(paymentScreenshot)} alt="Payment screenshot" className="w-full h-full object-cover" />
                          ) : (
                            <FileText size={28} className="text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium truncate">{paymentScreenshot.name}</p>
                          <p className="text-xs text-muted-foreground">{(paymentScreenshot.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => { setPaymentScreenshot(null); setErrors((e) => ({ ...e, paymentScreenshot: "Payment screenshot is required" })); }} className="text-destructive hover:text-destructive shrink-0">
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed ${touched.paymentScreenshot && errors.paymentScreenshot ? "border-destructive" : "border-border hover:border-primary/50"} bg-muted/30 p-6 transition-colors`}>
                        <Upload size={24} className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground text-center">Click to upload screenshot (All image formats & PDF supported, up to 5 MB)</span>
                        <span className="text-xs text-muted-foreground/70">PNG, JPG, GIF, BMP, WEBP, SVG, PDF, HEIC, HEIF</span>
                        <input
                          type="file"
                          accept="image/*,.pdf,.heic,.heif"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("File size must be under 5 MB");
                                return;
                              }
                              const allowedTypes = ["image/", "application/pdf"];
                              const allowedExts = [".heic", ".heif"];
                              const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
                              const isAllowed = allowedTypes.some((t) => file.type.startsWith(t)) || allowedExts.includes(ext);
                              if (!isAllowed) {
                                toast.error("Unsupported file format");
                                return;
                              }
                              setPaymentScreenshot(file);
                              setErrors((er) => { const n = { ...er }; delete n.paymentScreenshot; return n; });
                              setTouched((t) => ({ ...t, paymentScreenshot: true }));
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev} className="text-muted-foreground"><ChevronLeft size={16} className="mr-1" /> Back</Button>
                <Button variant="neon" onClick={next} disabled={checkingPayment || !form.amountPaid.trim() || !form.utrNumber.trim() || !form.transactionId.trim() || !paymentScreenshot} className={shakeSubmit ? "animate-shake" : ""}>{checkingPayment ? "Verifying..." : "Review"} <ChevronRight size={16} className="ml-1" /></Button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="font-display text-lg font-semibold text-foreground">Step 4 — Review & Submit</h3>
              <div className="glass rounded-lg p-5 space-y-4 text-sm">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <span className="text-3xl">{selectedEventData?.icon}</span>
                  <div>
                    <p className="font-semibold text-foreground">{selectedEventData?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{selectedEventData?.category}</p>
                  </div>
                </div>
                <Row label="Name" value={form.leaderName} />
                <Row label="Email" value={form.leaderEmail} />
                <Row label="Phone" value={form.leaderPhone} />
                <Row label="College" value={form.collegeName} />
                <Row label="Semester" value={form.semester} />
                {!isSolo && (
                  <>
                    <Row label="Team Name" value={form.teamName} />
                    {form.members.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-2">Team Members:</p>
                        {form.members.map((m, i) => (
                          <p key={i} className="text-foreground ml-3">{i + 1}. {m.name} — {m.email}</p>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Payment Details</p>
                  <Row label="Amount Paid" value={`₹${form.amountPaid}`} />
                  <Row label="UTR Number" value={form.utrNumber} />
                  <Row label="Transaction ID" value={form.transactionId} />
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="terms" checked={form.agreedTerms} onCheckedChange={(v) => setForm((f) => ({ ...f, agreedTerms: v === true }))} className="mt-0.5" />
                <Label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                  I agree to the rules & guidelines and confirm that all information provided is accurate.
                </Label>
              </div>
              {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
              <div className="flex justify-between">
                <Button variant="ghost" onClick={prev} className="text-muted-foreground"><ChevronLeft size={16} className="mr-1" /> Back</Button>
                <Button variant="neon" onClick={handleSubmit} disabled={loading} className={`min-w-[160px] ${shakeSubmit ? "animate-shake" : ""}`}>
                  {loading ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSuccessData(null)} />
          <div className="relative w-full max-w-md glass-strong rounded-2xl p-8 text-center animate-in zoom-in-95 fade-in duration-300 neon-border">
            <button onClick={() => setSuccessData(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
            <div className="mb-4"><PartyPopper size={48} className="text-primary mx-auto" /></div>
            <h3 className="font-display text-2xl font-bold gradient-text mb-2">Registration Successful! 🎉</h3>
            <p className="text-muted-foreground text-sm mb-6">You will receive a confirmation email shortly.</p>
            <div className="glass rounded-lg p-4 text-left space-y-2 text-sm mb-6">
              <Row label="Registration ID" value={successData.id.slice(0, 8).toUpperCase()} />
              <Row label="Event" value={successData.eventName} />
            </div>
            <Button variant="neon" className="w-full" onClick={() => setSuccessData(null)}>Done</Button>
          </div>
        </div>
      )}
    </section>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium text-right">{value}</span>
  </div>
);

export default RegisterSection;
