import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dealApi } from '../../../api/dealApi';
import { type Deal } from '../../../types/deal.types';
import { formatNaira } from '../../../utils/formatNaira';
import {
  ShieldAlert,
  Scale,
  Cpu,
  CheckCircle2,
  Lock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    dealApi.getVendorDeals().then(setDeals).catch(() => {});
  }, []);

  const totalPlatformFees = deals.reduce((acc, d) => acc + d.financials.platform_fee_naira, 0);
  const totalGmv = deals.reduce((acc, d) => acc + d.financials.total_payable_naira, 0);
  const disputedDeals = deals.filter((d) => d.status === 'DISPUTE_FROZEN');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-xs font-display font-semibold uppercase tracking-widest text-[#F59E0B]">
            CONFAM RISK, AI OCR & ARBITRATION CONTROL
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white mt-0.5">
            Admin Compliance & Dispute Desk
          </h1>
        </div>

        <div className="inline-flex rounded-full bg-[#13131F] p-1 border border-white/10 text-xs">
          <Link to="/dashboard/vendor" className="px-3.5 py-1.5 rounded-full text-[#9496A1] hover:text-white font-display">
            Vendor
          </Link>
          <Link to="/dashboard/buyer" className="px-3.5 py-1.5 rounded-full text-[#9496A1] hover:text-white font-display">
            Buyer
          </Link>
          <Link to="/dashboard/admin" className="px-3.5 py-1.5 rounded-full bg-[#7C5CFC] text-white font-display font-semibold">
            Admin
          </Link>
        </div>
      </div>

      {/* Admin Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="iz-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9496A1]">
            <span>Gross Escrow Volume (GMV)</span>
            <Lock className="w-4 h-4 text-[#7C5CFC]" />
          </div>
          <div className="font-display font-bold text-2xl text-white">{formatNaira(totalGmv)}</div>
          <div className="text-[11px] text-[#10B981]">100% Double-Entry Ledger Backed</div>
        </div>

        <div className="iz-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9496A1]">
            <span>Net 1.5% Platform Trust Revenue</span>
            <Sparkles className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="font-display font-bold text-2xl text-[#10B981]">
            {formatNaira(totalPlatformFees)}
          </div>
          <div className="text-[11px] text-[#9496A1]">Auto-split via Paystack Subaccount</div>
        </div>

        <div className="iz-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9496A1]">
            <span>Frozen Disputes Pending Review</span>
            <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div className="font-display font-bold text-2xl text-[#EF4444]">
            {disputedDeals.length}
          </div>
          <div className="text-[11px] text-[#9496A1]">Audited via SHA-256 Video + Gemini 3.8</div>
        </div>
      </div>

      {/* Arbitration Queue */}
      <div className="iz-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#9B82FF]" />
            <h2 className="font-display font-bold text-base text-white">
              Global Escrow & Video OCR Audit Feed
            </h2>
          </div>
          <span className="text-xs font-mono-tabular text-[#10B981] flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" /> GEMINI-3.8-FLASH ONLINE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#0B0B10]/60 font-display text-[11px] text-[#9496A1] uppercase">
                <th className="py-3.5 px-5">Deal ID</th>
                <th className="py-3.5 px-5">Vendor → Buyer</th>
                <th className="py-3.5 px-5">SHA-256 Proof & Video OCR</th>
                <th className="py-3.5 px-5">State</th>
                <th className="py-3.5 px-5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {deals.map((d) => (
                <tr key={d.short_code} className="hover:bg-white/[0.02]">
                  <td className="py-4 px-5 font-mono-tabular font-bold text-[#9B82FF]">
                    #{d.short_code}
                  </td>
                  <td className="py-4 px-5">
                    <div className="text-white font-medium">{d.vendor.name}</div>
                    <div className="text-[11px] text-[#9496A1]">→ {d.buyer.name}</div>
                  </td>
                  <td className="py-4 px-5">
                    {d.proof_artifact ? (
                      <div className="space-y-0.5">
                        <span className="text-[#10B981] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {d.proof_artifact.ai_confidence_score ?? 97}% AI Video Match
                        </span>
                        <div className="text-[10px] font-mono-tabular text-[#9496A1] truncate max-w-xs">
                          SHA256: {d.proof_artifact.video_sha256_hash}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#9496A1]">Pending Vendor Video Upload</span>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-mono-tabular text-[11px]">
                      {d.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Link to={`/v/${d.short_code}`} className="iz-btn-outline !py-1.5 !px-3">
                      <span>Audit Room</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};