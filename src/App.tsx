import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { SiteVisibilityProvider } from "@/hooks/useSiteVisibility";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminColleges from "./pages/admin/AdminColleges";
import AdminApiKeys from "./pages/admin/AdminApiKeys";
import AdminApiDocs from "./pages/admin/AdminApiDocs";
import AdminEventLinks from "./pages/admin/AdminEventLinks";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminScores from "./pages/admin/AdminScores";
import AdminSponsors from "./pages/admin/AdminSponsors";
import AdminPageManager from "./pages/admin/AdminPageManager";
import AdminBotSettings from "./pages/admin/AdminBotSettings";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AdminAuthProvider>
          <SiteVisibilityProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route element={<AdminLayout />}>
                <Route path="/admin/overview" element={<AdminOverview />} />
                <Route path="/admin/page-manager" element={<AdminPageManager />} />
                <Route path="/admin/registrations" element={<AdminRegistrations />} />
                <Route path="/admin/events" element={<AdminEvents />} />
                <Route path="/admin/sponsors" element={<AdminSponsors />} />
                <Route path="/admin/colleges" element={<AdminColleges />} />
                <Route path="/admin/api-keys" element={<AdminApiKeys />} />
                <Route path="/admin/api-docs" element={<AdminApiDocs />} />
                <Route path="/admin/event-links" element={<AdminEventLinks />} />
                <Route path="/admin/scores" element={<AdminScores />} />
                <Route path="/admin/messages" element={<AdminMessages />} />
                <Route path="/admin/bot-settings" element={<AdminBotSettings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SiteVisibilityProvider>
        </AdminAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
