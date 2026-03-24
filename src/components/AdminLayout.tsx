import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useIsOwner } from "@/hooks/useIsOwner";

export const AdminRefreshContext = createContext(0);
export const useAdminRefresh = () => useContext(AdminRefreshContext);
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LayoutDashboard, ClipboardList, CalendarDays, MessageSquare,
  LogOut, Menu, X, Settings, CreditCard, Building2,
  Trophy, Handshake, Bot, Layers, Mail, Users, Clock, HelpCircle,
  Megaphone, ImageIcon, Play, UserX,
} from "lucide-react";

const links = [
  { label: "Overview", to: "/admin/overview", icon: LayoutDashboard },
  { label: "Page Manager", to: "/admin/page-manager", icon: Layers },
  { label: "Announcements", to: "/admin/announcements", icon: Megaphone },
  { label: "Registrations", to: "/admin/registrations", icon: ClipboardList },
  { label: "Payments", to: "/admin/payments", icon: CreditCard },
  { label: "Payment Setup", to: "/admin/payment-instructions", icon: CreditCard },
  { label: "Events", to: "/admin/events", icon: CalendarDays },
  { label: "Colleges", to: "/admin/colleges", icon: Building2 },
  { label: "Sponsors", to: "/admin/sponsors", icon: Handshake },
  { label: "Scores", to: "/admin/scores", icon: Trophy },
  { label: "Team", to: "/admin/team", icon: Users },
  { label: "Gallery", to: "/admin/gallery", icon: ImageIcon },
  { label: "Video Guide", to: "/admin/video-guide", icon: Play },
  { label: "Event Flow", to: "/admin/schedule", icon: Clock },
  { label: "FAQs", to: "/admin/faqs", icon: HelpCircle },
  { label: "CarniBOT", to: "/admin/bot-settings", icon: Bot },
  { label: "Email", to: "/admin/email", icon: Mail },
  { label: "Messages", to: "/admin/messages", icon: MessageSquare },
  { label: "Abandoned Leads", to: "/admin/drafts", icon: UserX },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut, showIdleWarning, dismissIdleWarning, idleMinutesLeft } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [abandonedCount, setAbandonedCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingColleges, setPendingColleges] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchBadgeCounts = useCallback(async () => {
    const [drafts, messages, colleges, payments] = await Promise.all([
      supabase.from("registration_drafts" as any).select("*", { count: "exact", head: true }).eq("status", "abandoned"),
      supabase.from("contacts").select("*", { count: "exact", head: true }).eq("is_read", false),
      supabase.from("colleges").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
      supabase.from("registrations").select("*", { count: "exact", head: true }).eq("registration_status", "pending"),
    ]);
    setAbandonedCount(drafts.count || 0);
    setUnreadMessages(messages.count || 0);
    setPendingColleges(colleges.count || 0);
    setPendingPayments(payments.count || 0);
  }, []);

  // Auto-refresh admin data every 10 seconds
  useEffect(() => {
    const id = setInterval(() => setRefreshKey(k => k + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  // Fetch badge counts + realtime
  useEffect(() => {
    fetchBadgeCounts();
    const channel = supabase
      .channel("admin-badge-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "registration_drafts" }, fetchBadgeCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, fetchBadgeCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "colleges" }, fetchBadgeCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, fetchBadgeCounts)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchBadgeCounts]);

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
              <span className="flex-1">{link.label}</span>
              {link.to === "/admin/drafts" && abandonedCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold">
                  {abandonedCount}
                </Badge>
              )}
              {link.to === "/admin/messages" && unreadMessages > 0 && (
                <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold">
                  {unreadMessages}
                </Badge>
              )}
              {link.to === "/admin/colleges" && pendingColleges > 0 && (
                <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold bg-amber-500 text-white border-0 hover:bg-amber-600">
                  {pendingColleges}
                </Badge>
              )}
              {link.to === "/admin/payments" && pendingPayments > 0 && (
                <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold bg-amber-500 text-white border-0 hover:bg-amber-600">
                  {pendingPayments}
                </Badge>
              )}
              {link.to === "/admin/registrations" && pendingPayments > 0 && (
                <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold bg-amber-500 text-white border-0 hover:bg-amber-600">
                  {pendingPayments}
                </Badge>
              )}
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
          <AdminRefreshContext.Provider value={refreshKey}>
            <Outlet />
          </AdminRefreshContext.Provider>
        </main>
      </div>

      {/* Idle Warning Dialog */}
      <AlertDialog open={showIdleWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
            <AlertDialogDescription>
              You've been inactive. Your session will expire in{" "}
              <span className="font-bold text-foreground">
                {idleMinutesLeft !== null && idleMinutesLeft <= 1
                  ? "less than a minute"
                  : `${idleMinutesLeft} minutes`}
              </span>
              . Click below to stay logged in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="default" onClick={dismissIdleWarning}>
              Stay Logged In
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              Logout Now
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminLayout;
