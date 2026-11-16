import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CreateDealPage } from './pages/CreateDealPage';
import { DealRoomPage } from './pages/DealRoomPage';
import { DriverPingPage } from './pages/DriverPingPage';
import { VendorDashboard } from './pages/dashboard/vendor/VendorDashboard';
import { BuyerDashboard } from './pages/dashboard/buyers/BuyerDashboard';
import { AdminDashboard } from './pages/dashboard/admin/AdminDashboard';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0B0B10] text-white flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Organized Role Dashboards inside src/pages/dashboard/{vendor,buyers,admin} */}
            <Route path="/dashboard" element={<Navigate to="/dashboard/vendor" replace />} />
            <Route path="/dashboard/vendor" element={<VendorDashboard />} />
            <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />

            <Route path="/create" element={<CreateDealPage />} />
            <Route path="/v/:shortCode" element={<DealRoomPage />} />
            <Route path="/d/:pingToken" element={<DriverPingPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;