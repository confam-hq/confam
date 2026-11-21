import { lazy, Suspense } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import DashboardShell from "./components/layout/DashboardShell";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoadingScreen from "./components/feedback/LoadingScreen";
import CreateDealPage from "./pages/CreateDealPage";
import DealRoomPage from "./pages/DealRoomPage";
import DriverPingPage from "./pages/DriverPingPage";
import VendorDashboard from "./pages/dashboard/vendor/VendorDashboard";
import VendorAnalyticsPage from "./pages/dashboard/vendor/VendorAnalyticsPage";
import VendorDisputesPage from "./pages/dashboard/vendor/VendorDisputesPage";
import VendorProfilePage from "./pages/dashboard/vendor/VendorProfilePage";
import VendorSettingsPage from "./pages/dashboard/vendor/VendorSettingsPage";
import BuyerDashboard from "./pages/dashboard/buyers/BuyerDashboard";
import LegalPage from "./pages/LegalPage";
import StatusPage from "./pages/StatusPage";
import AppErrorBoundary from "./components/feedback/AppErrorBoundary";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const VerifyEmailPage = lazy(() => import("./pages/auth/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const SessionsPage = lazy(() => import("./pages/auth/SessionsPage"));
const AdminDashboard = lazy(() => import("./pages/dashboard/admin/AdminDashboard"));

function MarketingShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<LoadingScreen label="Loading your Confam workspace" />}>
        <Routes>
          <Route element={<MarketingShell />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/ping/:token" element={<DriverPingPage />} />
            <Route path="/terms" element={<LegalPage page="terms" />} />
            <Route path="/privacy" element={<LegalPage page="privacy" />} />
            <Route path="/cookies" element={<LegalPage page="cookies" />} />
          </Route>

          <Route path="/deal/:code" element={<DealRoomPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/403" element={<StatusPage code="403" />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardShell />}>
              <Route path="/sessions" element={<SessionsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["vendor"]} />}>
            <Route element={<DashboardShell />}>
              <Route path="/dashboard/vendor" element={<VendorDashboard />} />
              <Route path="/dashboard/vendor/analytics" element={<VendorAnalyticsPage />} />
              <Route path="/dashboard/vendor/disputes" element={<VendorDisputesPage />} />
              <Route path="/dashboard/vendor/profile" element={<VendorProfilePage />} />
              <Route path="/dashboard/vendor/settings" element={<VendorSettingsPage />} />
              <Route path="/deals/new" element={<CreateDealPage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute roles={["buyer"]} />}>
            <Route element={<DashboardShell />}>
              <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route element={<DashboardShell />}>
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
            </Route>
          </Route>
          <Route path="*" element={<StatusPage code="404" />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
}