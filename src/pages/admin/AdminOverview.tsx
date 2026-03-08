import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users, CalendarDays, Building2, Trophy, MessageSquare,
  CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, Clock,
  Cpu, Gamepad2, Palette,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

interface Stats {
  totalRegistrations: number;
  totalEvents: number;
  activeEvents: number;
  totalColleges: number;
  totalMessages: number;
  pendingPayments: number;
  confirmedPayments: number;
  categoryBreakdown: { name: string; count: number }[];
  recentRegistrations: any[];
  registrationsByEvent: { name: string; count: number }[];
  registrationsByDay: { date: string; count: number }[];
  statusBreakdown: { name: string; value: number }[];
}

const COLORS = [
  "hsl(195, 100%, 50%)",
  "hsl(270, 80%, 60%)",
  "hsl(150, 70%, 50%)",
  "hsl(45, 90%, 55%)",
  "hsl(0, 84%, 60%)",
];

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: totalRegistrations },
        { data: events },
        { count: totalColleges },
        { count: totalMessages },
        { data: registrations },
      ] = await Promise.all([
        supabase.from("registrations").select("*", { count: "exact", head: true }),
        supabase.from("events").select("id, name, is_active, category"),
        supabase.from("colleges").select("*", { count: "exact", head: true }),
        supabase.from("contacts").select("*", { count: "exact", head: true }),
        supabase.from("registrations").select("id, event_id, registration_status, created_at, leader_name, leader_email, college_name, amount_paid").order("created_at", { ascending: false }).limit(200),
      ]);

      const totalEvents = events?.length || 0;
      const activeEvents = events?.filter(e => e.is_active).length || 0;

      // Category breakdown
      const catMap: Record<string, number> = {};
      events?.forEach(e => {
        const cat = e.category || "Other";
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      const categoryBreakdown = Object.entries(catMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const pendingPayments = registrations?.filter(r => r.registration_status === "pending").length || 0;
      const confirmedPayments = registrations?.filter(r => r.registration_status === "confirmed").length || 0;

      // Registrations by event
      const eventMap = new Map<string, string>();
      events?.forEach(e => eventMap.set(e.id, e.name));

      const byEvent: Record<string, number> = {};
      registrations?.forEach(r => {
        const name = eventMap.get(r.event_id) || "Unknown";
        byEvent[name] = (byEvent[name] || 0) + 1;
      });
      const registrationsByEvent = Object.entries(byEvent)
        .map(([name, count]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Registrations by day (last 14 days)
      const dayMap: Record<string, number> = {};
      const now = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dayMap[d.toISOString().slice(0, 10)] = 0;
      }
      registrations?.forEach(r => {
        const day = r.created_at.slice(0, 10);
        if (day in dayMap) dayMap[day]++;
      });
      const registrationsByDay = Object.entries(dayMap).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count,
      }));

      // Status breakdown
      const statusMap: Record<string, number> = {};
      registrations?.forEach(r => {
        const s = r.registration_status || "unknown";
        statusMap[s] = (statusMap[s] || 0) + 1;
      });
      const statusBreakdown = Object.entries(statusMap).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      const recentRegistrations = (registrations || []).slice(0, 5);

      setStats({
        totalRegistrations: totalRegistrations || 0,
        totalEvents,
        activeEvents,
        totalColleges: totalColleges || 0,
        totalMessages: totalMessages || 0,
        pendingPayments,
        confirmedPayments,
        recentRegistrations,
        registrationsByEvent,
        registrationsByDay,
        statusBreakdown,
      });
      setLoading(false);
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <CardContent className="p-6"><div className="h-16 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "Total Registrations", value: stats.totalRegistrations, icon: Users, color: "text-primary", trend: stats.confirmedPayments > 0 ? `${Math.round((stats.confirmedPayments / stats.totalRegistrations) * 100)}% confirmed` : null, up: true },
    { label: "Active Events", value: `${stats.activeEvents}/${stats.totalEvents}`, icon: CalendarDays, color: "text-secondary", trend: null, up: true },
    { label: "Colleges", value: stats.totalColleges, icon: Building2, color: "text-emerald-400", trend: null, up: true },
    { label: "Pending Payments", value: stats.pendingPayments, icon: CreditCard, color: "text-amber-400", trend: stats.pendingPayments > 0 ? "Needs attention" : "All clear", up: stats.pendingPayments === 0 },
    { label: "Confirmed", value: stats.confirmedPayments, icon: Trophy, color: "text-primary", trend: null, up: true },
    { label: "Messages", value: stats.totalMessages, icon: MessageSquare, color: "text-secondary", trend: null, up: true },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((s, i) => (
          <Card key={i} className="bg-card border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <s.icon size={20} className={s.color} />
                {s.trend && (
                  <span className={`text-xs flex items-center gap-1 ${s.up ? "text-emerald-400" : "text-amber-400"}`}>
                    {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {s.trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Trend */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Registration Trend (14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.registrationsByDay}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(195, 100%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(195, 100%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 18%)" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(230, 20%, 8%)", border: "1px solid hsl(230, 15%, 18%)", borderRadius: 8, color: "hsl(210, 40%, 95%)" }}
                    labelStyle={{ color: "hsl(215, 20%, 55%)" }}
                  />
                  <Area type="monotone" dataKey="count" stroke="hsl(195, 100%, 50%)" fill="url(#colorCount)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Registration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {stats.statusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {stats.statusBreakdown.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(230, 20%, 8%)", border: "1px solid hsl(230, 15%, 18%)", borderRadius: 8, color: "hsl(210, 40%, 95%)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">No data yet</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {stats.statusBreakdown.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations by Event */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <CalendarDays size={16} className="text-secondary" />
              Registrations by Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {stats.registrationsByEvent.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.registrationsByEvent} layout="vertical" margin={{ left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 18%)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip
                      contentStyle={{ background: "hsl(230, 20%, 8%)", border: "1px solid hsl(230, 15%, 18%)", borderRadius: 8, color: "hsl(210, 40%, 95%)" }}
                    />
                    <Bar dataKey="count" fill="hsl(270, 80%, 60%)" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No registrations yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Registrations */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              Recent Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentRegistrations.length > 0 ? (
              <div className="space-y-3">
                {stats.recentRegistrations.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.leader_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.college_name}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        r.registration_status === "confirmed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : r.registration_status === "pending"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {r.registration_status}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No registrations yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
