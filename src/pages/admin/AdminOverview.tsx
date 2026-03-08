import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, CheckCircle, CreditCard, Clock, Gamepad2, Cpu, Palette,
  TrendingUp, Download, Zap, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

interface OverviewData {
  totalRegistrations: number;
  uniqueParticipants: number;
  totalRevenue: number;
  confirmed: number;
  pending: number;
  categoryBreakdown: { name: string; count: number; icon: any; color: string }[];
  paymentByDay: { date: string; count: number }[];
  statusBreakdown: { name: string; value: number }[];
  categoryRevenue: { name: string; revenue: number; color: string }[];
  events: { id: string; name: string; syncCount: number; lastSync: string | null }[];
}

const STATUS_COLORS = [
  "hsl(45, 90%, 55%)",   // Pending - amber
  "hsl(150, 70%, 50%)",  // Confirmed - green
  "hsl(0, 84%, 60%)",    // Rejected - red
];

const CATEGORY_META: Record<string, { icon: any; color: string; barColor: string }> = {
  technical: { icon: Cpu, color: "text-primary", barColor: "hsl(0, 84%, 60%)" },
  gaming: { icon: Gamepad2, color: "text-sky-400", barColor: "hsl(195, 100%, 50%)" },
  cultural: { icon: Palette, color: "text-emerald-400", barColor: "hsl(150, 70%, 50%)" },
  general: { icon: Activity, color: "text-amber-400", barColor: "hsl(45, 90%, 55%)" },
};

