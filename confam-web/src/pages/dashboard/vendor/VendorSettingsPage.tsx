import { LockKeyhole, LogOut, Moon, Sun } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { useToast } from "../../../context/useToast";

export default function VendorSettingsPage() {
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const selectTheme = (nextTheme: "dark" | "light") => {
    if (theme !== nextTheme) toggle();
  };

  return (
    <div className="mx-auto max-w-3xl py-2">
      <div className="mb-6">
        <p className="label">Vendor workspace</p>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage the appearance and access to your Confam workspace.</p>
      </div>

      <section className="neo-card rounded-2xl p-5 sm:p-6">
        <div>
          <h2 className="font-semibold">Appearance</h2>
          <p className="mt-1 text-sm text-muted">Choose the theme used across your dashboard. Your choice is saved on this device.</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {([
            { value: "light", label: "Light", Icon: Sun },
            { value: "dark", label: "Dark", Icon: Moon },
          ] as const).map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={theme === value}
              onClick={() => selectTheme(value)}
              className={`neo-card flex min-h-14 items-center justify-between rounded-xl px-4 transition ${
                theme === value ? "border-brand ring-1 ring-brand" : "hover:-translate-y-0.5"
              }`}
            >
              <span className="flex items-center gap-3"><Icon size={17} />{label}</span>
              <span className="text-xs text-muted">{theme === value ? "Selected" : "Select"}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="neo-card mt-4 rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <LockKeyhole size={18} className="mt-0.5 text-brand" />
          <div>
            <h2 className="font-semibold">Account and security</h2>
            <p className="mt-1 text-sm text-muted">Review your contact and payout details in your profile. Log out to end this session on the current device.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/dashboard/vendor/profile" className="btn-ghost min-h-11">Review profile</Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  toast.info("Signed out", "Your Confam session has ended.");
                  navigate("/", { replace: true });
                }}
                className="btn-ghost min-h-11"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
