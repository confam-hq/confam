import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, homeFor } from "../../context/AuthContext";
import type { Role } from "../../types/deal.types";

export default function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading)
    return <div className="grid min-h-[50vh] place-items-center text-sm text-muted">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}