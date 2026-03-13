import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, MapPin, User } from "lucide-react";
import EyeFollowButton from "@/components/ui/EyeFollowButton";
import { validateName, validateEmail, validatePhone, validateMessage, sanitizeInput } from "@/lib/validators";

const coordinators = [
  {
    name: "Aniket Tegginamath",
    role: "Core Organizer",
    phone: "+91 8073491988",
    email: "aniket.gmu@gmail.com",
    initial: "A",
  },
  {
    name: "Sonali V Meharwade",
    role: "Core Organizer",
    phone: "+91 8073289015",
    email: "meharwadesona@gmail.com",
    initial: "S",
  },
];

const RATE_LIMIT_KEY = "contact_last_submit";

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => {
    setTouched((t) => ({ ...t, [field]: true }));
    const errs = { ...errors };
    delete errs[field];
    if (field === "name") {
      const r = validateName(form.name);
      if (!r.valid) errs.name = r.error!;
    }
    if (field === "email") {
      const r = validateEmail(form.email);
      if (!r.valid) errs.email = r.error!;
    }
    if (field === "phone" && form.phone.trim()) {
      const r = validatePhone(form.phone);
      if (!r.valid) errs.phone = r.error!;
    }
    if (field === "message") {
      const r = validateMessage(form.message);
      if (!r.valid) errs.message = r.error!;
    }
    setErrors(errs);
  };

  const getFieldClass = (field: string) => {
    const base = "bg-muted/50 text-foreground placeholder:text-muted-foreground transition-colors";
    if (errors[field] && touched[field]) return `${base} border-destructive focus:border-destructive`;
    if (touched[field] && !errors[field] && form[field as keyof typeof form])
      return `${base} border-green-500/50 focus:border-green-500`;
    return `${base} border-border focus:border-primary`;
  };

  const validateAll = (): boolean => {
    const errs: Record<string, string> = {};
    const nv = validateName(form.name);
    if (!nv.valid) errs.name = nv.error!;
    const ev = validateEmail(form.email);
    if (!ev.valid) errs.email = ev.error!;
    if (form.phone.trim()) {
      const pv = validatePhone(form.phone);
      if (!pv.valid) errs.phone = pv.error!;
    }
    const mv = validateMessage(form.message);
    if (!mv.valid) errs.message = mv.error!;
    setErrors(errs);
    setTouched({ name: true, email: true, phone: true, message: true });
    if (Object.keys(errs).length > 0) {
      toast.error(`Please fix ${Object.keys(errs).length} error(s) before submitting`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    const lastSubmit = localStorage.getItem(RATE_LIMIT_KEY);
    if (lastSubmit) {
      const diff = Date.now() - parseInt(lastSubmit);
      if (diff < 5 * 60 * 1000) {
        const mins = Math.ceil((5 * 60 * 1000 - diff) / 60000);
        toast.error(`Please wait ${mins} minute(s) before sending another message`);
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("contacts").insert({
        name: sanitizeInput(form.name),
        email: sanitizeInput(form.email).toLowerCase(),
        phone: form.phone.trim() ? sanitizeInput(form.phone) : null,
        message: sanitizeInput(form.message),
      });
      if (error) throw error;
      localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: "", email: "", phone: "", message: "" });
      setTouched({});
      setErrors({});
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const messageLen = form.message.length;

  return (
    <section id="contact" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-4">Get in Touch</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Have questions? Reach out to us and we'll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="liquid-glass rounded-xl p-6 sm:p-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name" className="text-sm text-foreground font-medium">
                Name
              </Label>
              <Input
                id="contact-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onBlur={() => handleBlur("name")}
                placeholder="Your name"
                className={getFieldClass("name")}
              />
              {errors.name && touched.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-email" className="text-sm text-foreground font-medium">
                Email
              </Label>
              <Input
                id="contact-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                onBlur={() => handleBlur("email")}
                placeholder="you@example.com"
                className={getFieldClass("email")}
              />
              {errors.email && touched.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone" className="text-sm text-foreground font-medium">
                Phone
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                onBlur={() => handleBlur("phone")}
                placeholder="9876543210"
                className={getFieldClass("phone")}
              />
              {errors.phone && touched.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="contact-msg" className="text-sm text-foreground font-medium">
                  Message
                </Label>
                <span className={`text-xs ${messageLen > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                  {messageLen}/500
                </span>
              </div>
              <Textarea
                id="contact-msg"
                required
                rows={4}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                onBlur={() => handleBlur("message")}
                placeholder="Your message..."
                className={`${getFieldClass("message")} resize-none`}
                maxLength={500}
              />
              {errors.message && touched.message && <p className="text-xs text-destructive">{errors.message}</p>}
            </div>
            <EyeFollowButton
              type="submit"
              disabled={loading}
              loading={loading}
              text="Send Message"
            />
          </form>

          <div className="space-y-6">
            {coordinators.map((c) => (
              <div key={c.email} className="liquid-glass rounded-xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-display font-bold text-sm">{c.initial}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.role}</p>
                  <a
                    href={`tel:${c.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-1.5 min-h-[44px] py-1.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone size={14} /> {c.phone}
                  </a>
                  <a
                    href={`mailto:${c.email}`}
                    className="flex items-center gap-1.5 min-h-[44px] py-1.5 text-muted-foreground hover:text-primary transition-colors break-all"
                  >
                    <Mail size={14} /> {c.email}
                  </a>
                </div>
              </div>
            ))}
            <div className="liquid-glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-primary" />
                <p className="text-sm font-semibold text-foreground">College Address</p>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                GM University P.B. Road, Davanagere,
                <br />
                Davangere - 577006 Karnataka,
              </p>
              <div className="rounded-lg overflow-hidden border border-border h-40 bg-muted/30">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1720.843825501612!2d75.88425921598456!3d14.47528060769758!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bba2f005c56529f%3A0x2178cebedeb330c!2sGM%20University%20Main%20Gate!5e0!3m2!1sen!2sin!4v1771513343942!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
