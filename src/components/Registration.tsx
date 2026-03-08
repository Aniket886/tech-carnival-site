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
import { CheckCircle2, Plus, Trash2, Users, User, ChevronRight, ChevronLeft } from "lucide-react";
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

interface TeamMember {
  name: string;
  email: string;
  phone: string;
}

interface FormData {
  event_id: string;
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

const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

const STEP_LABELS = ["Select Event", "Details", "Review"];

const categoryColors: Record<string, string> = {
  technical: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  gaming: "bg-red-500/15 text-red-400 border-red-500/30",
  cultural: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const emptyMember = (): TeamMember => ({ name: "", email: "", phone: "" });

const initialForm: FormData = {
  event_id: "",
  leader_name: "",
  leader_email: "",
  leader_phone: "",
  college_name: "",
  semester: "",
  team_name: "",
  members: [],
  agreed: false,
};

// ── Validation helpers ──
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone: string) => /^\d{10}$/.test(phone.replace(/\D/g, ""));

// ── Component ──
const Registration = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [form, setForm] = useState<FormData>({ ...initialForm });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [successData, setSuccessData] = useState<{
    id: string;
    eventName: string;
  } | null>(null);

  const selectedEvent = events.find((e) => e.id === form.event_id);
  const isTeamEvent = selectedEvent ? selectedEvent.team_size_max > 1 : false;

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

  // Fetch events
  useEffect(() => {
    supabase
      .from("events")
      .select("id, name, icon, category, team_size_min, team_size_max")
      .eq("is_active", true)
      .order("category")
      .then(({ data }) => {
        if (data) setEvents(data);
      });
  }, []);

  // Listen for preselect-event
  useEffect(() => {
    const handler = (e: Event) => {
      const eventName = (e as CustomEvent).detail;
      const match = events.find((ev) => ev.name === eventName);
      if (match) {
        setForm((prev) => ({ ...prev, event_id: match.id }));
        setStep(0);
      }
    };
    window.addEventListener("preselect-event", handler);
    return () => window.removeEventListener("preselect-event", handler);
  }, [events]);

