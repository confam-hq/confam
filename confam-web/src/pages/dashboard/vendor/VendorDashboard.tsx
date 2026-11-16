import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dealApi } from '../../../api/dealApi';
import { type Deal } from '../../../types/deal.types';
import { formatNaira } from '../../../utils/formatNaira';
import {
  Plus,
  Lock,
  Truck,
  CheckCircle2,
  Copy,
  Check,
  ArrowUpRight,
  Building2,
  Video,
  Sparkles,
  Loader2,
} from 'lucide-react';

export const VendorDashboard: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const rawUser = localStorage.getItem('confam_vendor_user');
  const vendor = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    dealApi
      .getVendorDeals()
      .then(setDeals)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const lockedTotal = deals
    .filter((d) => d.status === 'FUNDED_LOCKED' || d.status === 'DISPATCHED_IN_TRANSIT')
    .reduce((sum, d) => sum + d.financials.item_amount_naira + d.financials.waybill_fee_naira, 0);

  const settledTotal = deals
    .filter((d) => d.status === 'COMPLETED_RELEASED')
    .reduce((sum, d) => sum + d.financials.item_amount_naira + d.financials.waybill_fee_naira, 0);

  const awaitingProofCount = deals.filter((d) => d.status === 'FUNDED_LOCKED').length;

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/v/${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Role Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-display font-semibold uppercase tracking-widest text-[#9B82FF]">
            VENDOR ESCROW & WAYBILL HUB
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white mt-0.5">
            {vendor?.name || 'Merchant Command Center'}
          </h1>
          {vendor?.account_number && (
            <p className="text-xs text-[#9496A1] flex items-center gap-1.5 mt-1">
              <Building2 className="w-3.5 h-3.5 text-[#7C5CFC]" />
              <span>
                NUBAN Payout Vault: <strong className="text-white">{vendor.bank_name}</strong> •{' '}
                <span className="font-mono-tabular text-[#10B981]">{vendor.account_number}</span>
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-full bg-[#13131F] p-1 border border-white/10 text-xs">
            <Link to="/dashboard/vendor" className="px-3.5 py-1.5 rounded-full bg-[#7C5CFC] text-white font-display font-semibold">
              Vendor
            </Link>
            <Link to="/dashboard/buyer" className="px-3.5 py-1.5 rounded-full text-[#9496A1] hover:text-white font-display">
              Buyer
            </Link>
            <Link to="/dashboard/admin" className="px-3.5 py-1.5 rounded-full text-[#9496A1] hover:text-white font-display">
              Admin
            </Link>
          </div>

          <Link to="/create" className="iz-btn-pill">
            <Plus className="w-4 h-4" />
            <span>Create Escrow Link</span>
          </Link>
        </div>
      </div>

      {/* iZPAY Style Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="iz-card p-5 space-y-3">
          <div className="w-11 h-11 rounded-full bg-[#7C5CFC] flex items-center justify-center text-white shadow-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#9496A1]">Locked in Escrow Vault</div>
            <div className="font-display font-bold text-2xl text-white mt-0.5">
              {formatNaira(lockedTotal)}
            </div>
          </div>
        </div>

        <div className="iz-card p-5 space-y-3">
          <div className="w-11 h-11 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#9496A1]">Settled to Your Bank</div>
            <div className="font-display font-bold text-2xl text-[#10B981] mt-0.5">
              {formatNaira(settledTotal)}
            </div>
          </div>
        </div>

        <div className="iz-card p-5 space-y-3">
          <div className="w-11 h-11 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#9496A1]">Awaiting Video OCR Upload</div>
            <div className="font-display font-bold text-2xl text-white mt-0.5">
              {awaitingProofCount} Deals
            </div>
          </div>
        </div>

        <div className="iz-card p-5 space-y-3">
          <div className="w-11 h-11 rounded-full bg-[#7C5CFC]/20 border border-[#7C5CFC]/40 flex items-center justify-center text-[#9B82FF]">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#9496A1]">Total Created Links</div>
            <div className="font-display font-bold text-2xl text-white mt-0.5">
              {deals.length}
            </div>
          </div>
        </div>
      </div>

      {/* Active Vendor Deals Table */}
      <div className="iz-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-white">
            Your Escrow & Motor-Park Waybill Links
          </h2>
          <span className="text-xs font-mono-tabular text-[#9B82FF] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Gemini 3.8 Video OCR Active
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 text-[#7C5CFC] animate-spin mx-auto mb-2" />
            <p className="text-xs text-[#9496A1]">Loading merchant deals...</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <p className="font-display font-semibold text-base text-white">No Escrow Links Yet</p>
            <p className="text-xs text-[#9496A1] max-w-md mx-auto">
              Generate your first Confam link, accept instant Paystack popup deposits, and upload your Proof-of-Pack video for AI OCR verification.
            </p>
            <Link to="/create" className="iz-btn-pill mt-2">
              <Plus className="w-4 h-4" /> Create First Link
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-[#0B0B10]/60 font-display text-[11px] text-[#9496A1] uppercase">
                  <th className="py-3.5 px-5">Deal Code</th>
                  <th className="py-3.5 px-5">Item & Waybill Line</th>
                  <th className="py-3.5 px-5">Buyer</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Vendor Payout</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {deals.map((d) => (
                  <tr key={d.short_code} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-5 font-mono-tabular font-bold text-[#9B82FF]">
                      #{d.short_code}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-display font-semibold text-white">{d.item.title}</div>
                      <div className="text-[11px] text-[#9496A1]">
                        {d.waybill_manifest?.transport_company || d.delivery_mode}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-white">{d.buyer.name}</div>
                      <div className="text-[11px] font-mono-tabular text-[#9496A1]">{d.buyer.phone_masked}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-full bg-[#7C5CFC]/15 border border-[#7C5CFC]/30 text-[11px] font-mono-tabular text-[#B6A4FF]">
                        {d.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right font-mono-tabular font-bold text-[#10B981]">
                      {formatNaira(d.financials.item_amount_naira + d.financials.waybill_fee_naira)}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyLink(d.short_code)}
                          className="iz-btn-outline !py-1.5 !px-3"
                        >
                          {copiedCode === d.short_code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode === d.short_code ? 'Copied' : 'Copy'}</span>
                        </button>
                        <Link
                          to={`/v/${d.short_code}`}
                          className="iz-btn-pill !py-1.5 !px-3.5 !text-xs"
                        >
                          <span>{d.status === 'FUNDED_LOCKED' ? 'Upload Video OCR' : 'Open Room'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};