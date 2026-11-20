import { Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import DashboardShell from "./components/layout/DashboardShell";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CreateDealPage from "./pages/CreateDealPage";
import DealRoomPage from "./pages/DealRoomPage";
import DriverPingPage from "./pages/DriverPingPage";
import VendorDashboard from "./pages/dashboard/vendor/VendorDashboard";
import VendorAnalyticsPage from "./pages/dashboard/vendor/VendorAnalyticsPage";
import VendorDisputesPage from "./pages/dashboard/vendor/VendorDisputesPage";
import VendorProfilePage from "./pages/dashboard/vendor/VendorProfilePage";
import VendorSettingsPage from "./pages/dashboard/vendor/VendorSettingsPage";
import BuyerDashboard from "./pages/dashboard/buyers/BuyerDashboard";
import AdminDashboard from "./pages/dashboard/admin/AdminDashboard";
import LegalPage from "./pages/LegalPage";
import StatusPage from "./pages/StatusPage";
import AppErrorBoundary from "./components/feedback/AppErrorBoundary";

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
      <Routes>
        <Route element={<MarketingShell />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/deal/:code" element={<DealRoomPage />} />
          <Route path="/ping/:token" element={<DriverPingPage />} />
          <Route path="/terms" element={<LegalPage page="terms" />} />
          <Route path="/privacy" element={<LegalPage page="privacy" />} />
          <Route path="/cookies" element={<LegalPage page="cookies" />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/403" element={<StatusPage code="403" />} />

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
    </AppErrorBoundary>
  );
}