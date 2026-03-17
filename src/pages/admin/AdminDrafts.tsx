import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRefresh } from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Phone, Mail, CheckCircle, Search, RefreshCw, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Draft {
  id: string;
  event_id: string;
  event_name: string;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  college_name: string;
  semester: string | null;
  team_name: string | null;
  members: any;
  status: string;
  created_at: string;
  updated_at: string;
}

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const AdminDrafts = () => {
  const refreshKey = useAdminRefresh();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("abandoned");

  const fetchDrafts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("registration_drafts" as any)
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setDrafts(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchDrafts(); }, [refreshKey]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-drafts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "registration_drafts" }, () => {
        fetchDrafts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const eventNames = useMemo(() => {
    const names = new Set(drafts.map(d => d.event_name).filter(Boolean));
    return Array.from(names).sort();
  }, [drafts]);

  const filtered = useMemo(() => {
    let list = drafts;
    if (statusFilter !== "all") list = list.filter(d => d.status === statusFilter);
    if (eventFilter !== "all") list = list.filter(d => d.event_name === eventFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.leader_name.toLowerCase().includes(q) ||
        d.leader_email.toLowerCase().includes(q) ||
        d.leader_phone.includes(q) ||
        (d.college_name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [drafts, search, eventFilter, statusFilter]);

  const markContacted = async (id: string) => {
    await supabase.from("registration_drafts" as any)
      .update({ status: "contacted" } as any)
      .eq("id", id);
    toast.success("Marked as contacted");
    fetchDrafts();
  };

  const getMemberCount = (members: any) => {
    if (!members) return 0;
    if (Array.isArray(members)) return members.length;
    return 0;
  };

  const abandonedCount = drafts.filter(d => d.status === "abandoned").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Abandoned Leads</h2>
          <p className="text-sm text-muted-foreground">
            Participants who filled details but didn't complete registration
            {abandonedCount > 0 && (
              <Badge variant="destructive" className="ml-2">{abandonedCount} pending</Badge>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDrafts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone, college..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {eventNames.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="abandoned">Abandoned</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Leader</TableHead>
              <TableHead className="hidden md:table-cell">College</TableHead>
              <TableHead className="hidden lg:table-cell">Team</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">When</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {loading ? "Loading..." : "No abandoned leads found"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(draft => (
                <TableRow key={draft.id}>
                  <TableCell className="font-medium text-sm max-w-[120px] truncate">
                    {draft.event_name}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{draft.leader_name}</div>
                    <div className="text-xs text-muted-foreground">{draft.leader_email}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {draft.college_name}
                    {draft.semester && <span className="text-muted-foreground ml-1">({draft.semester})</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {draft.team_name && <div>{draft.team_name}</div>}
                    {getMemberCount(draft.members) > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" /> +{getMemberCount(draft.members)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <a href={`tel:${draft.leader_phone}`} title="Call">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-400">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </a>
                      <a href={`mailto:${draft.leader_email}`} title="Email">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-400">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      draft.status === "abandoned" ? "destructive" :
                      draft.status === "contacted" ? "secondary" : "default"
                    }>
                      {draft.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {timeAgo(draft.updated_at)}
                  </TableCell>
                  <TableCell>
                    {draft.status === "abandoned" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markContacted(draft.id)}
                        className="text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Contacted
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Showing {filtered.length} of {drafts.length} total leads • Auto-syncs in real-time
      </p>
    </div>
  );
};

export default AdminDrafts;
