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
import { UserPlus, Trash2, Shield, Clock, Activity, LogOut } from "lucide-react";

interface AdminRole {
  id: string;
  user_id: string;
  role: string;
  is_owner: boolean;
}

interface LoginLog {
  id: string;
  user_id: string;
  email: string;
  action_type: string;
  logged_in_at: string;
}

const AdminSettings = () => {
  const { user } = useAdminAuth();

  // Invite form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviting, setInviting] = useState(false);

  // Admins list
  const [admins, setAdmins] = useState<AdminRole[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<AdminRole | null>(null);

  // Session security
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [savingTimeout, setSavingTimeout] = useState(false);

  // Login logs
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [logTab, setLogTab] = useState("active");

  const fetchAdmins = useCallback(async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("*")
      .eq("role", "admin")
      .order("is_owner", { ascending: false });
    setAdmins(data || []);
  }, []);

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from("admin_login_logs")
      .select("*")
      .order("logged_in_at", { ascending: false })
      .limit(50);
    setLoginLogs(data || []);
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
    fetchLogs();
    fetchTimeout();
  }, [fetchAdmins, fetchLogs, fetchTimeout]);

  // Create admin
  const handleCreateAdmin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
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

  // Remove admin
  const handleRemoveAdmin = async () => {
    if (!deleteTarget) return;
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

  // Save session timeout
  const handleSaveTimeout = async () => {
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
      toast.success("Session timeout updated");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingTimeout(false);
    }
  };

  // Active sessions = logs with action_type "login" from last N hours
  const activeLogs = loginLogs.filter((l) => {
    const age = Date.now() - new Date(l.logged_in_at).getTime();
    return l.action_type === "login" && age < parseInt(sessionTimeout) * 60 * 1000;
  });

  const isCurrentUser = (userId: string) => userId === user?.id;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ──── Invite New Admin ──── */}
      <section>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <UserPlus size={20} className="text-primary" /> Invite New Admin
        </h2>
        <div className="rounded-xl border border-border bg-card p-5 max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground">Email</Label>
            <Input
              placeholder="newadmin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-muted/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground">Password</Label>
            <Input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-muted/50"
            />
          </div>
          <Button onClick={handleCreateAdmin} disabled={inviting} variant="default" className="gap-2">
            <UserPlus size={14} /> {inviting ? "Creating…" : "Create Admin Account"}
          </Button>
        </div>
      </section>

      {/* ──── Current Admins ──── */}
      <section>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <Shield size={20} className="text-primary" /> Current Admins ({admins.length})
        </h2>
        <div className="space-y-2">
          {admins.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-border bg-card px-5 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30 text-[10px] shrink-0">
                  Admin
                </Badge>
                <span className="text-sm text-foreground truncate">{a.user_id}</span>
                {a.is_owner && (
                  <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">
                    Owner
                  </Badge>
                )}
                {isCurrentUser(a.user_id) && (
                  <span className="text-xs text-muted-foreground">(you)</span>
                )}
              </div>
              {!a.is_owner && !isCurrentUser(a.user_id) && (
                <button
                  onClick={() => setDeleteTarget(a)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ──── Session Security ──── */}
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

      {/* ──── Session Activity ──── */}
      <section>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <Activity size={20} className="text-primary" /> Session Activity
        </h2>
        <Tabs value={logTab} onValueChange={setLogTab}>
          <TabsList className="mb-3">
            <TabsTrigger value="active">Active Sessions ({activeLogs.length})</TabsTrigger>
            <TabsTrigger value="history">History ({loginLogs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {activeLogs.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground text-sm">No active sessions.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground w-10">#</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Email</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Logged in at</TableHead>
                      <TableHead className="text-xs text-muted-foreground text-right">Manage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLogs.map((l, i) => (
                      <TableRow key={l.id} className="border-border">
                        <TableCell className="text-sm text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-sm text-foreground">{l.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                            Online
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(l.logged_in_at).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isCurrentUser(l.user_id) && (
                            <span className="text-xs text-destructive flex items-center justify-end gap-1 cursor-pointer hover:underline">
                              <LogOut size={12} /> Kick
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {loginLogs.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground text-sm">No login history.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground w-10">#</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Email</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Action</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginLogs.map((l, i) => (
                      <TableRow key={l.id} className="border-border">
                        <TableCell className="text-sm text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-sm text-foreground">{l.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] capitalize ${l.action_type === "login" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-muted text-muted-foreground border-border"}`}>
                            {l.action_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(l.logged_in_at).toLocaleString("en-IN")}
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

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove admin?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke admin access for user {deleteTarget?.user_id}. They can still log in but won't have admin privileges.
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
    </div>
  );
};

export default AdminSettings;
