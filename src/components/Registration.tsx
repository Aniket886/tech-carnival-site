import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EventOption {
  id: string;
  name: string;
}

const Registration = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [form, setForm] = useState({
    leader_name: "",
    leader_email: "",
    leader_phone: "",
    college_name: "",
    event_id: "",
    team_name: "",
    semester: "",
  });

  useEffect(() => {
    supabase
      .from("events")
      .select("id, name")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) setEvents(data);
      });
  }, []);

  // Listen for preselect-event from Events section
  useEffect(() => {
    const handler = (e: Event) => {
      const eventName = (e as CustomEvent).detail;
      const match = events.find((ev) => ev.name === eventName);
      if (match) setForm((prev) => ({ ...prev, event_id: match.id }));
    };
    window.addEventListener("preselect-event", handler);
    return () => window.removeEventListener("preselect-event", handler);
  }, [events]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leader_name || !form.leader_email || !form.leader_phone || !form.college_name || !form.event_id) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("registrations").insert([{
      event_id: form.event_id,
      leader_name: form.leader_name,
      leader_email: form.leader_email,
      leader_phone: form.leader_phone,
      college_name: form.college_name,
      team_name: form.team_name || null,
      semester: form.semester || null,
    }]);
    setLoading(false);

    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🎉 Registration successful!", description: "See you at Tech Carnival!" });
      setForm({ leader_name: "", leader_email: "", leader_phone: "", college_name: "", event_id: "", team_name: "", semester: "" });
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
              <Label htmlFor="leader_name">Full Name *</Label>
              <Input id="leader_name" placeholder="John Doe" value={form.leader_name} onChange={(e) => setForm({ ...form, leader_name: e.target.value })} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leader_email">Email *</Label>
              <Input id="leader_email" type="email" placeholder="john@example.com" value={form.leader_email} onChange={(e) => setForm({ ...form, leader_email: e.target.value })} maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leader_phone">Phone *</Label>
              <Input id="leader_phone" placeholder="+91 9876543210" value={form.leader_phone} onChange={(e) => setForm({ ...form, leader_phone: e.target.value })} maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="college_name">College *</Label>
              <Input id="college_name" placeholder="Your College Name" value={form.college_name} onChange={(e) => setForm({ ...form, college_name: e.target.value })} maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team_name">Team Name (if applicable)</Label>
              <Input id="team_name" placeholder="Team Alpha" value={form.team_name} onChange={(e) => setForm({ ...form, team_name: e.target.value })} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input id="semester" placeholder="e.g., 4th Sem" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label>Select Event *</Label>
              <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
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
