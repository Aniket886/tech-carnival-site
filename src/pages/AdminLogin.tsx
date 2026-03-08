import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (sessionStorage.getItem("session_expired") === "1") {
        setSessionExpired(true);
        sessionStorage.removeItem("session_expired");
        const t = setTimeout(() => setSessionExpired(false), 10000);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check admin role
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: data.user.id,
        _role: "admin",
      });

      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error("Access denied. Admin privileges required.");
      }

      // Log the login (don't await to avoid blocking navigation)
      supabase.from("admin_login_logs").insert({
        user_id: data.user.id,
        email: data.user.email || email,
        action_type: "login",
      }).then(() => {});

      navigate("/admin/overview");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {sessionExpired && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-sm text-amber-300 animate-in fade-in duration-300">
            <Lock size={16} className="shrink-0" />
            <span>Your session expired due to inactivity. Please log in again.</span>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 neon-border flex items-center justify-center mx-auto mb-4">
            <Lock className="text-primary" size={28} />
          </div>
          <h1 className="font-display text-2xl font-bold gradient-text mb-2">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Tech Carnival – 2K26 Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="glass-strong rounded-xl p-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-foreground font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@techcarnival.com"
              className="bg-muted/50 border-border focus:border-primary"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm text-foreground font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-muted/50 border-border focus:border-primary"
            />
          </div>
          <Button variant="default" className="w-full" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <button onClick={() => navigate("/")} className="hover:text-primary transition-colors">
            ← Back to site
          </button>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
