import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Cpu, Terminal, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="bg-[#0B0B10] text-[#9496A1] pt-16 mt-16 border-t border-white/8">
      {/* iZPAY Style Purple CTA Banner ("Keep Updated About Our Product") */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-16">
        <div className="rounded-3xl bg-gradient-to-r from-[#8B6EFE] via-[#7C5CFC] to-[#6342E8] p-8 sm:p-12 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left max-w-md">
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-white leading-tight">
              Keep Updated About <br className="hidden sm:inline" /> Our Product
            </h3>
            <p className="text-xs sm:text-sm text-white/85">
              Get real-time alerts on new verified motor-park terminals, escrow API webhooks, and merchant fee discounts.
            </p>
          </div>

          <form
            onSubmit={handleSubscribe}
            className="w-full max-w-md flex items-center bg-white rounded-full p-1.5 shadow-lg"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="flex-1 bg-transparent px-4 py-2 text-xs sm:text-sm text-[#0B0B10] placeholder-[#6E7180] focus:outline-none"
              required
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#7C5CFC] hover:bg-[#6A48E6] text-white font-display font-semibold text-xs uppercase tracking-wider transition cursor-pointer shrink-0"
            >
              {subscribed ? 'Joined!' : 'Submit'}
            </button>
          </form>
        </div>
      </div>

      {/* Main 4-Column iZPAY Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Col 1: Brand Identity */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7C5CFC] flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight text-white">
              CONFAM<span className="text-[#9B82FF]">.</span>
            </span>
          </Link>
          <p className="text-xs leading-relaxed text-[#9496A1]">
            See am. Confam am. Collect am. Nigeria&apos;s zero-redirect Paystack Popup escrow and Gemini 3.8 Video OCR waybill protocol.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#13131F] border border-white/10 text-[11px] font-mono-tabular text-[#10B981]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ALL ESCROW LEDGERS ONLINE</span>
          </div>
        </div>

        {/* Col 2: Role Dashboards */}
        <div className="space-y-3 text-xs">
          <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
            Role Workspaces
          </h4>
          <ul className="space-y-2.5">
            <li>
              <Link to="/dashboard/vendor" className="hover:text-[#9B82FF] transition">
                Vendor Escrow Hub
              </Link>
            </li>
            <li>
              <Link to="/dashboard/buyer" className="hover:text-[#9B82FF] transition">
                Buyer Tracking & OTP Portal
              </Link>
            </li>
            <li>
              <Link to="/dashboard/admin" className="hover:text-[#9B82FF] transition">
                Admin Arbitration & OCR Desk
              </Link>
            </li>
            <li>
              <Link to="/create" className="hover:text-[#9B82FF] transition">
                Generate 20s Escrow Link
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Supported Waybill Parks */}
        <div className="space-y-3 text-xs">
          <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
            Supported Waybill Parks
          </h4>
          <ul className="space-y-2.5 font-mono-tabular text-[11px]">
            <li className="text-white/90">Peace Mass Transit (PMT)</li>
            <li className="text-white/90">GUO Transport & Logistics</li>
            <li className="text-white/90">ITC / Imo Transport</li>
            <li className="text-white/90">GIGM & ABC Cargo</li>
            <li className="text-[#9B82FF]">UNIZIK Tempsite & Aroma Dispatch</li>
          </ul>
        </div>

        {/* Col 4: Security & Contact */}
        <div className="space-y-3 text-xs">
          <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
            Security Architecture
          </h4>
          <div className="space-y-2.5 text-[11px]">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#9B82FF] shrink-0" />
              <span>SHA-256 Video Tamper Hashing</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>Gemini 3.8 Flash Video + Ticket OCR</span>
            </div>
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <span>Paystack Inline Popup + HMAC Webhooks</span>
            </div>
          </div>
          <p className="text-[11px] text-[#9496A1] pt-1">
            ASUU Secretariat Showcase • UNIZIK, Awka
          </p>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-white/8 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono-tabular text-[#9496A1]">
          <span>© 2026 CONFAM PROTOCOL. INTROTECH BUILDATHON 2026.</span>
          <span className="text-white">1.5% TRUST FEE • ZERO REDIRECT POPUP</span>
        </div>
      </div>
    </footer>
  );
};