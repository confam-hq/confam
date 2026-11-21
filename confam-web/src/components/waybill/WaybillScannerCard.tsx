import { useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { dealApi } from "../../api/dealApi";
import { errMsg } from "../../api/client";
import { useToast } from "../../context/useToast";
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

const fieldLabels: { key: WaybillFieldKey; label: string; required?: boolean; maxLength: number }[] = [
  { key: "transport_company", label: "Transport company", required: true, maxLength: 120 },
  { key: "waybill_number", label: "Waybill number", maxLength: 80 },
  { key: "driver_phone", label: "Driver phone", required: true, maxLength: 25 },
  { key: "vehicle_plate", label: "Vehicle plate", maxLength: 30 },
  { key: "origin_park", label: "Origin park", maxLength: 120 },
  { key: "destination_park", label: "Destination park", required: true, maxLength: 120 },
];

export default function WaybillScannerCard({ code, onDone }: { code: string; onDone: (d: Deal) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [err, setErr] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [formOpen, setFormOpen] = useState(false);
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
  const toast = useToast();

  const pick = async (f?: File | null) => {
    if (!f) return;
    setScanning(true);
    setErr("");
    setReceipt(f);
    setFormOpen(true);
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
      toast.info("Waybill scanned", "Review the extracted details before dispatching.");
    } catch (e) {
      const message = errMsg(e, "Could not read waybill");
      setErr(message);
      toast.info("Manual entry is available", message);
      setValidReceipt(false);
      setFields((current) => ({
        ...current,
        ai_summary_note: "OCR is unavailable. Enter the waybill details manually.",
      }));
    } finally {
      setScanning(false);
    }
  };

  const dispatch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requiredFields = ["transport_company", "driver_phone", "destination_park"] as const;
    if (requiredFields.some((key) => !fields[key].trim())) {
      const message = "Add the transport company, driver phone, and destination before dispatching.";
      setErr(message);
      toast.error("Waybill details are incomplete", message);
      return;
    }

    setDispatching(true);
    setErr("");
    try {
      onDone(await dealApi.dispatch(code, {
        ...fields,
        transport_company: fields.transport_company.trim(),
        driver_phone: fields.driver_phone.trim(),
        destination_park: fields.destination_park.trim(),
        receipt_image: receipt,
      }));
      toast.success("Deal dispatched", "Waybill details were saved and the buyer can track delivery.");
    } catch (e) {
      const message = errMsg(e, "Could not save waybill and dispatch deal.");
      setErr(message);
      toast.error("Could not dispatch deal", message);
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
      {!formOpen && (
        <button
          type="button"
          onClick={() => {
            setErr("");
            setValidReceipt(false);
            setFields((current) => ({
              ...current,
              ai_summary_note: "Manual entry. Check each waybill field before dispatch.",
            }));
            setFormOpen(true);
          }}
          disabled={dispatching}
          className="btn-ghost min-h-12 w-full"
        >
          Enter waybill details manually
        </button>
      )}
      {formOpen && (
        <form onSubmit={dispatch} className="space-y-3">
          <fieldset disabled={scanning || dispatching} className="space-y-3">
          {validReceipt === false && (
            <p role="status" className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              {receipt ? "AI could not verify this receipt. Review and edit the details manually." : "No receipt image attached. Enter the waybill details manually."}
            </p>
          )}
          {fieldLabels.map(({ key, label, required, maxLength }) => (
            <label key={key} className="block">
              <span className="label">{label}{required ? " *" : ""}</span>
              <input
                required={required}
                maxLength={maxLength}
                className="input"
                value={fields[key] ?? ""}
                onChange={(event) => updateField(key, event.target.value)}
              />
            </label>
          ))}
          <p className="text-xs text-muted">{fields.ai_summary_note}</p>
          </fieldset>
          <button type="submit" disabled={dispatching || scanning} className="btn-primary min-h-14 w-full rounded-2xl text-base">
            {dispatching ? "Saving waybill…" : "Save details and dispatch"}
          </button>
        </form>
      )}
      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
    </div>
  );
}