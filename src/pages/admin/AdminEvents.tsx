import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface EventRow {
  id: string;
  name: string;
  icon: string | null;
  category: string;
  is_active: boolean;
  regCount: number;
}

const AdminEvents = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: evts }, { data: regs }] = await Promise.all([
        supabase.from("events").select("id, name, icon, category, is_active").order("category"),
        supabase.from("registrations").select("event_id"),
      ]);
      if (evts) {
        const countMap = new Map<string, number>();
        regs?.forEach((r) => countMap.set(r.event_id, (countMap.get(r.event_id) || 0) + 1));
        setEvents(evts.map((e) => ({ ...e, regCount: countMap.get(e.id) || 0 })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("events").update({ is_active: !current }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, is_active: !current } : e)));
  };

  const catColor: Record<string, string> = {
    technical: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    gaming: "bg-red-500/15 text-red-400 border-red-500/30",
    cultural: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Event Management</h2>
      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Event</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Category</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Registrations</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-medium">Active</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-border/50 hover:bg-muted/10">
                <td className="px-4 py-3 font-medium text-foreground">
                  {e.icon} {e.name}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={catColor[e.category]}>{e.category}</Badge>
                </td>
                <td className="px-4 py-3 text-foreground font-semibold">{e.regCount}</td>
                <td className="px-4 py-3">
                  <Switch checked={e.is_active} onCheckedChange={() => toggleActive(e.id, e.is_active)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminEvents;
