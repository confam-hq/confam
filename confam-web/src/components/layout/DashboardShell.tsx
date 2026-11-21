import {
  ChartNoAxesColumnIncreasing,
  LayoutDashboard,
  LogOut,
  Monitor,
  Plus,
  Settings2,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { homeFor } from "../../context/authRoutes";
import { useToast } from "../../context/useToast";
import ConfamLogo from "./ConfamLogo";
import ThemeToggle from "./ThemeToggle";

export default function DashboardShell({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  if (!user) return null;

  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const items = [
    {
      to: homeFor(user.role),
      label: user.role === "buyer" ? "Purchases" : user.role === "admin" ? "Disputes" : "Overview",
      icon: LayoutDashboard,
    },
    ...(user.role === "vendor"
      ? [
          { to: "/dashboard/vendor/analytics", label: "Analytics", icon: ChartNoAxesColumnIncreasing },
          { to: "/deals/new", label: "Create deal", icon: Plus },
          { to: "/dashboard/vendor/disputes", label: "Submit dispute", icon: ShieldAlert },
          { to: "/dashboard/vendor/profile", label: "Profile", icon: UserRound },
          { to: "/dashboard/vendor/settings", label: "Settings", icon: Settings2 },
        ]
      : []),
    { to: "/sessions", label: "Sessions", icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      <header className="neo-card relative z-10 rounded-none border-x-0 border-t-0">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
          <Link to={homeFor(user.role)} aria-label="Confam dashboard">
            <ConfamLogo size={32} />
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted">{roleLabel} workspace</p>
            </div>
            <ThemeToggle />
            <button
              onClick={async () => {
                try {
                  await logout();
                  toast.info("Signed out", "Your Confam session has ended.");
                } catch (error) {
                  toast.error("Session ended locally", error instanceof Error ? error.message : "The server could not revoke the session.");
                } finally {
                  navigate("/", { replace: true });
                }
              }}
              aria-label="Log out"
              className="neo-card grid h-11 w-11 place-items-center rounded-xl text-muted transition hover:-translate-y-0.5 hover:text-ink"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-line bg-canvas px-3 py-3 lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
          <p className="mb-2 hidden px-3 text-[11px] font-semibold uppercase tracking-wider text-muted lg:block">
            Workspace
          </p>
          <nav aria-label="Dashboard navigation" className="flex gap-2 overflow-x-auto lg:flex-col">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? "neo-inset text-emerald-700 dark:text-emerald-300" : "text-muted hover:bg-surface-2 hover:text-ink"
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          {children ?? <Outlet />}
          <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
            <span>5% vendor fee applies to new deals only.</span>
            <nav aria-label="Legal links" className="flex gap-4">
              <Link to="/terms" className="hover:text-brand">Terms</Link>
              <Link to="/privacy" className="hover:text-brand">Privacy</Link>
              <Link to="/cookies" className="hover:text-brand">Cookies</Link>
            </nav>
          </footer>
        </main>
      </div>
    </div>
  );
}
