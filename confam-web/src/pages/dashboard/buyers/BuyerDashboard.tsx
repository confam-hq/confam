import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dealApi } from '../../../api/dealApi';
import { type Deal } from '../../../types/deal.types';
import { formatNaira } from '../../../utils/formatNaira';
import {
  Search,
  ShieldCheck,
  KeyRound,
  ArrowUpRight,
  Video,
} from 'lucide-react';

export const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState('');
  const [recentDeals, setRecentDeals] = useState<{ code: string; otp: string | null; deal?: Deal }[]>([]);

  useEffect(() => {
    // Load any deal codes or OTPs saved in this buyer's browser
    const items: { code: string; otp: string | null }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('confam_buyer_otp_')) {
        const code = k.replace('confam_buyer_otp_', '');
        items.push({ code, otp: localStorage.getItem(k) });
      }
    }

    Promise.all(
      items.map(async (item) => {
        try {
          const deal = await dealApi.getDeal(item.code);
          return { ...item, deal };
        } catch {
          return item;
        }
      })
    ).then(setRecentDeals);
  }, []);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = searchCode.trim().toUpperCase();
    if (!cleaned) return;
    navigate(`/v/${cleaned.startsWith('CF-') ? cleaned : `CF-${cleaned}`}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header & Role Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-display font-semibold uppercase tracking-widest text-[#10B981]">
            BUYER PROTECTION & WAYBILL TRACKING HUB
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white mt-0.5">
            Buyer Escrow & Delivery Portal
          </h1>
          <p className="text-xs text-[#9496A1] mt-1">
            Pay safely via Paystack Popup, watch the vendor&apos;s Proof-of-Pack video, and release funds with your 4-digit OTP.
          </p>
        </div>

        <div className="inline-flex rounded-full bg-[#13131F] p-1 border border-white/10 text-xs">
          <Link to="/dashboard/vendor" className="px-3.5 py-1.5 rounded-full text-[#9496A1] hover:text-white font-display">
            Vendor
          </Link>
          <Link to="/dashboard/buyer" className="px-3.5 py-1.5 rounded-full bg-[#7C5CFC] text-white font-display font-semibold">
            Buyer
          </Link>
          <Link to="/dashboard/admin" className="px-3.5 py-1.5 rounded-full text-[#9496A1] hover:text-white font-display">
            Admin
          </Link>
        </div>
      </div>

      {/* Instant Deal Lookup Banner */}
      <div className="iz-card p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-2">
          <h2 className="font-display font-bold text-xl text-white">
            Received a Confam Link on WhatsApp or Instagram?
          </h2>
          <p className="text-xs text-[#9496A1]">
            Enter the Deal Code (e.g. <span className="text-white font-mono-tabular">CF-8492</span>) to open the Paystack Inline Popup, inspect the Gemini 3.8 Video OCR report, or unlock settlement.
          </p>
        </div>
        <form onSubmit={handleLookup} className="lg:col-span-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9496A1] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Enter Deal ID (e.g. CF-8492)"
              className="iz-input !pl-10 uppercase font-mono-tabular"
            />
          </div>
          <button type="submit" className="iz-btn-pill shrink-0">
            <span>Open Deal</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Saved Buyer Deals & Secret 4-Digit Release OTPs */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-lg text-white">
          Your Active Protected Purchases & Release OTPs
        </h3>

        {recentDeals.length === 0 ? (
          <div className="iz-card p-8 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-[#7C5CFC] mx-auto" />
            <div className="font-display font-semibold text-sm text-white">
              No Saved Purchases on This Browser Yet
            </div>
            <p className="text-xs text-[#9496A1] max-w-md mx-auto">
              Whenever you fund a deal via the Paystack Popup, your secret 4-digit Release OTP and live motor-park waybill tracker will appear automatically right here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recentDeals.map(({ code, otp, deal }) => (
              <div key={code} className="iz-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="font-mono-tabular font-bold text-sm text-[#9B82FF]">#{code}</span>
                    <h4 className="font-display font-semibold text-base text-white">
                      {deal?.item.title || 'Protected Escrow Order'}
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-xs font-mono-tabular text-[#10B981]">
                    {deal?.status || 'FUNDED'}
                  </span>
                </div>

                {otp && (
                  <div className="p-3.5 rounded-xl bg-[#0B0B10] border border-[#7C5CFC]/40 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#9496A1]">
                      <KeyRound className="w-4 h-4 text-[#7C5CFC]" />
                      <span>Your Secret 4-Digit Release OTP:</span>
                    </div>
                    <span className="font-mono-tabular font-bold text-lg tracking-[0.25em] text-[#10B981]">
                      {otp}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-[#9496A1]">
                  <span className="flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#9B82FF]" />
                    {deal?.proof_artifact ? 'Proof Video OCR Verified' : 'Awaiting Vendor Video'}
                  </span>
                  {deal && (
                    <span className="font-mono-tabular font-bold text-white">
                      {formatNaira(deal.financials.total_payable_naira)}
                    </span>
                  )}
                </div>

                <Link to={`/v/${code}`} className="iz-btn-pill w-full">
                  <span>Inspect Proof Video & Track Waybill</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};