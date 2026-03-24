import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";

import {
  Search, Download, ChevronDown, Check, XCircle, Trash2, AlertTriangle, Undo2,
} from "lucide-react";
import { useIsOwner } from "@/hooks/useIsOwner";

/* ─── types ─── */
interface Registration {
  id: string;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  college_name: string;
  college_id: string | null;
  team_name: string | null;
  event_id: string;
  registration_status: string;
  amount_paid: string | null;
  utr_number: string | null;
  transaction_id: string | null;
  source: string;
  semester: string | null;
  created_at: string;
  members: any;
}

interface CollegeInfo { id: string; name: string; city: string | null; state: string | null; }

interface EventInfo { id: string; name: string; icon: string | null; category: string; }

/* ─── helpers ─── */
const statusConfig: Record<string, { label: string; class: string }> = {
  confirmed: { label: "Confirmed", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  pending: { label: "Pending", class: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  rejected: { label: "Rejected", class: "bg-destructive/15 text-destructive border-destructive/30" },
};

const categoryConfig: Record<string, string> = {
  technical: "💻", gaming: "🎮", cultural: "🎭",
};

const AdminRegistrations = () => {
  const isOwner = useIsOwner();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [colleges, setColleges] = useState<CollegeInfo[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "single" | "bulk"; id?: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [{ data: regs }, { data: evts }, { data: cols }] = await Promise.all([
      supabase.from("registrations").select("*").order("created_at", { ascending: false }),
      supabase.from("events").select("id, name, icon, category"),
      supabase.from("colleges").select("id, name, city, state"),
    ]);
    setRegistrations(regs || []);
    setEvents(evts || []);
    setColleges(cols || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const eventMap = useMemo(() => {
    const m = new Map<string, EventInfo>();
    events.forEach(e => m.set(e.id, e));
    return m;
  }, [events]);

  const categories = useMemo(() => {
    const set = new Set(events.map(e => e.category));
    return Array.from(set).sort();
  }, [events]);

  const cities = useMemo(() => {
    const set = new Set(colleges.map(c => c.city).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [colleges]);


  const collegeIdMap = useMemo(() => {
    const m = new Map<string, CollegeInfo>();
    colleges.forEach(c => m.set(c.id, c));
    return m;
  }, [colleges]);

  const collegeNameMap = useMemo(() => {
    const m = new Map<string, CollegeInfo>();
    colleges.forEach(c => m.set(c.name.toLowerCase(), c));
    return m;
  }, [colleges]);

  const getCollegeInfo = useCallback((r: Registration) => {
    if (r.college_id) return collegeIdMap.get(r.college_id);
    return collegeNameMap.get(r.college_name.toLowerCase());
  }, [collegeIdMap, collegeNameMap]);

  /* ─── filtering ─── */
  const filtered = useMemo(() => {
    let data = registrations;
    if (statusFilter !== "all") data = data.filter(r => r.registration_status === statusFilter);
    if (eventFilter !== "all") data = data.filter(r => r.event_id === eventFilter);
    if (categoryFilter !== "all") {
      const catEventIds = new Set(events.filter(e => e.category === categoryFilter).map(e => e.id));
      data = data.filter(r => catEventIds.has(r.event_id));
    }
    if (cityFilter !== "all") {
      data = data.filter(r => {
        const col = getCollegeInfo(r);
        return col?.city === cityFilter;
      });
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
  }, [registrations, search, statusFilter, eventFilter, categoryFilter, cityFilter, stateFilter, events, getCollegeInfo]);

  /* ─── status update ─── */
  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("registrations").update({ registration_status: status }).eq("id", id);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(`Status updated to ${status}`);
    const reg = registrations.find(r => r.id === id);
    
    // Send email notification on confirm/reject
    if (status === "confirmed" || status === "rejected") {
      const reg = registrations.find(r => r.id === id);
      if (reg) {
        const ev = eventMap.get(reg.event_id);
        supabase.functions.invoke("send-email", {
          body: {
            type: status === "confirmed" ? "registration_confirmed" : "registration_rejected",
            to: reg.leader_email,
            leader_name: reg.leader_name,
            team_name: reg.team_name || undefined,
            registration_id: reg.id,
            event_name: ev?.name || "Event",
            event_date: ev ? undefined : undefined,
            event_venue: undefined,
          },
        }).catch(() => {});
        toast.info(`${status === "confirmed" ? "Confirmation" : "Rejection"} email sent to ${reg.leader_email}`);
      }
    }

    fetchData();
  };

  /* ─── delete single ─── */
  const deleteSingle = async (id: string) => {
    const reg = registrations.find(r => r.id === id);
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Registration deleted");
    
    setDeleteConfirm(null);
    fetchData();
  };

  /* ─── delete filtered ─── */
  const deleteFiltered = async () => {
    const ids = filtered.map(r => r.id);
    if (ids.length === 0) return;
    const { error } = await supabase.from("registrations").delete().in("id", ids);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success(`${ids.length} registrations deleted`);
    
    setDeleteConfirm(null);
    fetchData();
  };

  /* ─── CSV export ─── */
  const exportCSV = (andDelete = false) => {
    const maxMembers = Math.max(...filtered.map(r => Array.isArray(r.members) ? r.members.length : 0), 0);
    const memberHeaders = Array.from({ length: maxMembers }, (_, i) => [
      `Member ${i + 1} Name`, `Member ${i + 1} Email`, `Member ${i + 1} Phone`
    ]).flat();
    const headers = [
      "S.No", "Leader Name", "Email", "Phone", "College", "City", "State", "Team Name", "Event", "Category",
      "Status", "Amount Paid", "UTR", "Transaction ID", "Source", "Semester", ...memberHeaders, "Date",
    ];
    const rows = filtered.map((r, i) => {
      const ev = eventMap.get(r.event_id);
      const col = getCollegeInfo(r);
      const members = Array.isArray(r.members) ? r.members : [];
      const memberCells = Array.from({ length: maxMembers }, (_, j) => {
        const m = members[j];
        return [m?.name || "", m?.email || "", m?.phone || ""];
      }).flat();
      return [
        i + 1, r.leader_name, r.leader_email, r.leader_phone, r.college_name,
        col?.city || "", col?.state || "",
        r.team_name || "", ev?.name || "", ev?.category || "",
        r.registration_status, r.amount_paid || "", r.utr_number || "",
        r.transaction_id || "", r.source, r.semester || "", ...memberCells,
        new Date(r.created_at).toLocaleDateString(),
      ];
    });
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

    if (andDelete) deleteFiltered();
  };

  /* ─── members display ─── */
  const getMembers = (members: any): { name: string; phone?: string; email?: string }[] => {
    if (!members || !Array.isArray(members)) return [];
    return members;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-display font-bold text-foreground">
          Registrations ({registrations.length})
        </h2>
        <Button variant="outline" size="sm" onClick={() => exportCSV(false)} disabled={filtered.length === 0} className="gap-2">
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, team…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-full sm:w-44 bg-card border-border">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-card border-border">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-full sm:w-36 bg-card border-border">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {states.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-full sm:w-36 bg-card border-border">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36 bg-card border-border">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            No registrations found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground font-medium w-10">#</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Team / Name</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Event</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Email</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">College</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, idx) => {
                  const ev = eventMap.get(r.event_id);
                  const sc = statusConfig[r.registration_status] || statusConfig.pending;
                  const isExpanded = expandedId === r.id;
                  const members = getMembers(r.members);
                  return (
                    <>
                      <TableRow key={r.id} className="border-border cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                        <TableCell className="text-sm text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-foreground">{r.team_name || r.leader_name}</span>
                            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <span>{ev?.icon || categoryConfig[ev?.category || ""] || "🎯"}</span>
                            <span className="truncate max-w-[130px]">{ev?.name || "—"}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{r.leader_email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{r.college_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] capitalize ${sc.class}`}>
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <button title="Confirm" onClick={() => updateStatus(r.id, "confirmed")} disabled={r.registration_status === "confirmed"} className={`p-1.5 rounded-md transition-colors ${r.registration_status === "confirmed" ? "text-emerald-400/40 cursor-not-allowed" : "text-emerald-400 hover:bg-emerald-500/10"}`}><Check size={15} /></button>
                            <button title="Reject" onClick={() => updateStatus(r.id, "rejected")} disabled={r.registration_status === "confirmed"} className={`p-1.5 rounded-md transition-colors ${r.registration_status === "confirmed" ? "text-muted-foreground/30 cursor-not-allowed" : "text-destructive hover:bg-destructive/10"}`}><XCircle size={15} /></button>
                            {r.registration_status === "confirmed" && (
                              <button title="Undo (set back to pending)" onClick={() => updateStatus(r.id, "pending")} className="p-1.5 rounded-md text-amber-400 hover:bg-amber-500/10 transition-colors"><Undo2 size={15} /></button>
                            )}
                            {isOwner && <button title="Delete" onClick={() => setDeleteConfirm({ type: "single", id: r.id })} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={15} /></button>}
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${r.id}-detail`} className="border-border bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={7} className="py-4 px-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-sm">
                              <p><span className="text-muted-foreground">Leader:</span> <span className="font-medium text-foreground">{r.leader_name}</span></p>
                              <p><span className="text-muted-foreground">Phone:</span> <span className="font-medium text-foreground">{r.leader_phone}</span></p>
                              <p><span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground">{r.leader_email}</span></p>
                              <p><span className="text-muted-foreground">Semester:</span> <span className="font-medium text-foreground">{r.semester || "—"}</span></p>
                              <p><span className="text-muted-foreground">College:</span> <span className="font-medium text-foreground">{r.college_name || "—"}</span></p>
                              {(() => { const col = getCollegeInfo(r); return <>
                                <p><span className="text-muted-foreground">City:</span> <span className="font-medium text-foreground">{col?.city || "—"}</span></p>
                                <p><span className="text-muted-foreground">State:</span> <span className="font-medium text-foreground">{col?.state || "—"}</span></p>
                              </>; })()}
                              <p><span className="text-muted-foreground">Event:</span> <span className="font-medium text-foreground">{ev?.icon || ""} {ev?.name || "—"}</span></p>
                              <p><span className="text-muted-foreground">Category:</span> <span className="font-medium text-foreground capitalize">{ev?.category || "—"}</span></p>
                              <p><span className="text-muted-foreground">Date:</span> <span className="font-medium text-foreground">{new Date(r.created_at).toLocaleString("en-IN")}</span></p>
                              <p><span className="text-muted-foreground">Amount Paid:</span> <span className="font-medium text-foreground">{r.amount_paid ? `₹${r.amount_paid}` : "—"}</span></p>
                              <p><span className="text-muted-foreground">UTR Number:</span> <span className="font-medium text-foreground">{r.utr_number || "—"}</span></p>
                              <p><span className="text-muted-foreground">Transaction ID:</span> <span className="font-medium text-foreground">{r.transaction_id || "—"}</span></p>
                            </div>
                            {members.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs text-muted-foreground mb-1.5">Team Members:</p>
                                <div className="space-y-0.5">
                                  {members.map((m, i) => (
                                    <p key={i} className="text-sm text-foreground">
                                      {i + 1}. {m.name}{m.email ? ` — ${m.email}` : ""}{m.phone ? ` — ${m.phone}` : ""}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Danger Zone - Owner Only */}
      {isOwner && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="text-destructive mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-destructive">Data Management — Danger Zone</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cloud storage is limited. Export your data as CSV before deleting to keep a local backup. Deleted data cannot be recovered.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" size="sm" className="gap-2" onClick={() => exportCSV(true)} disabled={filtered.length === 0}>
              <Download size={14} /> Export & Delete All ({filtered.length})
            </Button>
            <Button variant="outline" size="sm" className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirm({ type: "bulk" })} disabled={filtered.length === 0}>
              <Trash2 size={14} /> Delete Filtered ({filtered.length})
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === "single"
                ? "This registration will be permanently deleted."
                : `${filtered.length} registrations will be permanently deleted. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm?.type === "single" && deleteConfirm.id) deleteSingle(deleteConfirm.id);
                else deleteFiltered();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRegistrations;
