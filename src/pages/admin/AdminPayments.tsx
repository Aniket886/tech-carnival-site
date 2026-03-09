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
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Search, Download, ChevronDown, CheckCircle2, XCircle, AlertTriangle, RotateCcw, IndianRupee, Undo2, ImageIcon,
} from "lucide-react";
import { useIsOwner } from "@/hooks/useIsOwner";

/* ─── types ─── */
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
  transaction_id: string | null;
  payment_screenshot_url: string | null;
  members: any;
  created_at: string;
  semester: string | null;
}

interface EventInfo { id: string; name: string; icon: string | null; category: string; }

const statusConfig: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "Confirmed", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  rejected: { label: "Rejected", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

const categoryIcon: Record<string, string> = { technical: "💻", gaming: "🎮", cultural: "🎭" };

const AdminPayments = () => {
  const isOwner = useIsOwner();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dupsOnly, setDupsOnly] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [{ data: regs }, { data: evts }] = await Promise.all([
      supabase.from("registrations").select("*").order("created_at", { ascending: false }),
      supabase.from("events").select("id, name, icon, category"),
    ]);
    setRegistrations(regs || []);
    setEvents(evts || []);
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

  /* ─── duplicate detection ─── */
  const duplicateIds = useMemo(() => {
    const utrMap = new Map<string, string[]>();
    const txMap = new Map<string, string[]>();
    registrations.forEach(r => {
      if (r.utr_number) {
        const key = r.utr_number.toLowerCase().trim();
        if (key) utrMap.set(key, [...(utrMap.get(key) || []), r.id]);
      }
      if (r.transaction_id) {
        const key = r.transaction_id.toLowerCase().trim();
        if (key) txMap.set(key, [...(txMap.get(key) || []), r.id]);
      }
    });
    const ids = new Set<string>();
    utrMap.forEach(arr => { if (arr.length > 1) arr.forEach(id => ids.add(id)); });
    txMap.forEach(arr => { if (arr.length > 1) arr.forEach(id => ids.add(id)); });
    return ids;
  }, [registrations]);

  /* ─── filtering ─── */
  const filtered = useMemo(() => {
    let data = registrations;
    if (statusFilter !== "all") data = data.filter(r => r.registration_status === statusFilter);
    if (dupsOnly) data = data.filter(r => duplicateIds.has(r.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        r.leader_name.toLowerCase().includes(q) ||
        (r.utr_number && r.utr_number.toLowerCase().includes(q)) ||
        (r.transaction_id && r.transaction_id.toLowerCase().includes(q)) ||
        (r.team_name && r.team_name.toLowerCase().includes(q))
      );
    }
    return data;
  }, [registrations, search, statusFilter, dupsOnly, duplicateIds]);

  /* ─── stats ─── */
  const stats = useMemo(() => {
    const total = registrations.length;
    const totalAmount = registrations.reduce((s, r) => s + (parseFloat(r.amount_paid || "0") || 0), 0);
    const confirmedAmount = registrations
      .filter(r => r.registration_status === "confirmed")
      .reduce((s, r) => s + (parseFloat(r.amount_paid || "0") || 0), 0);
    return { total, totalAmount, confirmedAmount, duplicates: duplicateIds.size };
  }, [registrations, duplicateIds]);

  /* ─── actions ─── */
  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("registrations").update({ registration_status: status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Status → ${status}`);

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
          },
        }).catch(() => {});
        toast.info(`${status === "confirmed" ? "Confirmation" : "Rejection"} email sent to ${reg.leader_email}`);
      }
    }

    fetchData();
  };

  const resetAllPending = async () => {
    const pendingIds = registrations.filter(r => r.registration_status !== "pending").map(r => r.id);
    if (pendingIds.length === 0) { toast.info("All already pending"); setResetConfirm(false); return; }
    const { error } = await supabase.from("registrations").update({ registration_status: "pending" }).in("id", pendingIds);
    if (error) { toast.error("Failed to reset"); return; }
    toast.success(`${pendingIds.length} registrations reset to pending`);
    setResetConfirm(false);
    fetchData();
  };

  const exportCSV = () => {
    const headers = ["S.No", "Name", "Team", "Event", "Amount", "UTR", "Transaction ID", "Status", "College", "Date"];
    const rows = filtered.map((r, i) => {
      const ev = eventMap.get(r.event_id);
      return [
        i + 1, r.leader_name, r.team_name || "", ev?.name || "",
        r.amount_paid || "0", r.utr_number || "", r.transaction_id || "",
        r.registration_status, r.college_name, new Date(r.created_at).toLocaleDateString(),
      ];
    });
    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} records`);
  };

  const getMembers = (m: any): { name: string; phone?: string }[] =>
    Array.isArray(m) ? m : [];

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<IndianRupee size={16} className="text-primary" />} label="Total Payments" value={String(stats.total)} />
        <KpiCard icon={<IndianRupee size={16} className="text-primary" />} label="Total Amount" value={`₹${stats.totalAmount.toLocaleString()}`} />
        <KpiCard icon={<CheckCircle2 size={16} className="text-emerald-400" />} label="Confirmed Amount" value={`₹${stats.confirmedAmount.toLocaleString()}`} />
        <KpiCard icon={<AlertTriangle size={16} className="text-amber-400" />} label="Duplicate Warnings" value={String(stats.duplicates)} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-display font-bold text-foreground">
          Payment Verification ({filtered.length})
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0} className="gap-2">
            <Download size={14} /> Export CSV
          </Button>
          {isOwner && <Button variant="outline" size="sm" className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setResetConfirm(true)}>
            <RotateCcw size={14} /> Reset All
          </Button>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, UTR, transaction ID…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
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
        <Button
          variant={dupsOnly ? "default" : "outline"}
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => setDupsOnly(!dupsOnly)}
        >
          <AlertTriangle size={14} /> Show Duplicates Only
        </Button>
      </div>

      {/* Duplicate warning banner */}
      {stats.duplicates > 0 && !dupsOnly && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">
              {stats.duplicates} registration(s) have duplicate UTR or Transaction IDs
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              These are flagged below with a warning icon. Verify these payments manually before confirming.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No payments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground font-medium w-10">#</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Team / Name</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Event</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Amount</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">UTR</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Screenshot</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, idx) => {
                  const ev = eventMap.get(r.event_id);
                  const sc = statusConfig[r.registration_status] || statusConfig.pending;
                  const isDup = duplicateIds.has(r.id);
                  return (
                    <TableRow key={r.id} className="border-border">
                      <TableCell className="text-sm text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors">
                            {isDup && <AlertTriangle size={13} className="text-amber-400 shrink-0" />}
                            {r.team_name || r.leader_name}
                            <ChevronDown size={14} className="text-muted-foreground" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56">
                            <div className="px-3 py-2 space-y-1 text-sm">
                              <p className="font-medium text-foreground">{r.leader_name}</p>
                              <p className="text-muted-foreground text-xs">{r.leader_email}</p>
                              <p className="text-muted-foreground text-xs">{r.leader_phone}</p>
                              {r.team_name && <p className="text-xs text-muted-foreground">Team: {r.team_name}</p>}
                              <p className="text-xs text-muted-foreground">College: {r.college_name}</p>
                              {r.transaction_id && <p className="text-xs text-muted-foreground">Txn: {r.transaction_id}</p>}
                              {r.payment_screenshot_url && (
                                <div className="pt-1 border-t border-border mt-1">
                                  <p className="text-xs font-medium text-foreground mb-1">Payment Screenshot:</p>
                                  <a href={r.payment_screenshot_url} target="_blank" rel="noopener noreferrer">
                                    <img src={r.payment_screenshot_url} alt="Payment screenshot" className="w-full max-w-[200px] rounded-md border border-border" />
                                  </a>
                                </div>
                              )}
                              {getMembers(r.members).length > 0 && (
                                <div className="pt-1 border-t border-border mt-1">
                                  <p className="text-xs font-medium text-foreground mb-0.5">Members:</p>
                                  {getMembers(r.members).map((m, i) => (
                                    <p key={i} className="text-xs text-muted-foreground">{m.name}{m.phone ? ` · ${m.phone}` : ""}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <span>{ev?.icon || categoryIcon[ev?.category || ""] || "🎯"}</span>
                          <span className="truncate max-w-[130px]">{ev?.name || "—"}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground whitespace-nowrap">
                        {r.amount_paid ? `₹${r.amount_paid}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono max-w-[140px] truncate">
                        {r.utr_number || "—"}
                      </TableCell>
                      <TableCell>
                        {r.payment_screenshot_url ? (
                          <button onClick={() => setLightboxUrl(r.payment_screenshot_url)} title="View payment screenshot" className="block">
                            <img src={r.payment_screenshot_url} alt="Payment" className="w-12 h-12 object-cover rounded-md border border-border hover:opacity-80 transition-opacity cursor-pointer" />
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] capitalize ${sc.cls}`}>
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Confirm"
                            onClick={() => updateStatus(r.id, "confirmed")}
                            disabled={r.registration_status === "confirmed"}
                            className={`p-1.5 rounded-md transition-colors ${r.registration_status === "confirmed" ? "text-emerald-400/40 cursor-not-allowed" : "text-emerald-400 hover:bg-emerald-500/10"}`}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            title="Reject"
                            onClick={() => updateStatus(r.id, "rejected")}
                            disabled={r.registration_status === "confirmed"}
                            className={`p-1.5 rounded-md transition-colors ${r.registration_status === "confirmed" ? "text-muted-foreground/30 cursor-not-allowed" : "text-destructive hover:bg-destructive/10"}`}
                          >
                            <XCircle size={16} />
                          </button>
                          {r.registration_status === "confirmed" && (
                            <button title="Undo (set back to pending)" onClick={() => updateStatus(r.id, "pending")} className="p-1.5 rounded-md text-amber-400 hover:bg-amber-500/10 transition-colors"><Undo2 size={16} /></button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Reset Confirmation */}
      <AlertDialog open={resetConfirm} onOpenChange={setResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all statuses?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set all registrations back to "pending". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={resetAllPending}>
              Reset All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* ─── KPI Card ─── */
const KpiCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
      {icon} {label}
    </div>
    <p className="text-xl font-display font-bold text-foreground">{value}</p>
  </div>
);

export default AdminPayments;
