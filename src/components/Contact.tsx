import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateName, validateEmail, validateMessage, sanitizeInput, countErrors } from "@/lib/validators";

const coordinators = [
  { name: "Rahul Sharma", role: "Event Coordinator", phone: "+91 98765 43210", email: "rahul.coordinator@college.edu" },
  { name: "Priya Patel", role: "Event Coordinator", phone: "+91 87654 32109", email: "priya.coordinator@college.edu" },
];

interface FieldErrors { [key: string]: string }

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [shake, setShake] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    const nameV = validateName(form.name);
    if (!nameV.valid) e.name = nameV.error!;
    const emailV = validateEmail(form.email);
    if (!emailV.valid) e.email = emailV.error!;
    const msgV = validateMessage(form.message);
    if (!msgV.valid) e.message = msgV.error!;
    return e;
  };

  const onBlur = (field: string) => {
    setTouched((prev) => new Set(prev).add(field));
    const errs = validate();
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

  const isFormValid = countErrors(validate()) === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setTouched(new Set(["name", "email", "message"]));

    if (countErrors(errs) > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast({ title: `Please fix ${countErrors(errs)} error${countErrors(errs) > 1 ? "s" : ""} before submitting`, variant: "destructive" });
      const firstErr = formRef.current?.querySelector("[data-invalid]");
      firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Rate limit: check last submission by this email
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", form.email.trim().toLowerCase())
      .gte("created_at", fiveMinAgo);
    if (recent && recent.length > 0) {
      setErrors({ email: "You can only submit once every 5 minutes" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("contacts").insert([{
      name: sanitizeInput(form.name),
      email: form.email.trim().toLowerCase(),
      message: sanitizeInput(form.message),
    }]);
    setLoading(false);
    if (error) {
      toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✉️ Message sent!", description: "We'll get back to you soon." });
      setForm({ name: "", email: "", message: "" });
      setTouched(new Set());
      setErrors({});
    }
  };

  const FieldError = ({ field }: { field: string }) =>
    touched.has(field) && errors[field]
      ? <p className="text-xs text-destructive mt-1">{errors[field]}</p>
      : touched.has(field) && !errors[field]
        ? <p className="text-xs text-green-400 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Looks good</p>
        : null;

  return (
    <section id="contact" className="py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl sm:text-4xl font-bold text-gradient text-center mb-4">
          Get in Touch
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-center text-muted-foreground mb-12">
          Have questions? Reach out to us or our coordinators
        </motion.p>

        <div className="grid lg:grid-cols-2 gap-10">
          <motion.form
            ref={formRef}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="rounded-xl border border-border bg-card/50 p-8 space-y-5"
          >
            <div className="space-y-1.5" data-invalid={errors.name ? true : undefined}>
              <Label htmlFor="contact-name">Name *</Label>
              <Input id="contact-name" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={() => onBlur("name")} maxLength={20} className={fieldClass("name")} />
              <FieldError field="name" />
            </div>
            <div className="space-y-1.5" data-invalid={errors.email ? true : undefined}>
              <Label htmlFor="contact-email">Email *</Label>
              <Input id="contact-email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onBlur={() => onBlur("email")} maxLength={50} className={fieldClass("email")} />
              <FieldError field="email" />
            </div>
            <div className="space-y-1.5" data-invalid={errors.message ? true : undefined}>
              <div className="flex items-center justify-between">
                <Label htmlFor="contact-message">Message *</Label>
                <span className="text-xs text-muted-foreground">{sanitizeInput(form.message).length}/500</span>
              </div>
              <Textarea id="contact-message" placeholder="Your message (min 10 characters)..." rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} onBlur={() => onBlur("message")} maxLength={500} className={fieldClass("message")} />
              <FieldError field="message" />
            </div>
            <motion.div animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
              <Button type="submit" className="w-full neon-glow" disabled={loading || !isFormValid}>
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </motion.div>
          </motion.form>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="space-y-5">
            {coordinators.map((c) => (
              <div key={c.email} className="rounded-xl border border-border bg-card/50 p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{c.role}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary shrink-0" /><span>{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="h-3.5 w-3.5 text-primary shrink-0" /><span className="truncate">{c.email}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-border bg-card/50 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">GM University</p>
                  <p className="text-sm text-muted-foreground">GM University P.B. Road, Davanagere<br />Davangere – 577006 Karnataka,</p>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden border border-border aspect-video bg-muted/20 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Google Maps Embed</p>
                  <p className="text-xs opacity-60">Replace with actual embed iframe</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
