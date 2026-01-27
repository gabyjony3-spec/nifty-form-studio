import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import ThankYouPage from "./pages/ThankYouPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { AdminLoginRoute } from "./components/AdminLoginRoute";
import { UserLayout } from "./components/UserLayout";
import { AdminLayout } from "./components/AdminLayout";

// User pages
import UserDashboard from "./pages/user/UserDashboard";
import LeadsPage from "./pages/user/LeadsPage";
import AutomationPage from "./pages/user/AutomationPage";
import AnalysisPage from "./pages/user/AnalysisPage";
import AnalyticsPage from "./pages/user/AnalyticsPage";
import HistoryPage from "./pages/user/HistoryPage";
import LibraryPage from "./pages/user/LibraryPage";
import TeamPage from "./pages/user/TeamPage";
import SettingsPage from "./pages/user/SettingsPage";
import ProfilePage from "./pages/user/ProfilePage";
import PricingPage from "./pages/user/PricingPage";
import ReportsPage from "./pages/user/ReportsPage";
import IntegrationsUserPage from "./pages/user/IntegrationsUserPage";
import RadarNichePage from "./pages/user/RadarNichePage";
import WhatsAppUserHistoryPage from "./pages/user/WhatsAppUserHistoryPage";
import EliteUpgradePage from "./pages/user/EliteUpgradePage";
import ProfileResultPage from "./pages/user/ProfileResultPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminRegisterPage from "./pages/admin/AdminRegisterPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FunnelPage from "./pages/admin/FunnelPage";
import AdminLeadsPage from "./pages/admin/AdminLeadsPage";
import AdminAnalysisLeadsPage from "./pages/admin/AdminAnalysisLeadsPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import WebhooksPage from "./pages/admin/WebhooksPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import IntegrationsPage from "./pages/admin/IntegrationsPage";
import AIAnalysisPage from "./pages/admin/AIAnalysisPage";
import UsersPage from "./pages/admin/UsersPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import AccessCodesPage from "./pages/admin/AccessCodesPage";
import SubscriptionsListPage from "./pages/admin/SubscriptionsListPage";
import AdminAlertsPage from "./pages/admin/AdminAlertsPage";
import LifetimeAccessPage from "./pages/admin/LifetimeAccessPage";
import WhatsAppHistoryPage from "./pages/admin/WhatsAppHistoryPage";
import CompaniesPage from "./pages/admin/CompaniesPage";
import WhatsAppTemplatesPage from "./pages/admin/WhatsAppTemplatesPage";
import AutomationTriggersPage from "./pages/admin/AutomationTriggersPage";
import ServiceLeadsPage from "./pages/admin/ServiceLeadsPage";
import ServiceQuestionnairePage from "./pages/ServiceQuestionnairePage";
import ServiceThankYouPage from "./pages/ServiceThankYouPage";
import AnalysisCenterPage from "./pages/admin/AnalysisCenterPage";
import AdminCampaignsPage from "./pages/admin/AdminCampaignsPage";
import WhatsAppSettingsPage from "./pages/user/WhatsAppSettingsPage";
import UserAnalysisPage from "./pages/admin/UserAnalysisPage";
import WhatsAppCentralPage from "./pages/admin/WhatsAppCentralPage";
import TwilioDispatchPage from "./pages/admin/TwilioDispatchPage";
import UserPresencePage from "./pages/admin/UserPresencePage";
import ProfileHistoryPage from "./pages/user/ProfileHistoryPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/service-questionnaire" element={<ServiceQuestionnairePage />} />
          <Route path="/service-thank-you" element={<ServiceThankYouPage />} />
          <Route path="/admin/login" element={
            <AdminLoginRoute>
              <AdminLoginPage />
            </AdminLoginRoute>
          } />
          <Route path="/admin/register" element={
            <AdminLoginRoute>
              <AdminRegisterPage />
            </AdminLoginRoute>
          } />
          
          {/* User dashboard routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <UserLayout>
                <UserDashboard />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/radar" element={
            <ProtectedRoute>
              <UserLayout>
                <RadarNichePage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/leads" element={
            <ProtectedRoute>
              <UserLayout>
                <LeadsPage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/automation" element={
            <ProtectedRoute>
              <UserLayout>
                <AutomationPage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/analysis" element={
            <ProtectedRoute>
              <UserLayout>
                <AnalysisPage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/analytics" element={
            <ProtectedRoute>
              <UserLayout>
                <AnalyticsPage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/history" element={
            <ProtectedRoute>
              <UserLayout>
                <HistoryPage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/library" element={
            <ProtectedRoute>
              <UserLayout>
                <LibraryPage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/team" element={
            <ProtectedRoute>
              <UserLayout>
                <TeamPage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/settings" element={
            <ProtectedRoute>
              <UserLayout>
                <SettingsPage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/profile" element={
            <ProtectedRoute>
              <UserLayout>
                <ProfilePage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/pricing" element={
            <ProtectedRoute>
              <UserLayout>
                <PricingPage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/reports" element={
            <ProtectedRoute>
              <UserLayout>
                <ReportsPage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/integrations" element={
            <ProtectedRoute>
              <UserLayout>
                <IntegrationsUserPage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/whatsapp" element={
            <ProtectedRoute>
              <UserLayout>
                <WhatsAppSettingsPage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/whatsapp-history" element={
            <ProtectedRoute>
              <UserLayout>
                <WhatsAppUserHistoryPage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/upgrade-elite" element={
            <ProtectedRoute>
              <UserLayout>
                <EliteUpgradePage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/profile-result/:analysisId" element={
            <ProtectedRoute>
              <UserLayout>
                <ProfileResultPage />
              </UserLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/history-global" element={
            <ProtectedRoute>
              <UserLayout>
                <ProfileHistoryPage />
              </UserLayout>
            </ProtectedRoute>
          } />

          {/* Admin dashboard routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/analysis-center" element={
            <AdminRoute>
              <AdminLayout>
                <AnalysisCenterPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/campaigns" element={
            <AdminRoute>
              <AdminLayout>
                <AdminCampaignsPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/funnel" element={
            <AdminRoute>
              <AdminLayout>
                <FunnelPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/leads" element={
            <AdminRoute>
              <AdminLayout>
                <AdminLeadsPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/analysis-leads" element={
            <AdminRoute>
              <AdminLayout>
                <AdminAnalysisLeadsPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/payments" element={
            <AdminRoute>
              <AdminLayout>
                <PaymentsPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/webhooks" element={
            <AdminRoute>
              <AdminLayout>
                <WebhooksPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/analytics" element={
            <AdminRoute>
              <AdminLayout>
                <AdminAnalyticsPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/integrations" element={
            <AdminRoute>
              <AdminLayout>
                <IntegrationsPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/subscriptions" element={
            <AdminRoute>
              <AdminLayout>
                <SubscriptionsListPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/ai-analysis" element={
            <AdminRoute>
              <AdminLayout>
                <AIAnalysisPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminLayout>
                <UsersPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/perfil" element={
            <AdminRoute>
              <AdminLayout>
                <AdminProfilePage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminRoute>
              <AdminLayout>
                <AdminSettingsPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/access-codes" element={
            <AdminRoute>
              <AdminLayout>
                <AccessCodesPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/alerts" element={
            <AdminRoute>
              <AdminLayout>
                <AdminAlertsPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/lifetime-access" element={
            <AdminRoute>
              <AdminLayout>
                <LifetimeAccessPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/whatsapp-history" element={
            <AdminRoute>
              <AdminLayout>
                <WhatsAppHistoryPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/companies" element={
            <AdminRoute>
              <AdminLayout>
                <CompaniesPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/templates" element={
            <AdminRoute>
              <AdminLayout>
                <WhatsAppTemplatesPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/automations" element={
            <AdminRoute>
              <AdminLayout>
                <AutomationTriggersPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/service-leads" element={
            <AdminRoute>
              <AdminLayout>
                <ServiceLeadsPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/user-analysis" element={
            <AdminRoute>
              <AdminLayout>
                <UserAnalysisPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/whatsapp-central" element={
            <AdminRoute>
              <AdminLayout>
                <WhatsAppCentralPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/twilio-dispatch" element={
            <AdminRoute>
              <AdminLayout>
                <TwilioDispatchPage />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/presence" element={
            <AdminRoute>
              <AdminLayout>
                <UserPresencePage />
              </AdminLayout>
            </AdminRoute>
          } />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
