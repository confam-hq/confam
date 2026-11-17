import { useState } from "react";
import { Delete } from "lucide-react";

export default function OtpReleasePad({
  onSubmit,
  busy,
}: {
  onSubmit: (otp: string) => void;
  busy?: boolean;
}) {
  const [digits, setDigits] = useState("");
  const press = (d: string) => setDigits((p) => (p.length < 4 ? p + d : p));

  return (
    <div className="mx-auto w-full max-w-[260px]">
      <div className="mb-4 flex justify-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`font-mono-tabular grid h-12 w-12 place-items-center rounded-lg border text-xl ${
              digits[i] ? "border-brand" : "border-line"
            } bg-surface`}
          >
            {digits[i] ? "•" : ""}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
          <button key={n} onClick={() => press(n)} className="btn-ghost font-mono-tabular h-11 text-base">
            {n}
          </button>
        ))}
        <span />
        <button onClick={() => press("0")} className="btn-ghost font-mono-tabular h-11 text-base">0</button>
        <button onClick={() => setDigits((p) => p.slice(0, -1))} aria-label="Delete" className="btn-ghost h-11">
          <Delete size={16} />
        </button>
      </div>
      <button
        disabled={digits.length !== 4 || busy}
        onClick={() => onSubmit(digits)}
        className="btn-primary mt-3 w-full"
      >
        {busy ? "Releasing…" : "Release payment"}
      </button>
    </div>
  );
}