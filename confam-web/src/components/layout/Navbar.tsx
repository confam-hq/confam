import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Search } from "lucide-react";
import ConfamLogo from "./ConfamLogo";
import ThemeToggle from "./ThemeToggle";
import { useAuth, homeFor } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const lookup = (e: React.FormEvent) => {
    e.preventDefault();
    const code = q.trim();
    if (code) {
      nav(`/deal/${encodeURIComponent(code)}`);
      setQ("");
      ref.current?.blur();
    }
  };

  const search = (
    <form onSubmit={lookup} className="relative w-full">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Look up deal code" className="input pl-9 pr-12" />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 py-0.5 text-[10px] text-muted sm:block">⌘K</kbd>
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to={user ? homeFor(user.role) : "/"}><ConfamLogo size={32} /></Link>
        <div className="mx-4 hidden max-w-sm flex-1 md:block">{search}</div>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <ThemeToggle />
              <button
                onClick={() => { logout(); nav("/"); }}
                aria-label="Log out"
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:bg-surface-2 hover:text-ink"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/register" className="btn-primary hidden sm:inline-flex">Get started</Link>
            </>
          )}
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden">{search}</div>
    </header>
  );
}