import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
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

function Shell() {
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
      <Route element={<Shell />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/deal/:code" element={<DealRoomPage />} />
        <Route path="/ping/:token" element={<DriverPingPage />} />

        <Route element={<ProtectedRoute roles={["vendor"]} />}>
          <Route path="/dashboard/vendor" element={<VendorDashboard />} />
          <Route path="/deals/new" element={<CreateDealPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={["buyer"]} />}>
          <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
        </Route>
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}