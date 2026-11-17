import { LayoutDashboard, LogOut, Plus } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth, homeFor } from "../../context/AuthContext";
import ConfamLogo from "./ConfamLogo";
import ThemeToggle from "./ThemeToggle";

export default function DashboardShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const items = [
    {
      to: homeFor(user.role),
      label: user.role === "buyer" ? "Purchases" : user.role === "admin" ? "Disputes" : "Overview",
      icon: LayoutDashboard,
    },
    ...(user.role === "vendor" ? [{ to: "/deals/new", label: "Create deal", icon: Plus }] : []),
  ];

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
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
              onClick={() => {
                logout();
                navigate("/", { replace: true });
              }}
              aria-label="Log out"
              className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:bg-surface-2 hover:text-ink"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-line bg-surface px-3 py-3 lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
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
                    isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-muted hover:bg-surface-2 hover:text-ink"
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