  // Auto-adjust members array when event changes
  useEffect(() => {
    if (!selectedEvent) return;
    if (isTeamEvent) {
      const minExtra = Math.max(0, selectedEvent.team_size_min - 1);
      const currentLen = form.members.length;
      if (currentLen < minExtra) {
        const toAdd = Array.from({ length: minExtra - currentLen }, emptyMember);
        setForm((prev) => ({ ...prev, members: [...prev.members, ...toAdd] }));
      }
    } else {
      setForm((prev) => ({ ...prev, members: [], team_name: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.event_id]);

  // ── Validation ──
  const validateStep = useCallback(
    (s: number): FieldErrors => {
      const e: FieldErrors = {};
      if (s === 0) {
        if (!form.event_id) e.event_id = "Please select an event";
      }
      if (s === 1) {
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
        // Check duplicate emails within team
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
    if (countErrors(errs) > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast({ title: `Please fix ${countErrors(errs)} error${countErrors(errs) > 1 ? "s" : ""} before continuing`, variant: "destructive" });
      return;
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const addMember = () => {
    if (!selectedEvent) return;
    if (form.members.length + 1 < selectedEvent.team_size_max) {
      setForm((prev) => ({ ...prev, members: [...prev.members, emptyMember()] }));
    }
  };

  const removeMember = (idx: number) => {
    if (!selectedEvent) return;
    const minExtra = Math.max(0, selectedEvent.team_size_min - 1);
    if (form.members.length > minExtra) {
      setForm((prev) => ({
        ...prev,
        members: prev.members.filter((_, i) => i !== idx),
      }));
    }
  };

  const updateMember = (idx: number, field: keyof TeamMember, value: string) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.map((m, i) => (i === idx ? { ...m, [field]: value } : m)),
    }));
  };

  // ── Submit ──
  const handleSubmit = async () => {
    const errs = validateStep(2);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);

    // Duplicate email check
    const { data: existing } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", form.event_id)
      .eq("leader_email", form.leader_email);

    if (existing && existing.length > 0) {
      setErrors({ leader_email: "This email is already registered for this event" });
      setLoading(false);
      setStep(1);
      return;
    }

    const { data, error } = await supabase
      .from("registrations")
      .insert([
        {
          event_id: form.event_id,
          leader_name: sanitizeInput(form.leader_name),
          leader_email: form.leader_email.trim().toLowerCase(),
          leader_phone: form.leader_phone.trim(),
          college_name: sanitizeInput(form.college_name),
          semester: form.semester || null,
          team_name: isTeamEvent ? sanitizeInput(form.team_name) : null,
          members: isTeamEvent && form.members.length > 0
            ? form.members.map((m) => ({ name: sanitizeInput(m.name), email: m.email.trim().toLowerCase(), phone: m.phone.trim() } as Record<string, string>))
            : null,
        },
      ])
      .select("id")
      .single();

    setLoading(false);

    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else if (data) {
      setSuccessData({ id: data.id, eventName: selectedEvent?.name || "" });
      // Send confirmation email (fire-and-forget)
      supabase.functions.invoke("send-email", {
        body: {
          type: "registration_received",
          to: form.leader_email.trim(),
          leader_name: form.leader_name.trim(),
          team_name: isTeamEvent ? form.team_name.trim() : undefined,
          registration_id: data.id,
          event_name: selectedEvent?.name || "",
        },
      }).catch(() => {});
    }
  };

  const resetForm = () => {
    setForm({ ...initialForm });
    setStep(0);
    setErrors({});
    setSuccessData(null);
  };

  // ── Grouped events for step 0 ──
  const grouped = events.reduce<Record<string, EventOption[]>>((acc, ev) => {
    (acc[ev.category] = acc[ev.category] || []).push(ev);
    return acc;
  }, {});

  const categoryOrder = ["technical", "gaming", "cultural"];
  const categoryLabels: Record<string, string> = {
    technical: "💻 Technical Events",
    gaming: "🎮 Gaming Events",
    cultural: "🎭 Cultural Events",
  };

  // ── Render helpers ──
  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="text-sm text-destructive mt-1">{errors[field]}</p>
    ) : null;

  const stepVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <section id="register" className="py-24">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gradient mb-2">
            Register for Tech Carnival – 2K26
          </h2>
          <p className="text-muted-foreground text-lg">Secure your spot now!</p>
        </motion.div>

        {/* Progress bar */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border transition-all duration-300 ${
                    i < step
                      ? "bg-primary text-primary-foreground border-primary"
                      : i === step
                      ? "bg-primary/20 text-primary border-primary neon-glow"
                      : "bg-muted/30 text-muted-foreground border-border"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                </div>
                <span
                  className={`text-xs mt-1 hidden sm:block ${
                    i <= step ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-0.5 transition-colors duration-300 ${
                    i < step ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-xl border border-border bg-card/50 p-6 sm:p-8 neon-glow"
        >
          <AnimatePresence mode="wait">
            {/* ─── Step 0: Select Event ─── */}
            {step === 0 && (
              <motion.div
                key="step-0"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-semibold text-foreground mb-6">
                  Choose Your Event
                </h3>
                <FieldError field="event_id" />
                <div className="space-y-6 mt-2">
                  {categoryOrder.map((cat) => {
                    const list = grouped[cat];
                    if (!list) return null;
                    return (
                      <div key={cat}>
                        <p className="text-sm font-semibold text-muted-foreground mb-3">
                          {categoryLabels[cat]}
                        </p>
                        <div className="grid gap-3">
                          {list.map((ev) => {
                            const selected = form.event_id === ev.id;
                            return (
                              <button
                                key={ev.id}
                                type="button"
                                onClick={() =>
                                  setForm((prev) => ({ ...prev, event_id: ev.id }))
                                }
                                className={`w-full text-left flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 ${
                                  selected
                                    ? "border-primary bg-primary/10 neon-glow"
                                    : "border-border bg-muted/10 hover:border-primary/30"
                                }`}
                              >
                                <span className="text-2xl">{ev.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-foreground">{ev.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${categoryColors[ev.category]}`}
                                    >
                                      {ev.category}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      {ev.team_size_max === 1 ? (
                                        <>
                                          <User className="h-3 w-3" /> Solo
                                        </>
                                      ) : (
                                        <>
                                          <Users className="h-3 w-3" /> {ev.team_size_min}-
                                          {ev.team_size_max} members
                                        </>
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    selected
                                      ? "border-primary bg-primary"
                                      : "border-muted-foreground"
                                  }`}
                                >
                                  {selected && (
                                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end mt-8">
                  <Button onClick={goNext} className="neon-glow gap-2">
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 1: Details ─── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-semibold text-foreground mb-1">
                  {isTeamEvent ? "Team Details" : "Your Details"}
                </h3>
                {selectedEvent && (
                  <p className="text-sm text-muted-foreground mb-6">
                    Registering for{" "}
                    <span className="text-primary font-medium">
                      {selectedEvent.icon} {selectedEvent.name}
                    </span>
                    {isTeamEvent &&
                      ` · Team of ${selectedEvent.team_size_min}-${selectedEvent.team_size_max} members`}
                  </p>
                )}

                <div className="space-y-5">
                  {/* Leader section */}
                  <p className="text-sm font-semibold text-muted-foreground border-b border-border pb-2">
                    {isTeamEvent ? "👤 Team Leader" : "👤 Participant"}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full Name *</Label>
                      <Input
                        placeholder="John Doe"
                        value={form.leader_name}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, leader_name: e.target.value }))
                        }
                        maxLength={100}
                      />
                      <FieldError field="leader_name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={form.leader_email}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, leader_email: e.target.value }))
                        }
                        maxLength={255}
                      />
                      <FieldError field="leader_email" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone *</Label>
                      <Input
                        placeholder="9876543210"
                        value={form.leader_phone}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, leader_phone: e.target.value }))
                        }
                        maxLength={15}
                      />
                      <FieldError field="leader_phone" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>College *</Label>
                      <Input
                        placeholder="XYZ College of Engineering"
                        value={form.college_name}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, college_name: e.target.value }))
                        }
                        maxLength={200}
                      />
                      <FieldError field="college_name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Semester</Label>
                      <Select
                        value={form.semester}
                        onValueChange={(v) => setForm((p) => ({ ...p, semester: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {SEMESTERS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s} Semester
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {isTeamEvent && (
                      <div className="space-y-1.5">
                        <Label>Team Name *</Label>
                        <Input
                          placeholder="Team Alpha"
                          value={form.team_name}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, team_name: e.target.value }))
                          }
                          maxLength={100}
                        />
                        <FieldError field="team_name" />
                      </div>
                    )}
                  </div>

                  {/* Team members */}
                  {isTeamEvent && selectedEvent && (
                    <>
                      <div className="flex items-center justify-between border-b border-border pb-2 mt-6">
                        <p className="text-sm font-semibold text-muted-foreground">
                          👥 Team Members ({form.members.length + 1}/
                          {selectedEvent.team_size_max})
                        </p>
                        {form.members.length + 1 < selectedEvent.team_size_max && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addMember}
                            className="gap-1 text-primary border-primary/30"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Member
                          </Button>
                        )}
                      </div>

                      {form.members.map((m, i) => (
                        <div
                          key={i}
                          className="relative rounded-lg border border-border bg-muted/10 p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-foreground">
                              Member {i + 2}
                            </p>
                            {form.members.length >
                              Math.max(0, selectedEvent.team_size_min - 1) && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMember(i)}
                                className="text-destructive hover:text-destructive h-7 px-2"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <div className="grid sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Name *</Label>
                              <Input
                                placeholder="Name"
                                value={m.name}
                                onChange={(e) =>
                                  updateMember(i, "name", e.target.value)
                                }
                                maxLength={100}
                              />
                              <FieldError field={`member_${i}_name`} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Email *</Label>
                              <Input
                                type="email"
                                placeholder="Email"
                                value={m.email}
                                onChange={(e) =>
                                  updateMember(i, "email", e.target.value)
                                }
                                maxLength={255}
                              />
                              <FieldError field={`member_${i}_email`} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Phone *</Label>
                              <Input
                                placeholder="Phone"
                                value={m.phone}
                                onChange={(e) =>
                                  updateMember(i, "phone", e.target.value)
                                }
                                maxLength={15}
                              />
                              <FieldError field={`member_${i}_phone`} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={goBack} className="gap-2">
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button onClick={goNext} className="neon-glow gap-2">
                    Review <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 2: Review ─── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-semibold text-foreground mb-6">
                  Review Your Registration
                </h3>

                <div className="space-y-4">
                  {/* Event */}
                  <div className="rounded-lg border border-border bg-muted/10 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Event</p>
                    <p className="font-semibold text-foreground">
                      {selectedEvent?.icon} {selectedEvent?.name}
                    </p>
                  </div>

                  {/* Leader */}
                  <div className="rounded-lg border border-border bg-muted/10 p-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      {isTeamEvent ? "Team Leader" : "Participant"}
                    </p>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-muted-foreground">Name</span>
                      <span className="text-foreground">{form.leader_name}</span>
                      <span className="text-muted-foreground">Email</span>
                      <span className="text-foreground">{form.leader_email}</span>
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

                  {/* Team */}
                  {isTeamEvent && (
                    <div className="rounded-lg border border-border bg-muted/10 p-4">
                      <p className="text-xs text-muted-foreground mb-1">Team</p>
                      <p className="font-semibold text-foreground mb-3">
                        {form.team_name}
                      </p>
                      {form.members.map((m, i) => (
                        <div
                          key={i}
                          className="text-sm border-t border-border pt-2 mt-2 grid grid-cols-2 gap-y-1"
                        >
                          <span className="text-muted-foreground">
                            Member {i + 2}
                          </span>
                          <span className="text-foreground">{m.name}</span>
                          <span className="text-muted-foreground">Email</span>
                          <span className="text-foreground text-xs">{m.email}</span>
                          <span className="text-muted-foreground">Phone</span>
                          <span className="text-foreground">{m.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Terms */}
                  <div className="flex items-start gap-3 mt-4">
                    <Checkbox
                      id="terms"
                      checked={form.agreed}
                      onCheckedChange={(v) =>
                        setForm((p) => ({ ...p, agreed: v === true }))
                      }
                    />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                      I agree to the event rules, terms & conditions, and confirm all
                      information provided is accurate.
                    </Label>
                  </div>
                  <FieldError field="agreed" />
                </div>

                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={goBack} className="gap-2">
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="neon-glow"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit Registration"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Success Modal */}
      <Dialog open={!!successData} onOpenChange={() => resetForm()}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-gradient">
              Registration Successful! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              You're all set for Tech Carnival – 2K26
            </DialogDescription>
          </DialogHeader>
          {successData && (
            <div className="space-y-4 mt-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registration ID</span>
                  <span className="font-mono text-primary text-xs">
                    {successData.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event</span>
                  <span className="text-foreground font-medium">
                    {successData.eventName}
                  </span>
                </div>
                {form.team_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Team</span>
                    <span className="text-foreground">{form.team_name}</span>
                  </div>
                )}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                📧 You will receive a confirmation email shortly.
              </p>
              <Button onClick={resetForm} className="w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Registration;
