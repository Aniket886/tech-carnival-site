import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail } from "lucide-react";

const AdminLogin = () => {
  const { signIn, loading, isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showExpiredBanner, setShowExpiredBanner] = useState(false);

  // Check if redirected due to session expiry
  useEffect(() => {
    const state = location.state as { sessionExpired?: boolean } | null;
    if (state?.sessionExpired) {
      setShowExpiredBanner(true);
      // Clear the state so refresh doesn't re-show
      window.history.replaceState({}, "", "/admin");
      const timer = setTimeout(() => setShowExpiredBanner(false), 10_000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isAdmin) {
    navigate("/admin/overview", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowExpiredBanner(false);
    setSubmitting(true);
    const err = await signIn(email, password);
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      navigate("/admin/overview", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Session expired banner */}
        {showExpiredBanner && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Lock className="h-4 w-4 text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-300">
              Your session has expired due to inactivity. Please log in again.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card/50 p-8 neon-glow">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gradient mb-1">Admin Login</h1>
            <p className="text-sm text-muted-foreground">Tech Carnival – 2K26</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" /> Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full neon-glow" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
