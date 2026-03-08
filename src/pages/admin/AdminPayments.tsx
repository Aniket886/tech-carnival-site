import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, AlertTriangle, CheckCircle2, XCircle, Download, ChevronDown, ChevronUp, IndianRupee, Trash2 } from "lucide-react";

interface PaymentReg { id: string; team_name: string | null; leader_name: string; leader_email: string; leader_phone: string; college_name: string; semester: string | null; members: any; registration_status: string | null; created_at: string | null; event_id: string | null; amount_paid: string | null; utr_number: string | null; transaction_id: string | null; events: { name: string; category: string; icon: string | null } | null; }

const statusStyles: Record<string, string> = { pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", confirmed: "bg-green-500/15 text-green-400 border-green-500/30", rejected: "bg-red-500/15 text-red-400 border-red-500/30" };

const AdminPayments = () => {
  const [regs, setRegs] = useState<PaymentReg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDuplicates, setFilterDuplicates] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchData = async () => { const { data } = await supabase.from("registrations").select("*, events(name, category, icon)").order("created_at", { ascending: false }); if (data) setRegs(data as any); setLoading(false); };
  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 30000); return () => clearInterval(interval); }, []);

  const duplicates = useMemo(() => {
    const utrMap = new Map<string, string[]>();
    const txnMap = new Map<string, string[]>();
    regs.forEach((r) => {
      if (r.utr_number?.trim()) { const k = r.utr_number.trim().toLowerCase(); utrMap.set(k, [...(utrMap.get(k) || []), r.id]); }
      if (r.transaction_id?.trim()) { const k = r.transaction_id.trim().toLowerCase(); txnMap.set(k, [...(txnMap.get(k) || []), r.id]); }
    });
    const dupIds = new Set<string>(); const dupUtrIds = new Set<string>(); const dupTxnIds = new Set<string>();
    utrMap.forEach((ids) => { if (ids.length > 1) ids.forEach((id) => { dupIds.add(id); dupUtrIds.add(id); }); });
    txnMap.forEach((ids) => { if (ids.length > 1) ids.forEach((id) => { dupIds.add(id); dupTxnIds.add(id); }); });
    return { all: dupIds, utr: dupUtrIds, txn: dupTxnIds };
  }, [regs]);

  const filtered = useMemo(() => {
    let r = regs;
    if (filterStatus !== "all") r = r.filter((x) => x.registration_status === filterStatus);
    if (filterDuplicates) r = r.filter((x) => duplicates.all.has(x.id));
    if (search.trim()) { const q = search.toLowerCase(); r = r.filter((x) => x.leader_name.toLowerCase().includes(q) || x.leader_email.toLowerCase().includes(q) || (x.team_name && x.team_name.toLowerCase().includes(q)) || (x.utr_number && x.utr_number.toLowerCase().includes(q)) || (x.transaction_id && x.transaction_id.toLowerCase().includes(q))); }
    return r;
  }, [regs, filterStatus, filterDuplicates, search, duplicates]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("registrations").update({ registration_status: status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Payment ${status}`); setRegs((prev) => prev.map((r) => (r.id === id ? { ...r, registration_status: status } : r)));
    const emailType = status === "confirmed" ? "registration_confirmed" : status === "rejected" ? "registration_rejected" : null;
    if (emailType) supabase.functions.invoke("send-email", { body: { type: emailType, registrationId: id } }).catch(console.error);
  };

  const exportCSV = () => {
    const headers = ["S.No", "Team/Name", "Leader", "Email", "Phone", "College", "Event", "Category", "Amount Paid", "UTR Number", "Transaction ID", "Status", "Duplicate Warning", "Date"];
    const rows = filtered.map((r, i) => { const warnings: string[] = []; if (duplicates.utr.has(r.id)) warnings.push("Duplicate UTR"); if (duplicates.txn.has(r.id)) warnings.push("Duplicate TXN ID"); return [i + 1, r.team_name || r.leader_name, r.leader_name, r.leader_email, r.leader_phone, r.college_name, r.events?.name || "", r.events?.category || "", r.amount_paid || "", r.utr_number || "", r.transaction_id || "", r.registration_status || "", warnings.join("; "), r.created_at ? new Date(r.created_at).toLocaleString() : ""]; });
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const totalAmount = useMemo(() => regs.reduce((sum, r) => sum + (parseFloat(r.amount_paid || "0") || 0), 0), [regs]);
  const confirmedAmount = useMemo(() => regs.filter((r) => r.registration_status === "confirmed").reduce((sum, r) => sum + (parseFloat(r.amount_paid || "0") || 0), 0), [regs]);

  if (loading) return <p className="text-muted-foreground">Loading payments...</p>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Payments" value={regs.length} icon={<IndianRupee size={18} />} />
        <SummaryCard label="Total Amount" value={`₹${totalAmount.toLocaleString()}`} icon={<IndianRupee size={18} />} />
        <SummaryCard label="Confirmed Amount" value={`₹${confirmedAmount.toLocaleString()}`} icon={<CheckCircle2 size={18} />} accent="text-green-400" />
        <SummaryCard label="Duplicate Warnings" value={duplicates.all.size} icon={<AlertTriangle size={18} />} accent={duplicates.all.size > 0 ? "text-destructive" : "text-muted-foreground"} />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-foreground">Payment Verification ({filtered.length})</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download size={14} className="mr-1.5" /> Export CSV</Button>
          <Button variant="destructive" size="sm" onClick={() => setShowResetDialog(true)}><Trash2 size={14} className="mr-1.5" /> Reset All</Button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search name, UTR, transaction ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/50 border-border" /></div>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[140px] bg-muted/50 border-border"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
        <Button variant={filterDuplicates ? "destructive" : "outline"} size="sm" className={filterDuplicates ? "" : "border-destructive/50 text-destructive hover:bg-destructive/10"} onClick={() => setFilterDuplicates(!filterDuplicates)}><AlertTriangle size={14} className="mr-1.5" />{filterDuplicates ? "Showing Duplicates" : "Show Duplicates Only"}</Button>
      </div>
      {duplicates.all.size > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5"><AlertTriangle size={20} className="text-destructive shrink-0 mt-0.5" /><div><p className="text-sm font-semibold text-destructive">{duplicates.all.size} registration(s) have duplicate UTR or Transaction IDs</p><p className="text-xs text-muted-foreground mt-1">These are flagged below with a warning icon. Verify these payments manually before confirming.</p></div></div>
      )}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left"><th className="px-4 py-3 text-xs text-muted-foreground font-medium">#</th><th className="px-4 py-3 text-xs text-muted-foreground font-medium">Team / Name</th><th className="px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Event</th><th className="px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Amount</th><th className="px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">UTR</th><th className="px-4 py-3 text-xs text-muted-foreground font-medium">Status</th><th className="px-4 py-3 text-xs text-muted-foreground font-medium">Actions</th></tr></thead>
            <tbody>
              {filtered.map((r, i) => {
                const hasDupUtr = duplicates.utr.has(r.id); const hasDupTxn = duplicates.txn.has(r.id); const hasDup = hasDupUtr || hasDupTxn;
                return (
                  <tr key={r.id}>
                    <td colSpan={7} className="p-0">
                      <div className={`flex items-center border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors ${hasDup ? "bg-destructive/5" : ""}`} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                        <div className="px-4 py-3 text-muted-foreground w-12">{i + 1}</div>
                        <div className="px-4 py-3 flex-1"><div className="flex items-center gap-2">{hasDup && <AlertTriangle size={14} className="text-destructive shrink-0" />}<span className="text-foreground font-medium">{r.team_name || r.leader_name}</span>{expanded === r.id ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}</div></div>
                        <div className="px-4 py-3 hidden md:block text-foreground">{r.events?.icon} {r.events?.name}</div>
                        <div className="px-4 py-3 hidden lg:block text-foreground font-medium">{r.amount_paid ? `₹${r.amount_paid}` : "—"}</div>
                        <div className="px-4 py-3 hidden lg:block"><span className={`text-foreground ${hasDupUtr ? "text-destructive font-semibold" : ""}`}>{r.utr_number || "—"}</span></div>
                        <div className="px-4 py-3"><Badge variant="outline" className={`text-[10px] capitalize ${statusStyles[r.registration_status || "pending"]}`}>{r.registration_status || "pending"}</Badge></div>
                        <div className="px-4 py-3"><div className="flex gap-1" onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-400 hover:text-green-300" onClick={() => updateStatus(r.id, "confirmed")}><CheckCircle2 size={14} /></Button><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => updateStatus(r.id, "rejected")}><XCircle size={14} /></Button></div></div>
                      </div>
                      {expanded === r.id && (
                        <div className="bg-muted/20 px-6 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                            <DetailItem label="Team Name" value={r.team_name || "—"} /> <DetailItem label="Leader" value={r.leader_name} /> <DetailItem label="Email" value={r.leader_email} /> <DetailItem label="Phone" value={r.leader_phone} /> <DetailItem label="College" value={r.college_name} /> <DetailItem label="Semester" value={r.semester || "—"} /> <DetailItem label="Event" value={`${r.events?.icon || ""} ${r.events?.name || "—"}`} /> <DetailItem label="Category" value={r.events?.category || "—"} capitalize /> <DetailItem label="Amount Paid" value={r.amount_paid ? `₹${r.amount_paid}` : "—"} bold /> <DetailItem label="UTR Number" value={r.utr_number || "—"} warning={hasDupUtr ? "Duplicate UTR detected!" : undefined} /> <DetailItem label="Transaction ID" value={r.transaction_id || "—"} warning={hasDupTxn ? "Duplicate Transaction ID detected!" : undefined} /> <DetailItem label="Date" value={r.created_at ? new Date(r.created_at).toLocaleString() : "—"} />
                          </div>
                          {r.members && Array.isArray(r.members) && r.members.length > 0 && (<div className="mt-4"><p className="text-xs text-muted-foreground font-medium mb-2">Team Members:</p><div className="space-y-1">{(r.members as any[]).map((m: any, j: number) => (<div key={j} className="text-sm text-foreground">{j + 1}. {m.name} — {m.email} — {m.phone}</div>))}</div></div>)}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No payments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Export & Reset All Payments?</AlertDialogTitle><AlertDialogDescription>This will first download a CSV export of all {regs.length} payment(s), then permanently delete all registrations. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel><AlertDialogAction disabled={resetting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => { setResetting(true); exportCSV(); const { error } = await supabase.from("registrations").delete().neq("id", "00000000-0000-0000-0000-000000000000"); setResetting(false); if (error) { toast.error(error.message); return; } setRegs([]); toast.success("All payments exported & reset"); setShowResetDialog(false); }}>{resetting ? "Processing..." : "Export & Reset All"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SummaryCard = ({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent?: string; }) => (<div className="glass rounded-xl p-4 flex items-center gap-3"><div className={`${accent || "text-primary"}`}>{icon}</div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-bold text-foreground">{value}</p></div></div>);
const DetailItem = ({ label, value, bold, capitalize, warning }: { label: string; value: string; bold?: boolean; capitalize?: boolean; warning?: string; }) => (<div><span className="text-muted-foreground">{label}:</span>{" "}<span className={`text-foreground ${bold ? "font-medium" : ""} ${capitalize ? "capitalize" : ""}`}>{value}</span>{warning && (<div className="flex items-center gap-1 mt-0.5"><AlertTriangle size={12} className="text-destructive" /><span className="text-[11px] text-destructive font-medium">{warning}</span></div>)}</div>);

export default AdminPayments;
