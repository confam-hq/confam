import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { dealApi } from '../api/dealApi';
import { Navigation, CheckCircle2, Truck, Loader2 } from 'lucide-react';

export const DriverPingPage: React.FC = () => {
  const { pingToken = '' } = useParams<{ pingToken: string }>();
  const [manifest, setManifest] = useState<any>(null);
  const [locationLabel, setLocationLabel] = useState('Arrived at UNIZIK Tempsite Park, Awka');
  const [pinging, setPinging] = useState(false);
  const [pingSuccess, setPingSuccess] = useState(false);

  useEffect(() => {
    dealApi.getDriverManifest(pingToken).then(setManifest).catch(() => {});
  }, [pingToken]);

  const handleSendGpsPing = () => {
    setPinging(true);
    setPingSuccess(false);

    const submit = async (lat: number, lng: number) => {
      try {
        await dealApi.submitDriverPing(pingToken, lat, lng, locationLabel);
        setPingSuccess(true);
        const updated = await dealApi.getDriverManifest(pingToken);
        setManifest(updated);
      } finally {
        setPinging(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => submit(pos.coords.latitude, pos.coords.longitude),
        () => submit(6.222, 7.0821) // Awka Tempsite coordinates fallback
      );
    } else {
      submit(6.222, 7.0821);
    }
  };

  if (!manifest) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-xs font-mono-tabular text-[#A1A1AA]">
        Loading Driver Waybill Manifest...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10 space-y-5">
      <div className="bg-[#121216] border border-[#27272A] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-[#F59E0B]">
          <Truck className="w-5 h-5" />
          <span className="font-mono-tabular font-bold text-xs uppercase">
            ZERO-INSTALL DRIVER TRANSIT CHECK-IN
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="font-display font-bold text-xl text-[#FAFAFA]">
            Waybill #{manifest.waybill_number || manifest.short_code}
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            {manifest.transport_company} → <strong className="text-[#FAFAFA]">{manifest.destination_park}</strong>
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[#09090B] border border-[#27272A] text-xs space-y-1 font-mono-tabular">
          <div className="flex justify-between">
            <span className="text-[#A1A1AA]">Package:</span>
            <span className="text-[#FAFAFA]">{manifest.item_title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#A1A1AA]">Receiver Phone:</span>
            <span className="text-[#10B981]">{manifest.buyer_phone_masked}</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-[#A1A1AA] block mb-1">Current Stop / Park Landmark</label>
          <input
            type="text"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA]"
          />
        </div>

        <button
          type="button"
          onClick={handleSendGpsPing}
          disabled={pinging}
          className="w-full py-3.5 rounded-xl bg-[#10B981] text-[#09090B] font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
        >
          {pinging ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              <span>Tap to Share Live GPS Transit Ping</span>
            </>
          )}
        </button>

        {pingSuccess && (
          <div className="p-3 rounded-lg bg-[#10B981]/15 border border-[#10B981] text-xs text-[#10B981] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Buyer tracking screen updated with your live GPS location!</span>
          </div>
        )}
      </div>
    </div>
  );
};