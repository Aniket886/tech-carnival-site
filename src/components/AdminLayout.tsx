import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LayoutDashboard, ClipboardList, CalendarDays, MessageSquare,
  LogOut, Menu, X, Settings, CreditCard, Building2,
  Trophy, Handshake, Bot, Layers,
} from "lucide-react";

const links = [
  { label: "Overview", to: "/admin/overview", icon: LayoutDashboard },
  { label: "Page Manager", to: "/admin/page-manager", icon: Layers },
  { label: "Registrations", to: "/admin/registrations", icon: ClipboardList },
  { label: "Payments", to: "/admin/payments", icon: CreditCard },
  { label: "Events", to: "/admin/events", icon: CalendarDays },
  { label: "Colleges", to: "/admin/colleges", icon: Building2 },
  { label: "Sponsors", to: "/admin/sponsors", icon: Handshake },
  { label: "Scores", to: "/admin/scores", icon: Trophy },
  { label: "CarniBOT", to: "/admin/bot-settings", icon: Bot },
  { label: "Messages", to: "/admin/messages", icon: MessageSquare },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/admin", { replace: true });
  };

  const currentLabel = links.find(l =>
    location.pathname === l.to || (l.to !== "/admin/overview" && location.pathname.startsWith(l.to))
  )?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <button onClick={() => navigate("/")} className="font-display text-sm font-bold text-primary tracking-wider">Tech Carnival</button>
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/admin/overview"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`
              }
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 lg:px-6 bg-card sticky top-0 z-30">
          <button className="lg:hidden mr-3 text-muted-foreground" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
          <h1 className="font-display text-sm font-semibold text-foreground tracking-wide">{currentLabel}</h1>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
