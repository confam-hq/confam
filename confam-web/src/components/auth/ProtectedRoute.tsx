import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import LoadingScreen from "../feedback/LoadingScreen";
import SessionLockScreen from "./SessionLockScreen";
import type { Role } from "../../types/deal.types";

export default function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading, locked } = useAuth();
  const loc = useLocation();
  if (loading) return <LoadingScreen label="Checking your secure session" />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (locked) return <SessionLockScreen />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/403" replace />;
  return <Outlet />;
}