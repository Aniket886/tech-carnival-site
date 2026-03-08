import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const coordinators = [
  {
    name: "Rahul Sharma",
    role: "Event Coordinator",
    phone: "+91 98765 43210",
    email: "rahul.coordinator@college.edu",
  },
  {
    name: "Priya Patel",
    role: "Event Coordinator",
    phone: "+91 87654 32109",
    email: "priya.coordinator@college.edu",
  },
];

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contacts").insert([form]);
    setLoading(false);
    if (error) {
      toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✉️ Message sent!", description: "We'll get back to you soon." });
      setForm({ name: "", email: "", message: "" });
    }
  };

  return (
    <section id="contact" className="py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-gradient text-center mb-4"
        >
          Get in Touch
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-center text-muted-foreground mb-12"
        >
          Have questions? Reach out to us or our coordinators
        </motion.p>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left: Form */}
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="rounded-xl border border-border bg-card/50 p-8 space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name</Label>
              <Input id="contact-name" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea id="contact-message" placeholder="Your message..." rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={1000} />
            </div>
            <Button type="submit" className="w-full neon-glow" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </motion.form>

          {/* Right: Coordinators + Address */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-5"
          >
            {/* Coordinator Cards */}
            {coordinators.map((c) => (
              <div key={c.email} className="rounded-xl border border-border bg-card/50 p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{c.role}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Address & Map */}
            <div className="rounded-xl border border-border bg-card/50 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">College Campus</p>
                  <p className="text-sm text-muted-foreground">
                    XYZ College of Engineering, Main Road,<br />
                    City, State – 123456
                  </p>
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
