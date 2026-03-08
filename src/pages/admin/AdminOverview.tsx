import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Users, Clock, CheckCircle2, Activity } from "lucide-react";

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
  technical: number;
  gaming: number;
  cultural: number;
  uniqueEmails: number;
}

interface SyncEvent {
  id: string;
  update_type: string;
  sync_status: string;
  created_at: string;
  event_name?: string;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({
    total: 0, pending: 0, confirmed: 0, rejected: 0,
    technical: 0, gaming: 0, cultural: 0, uniqueEmails: 0,
  });
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);
  const [apiCallsToday, setApiCallsToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [{ data: regs }, { data: events }, { data: updates }] = await Promise.all([
        supabase.from("registrations").select("id, registration_status, leader_email, event_id"),
        supabase.from("events").select("id, category, name"),
        supabase.from("event_updates").select("id, update_type, sync_status, created_at, event_id").order("created_at", { ascending: false }).limit(10),
      ]);

      if (!regs || !events) { setLoading(false); return; }

      const eventMap = new Map(events.map((e) => [e.id, e]));
      const uniqueEmails = new Set(regs.map((r) => r.leader_email)).size;

      setStats({
        total: regs.length,
        pending: regs.filter((r) => r.registration_status === "pending").length,
        confirmed: regs.filter((r) => r.registration_status === "confirmed").length,
        rejected: regs.filter((r) => r.registration_status === "rejected").length,
        technical: regs.filter((r) => eventMap.get(r.event_id)?.category === "technical").length,
        gaming: regs.filter((r) => eventMap.get(r.event_id)?.category === "gaming").length,
        cultural: regs.filter((r) => eventMap.get(r.event_id)?.category === "cultural").length,
        uniqueEmails,
      });

      if (updates) {
        setSyncEvents(updates.map((u) => ({
          ...u,
          event_name: eventMap.get(u.event_id)?.name || "Unknown",
        })));
        const today = new Date().toISOString().split("T")[0];
        setApiCallsToday(updates.filter((u) => u.created_at.startsWith(today)).length);
      }

      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-muted-foreground">Loading stats...</div>;

  const cards = [
    { label: "Total Registrations", value: stats.total, icon: ClipboardList, color: "text-primary" },
    { label: "Unique Participants", value: stats.uniqueEmails, icon: Users, color: "text-blue-400" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-400" },
    { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2, color: "text-green-400" },
  ];

  const catCards = [
    { label: "Technical", value: stats.technical, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Gaming", value: stats.gaming, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Cultural", value: stats.cultural, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Rejected", value: stats.rejected, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="bg-card/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {catCards.map((c) => (
          <Card key={c.label} className={`${c.bg} border-border`}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sync Monitor */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> API Sync Monitor
          </CardTitle>
          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
            {apiCallsToday} calls today
          </Badge>
        </CardHeader>
        <CardContent>
          {syncEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">No API activity yet.</p>
          ) : (
            <div className="space-y-2">
              {syncEvents.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 text-xs">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      ev.update_type === "registration" ? "text-blue-400 border-blue-500/30" :
                      ev.update_type === "result" ? "text-green-400 border-green-500/30" :
                      "text-yellow-400 border-yellow-500/30"
                    }`}
                  >
                    {ev.update_type}
                  </Badge>
                  <span className="text-foreground">{ev.event_name}</span>
                  <Badge variant="outline" className="text-[10px]">{ev.sync_status}</Badge>
                  <span className="text-muted-foreground ml-auto">{new Date(ev.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
