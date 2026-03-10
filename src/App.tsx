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
import AdminPayments from "./pages/admin/AdminPayments";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminColleges from "./pages/admin/AdminColleges";

import AdminMessages from "./pages/admin/AdminMessages";
import AdminScores from "./pages/admin/AdminScores";
import AdminSponsors from "./pages/admin/AdminSponsors";
import AdminPageManager from "./pages/admin/AdminPageManager";
import AdminBotSettings from "./pages/admin/AdminBotSettings";
import AdminEmail from "./pages/admin/AdminEmail";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminTeam from "./pages/admin/AdminTeam";
import AdminSchedule from "./pages/admin/AdminSchedule";
import AdminPaymentInstructions from "./pages/admin/AdminPaymentInstructions";
import AdminFAQ from "./pages/admin/AdminFAQ";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminActivityLog from "./pages/admin/AdminActivityLog";
import AdminGallery from "./pages/admin/AdminGallery";

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
                <Route path="/admin/payments" element={<AdminPayments />} />
                <Route path="/admin/events" element={<AdminEvents />} />
                <Route path="/admin/sponsors" element={<AdminSponsors />} />
                <Route path="/admin/colleges" element={<AdminColleges />} />
                <Route path="/admin/scores" element={<AdminScores />} />
                <Route path="/admin/messages" element={<AdminMessages />} />
                <Route path="/admin/bot-settings" element={<AdminBotSettings />} />
                <Route path="/admin/email" element={<AdminEmail />} />
                <Route path="/admin/team" element={<AdminTeam />} />
                <Route path="/admin/schedule" element={<AdminSchedule />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/payment-instructions" element={<AdminPaymentInstructions />} />
                <Route path="/admin/faqs" element={<AdminFAQ />} />
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
