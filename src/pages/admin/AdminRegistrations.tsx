import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, Search, ChevronDown, ChevronUp, Check, X, Trash2 } from "lucide-react";

interface Reg {
  id: string;
  team_name: string | null;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  college_name: string;
  semester: string | null;
  registration_status: string;
  source: string;
  members: Record<string, string>[] | null;
  created_at: string;
  event_id: string;
  events?: { name: string; category: string } | null;
}

interface EventOption { id: string; name: string; category: string }

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-green-500/15 text-green-400 border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
};

const AdminRegistrations = () => {
  const { toast } = useToast();
  const [regs, setRegs] = useState<Reg[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEvent, setFilterEvent] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    const [{ data: r }, { data: e }] = await Promise.all([
      supabase.from("registrations").select("*, events(name, category)").order("created_at", { ascending: false }),
      supabase.from("events").select("id, name, category"),
    ]);
    if (r) setRegs(r as unknown as Reg[]);
    if (e) setEvents(e);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    let list = regs;
    if (filterEvent !== "all") list = list.filter((r) => r.event_id === filterEvent);
    if (filterCategory !== "all") list = list.filter((r) => r.events?.category === filterCategory);
    if (filterStatus !== "all") list = list.filter((r) => r.registration_status === filterStatus);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((r) =>
        r.leader_name.toLowerCase().includes(s) ||
        r.leader_email.toLowerCase().includes(s) ||
        (r.team_name?.toLowerCase().includes(s) ?? false)
      );
    }
    return list;
  }, [regs, filterEvent, filterCategory, filterStatus, search]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("registrations").update({ registration_status: status }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setRegs((prev) => prev.map((r) => (r.id === id ? { ...r, registration_status: status } : r)));
      toast({ title: `Registration ${status}` });
    }
  };

  const deleteReg = async (id: string) => {
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setRegs((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Registration deleted" });
    }
  };

  const exportCSV = () => {
    const headers = ["S.No", "Team/Name", "Event", "Category", "Leader Email", "Phone", "College", "Semester", "Status", "Source", "Date"];
    const rows = filtered.map((r, i) => [
      i + 1, r.team_name || r.leader_name, r.events?.name || "", r.events?.category || "",
      r.leader_email, r.leader_phone, r.college_name, r.semester || "",
      r.registration_status, r.source, new Date(r.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "registrations.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Registrations ({filtered.length})</h2>
        <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, email, team..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterEvent} onValueChange={setFilterEvent}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Event" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="gaming">Gaming</SelectItem>
            <SelectItem value="cultural">Cultural</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="px-3 py-3 text-left text-muted-foreground font-medium">#</th>
              <th className="px-3 py-3 text-left text-muted-foreground font-medium">Team / Name</th>
              <th className="px-3 py-3 text-left text-muted-foreground font-medium">Event</th>
              <th className="px-3 py-3 text-left text-muted-foreground font-medium hidden md:table-cell">Email</th>
              <th className="px-3 py-3 text-left text-muted-foreground font-medium hidden lg:table-cell">College</th>
              <th className="px-3 py-3 text-left text-muted-foreground font-medium">Status</th>
              <th className="px-3 py-3 text-left text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <>
                <tr
                  key={r.id}
                  className="border-b border-border/50 hover:bg-muted/10 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  <td className="px-3 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {expandedId === r.id ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                      <div>
                        <p className="font-medium text-foreground">{r.team_name || r.leader_name}</p>
                        <p className="text-xs text-muted-foreground">{r.leader_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-foreground">{r.events?.name}</td>
                  <td className="px-3 py-3 text-muted-foreground hidden md:table-cell">{r.leader_email}</td>
                  <td className="px-3 py-3 text-muted-foreground hidden lg:table-cell">{r.college_name}</td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={statusColors[r.registration_status] || ""}>
                      {r.registration_status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {r.registration_status !== "confirmed" && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400 hover:text-green-300" onClick={() => updateStatus(r.id, "confirmed")}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {r.registration_status !== "rejected" && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => updateStatus(r.id, "rejected")}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteReg(r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
                {expandedId === r.id && (
                  <tr key={`${r.id}-expanded`} className="bg-muted/5">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Leader Details</p>
                          <p className="text-foreground">{r.leader_name}</p>
                          <p className="text-muted-foreground">{r.leader_email}</p>
                          <p className="text-muted-foreground">{r.leader_phone}</p>
                          <p className="text-muted-foreground">{r.college_name}</p>
                          {r.semester && <p className="text-muted-foreground">{r.semester} Semester</p>}
                        </div>
                        {r.members && Array.isArray(r.members) && r.members.length > 0 && (
                          <div>
                            <p className="text-muted-foreground mb-1">Team Members</p>
                            {r.members.map((m, j) => (
                              <div key={j} className="mb-2 text-xs">
                                <p className="text-foreground font-medium">{m.name}</p>
                                <p className="text-muted-foreground">{m.email} · {m.phone}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Source: {r.source} · Registered: {new Date(r.created_at).toLocaleString()}
                      </p>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No registrations found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRegistrations;
