import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";

export interface Option { value: string; label: string; hint?: string }

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  searchable?: boolean;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  align?: "left" | "right";
  className?: string;
}

export default function Select({
  value, onChange, options, placeholder = "Select…", searchable, loading, disabled, compact, align = "left", className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const search = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())),
    [options, q]
  );
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const h = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(Math.max(0, options.findIndex((o) => o.value === value)));
      if (searchable) setTimeout(() => search.current?.focus(), 0);
    }
    // eslint-disable-next-line
  }, [open]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    (list.current?.children[active] as HTMLElement | undefined)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const pick = (v: string) => { onChange(v); setOpen(false); };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); filtered[active] && pick(filtered[active].value); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={root} className={`relative ${className}`} onKeyDown={onKey}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-surface text-left text-sm outline-none transition disabled:opacity-60 ${
          compact ? "px-3 py-1.5" : "px-3 py-2.5"
        } ${open ? "border-brand ring-1 ring-brand" : "border-line hover:border-muted/60"}`}
      >
        <span className={`truncate ${selected ? "text-ink" : "text-muted"}`}>
          {loading ? "Loading…" : selected?.label ?? placeholder}
        </span>
        {loading ? (
          <Loader2 size={14} className="shrink-0 animate-spin text-muted" />
        ) : (
          <ChevronDown size={14} className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div
          className={`pop-in absolute z-50 mt-2 w-full min-w-[190px] overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-black/20 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {searchable && (
            <div className="border-b border-line p-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  ref={search}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
                  className="w-full rounded-md bg-surface-2 py-2 pl-8 pr-2 text-sm text-ink outline-none placeholder:text-muted"
                />
              </div>
            </div>
          )}
          <ul ref={list} role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filtered.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o.value)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm ${
                  i === active ? "bg-surface-2" : ""
                } ${o.value === value ? "font-semibold text-brand" : "text-ink"}`}
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <Check size={14} className="shrink-0" />}
              </li>
            ))}
            {!filtered.length && <li className="px-3 py-6 text-center text-xs text-muted">No results</li>}
          </ul>
        </div>
      )}
    </div>
  );
}