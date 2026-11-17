import { Routes, Route, Navigate, Outlet } from "react-router-dom";
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
import BuyerDashboard from "./pages/dashboard/buyers/BuyerDashboard";
import AdminDashboard from "./pages/dashboard/admin/AdminDashboard";

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
    <Routes>
      <Route element={<MarketingShell />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/deal/:code" element={<DealRoomPage />} />
        <Route path="/ping/:token" element={<DriverPingPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["vendor"]} />}>
        <Route element={<DashboardShell />}>
          <Route path="/dashboard/vendor" element={<VendorDashboard />} />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}