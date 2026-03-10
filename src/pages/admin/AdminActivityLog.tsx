import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRefresh } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface LogEntry {
  id: string;
  action: string;
  reason: string | null;
  admin_email: string | null;
  created_at: string;
}

const AdminActivityLog = () => {
  const refreshKey = useAdminRefresh();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => { if (data) setLogs(data); setLoading(false); });
  }, [refreshKey]);

  const filtered = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.reason || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.admin_email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <ScrollText className="text-primary" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Activity Log</h2>
            <p className="text-sm text-muted-foreground">Audit trail of admin actions</p>
          </div>
        </div>
        <Badge variant="outline">{filtered.length} entries</Badge>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search actions, reasons, or emails..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-background border-border" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No activity logged yet.</CardContent></Card>
      ) : (
        <Card className="border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium text-foreground">{l.action}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{l.reason || "—"}</TableCell>
                  <TableCell className="text-sm">{l.admin_email || "—"}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(l.created_at), "MMM d, yyyy HH:mm")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default AdminActivityLog;
