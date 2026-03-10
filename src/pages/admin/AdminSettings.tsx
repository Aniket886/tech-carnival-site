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

import { toast } from "sonner";
import { logActivity } from "@/lib/logActivity";
import { UserPlus, Trash2, Shield, Clock, RotateCcw } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface AdminRole {
  id: string;
  user_id: string;
  role: string;
  is_owner: boolean;
  email?: string;
}


const AdminSettings = () => {
  const { user } = useAdminAuth();
  const [isOwner, setIsOwner] = useState(false);

  // Invite form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviting, setInviting] = useState(false);

  // Admins list
  const [admins, setAdmins] = useState<AdminRole[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<AdminRole | null>(null);
  const [showReinvite, setShowReinvite] = useState(false);

  // Session security
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [savingTimeout, setSavingTimeout] = useState(false);


  const fetchAdmins = useCallback(async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("*")
      .eq("role", "admin")
      .order("is_owner", { ascending: false });

    const adminRoles = (roles || []) as unknown as AdminRole[];
    
    // For admins missing email in user_roles, try fallback sources
    const missingEmailIds = adminRoles.filter(a => !a.email).map(a => a.user_id);
    if (missingEmailIds.length > 0) {
      const [{ data: logs }, { data: sessions }] = await Promise.all([
        supabase.from("admin_login_logs").select("user_id, email").in("user_id", missingEmailIds),
        supabase.from("admin_sessions").select("user_id, email").in("user_id", missingEmailIds),
      ]);
      
      const emailMap = new Map<string, string>();
      sessions?.forEach(s => { if (!emailMap.has(s.user_id)) emailMap.set(s.user_id, s.email); });
      logs?.forEach(l => { if (!emailMap.has(l.user_id)) emailMap.set(l.user_id, l.email); });
      if (user && !emailMap.has(user.id) && user.email) emailMap.set(user.id, user.email);
      
      adminRoles.forEach(a => { if (!a.email) a.email = emailMap.get(a.user_id); });
    }
    // Check if current user is owner
    if (user) {
      const ownerRole = adminRoles.find(a => a.user_id === user.id);
      setIsOwner(ownerRole?.is_owner || false);
    }
    setAdmins(adminRoles);
  }, [user]);


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
    fetchTimeout();
  }, [fetchAdmins, fetchTimeout]);

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
    const removedEmail = deleteTarget.email || "";
    try {
      const { data, error } = await supabase.functions.invoke("delete-admin", {
        body: { user_id: deleteTarget.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Admin removed — no longer has access", {
        action: removedEmail
          ? {
              label: "Re-invite",
              onClick: () => {
                setEmail(removedEmail);
                setPassword("");
                setShowReinvite(true);
              },
            }
          : undefined,
        duration: 8000,
      });
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
                <span className="text-sm text-foreground truncate">{a.email || a.user_id}</span>
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
                <SelectItem value="1">1 minute (testing)</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            A warning will appear 30 seconds before the session expires. Changes apply to all admin sessions.
          </p>
          <Button size="sm" onClick={handleSaveTimeout} disabled={savingTimeout}>
            {savingTimeout ? "Saving…" : "Save"}
          </Button>
        </div>
      </section>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove admin?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.email || deleteTarget?.user_id} and revoke all access. They will no longer be able to log in.
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

      {/* Re-invite Dialog */}
      <Dialog open={showReinvite} onOpenChange={setShowReinvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw size={18} className="text-primary" /> Re-invite Admin
            </DialogTitle>
            <DialogDescription>
              Create a new account for the previously removed admin. They'll need to use the new password to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">New Password</Label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReinvite(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                await handleCreateAdmin();
                setShowReinvite(false);
              }}
              disabled={inviting}
              className="gap-2"
            >
              <RotateCcw size={14} /> {inviting ? "Creating…" : "Re-invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSettings;
