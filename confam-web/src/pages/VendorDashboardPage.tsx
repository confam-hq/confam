import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dealApi } from '../api/dealApi';
import { Deal, EscrowStatus } from '../types/deal.types';
import { formatNaira } from '../utils/formatNaira';
import {
  Plus,
  Lock,
  Truck,
  CheckCircle2,
  AlertOctagon,
  ArrowUpRight,
  Copy,
  Check,
  Building2,
  Loader2,
  Search,
  ShieldCheck,
} from 'lucide-react';

const STATUS_STYLES: Record<EscrowStatus, { label: string; classes: string; dot: string }> = {
  AWAITING_PAYMENT: {
    label: 'Awaiting Deposit',
    classes: 'bg-zinc-800/80 text-zinc-300 ring-zinc-700',
    dot: 'bg-zinc-400',
  },
  FUNDED_LOCKED: {
    label: 'Escrow Locked',
    classes: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  DISPATCHED_IN_TRANSIT: {
    label: 'Waybill In Transit',
    classes: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    dot: 'bg-amber-400',
  },
  COMPLETED_RELEASED: {
    label: 'Settled & Released',
    classes: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    dot: 'bg-emerald-300',
  },
  DISPUTE_FROZEN: {
    label: 'Dispute Frozen',
    classes: 'bg-red-500/10 text-red-400 ring-red-500/20',
    dot: 'bg-red-400',
  },
  REFUNDED: {
    label: 'Refunded',
    classes: 'bg-zinc-800 text-zinc-400 ring-zinc-700',
    dot: 'bg-zinc-500',
  },
};

export const VendorDashboardPage: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
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

  const lockedEscrowTotal = deals
    .filter((d) => d.status === 'FUNDED_LOCKED' || d.status === 'DISPATCHED_IN_TRANSIT')
    .reduce((acc, d) => acc + d.financials.item_amount_naira + d.financials.waybill_fee_naira, 0);

  const settledTotal = deals
    .filter((d) => d.status === 'COMPLETED_RELEASED')
    .reduce((acc, d) => acc + d.financials.item_amount_naira + d.financials.waybill_fee_naira, 0);

  const inTransitCount = deals.filter((d) => d.status === 'DISPATCHED_IN_TRANSIT').length;

  const filteredDeals = deals.filter((d) => {
    const matchesStatus = filter === 'ALL' || d.status === filter;
    const matchesQuery =
      !searchQuery ||
      d.short_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.buyer.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const copyShareUrl = (shortCode: string) => {
    const url = `${window.location.origin}/v/${shortCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(shortCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-xl sm:text-2xl text-zinc-50">
              {vendor?.name || 'Merchant Console'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20 text-[11px] font-mono-tabular">
              <ShieldCheck className="w-3 h-3" /> NUBAN Verified
            </span>
          </div>
          {vendor?.account_number && (
            <p className="text-xs font-mono-tabular text-zinc-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>
                Payout Vault: <strong className="text-zinc-200">{vendor.bank_name}</strong> • {vendor.account_number} ({vendor.account_name})
              </span>
            </p>
          )}
        </div>

        <Link
          to="/create"
          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Escrow Link</span>
        </Link>
      </div>

      {/* 4 AlignUI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#121215] border border-zinc-800/80 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Active Escrow Balance</span>
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-mono-tabular font-bold text-2xl text-zinc-50">
            {formatNaira(lockedEscrowTotal)}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono-tabular">
            ● Held in Paystack Vault
          </div>
        </div>

        <div className="rounded-xl bg-[#121215] border border-zinc-800/80 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Settled Volume</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="font-mono-tabular font-bold text-2xl text-zinc-50">
            {formatNaira(settledTotal)}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono-tabular">
            Disbursed via 4-Digit OTP
          </div>
        </div>

        <div className="rounded-xl bg-[#121215] border border-zinc-800/80 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Active Park Waybills</span>
            <Truck className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="font-mono-tabular font-bold text-2xl text-zinc-50">
            {inTransitCount}
          </div>
          <div className="text-[11px] text-amber-400 font-mono-tabular">
            AI OCR + GPS Ping Enabled
          </div>
        </div>

        <div className="rounded-xl bg-[#121215] border border-zinc-800/80 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Dispute Rate</span>
            <AlertOctagon className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="font-mono-tabular font-bold text-2xl text-zinc-50">0.0%</div>
          <div className="text-[11px] text-zinc-500 font-mono-tabular">
            {deals.length} Total Links Created
          </div>
        </div>
      </div>

      {/* Table Toolbar: Segmented Filter + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-zinc-900/90 border border-zinc-800/80 text-xs">
          {[
            { id: 'ALL', label: 'All Deals' },
            { id: 'AWAITING_PAYMENT', label: 'Unfunded' },
            { id: 'FUNDED_LOCKED', label: 'Funded' },
            { id: 'DISPATCHED_IN_TRANSIT', label: 'In Transit' },
            { id: 'COMPLETED_RELEASED', label: 'Settled' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                filter === tab.id
                  ? 'bg-zinc-800 text-zinc-50 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 h-8 w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by code, item, buyer..."
            className="bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Enterprise Ledger Table */}
      <div className="rounded-xl bg-[#121215] border border-zinc-800/90 overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin mx-auto mb-2" />
            <p className="text-xs font-mono-tabular text-zinc-500">Loading escrow ledger...</p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="py-14 text-center space-y-3 px-4">
            <p className="text-sm font-medium text-zinc-200">No matching escrow records</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Create a shareable payment and waybill tracking link for your next WhatsApp or Instagram customer.
            </p>
            <Link
              to="/create"
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-emerald-500 text-zinc-950 font-semibold text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> New Escrow Link
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/50 text-[11px] font-mono-tabular text-zinc-400 uppercase">
                  <th className="py-3 px-4">Deal ID</th>
                  <th className="py-3 px-4">Protected Item & Route</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Net Payout</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs">
                {filteredDeals.map((deal) => {
                  const badge = STATUS_STYLES[deal.status] || STATUS_STYLES.AWAITING_PAYMENT;
                  return (
                    <tr key={deal.short_code} className="hover:bg-zinc-900/40 transition">
                      <td className="py-3.5 px-4 font-mono-tabular font-semibold text-zinc-200">
                        {deal.short_code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-zinc-100">{deal.item.title}</div>
                        <div className="text-[11px] text-zinc-500 font-mono-tabular">
                          {deal.waybill_manifest?.transport_company ||
                            (deal.delivery_mode === 'INTERSTATE_WAYBILL'
                              ? 'Inter-State Park Waybill'
                              : 'Local Rider Dispatch')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-zinc-200">{deal.buyer.name}</div>
                        <div className="text-[11px] font-mono-tabular text-zinc-500">
                          {deal.buyer.phone_masked}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono-tabular font-medium ring-1 ring-inset ${badge.classes}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-zinc-100">
                        {formatNaira(
                          deal.financials.item_amount_naira + deal.financials.waybill_fee_naira
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyShareUrl(deal.short_code)}
                            className="h-7 px-2.5 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[11px] font-mono-tabular text-zinc-300 flex items-center gap-1 cursor-pointer transition"
                          >
                            {copiedCode === deal.short_code ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-zinc-400" />
                            )}
                            <span>{copiedCode === deal.short_code ? 'Copied' : 'Copy'}</span>
                          </button>

                          <Link
                            to={`/v/${deal.short_code}`}
                            className="h-7 px-2.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-[11px] inline-flex items-center gap-1 transition"
                          >
                            <span>Inspect</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};