import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminSessionTimeout } from "@/hooks/useAdminSessionTimeout";
import { useSessionTimeoutSettings } from "@/hooks/useSessionTimeoutSettings";
import SessionWarningModal from "@/components/SessionWarningModal";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  GraduationCap,
  Key,
  Mail,
  LogOut,
  Globe,
} from "lucide-react";

const navItems = [
  { title: "Overview", url: "/admin/overview", icon: LayoutDashboard },
  { title: "Registrations", url: "/admin/registrations", icon: ClipboardList },
  { title: "Events", url: "/admin/events", icon: Calendar },
  { title: "Colleges", url: "/admin/colleges", icon: GraduationCap },
  { title: "API Keys", url: "/admin/api-keys", icon: Key },
  { title: "Event Links", url: "/admin/event-links", icon: Globe },
  { title: "Messages", url: "/admin/messages", icon: Mail },
];

function AdminSidebar() {
  const { signOut } = useAdminAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card/30">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold">
            {!collapsed && "⚡ Admin Panel"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={signOut}
                  className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {!collapsed && <span>Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function SessionIndicator({ showWarning, remainingSeconds }: { showWarning: boolean; remainingSeconds: number }) {
  if (showWarning) {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
        </span>
        <span className="font-mono tabular-nums">
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-green-500" />
      <span>Active</span>
    </div>
  );
}

function AdminDashboardContent() {
  const { timeoutMs, warningMs } = useSessionTimeoutSettings();
  const { showWarning, remainingSeconds, stayLoggedIn, logoutNow } = useAdminSessionTimeout({
    timeoutMs,
    warningMs,
  });

  return (
    <>
      <SessionWarningModal
        open={showWarning}
        remainingSeconds={remainingSeconds}
        onStay={stayLoggedIn}
        onLogout={logoutNow}
      />
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 gap-4 shrink-0">
            <SidebarTrigger />
            <h1 className="text-sm font-semibold text-gradient flex-1">Tech Carnival – Admin</h1>
            <SessionIndicator showWarning={showWarning} remainingSeconds={remainingSeconds} />
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

const AdminLayout = () => {
  const { user, isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <SidebarProvider>
      <AdminDashboardContent />
    </SidebarProvider>
  );
};

export default AdminLayout;
