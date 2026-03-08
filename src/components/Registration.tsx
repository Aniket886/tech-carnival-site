import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const eventOptions = [
  "Hack Momentum",
  "Brain Quest",
  "Pixel Perfect",
  "Code Compass",
  "Myth Busters",
  "Battle Ground",
  "Dance Mania",
  "Scitopia",
];

const Registration = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    selected_event: "",
  });

  // Listen for preselect-event from Events section
  useEffect(() => {
    const handler = (e: Event) => {
      const eventName = (e as CustomEvent).detail;
      if (eventOptions.includes(eventName)) {
        setForm((prev) => ({ ...prev, selected_event: eventName }));
      }
    };
    window.addEventListener("preselect-event", handler);
    return () => window.removeEventListener("preselect-event", handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.college || !form.selected_event) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("registrations").insert([form]);
    setLoading(false);

    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🎉 Registration successful!", description: "See you at Tech Carnival!" });
      setForm({ name: "", email: "", phone: "", college: "", selected_event: "" });
    }
  };

  return (
    <section id="register" className="py-24">
      <div className="container mx-auto px-4 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-xl border border-border bg-card/50 p-8 neon-glow"
        >
          <h2 className="text-3xl font-bold text-gradient mb-8 text-center">Register Now</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="college">College</Label>
              <Input
                id="college"
                placeholder="Your College Name"
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label>Select Event</Label>
              <Select
                value={form.selected_event}
                onValueChange={(v) => setForm({ ...form, selected_event: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {eventOptions.map((ev) => (
                    <SelectItem key={ev} value={ev}>
                      {ev}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full neon-glow" size="lg" disabled={loading}>
              {loading ? "Submitting..." : "Register"}
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default Registration;
