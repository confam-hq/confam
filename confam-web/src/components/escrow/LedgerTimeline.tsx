import React from 'react';
import type { LedgerEntry } from '../../types/deal.types';
import { formatNaira } from '../../utils/formatNaira';
import { Shield, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Props {
  ledgers?: LedgerEntry[];
}

export const LedgerTimeline: React.FC<Props> = ({ ledgers = [] }) => {
  return (
    <div className="bg-[#121216] border border-[#27272A] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#10B981]" />
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#FAFAFA]">
            Immutable Double-Entry Escrow Ledger
          </h3>
        </div>
        <span className="text-[11px] font-mono-tabular text-[#A1A1AA]">
          {ledgers.length} EVENTS
        </span>
      </div>

      {ledgers.length === 0 ? (
        <p className="text-xs text-[#A1A1AA] py-2">
          Awaiting initial buyer escrow deposit. All ledger mutations are cryptographically logged.
        </p>
      ) : (
        <div className="space-y-2">
          {ledgers.map((row) => (
            <div
              key={row.id}
              className="p-2.5 rounded-lg bg-[#09090B] border border-[#27272A] flex items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-mono-tabular font-bold text-[#FAFAFA]">
                  {row.direction === 'CREDIT' ? (
                    <ArrowDownLeft className="w-3.5 h-3.5 text-[#10B981]" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#F59E0B]" />
                  )}
                  <span>{row.event_type}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#121216] border border-[#27272A] text-[#A1A1AA]">
                    {row.actor_role}
                  </span>
                </div>
                {row.metadata?.note && (
                  <p className="text-[11px] text-[#A1A1AA]">{row.metadata.note}</p>
                )}
              </div>
              <div className="text-right font-mono-tabular">
                <div className={row.direction === 'CREDIT' ? 'text-[#10B981] font-bold' : 'text-[#FAFAFA] font-bold'}>
                  {row.direction === 'CREDIT' ? '+' : '-'}
                  {formatNaira(row.amount_naira)}
                </div>
                <div className="text-[10px] text-[#A1A1AA]">
                  {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};