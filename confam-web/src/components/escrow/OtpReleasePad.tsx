import React, { useState } from 'react';
import { KeyRound, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';

interface Props {
  otpRemaining: number;
  isLocked: boolean;
  onRelease: (otp: string) => Promise<void>;
  onFreezeDispute: (reason: string) => Promise<void>;
}

export const OtpReleasePad: React.FC<Props> = ({
  otpRemaining,
  isLocked,
  onRelease,
  onFreezeDispute,
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) return;
    setError(null);
    setLoading(true);
    try {
      await onRelease(otp);
    } catch (err: any) {
      setError(
        err?.response?.data?.errors?.otp?.[0] ||
          err?.response?.data?.message ||
          'Invalid 4-digit Release OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disputeReason.trim().length < 10) return;
    setError(null);
    setLoading(true);
    try {
      await onFreezeDispute(disputeReason);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not freeze transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121216] border border-[#27272A] rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[#10B981]" />
          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-[#FAFAFA]">
            Buyer Delivery Confirmation (4-Digit OTP)
          </h3>
        </div>
        <span className="text-[11px] font-mono-tabular px-2 py-0.5 rounded bg-[#09090B] border border-[#27272A] text-[#A1A1AA]">
          {otpRemaining}/5 TRIES LEFT
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444] text-xs text-[#EF4444]">
          {error}
        </div>
      )}

      {isLocked ? (
        <div className="p-4 rounded-lg bg-[#EF4444]/10 border border-[#EF4444] text-xs text-[#EF4444] flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Maximum OTP attempts reached. Escrow unlock is temporarily locked for 15 minutes.</span>
        </div>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-3">
          <p className="text-xs text-[#A1A1AA]">
            Inspect your package at the park or doorstep. Once satisfied, enter the 4-digit Release OTP to settle the vendor immediately.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className="w-36 bg-[#09090B] border border-[#27272A] focus:border-[#10B981] rounded-lg px-4 py-2.5 text-center text-lg font-mono-tabular font-bold tracking-[0.35em] text-[#FAFAFA] focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={loading || otp.length !== 4}
              className="flex-1 py-2.5 px-4 rounded-lg bg-[#10B981] text-[#09090B] font-bold text-xs uppercase tracking-wider disabled:opacity-40 hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confam & Release Payout'}
            </button>
          </div>
        </form>
      )}

      <div className="pt-2 border-t border-[#27272A]">
        {!showDispute ? (
          <button
            type="button"
            onClick={() => setShowDispute(true)}
            className="text-xs text-[#EF4444] hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Package damaged or doesn't match Proof-of-Pack video? Freeze & Dispute
          </button>
        ) : (
          <form onSubmit={handleDisputeSubmit} className="space-y-2.5 pt-1">
            <label className="text-xs font-semibold text-[#EF4444] block">
              State exact discrepancy vs. vendor's Proof-of-Pack video (min 10 chars):
            </label>
            <textarea
              rows={2}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="e.g. Item delivered at Tempsite park has a cracked screen not shown in the proof video."
              className="w-full bg-[#09090B] border border-[#EF4444] rounded-lg p-2.5 text-xs text-[#FAFAFA] focus:outline-none"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || disputeReason.trim().length < 10}
                className="px-3.5 py-2 rounded-lg bg-[#EF4444] text-[#FAFAFA] font-bold text-xs cursor-pointer disabled:opacity-40"
              >
                Freeze Escrow Funds Now
              </button>
              <button
                type="button"
                onClick={() => setShowDispute(false)}
                className="px-3 py-2 rounded-lg bg-[#09090B] border border-[#27272A] text-xs text-[#A1A1AA] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};