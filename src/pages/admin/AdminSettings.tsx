import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UserPlus, Trash2, Shield, Clock, Activity, LogOut, Crown } from "lucide-react";

interface AdminRole {
  id: string;
  user_id: string;
  role: string;
  is_owner: boolean;
}

interface AdminSession {
  id: string;
  user_id: string;
  email: string;
  role: string;
  login_at: string;
  last_active_at: string;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  logged_out_at: string | null;
  logout_reason: string | null;
}

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function parseBrowser(ua: string | null) {
  if (!ua) return "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  return "Other";
}

function duration(start: string, end: string | null) {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

const AdminSettings = () => {
  const { user, isOwner } = useAdminAuth();

  // Invite form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviting, setInviting] = useState(false);

  // Admins list
  const [admins, setAdmins] = useState<AdminRole[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<AdminRole | null>(null);

  // Session security
  const [sessionTimeout, setSessionTimeout] = useState("15");
  const [savingTimeout, setSavingTimeout] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [sessionTab, setSessionTab] = useState("active");
  const [kickTarget, setKickTarget] = useState<AdminSession | null>(null);
  const [historyFilter, setHistoryFilter] = useState("");

  const fetchAdmins = useCallback(async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("*")
      .eq("role", "admin")
      .order("is_owner", { ascending: false });
    setAdmins(data || []);
  }, []);

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from("admin_sessions")
      .select("*")
      .order("login_at", { ascending: false })
      .limit(100);
    setSessions((data as AdminSession[]) || []);
  }, []);

  const fetchTimeout = useCallback(async () => {
    const { data } = await supabase
      .from("admin_settings")
      .select("setting_value")
      .eq("setting_key", "session_timeout")
      .maybeSingle();
    if (data) setSessionTimeout(data.setting_value);
  }, []);

  useEffect(() => {
    fetchAdmins();
    fetchSessions();
    fetchTimeout();

    // Realtime for sessions
    const channel = supabase
      .channel("admin_sessions_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_sessions" }, () => {
        fetchSessions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAdmins, fetchSessions, fetchTimeout]);

  // Create admin (owner only)
  const handleCreateAdmin = async () => {
    if (!isOwner) { toast.error("Only the Owner can invite new admins"); return; }
    if (!email.trim() || !password.trim()) { toast.error("Email and password are required"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-admin", {
        body: { email: email.trim(), password },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Admin account created for ${email}`);
      setEmail("");
      setPassword("");
      fetchAdmins();
    } catch (e: any) {
      toast.error(e.message || "Failed to create admin");
    } finally {
      setInviting(false);
    }
  };

  // Remove admin (owner only)
  const handleRemoveAdmin = async () => {
    if (!deleteTarget || !isOwner) return;
    try {
      const { data, error } = await supabase.functions.invoke("delete-admin", {
        body: { user_id: deleteTarget.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Admin removed");
      setDeleteTarget(null);
      fetchAdmins();
    } catch (e: any) {
      toast.error(e.message || "Failed to remove admin");
      setDeleteTarget(null);
    }
  };

  // Save session timeout (owner only)
  const handleSaveTimeout = async () => {
    if (!isOwner) { toast.error("Only the Owner can change this setting"); return; }
    setSavingTimeout(true);
    try {
      const { data: existing } = await supabase
        .from("admin_settings")
        .select("id")
        .eq("setting_key", "session_timeout")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("admin_settings")
          .update({ setting_value: sessionTimeout, updated_by: user?.id })
          .eq("setting_key", "session_timeout");
      } else {
        await supabase.from("admin_settings").insert({
          setting_key: "session_timeout",
          setting_value: sessionTimeout,
          updated_by: user?.id,
        });
      }
      toast.success("Session timeout updated — applies to all sessions immediately");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingTimeout(false);
    }
  };

  // Kick session (owner only)
  const handleKickSession = async () => {
    if (!kickTarget || !isOwner) return;
    try {
      await supabase
        .from("admin_sessions")
        .update({
          is_active: false,
          logged_out_at: new Date().toISOString(),
          logout_reason: "kicked_by_owner",
        } as any)
        .eq("id", kickTarget.id);
      toast.success(`Session terminated for ${kickTarget.email}`);
      setKickTarget(null);
      fetchSessions();
    } catch (e: any) {
      toast.error(e.message || "Failed to terminate session");
      setKickTarget(null);
    }
  };

  const isCurrentUser = (userId: string) => userId === user?.id;
  const activeSessions = sessions.filter((s) => s.is_active);
  const historySessions = sessions
    .filter((s) => !historyFilter || s.email.toLowerCase().includes(historyFilter.toLowerCase()))
    .slice(0, 50);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ──── Admin Management (Owner Only) ──── */}
      {isOwner && (
        <section>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
            <Crown size={20} className="text-amber-400" /> Admin Management
          </h2>

          {/* Invite Form */}
          <div className="rounded-xl border border-border bg-card p-5 max-w-md space-y-4 mb-6">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UserPlus size={16} /> Invite New Admin
            </h3>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Email</Label>
              <Input placeholder="newadmin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Password</Label>
              <Input type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-muted/50" />
            </div>
            <Button onClick={handleCreateAdmin} disabled={inviting} variant="default" className="gap-2">
              <UserPlus size={14} /> {inviting ? "Creating…" : "Create Admin Account"}
            </Button>
          </div>

          {/* Current Admins */}
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Shield size={16} className="text-primary" /> Current Admins ({admins.length})
          </h3>
          <div className="space-y-2">
            {admins.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-card px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {a.is_owner ? (
                    <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] shrink-0">
                      👑 Owner
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30 text-[10px] shrink-0">
                      🛡️ Admin
                    </Badge>
                  )}
                  <span className="text-sm text-foreground truncate font-mono">{a.user_id.substring(0, 8)}…</span>
                  {isCurrentUser(a.user_id) && (
                    <span className="text-xs text-muted-foreground">(you)</span>
                  )}
                </div>
                {isOwner && !a.is_owner && !isCurrentUser(a.user_id) && (
                  <button
                    onClick={() => setDeleteTarget(a)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove Admin"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ──── Session Security (Owner Only) ──── */}
      {isOwner && (
        <section>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
            <Clock size={20} className="text-primary" /> Session Security
          </h2>
          <div className="rounded-xl border border-border bg-card p-5 max-w-md space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Auto-logout after inactivity</Label>
              <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                <SelectTrigger className="bg-muted/50 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              A warning will appear 2 minutes before the session expires. Changes apply to all admin sessions.
            </p>
            <Button size="sm" onClick={handleSaveTimeout} disabled={savingTimeout}>
              {savingTimeout ? "Saving…" : "Save"}
            </Button>
          </div>
        </section>
      )}

      {/* ──── Session Activity ──── */}
      <section>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <Activity size={20} className="text-primary" /> Session Activity
        </h2>
        <Tabs value={sessionTab} onValueChange={setSessionTab}>
          <TabsList className="mb-3">
            <TabsTrigger value="active">Active Sessions ({activeSessions.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {activeSessions.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground text-sm">No active sessions.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground">Email</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Role</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Login</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Last Active</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Browser</TableHead>
                      <TableHead className="text-xs text-muted-foreground">IP</TableHead>
                      {isOwner && <TableHead className="text-xs text-muted-foreground text-right">Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSessions.map((s) => (
                      <TableRow key={s.id} className="border-border">
                        <TableCell className="text-sm text-foreground">
                          {s.email}
                          {isCurrentUser(s.user_id) && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                        </TableCell>
                        <TableCell>
                          {s.role === "owner" ? (
                            <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">👑 Owner</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30 text-[10px]">Admin</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(s.login_at).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{relativeTime(s.last_active_at)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{parseBrowser(s.user_agent)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{s.ip_address || "—"}</TableCell>
                        {isOwner && (
                          <TableCell className="text-right">
                            {!isCurrentUser(s.user_id) && (
                              <button
                                onClick={() => setKickTarget(s)}
                                className="text-xs text-destructive flex items-center justify-end gap-1 cursor-pointer hover:underline"
                              >
                                <LogOut size={12} /> Terminate
                              </button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="mb-3 max-w-xs">
              <Input
                placeholder="Filter by email…"
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="bg-muted/50 text-sm"
              />
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {historySessions.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground text-sm">No session history.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground">Email</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Role</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Login</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Logout</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Duration</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historySessions.map((s) => (
                      <TableRow key={s.id} className="border-border">
                        <TableCell className="text-sm text-foreground">{s.email}</TableCell>
                        <TableCell>
                          {s.role === "owner" ? (
                            <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">Owner</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30 text-[10px]">Admin</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(s.login_at).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {s.logged_out_at ? new Date(s.logged_out_at).toLocaleString("en-IN") : (
                            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{duration(s.login_at, s.logged_out_at)}</TableCell>
                        <TableCell>
                          {s.logout_reason && (
                            <Badge variant="outline" className={`text-[10px] capitalize ${s.logout_reason === "kicked_by_owner" ? "bg-destructive/15 text-destructive border-destructive/30" : "bg-muted text-muted-foreground border-border"}`}>
                              {s.logout_reason.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Delete Admin Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this admin? They will lose all dashboard access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAdmin} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Kick Session Confirm */}
      <AlertDialog open={!!kickTarget} onOpenChange={() => setKickTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately log out <span className="font-semibold">{kickTarget?.email}</span> from their current session. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleKickSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Terminate Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSettings;
