import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, Download, ChevronLeft, ChevronRight, Users, Filter, X,
} from "lucide-react";

interface Registration {
  id: string;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  college_name: string;
  team_name: string | null;
  event_id: string;
  registration_status: string;
  amount_paid: string | null;
  utr_number: string | null;
  source: string;
  semester: string | null;
  created_at: string;
  members: any;
}

interface EventInfo {
  id: string;
  name: string;
}

const PAGE_SIZE = 20;

const AdminRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: regs }, { data: evts }] = await Promise.all([
        supabase
          .from("registrations")
          .select("id, leader_name, leader_email, leader_phone, college_name, team_name, event_id, registration_status, amount_paid, utr_number, source, semester, created_at, members")
          .order("created_at", { ascending: false }),
        supabase.from("events").select("id, name"),
      ]);
      setRegistrations(regs || []);
      setEvents(evts || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const eventMap = useMemo(() => {
    const m = new Map<string, string>();
    events.forEach(e => m.set(e.id, e.name));
    return m;
  }, [events]);

  const filtered = useMemo(() => {
    let data = registrations;

    if (statusFilter !== "all") {
      data = data.filter(r => r.registration_status === statusFilter);
    }
    if (eventFilter !== "all") {
      data = data.filter(r => r.event_id === eventFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        r.leader_name.toLowerCase().includes(q) ||
        r.leader_email.toLowerCase().includes(q) ||
        r.leader_phone.includes(q) ||
        r.college_name.toLowerCase().includes(q) ||
        (r.team_name && r.team_name.toLowerCase().includes(q)) ||
        (r.utr_number && r.utr_number.toLowerCase().includes(q))
      );
    }
    return data;
  }, [registrations, search, statusFilter, eventFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search, statusFilter, eventFilter]);

  const statuses = useMemo(() => {
    const set = new Set(registrations.map(r => r.registration_status));
    return Array.from(set).sort();
  }, [registrations]);

  const getMemberCount = (members: any): number => {
    if (!members) return 0;
    if (Array.isArray(members)) return members.length;
    return 0;
  };

  const exportCSV = () => {
    const headers = [
      "Leader Name", "Email", "Phone", "College", "Team Name", "Event",
      "Status", "Amount Paid", "UTR", "Source", "Semester", "Members", "Date",
    ];
    const rows = filtered.map(r => [
      r.leader_name,
      r.leader_email,
      r.leader_phone,
      r.college_name,
      r.team_name || "",
      eventMap.get(r.event_id) || r.event_id,
      r.registration_status,
      r.amount_paid || "",
      r.utr_number || "",
      r.source,
      r.semester || "",
      getMemberCount(r.members),
      new Date(r.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} registrations`);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${styles[status] || "bg-muted text-muted-foreground border-border"}`}>
        {status}
      </span>
    );
  };

  const hasActiveFilters = statusFilter !== "all" || eventFilter !== "all" || search.trim() !== "";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users size={20} className="text-primary" /> Registrations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} of {registrations.length} registrations
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0} className="gap-2">
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, email, phone, college, UTR…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-muted/30"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-muted/30">
                <Filter size={14} className="mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map(s => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-muted/30">
                <SelectValue placeholder="Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setSearch(""); setStatusFilter("all"); setEventFilter("all"); }}>
                <X size={14} className="mr-1" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border overflow-hidden">
        {loading ? (
          <CardContent className="p-10 text-center text-muted-foreground">Loading…</CardContent>
        ) : paged.length === 0 ? (
          <CardContent className="p-10 text-center text-muted-foreground">
            {hasActiveFilters ? "No registrations match your filters." : "No registrations yet."}
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground font-medium">Name</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Email</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Phone</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">College</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Event</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Team</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Amount</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(r => (
                  <TableRow key={r.id} className="border-border">
                    <TableCell className="text-sm font-medium text-foreground whitespace-nowrap">{r.leader_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.leader_email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{r.leader_phone}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{r.college_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{eventMap.get(r.event_id) || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.team_name || "—"}</TableCell>
                    <TableCell>{statusBadge(r.registration_status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{r.amount_paid ? `₹${r.amount_paid}` : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </Button>
              <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminRegistrations;
