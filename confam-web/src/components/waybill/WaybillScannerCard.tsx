import React, { useState } from 'react';
import { Sparkles, Upload, Loader2, Truck } from 'lucide-react';
import { dealApi } from '../../api/dealApi';

export interface WaybillFormValues {
  receiptFile: File | null;
  transport_company: string;
  waybill_number: string;
  driver_phone: string;
  vehicle_plate: string;
  origin_park: string;
  destination_park: string;
  ai_ocr_summary: string;
}

interface Props {
  shortCode: string;
  values: WaybillFormValues;
  onChange: (updated: WaybillFormValues) => void;
}

export const WaybillScannerCard: React.FC<Props> = ({ shortCode, values, onChange }) => {
  const [scanning, setScanning] = useState(false);

  const handleReceiptSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onChange({ ...values, receiptFile: file });
    setScanning(true);

    try {
      const ocr = await dealApi.parseWaybillReceipt(shortCode, file);
      onChange({
        receiptFile: file,
        transport_company: ocr.transport_company || values.transport_company || 'Peace Mass Transit',
        waybill_number: ocr.waybill_number || values.waybill_number,
        driver_phone: ocr.driver_phone || values.driver_phone,
        vehicle_plate: ocr.vehicle_plate || values.vehicle_plate,
        origin_park: ocr.origin_park || values.origin_park || 'Onitsha Park',
        destination_park: ocr.destination_park || values.destination_park || 'UNIZIK Tempsite Park, Awka',
        ai_ocr_summary: ocr.ai_summary_note || 'AI CONFAMED: Motor-park waybill extracted.',
      });
    } catch {
      onChange({
        ...values,
        receiptFile: file,
        ai_ocr_summary: 'Receipt attached. Verify manifest details below.',
      });
    } finally {
      setScanning(false);
    }
  };

  const updateField = (field: keyof WaybillFormValues, val: string) => {
    onChange({ ...values, [field]: val });
  };

  return (
    <div className="bg-[#121216] border border-[#27272A] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-[#F59E0B]" />
          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-[#FAFAFA]">
            Step 2: AI Motor-Park Waybill Scanner
          </h3>
        </div>
        <span className="text-[11px] font-mono-tabular px-2 py-0.5 rounded bg-[#09090B] border border-[#27272A] text-[#10B981] flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> GEMINI VISION OCR
        </span>
      </div>

      <label className="block w-full py-3.5 px-4 rounded-lg border border-dashed border-[#27272A] hover:border-[#F59E0B] bg-[#09090B] text-center cursor-pointer transition">
        <input type="file" accept="image/*" capture="environment" onChange={handleReceiptSelect} className="hidden" />
        {scanning ? (
          <span className="flex items-center justify-center gap-2 text-xs text-[#F59E0B] font-semibold">
            <Loader2 className="w-4 h-4 animate-spin" /> Gemini Vision extracting park ticket details...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2 text-xs text-[#FAFAFA] font-medium">
            <Upload className="w-4 h-4 text-[#F59E0B]" />
            {values.receiptFile
              ? `Scanned: ${values.receiptFile.name} (Tap to rescan)`
              : 'Snap Peace Mass / GUO / ITC / Park Waybill Ticket'}
          </span>
        )}
      </label>

      {values.ai_ocr_summary && (
        <div className="px-3 py-2 rounded bg-[#10B981]/10 border border-[#10B981]/40 text-xs text-[#10B981] font-mono-tabular">
          {values.ai_ocr_summary}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <div>
          <label className="text-[11px] text-[#A1A1AA] block mb-1">Transport Company / Park *</label>
          <input
            type="text"
            value={values.transport_company}
            onChange={(e) => updateField('transport_company', e.target.value)}
            placeholder="e.g. Peace Mass Transit / GUO"
            className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA]"
            required
          />
        </div>
        <div>
          <label className="text-[11px] text-[#A1A1AA] block mb-1">Waybill / Manifest Code</label>
          <input
            type="text"
            value={values.waybill_number}
            onChange={(e) => updateField('waybill_number', e.target.value)}
            placeholder="e.g. PMT-AWK-49201"
            className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs font-mono-tabular text-[#FAFAFA]"
          />
        </div>
        <div>
          <label className="text-[11px] text-[#A1A1AA] block mb-1">Driver / Rider Phone *</label>
          <input
            type="tel"
            value={values.driver_phone}
            onChange={(e) => updateField('driver_phone', e.target.value)}
            placeholder="e.g. 08035550199"
            className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs font-mono-tabular text-[#FAFAFA]"
            required
          />
        </div>
        <div>
          <label className="text-[11px] text-[#A1A1AA] block mb-1">Bus / Vehicle Plate No.</label>
          <input
            type="text"
            value={values.vehicle_plate}
            onChange={(e) => updateField('vehicle_plate', e.target.value)}
            placeholder="e.g. ANR-402XY"
            className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs font-mono-tabular text-[#FAFAFA]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[11px] text-[#A1A1AA] block mb-1">Destination Park / Drop-off Point *</label>
          <input
            type="text"
            value={values.destination_park}
            onChange={(e) => updateField('destination_park', e.target.value)}
            placeholder="e.g. UNIZIK Tempsite Park, Awka"
            className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA]"
            required
          />
        </div>
      </div>
    </div>
  );
};