const AdminOverview = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [
        { data: registrations },
        { data: events },
        { data: eventUpdates },
      ] = await Promise.all([
        supabase.from("registrations").select("id, event_id, registration_status, created_at, leader_name, leader_email, amount_paid, college_name").order("created_at", { ascending: false }).limit(1000),
        supabase.from("events").select("id, name, category, is_active"),
        supabase.from("event_updates").select("event_id, created_at").order("created_at", { ascending: false }),
      ]);

      const regs = registrations || [];
      const evts = events || [];
      const updates = eventUpdates || [];

      const totalRegistrations = regs.length;
      const uniqueEmails = new Set(regs.map(r => r.leader_email));
      const uniqueParticipants = uniqueEmails.size;
      const totalRevenue = regs.reduce((sum, r) => sum + (parseFloat(r.amount_paid || "0") || 0), 0);
      const confirmed = regs.filter(r => r.registration_status === "confirmed").length;
      const pending = regs.filter(r => r.registration_status === "pending").length;

      // Category breakdown
      const eventMap = new Map<string, { name: string; category: string }>();
      evts.forEach(e => eventMap.set(e.id, { name: e.name, category: e.category }));

      const catCount: Record<string, number> = {};
      regs.forEach(r => {
        const cat = eventMap.get(r.event_id)?.category || "general";
        catCount[cat] = (catCount[cat] || 0) + 1;
      });
      const categoryBreakdown = Object.entries(catCount).map(([name, count]) => {
        const meta = CATEGORY_META[name.toLowerCase()] || CATEGORY_META.general;
        return { name: name.charAt(0).toUpperCase() + name.slice(1), count, icon: meta.icon, color: meta.color };
      });

      // Payment trends (last 7 days)
      const now = new Date();
      const dayMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dayMap[d.toISOString().slice(0, 10)] = 0;
      }
      regs.forEach(r => {
        const day = r.created_at.slice(0, 10);
        if (day in dayMap) {
          dayMap[day] += parseFloat(r.amount_paid || "0") || 0;
        }
      });
      const paymentByDay = Object.entries(dayMap).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short" }),
        count,
      }));

      // Status breakdown
      const statusMap: Record<string, number> = {};
      regs.forEach(r => {
        const s = r.registration_status || "unknown";
        statusMap[s] = (statusMap[s] || 0) + 1;
      });
      const statusOrder = ["pending", "confirmed", "rejected"];
      const statusBreakdown = statusOrder
        .filter(s => statusMap[s])
        .map((name, i) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value: statusMap[name] || 0,
        }));

      // Category-wise revenue
      const catRev: Record<string, number> = {};
      regs.forEach(r => {
        const cat = eventMap.get(r.event_id)?.category || "general";
        catRev[cat] = (catRev[cat] || 0) + (parseFloat(r.amount_paid || "0") || 0);
      });
      const categoryRevenue = Object.entries(catRev)
        .map(([name, revenue]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          revenue,
          color: (CATEGORY_META[name.toLowerCase()] || CATEGORY_META.general).barColor,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Event sync monitor
      const updateCountByEvent: Record<string, { count: number; last: string | null }> = {};
      updates.forEach(u => {
        if (!updateCountByEvent[u.event_id]) {
          updateCountByEvent[u.event_id] = { count: 0, last: null };
        }
        updateCountByEvent[u.event_id].count++;
        if (!updateCountByEvent[u.event_id].last || u.created_at > updateCountByEvent[u.event_id].last!) {
          updateCountByEvent[u.event_id].last = u.created_at;
        }
      });
      const eventsList = evts.map(e => ({
        id: e.id,
        name: e.name,
        syncCount: updateCountByEvent[e.id]?.count || 0,
        lastSync: updateCountByEvent[e.id]?.last || null,
      }));

      setData({
        totalRegistrations,
        uniqueParticipants,
        totalRevenue,
        confirmed,
        pending,
        categoryBreakdown,
        paymentByDay,
        statusBreakdown,
        categoryRevenue,
        events: eventsList,
      });
      setLoading(false);
    };

    fetch();
  }, []);

  const exportOverview = () => {
    if (!data) return;
    const lines = [
      `Overview Report - ${new Date().toLocaleDateString()}`,
      "",
      `Total Registrations,${data.totalRegistrations}`,
      `Unique Participants,${data.uniqueParticipants}`,
      `Total Revenue,₹${data.totalRevenue.toLocaleString()}`,
      `Confirmed,${data.confirmed}`,
      `Pending,${data.pending}`,
      "",
      "Category,Count",
      ...data.categoryBreakdown.map(c => `${c.name},${c.count}`),
      "",
      "Category,Revenue",
      ...data.categoryRevenue.map(c => `${c.name},₹${c.revenue.toLocaleString()}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `overview-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  if (!data) return null;

  const topCards = [
    { label: "Total Registrations", value: data.totalRegistrations, icon: Users, color: "text-primary" },
    { label: "Unique Participants", value: data.uniqueParticipants, icon: Users, color: "text-secondary" },
    { label: "Total Revenue", value: `₹${data.totalRevenue.toLocaleString()}`, icon: CreditCard, color: "text-emerald-400" },
    { label: "Confirmed", value: data.confirmed, icon: CheckCircle, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Overview</h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={exportOverview} className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
            <Download size={14} /> Export Overview
          </Button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topCards.map((c, i) => (
          <Card key={i} className="bg-card border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <c.icon size={16} className={c.color} />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category + Pending Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-border hover:border-amber-500/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-amber-400" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.pending}</p>
          </CardContent>
        </Card>
        {data.categoryBreakdown.map((cat, i) => (
          <Card key={i} className="bg-card border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <cat.icon size={16} className={cat.color} />
                <span className="text-xs text-muted-foreground">{cat.name}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{cat.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row: Payment Trends + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" />
                Payment Trends
              </CardTitle>
              <span className="text-xs text-muted-foreground border border-border rounded-md px-2 py-1">Last 7 days</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.paymentByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 flex items-center justify-center">
              {data.statusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data.statusBreakdown.map((_, idx) => (
                        <Cell key={idx} fill={STATUS_COLORS[idx % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">No data yet</p>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {data.statusBreakdown.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                  {s.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category-wise Revenue */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Category-wise Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {data.categoryRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryRevenue} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v.toLocaleString()}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={28}>
                    {data.categoryRevenue.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No revenue data yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Site Sync Monitor */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            Event Site Sync Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.events.map(evt => (
              <div key={evt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 min-w-0">
                  <Activity size={14} className="text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{evt.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {evt.lastSync ? `Last: ${new Date(evt.lastSync).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Never connected"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-xs font-mono text-muted-foreground">{evt.syncCount}</span>
                  <p className="text-[10px] text-muted-foreground">today</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
