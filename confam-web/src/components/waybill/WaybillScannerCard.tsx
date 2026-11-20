import { useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { dealApi } from "../../api/dealApi";
import { errMsg } from "../../api/client";
import type { Deal } from "../../types/deal.types";

type WaybillFields = {
  transport_company: string;
  waybill_number: string;
  driver_phone: string;
  vehicle_plate: string;
  origin_park: string;
  destination_park: string;
  ai_summary_note: string;
};
type WaybillFieldKey = keyof Omit<WaybillFields, "ai_summary_note">;

const fieldLabels: { key: WaybillFieldKey; label: string; required?: boolean }[] = [
  { key: "transport_company", label: "Transport company", required: true },
  { key: "waybill_number", label: "Waybill number" },
  { key: "driver_phone", label: "Driver phone", required: true },
  { key: "vehicle_plate", label: "Vehicle plate" },
  { key: "origin_park", label: "Origin park" },
  { key: "destination_park", label: "Destination park", required: true },
];

export default function WaybillScannerCard({ code, onDone }: { code: string; onDone: (d: Deal) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [err, setErr] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [fields, setFields] = useState<WaybillFields>({
    transport_company: "",
    waybill_number: "",
    driver_phone: "",
    vehicle_plate: "",
    origin_park: "",
    destination_park: "",
    ai_summary_note: "",
  });
  const [validReceipt, setValidReceipt] = useState<boolean | null>(null);

  const pick = async (f?: File | null) => {
    if (!f) return;
    setScanning(true);
    setErr("");
    setReceipt(null);
    setValidReceipt(null);
    setFields({
      transport_company: "",
      waybill_number: "",
      driver_phone: "",
      vehicle_plate: "",
      origin_park: "",
      destination_park: "",
      ai_summary_note: "",
    });
    if (input.current) input.current.value = "";
    try {
      const result = await dealApi.scanWaybill(code, f);
      setReceipt(f);
      setFields({
        transport_company: result.transport_company ?? "",
        waybill_number: result.waybill_number ?? "",
        driver_phone: result.driver_phone ?? "",
        vehicle_plate: result.vehicle_plate ?? "",
        origin_park: result.origin_park ?? "",
        destination_park: result.destination_park ?? "",
        ai_summary_note: result.ai_summary_note ?? "Review and correct the extracted details before dispatch.",
      });
      setValidReceipt(result.is_valid_receipt ?? false);
    } catch (e) {
      setErr(errMsg(e, "Could not read waybill"));
    } finally {
      setScanning(false);
    }
  };

  const dispatch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!receipt) return;
    setDispatching(true);
    setErr("");
    try {
      onDone(await dealApi.dispatch(code, { ...fields, receipt_image: receipt }));
    } catch (e) {
      setErr(errMsg(e, "Could not save waybill and dispatch deal."));
    } finally {
      setDispatching(false);
    }
  };

  const updateField = (key: WaybillFieldKey, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="neo-card space-y-4 rounded-2xl p-4">
      <div>
        <p className="mb-1 flex items-center gap-2 text-sm font-medium"><ScanLine size={16} className="text-brand" /> Scan motor-park waybill</p>
        <p className="text-xs text-muted">AI extracts the receipt details. Review them before dispatching the deal.</p>
      </div>
      <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <button type="button" onClick={() => input.current?.click()} disabled={scanning || dispatching} className="btn-ghost min-h-12 w-full">
        {scanning ? "Scanning receipt…" : receipt ? "Scan a different receipt" : "Take or upload receipt photo"}
      </button>
      {receipt && (
        <form onSubmit={dispatch} className="space-y-3">
          {validReceipt === false && (
            <p role="status" className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              AI could not verify this receipt. Enter the waybill details manually and check them carefully.
            </p>
          )}
          {fieldLabels.map(({ key, label, required }) => (
            <label key={key} className="block">
              <span className="label">{label}{required ? " *" : ""}</span>
              <input
                required={required}
                className="input"
                value={fields[key] ?? ""}
                onChange={(event) => updateField(key, event.target.value)}
              />
            </label>
          ))}
          <p className="text-xs text-muted">{fields.ai_summary_note}</p>
          <button type="submit" disabled={dispatching || scanning} className="btn-primary min-h-14 w-full rounded-2xl text-base">
            {dispatching ? "Saving waybill…" : "Confirm details and dispatch"}
          </button>
        </form>
      )}
      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
    </div>
  );
}