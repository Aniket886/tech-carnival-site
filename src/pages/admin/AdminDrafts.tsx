import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Phone, Mail, CheckCircle, Search, RefreshCw, Users, Trash2, Download, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useIsOwner } from "@/hooks/useIsOwner";

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
  const isOwner = useIsOwner();
  const refreshKey = useAdminRefresh();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("abandoned");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "single"; id: string } | { type: "all" } | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const deleteTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

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
    let list = drafts.filter(d => !pendingDeletes.has(d.id));
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
  }, [drafts, search, eventFilter, statusFilter, pendingDeletes]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, eventFilter, statusFilter, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedDrafts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const markContacted = async (id: string) => {
    await supabase.from("registration_drafts" as any)
      .update({ status: "contacted" } as any)
      .eq("id", id);
    toast.success("Marked as contacted");
    fetchDrafts();
  };

  const permanentlyDelete = useCallback(async (ids: string[]) => {
    for (const id of ids) {
      await supabase.from("registration_drafts" as any).delete().eq("id", id);
    }
    setPendingDeletes(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
    deleteTimers.current.forEach((_, key) => {
      if (ids.includes(key)) deleteTimers.current.delete(key);
    });
    fetchDrafts();
  }, []);

  const undoDelete = useCallback((ids: string[]) => {
    ids.forEach(id => {
      const timer = deleteTimers.current.get(id);
      if (timer) clearTimeout(timer);
      deleteTimers.current.delete(id);
    });
    setPendingDeletes(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
    toast.info("Delete undone");
  }, []);

  const scheduleDeletion = useCallback((ids: string[]) => {
    setPendingDeletes(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
    setDeleteTarget(null);

    const label = ids.length === 1 ? "Lead deleted" : `${ids.length} leads deleted`;

    // Set individual timers for permanent deletion
    const batchKey = `batch-${Date.now()}`;
    const timer = setTimeout(() => {
      permanentlyDelete(ids);
    }, 3000);
    ids.forEach(id => deleteTimers.current.set(id, timer));

    toast(label, {
      action: {
        label: "Undo",
        onClick: () => undoDelete(ids),
      },
      duration: 3000,
    });
  }, [permanentlyDelete, undoDelete]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "single") {
      scheduleDeletion([deleteTarget.id]);
    } else {
      const ids = filtered.map(d => d.id);
      if (ids.length > 0) scheduleDeletion(ids);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      deleteTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const getMemberCount = (members: any) => {
    if (!members) return 0;
    if (Array.isArray(members)) return members.length;
    return 0;
  };

  const abandonedCount = drafts.filter(d => d.status === "abandoned").length;

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const headers = ["Event", "Leader Name", "Email", "Phone", "College", "Semester", "Team Name", "Members", "Status", "Updated At"];
    const rows = filtered.map(d => [
      d.event_name,
      d.leader_name,
      d.leader_email,
      d.leader_phone,
      d.college_name,
      d.semester || "",
      d.team_name || "",
      getMemberCount(d.members),
      d.status,
      new Date(d.updated_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abandoned-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} leads`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Abandoned Leads</h2>
          <p className="text-sm text-muted-foreground">
            <span>Participants who filled details but didn't complete registration</span>
            {abandonedCount > 0 && (
              <Badge variant="destructive" className="ml-2">{abandonedCount} pending</Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
            {filtered.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  <Download className="h-4 w-4 mr-1" /> Export CSV
                </Button>
                {isOwner && (
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget({ type: "all" })}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete All ({filtered.length})
                  </Button>
                )}
              </>
            )}
          <Button variant="outline" size="sm" onClick={fetchDrafts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
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
              paginatedDrafts.map(draft => (
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
                      <a href={`https://wa.me/91${draft.leader_phone}?text=${encodeURIComponent(`Hi ${draft.leader_name}, we noticed you started registering for ${draft.event_name} at Tech Carnival but didn't complete it. Need any help?`)}`} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:text-emerald-400">
                          <MessageCircle className="h-4 w-4" />
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
                    <div className="flex gap-1">
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
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget({ type: "single", id: draft.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} leads
          </span>
          <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
            <SelectTrigger className="w-[70px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 15, 25, 50].map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>per page</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
              Previous
            </Button>
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
              ) : (
                <Button
                  key={p}
                  variant={currentPage === p ? "secondary" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "all" ? "Delete all filtered leads?" : "Delete this lead?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "all"
                ? `This will permanently delete ${filtered.length} lead(s). This action cannot be undone.`
                : "This will permanently remove this abandoned lead. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDrafts;
