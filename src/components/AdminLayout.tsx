import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSessionTimeout } from "@/hooks/useAdminSessionTimeout";
import SessionWarningModal from "@/components/SessionWarningModal";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Settings,
  CreditCard,
  Key,
  Building2,
  Trophy,
  Handshake,
  BookOpen,
  FileCode,
  Layers,
  Bot,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";

const sidebarLinks = [
  { label: "Overview", to: "/admin/overview", icon: LayoutDashboard },
  { label: "Page Manager", to: "/admin/page-manager", icon: Layers },
  { label: "Registrations", to: "/admin/registrations", icon: ClipboardList },
  { label: "Payments", to: "/admin/payments", icon: CreditCard },
  { label: "Events", to: "/admin/events", icon: CalendarDays },
  { label: "Colleges", to: "/admin/colleges", icon: Building2 },
  { label: "Sponsors", to: "/admin/sponsors", icon: Handshake },
  { label: "Scores", to: "/admin/scores", icon: Trophy },
  { label: "API Keys", to: "/admin/api-keys", icon: Key },
  { label: "API Docs", to: "/admin/api-docs", icon: BookOpen },
  { label: "Starter Kit", to: "/admin/starter-template", icon: FileCode },
  { label: "CarniBOT", to: "/admin/bot-settings", icon: Bot },
  { label: "Messages", to: "/admin/messages", icon: MessageSquare },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

const AdminLayout = () => {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeoutMs, setTimeoutMs] = useState(600_000);
  const navigate = useNavigate();
  const location = useLocation();
  const { showWarning, remainingSeconds, stayLoggedIn, logoutNow } = useAdminSessionTimeout({ timeoutMs, warningMs: Math.max(timeoutMs - 120_000, timeoutMs * 0.8) });

  useEffect(() => {
    let currentUserId: string | null = null;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/admin"); return; }

      currentUserId = session.user.id;

      const [{ data: isAdmin }, { data: setting }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }),
        supabase
          .from("admin_settings")
          .select("setting_value")
          .eq("setting_key", "session_timeout_minutes")
          .maybeSingle(),
      ]);

      if (!isAdmin) { await supabase.auth.signOut(); navigate("/admin"); return; }
      if (setting?.setting_value) {
        setTimeoutMs(parseInt(setting.setting_value, 10) * 60_000);
      }
      setLoading(false);
    };
    check();

    // Listen for kick events targeting this user via realtime
    const kickChannel = supabase
      .channel('kick-listener')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_login_logs' },
        async (payload) => {
          const record = payload.new as any;
          if (record.action_type === 'kicked' && record.user_id === currentUserId) {
            await supabase.auth.signOut();
            navigate("/admin");
          }
        }
      )
      .subscribe();

    // Listen for timeout setting changes from other tabs/settings page
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "admin_timeout_updated") {
        supabase
          .from("admin_settings")
          .select("setting_value")
          .eq("setting_key", "session_timeout_minutes")
          .maybeSingle()
          .then(({ data }) => {
            if (data?.setting_value) setTimeoutMs(parseInt(data.setting_value, 10) * 60_000);
          });
      }
    };
    window.addEventListener("storage", handleStorage);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/admin");
    });
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
      supabase.removeChannel(kickChannel);
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("admin_login_logs").insert({
          user_id: session.user.id,
          email: session.user.email || "unknown",
          action_type: "logout",
        });
      }
    } catch {}
    await supabase.auth.signOut();
    navigate("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 glass-strong border-r border-border flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <button onClick={() => navigate("/")} className="font-display text-sm font-bold gradient-text tracking-wider">
            Tech Carnival
          </button>
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/admin/overview"}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              activeClassName="bg-primary/10 text-primary neon-border"
              onClick={() => setSidebarOpen(false)}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}>
            <LogOut size={18} className="mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 lg:px-6 glass-strong sticky top-0 z-30">
          <button className="lg:hidden mr-3 text-muted-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <h1 className="font-display text-sm font-semibold text-foreground tracking-wide">
            {sidebarLinks.find((l) => location.pathname === l.to || (l.to !== "/admin/overview" && location.pathname.startsWith(l.to)))?.label || "Dashboard"}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {showWarning ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-400 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Expiring {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, "0")}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Session Active
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      {/* Session Warning Modal */}
      <SessionWarningModal
        open={showWarning}
        remainingSeconds={remainingSeconds}
        onStay={stayLoggedIn}
        onLogout={logoutNow}
      />
    </div>
  );
};

export default AdminLayout;
