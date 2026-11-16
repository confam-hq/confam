import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Camera,
  Truck,
  KeyRound,
  ArrowRight,
  Lock,
  Search,
  ScanText,
  CreditCard,
  Smartphone,
  Quote,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [lookupCode, setLookupCode] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lookupCode.trim().toUpperCase();
    if (!cleaned) return;
    navigate(`/v/${cleaned.startsWith('CF-') ? cleaned : `CF-${cleaned}`}`);
  };

  return (
    <div className="bg-[#0B0B10] text-white">
      {/* HERO SECTION (Modeled 1:1 on iZPAY Hero) */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-20 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-6">
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[54px] leading-[1.12] tracking-tight uppercase">
            <span className="text-[#9B82FF]">EASIEST</span> ESCROW & WAYBILL METHOD EVER
          </h1>

          <p className="text-[#9496A1] text-sm sm:text-base leading-relaxed max-w-lg">
            Stop losing money to fake WhatsApp vendors or untraceable motor-park waybills. Lock funds via instant Paystack Popup, inspect the vendor&apos;s{' '}
            <strong className="text-white">Gemini 3.8 Video OCR Proof-of-Pack</strong>, and release with a 4-digit OTP.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link to="/create" className="iz-btn-pill !px-8 !py-3.5 uppercase tracking-wider">
              Get Started
            </Link>
            <Link
              to="/dashboard/vendor"
              className="text-xs font-display font-semibold uppercase tracking-wider text-white hover:text-[#9B82FF] transition px-3 py-2"
            >
              Open Dashboards →
            </Link>
          </div>

          {/* Instant Deal Lookup Pill */}
          <form
            onSubmit={handleTrack}
            className="flex items-center bg-[#13131F] border border-white/10 rounded-full p-1.5 max-w-md"
          >
            <Search className="w-4 h-4 text-[#9496A1] ml-3.5 mr-2 shrink-0" />
            <input
              type="text"
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              placeholder="Track Deal ID (e.g. CF-8492)"
              className="bg-transparent text-xs font-mono-tabular text-white placeholder-[#9496A1] focus:outline-none w-full uppercase"
            />
            <button type="submit" className="iz-btn-pill !py-2 !px-5 !text-xs">
              Track
            </button>
          </form>
        </div>

        {/* Right Column: iZPAY Floating Violet Circle + Tilted Phone Mockup + Donut Chart */}
        <div className="lg:col-span-6 relative flex items-center justify-center">
          {/* Glowing Purple Orb */}
          <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-[#7C5CFC]/35 to-[#9B82FF]/10 blur-2xl absolute" />

          {/* Floating Donut Analytics Widget (Top Right like iZPAY) */}
          <div className="hidden sm:flex items-center gap-3 iz-card p-3.5 absolute -top-4 right-4 z-20 border-[#7C5CFC]/40">
            <svg viewBox="0 0 36 36" className="w-12 h-12">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1F1F35" strokeWidth="5" />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#10B981"
                strokeWidth="5"
                strokeDasharray="62 100"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="#7C5CFC"
                strokeWidth="5"
                strokeDasharray="28 100"
                strokeDashoffset="-62"
              />
            </svg>
            <div>
              <div className="text-[10px] text-[#9496A1] uppercase font-display">Video OCR Match</div>
              <div className="font-display font-bold text-sm text-white">98.4% Verified</div>
            </div>
          </div>

          {/* Tilted Mobile Escrow Screen */}
          <div className="relative z-10 w-full max-w-sm rounded-[2rem] bg-[#13131F] border-2 border-white/15 p-5 shadow-2xl transform -rotate-2 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-white">
                confam<span className="text-[#7C5CFC]">.</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] text-[10px] font-mono-tabular">
                ESCROW ACTIVE
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#7C5CFC] to-[#5B3FD9] text-white space-y-1">
              <div className="text-[11px] opacity-80">Locked Escrow Vault</div>
              <div className="font-display font-bold text-2xl">₦243,500.00</div>
              <div className="text-[10px] font-mono-tabular opacity-90 pt-1">
                #CF-8492 • Peace Mass Waybill
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#0B0B10] border border-white/8 flex items-center justify-between">
                <span className="text-[#9496A1]">Video OCR Audit</span>
                <span className="text-[#10B981] font-mono-tabular font-semibold">PASSED (98%)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0B10] border border-white/8 flex items-center justify-between">
                <span className="text-[#9496A1]">Waybill #PMT-49201</span>
                <span className="text-[#F59E0B] font-mono-tabular">Tempsite Awka</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0B10] border border-white/8 flex items-center justify-between">
                <span className="text-[#9496A1]">Buyer Release OTP</span>
                <span className="text-[#9B82FF] font-mono-tabular font-bold tracking-widest">7 4 9 2</span>
              </div>
            </div>
          </div>

          {/* Floating Bottom Badge (Like iZPAY "Easy Payment") */}
          <div className="hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#13131F] border border-[#7C5CFC]/50 shadow-xl absolute -bottom-4 left-6 z-20">
            <div className="w-7 h-7 rounded-full bg-[#7C5CFC] flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-display font-semibold text-xs text-white">
              INSTANT PAYSTACK POPUP
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: "Manage Everything in Your Hand" with 3 Violet Circular Icon Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5">
          <div className="iz-card p-6 space-y-4">
            <div className="text-xs font-mono-tabular text-[#9B82FF]">GEMINI 3.8 VIDEO OCR STREAM</div>
            <h3 className="font-display font-bold text-lg text-white">
              Upload Packing Video or Record Live
            </h3>
            <p className="text-xs text-[#9496A1] leading-relaxed">
              Every vendor uploads or records the item being packed. Confam extracts keyframes, computes a SHA-256 tamper hash, and uses Gemini 3.8 Flash to read serial numbers and waybill tickets inside the video.
            </p>
            <div className="p-3.5 rounded-xl bg-[#0B0B10] border border-white/10 font-mono-tabular text-[11px] text-[#10B981]">
              ✓ OCR DETECTED: &quot;iPhone 11 128GB • Waybill #PMT-AWK-49201&quot;
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white leading-tight">
            Manage Everything in <br /> Your Hand
          </h2>
          <p className="text-sm text-[#9496A1] max-w-xl">
            Three dedicated dashboards for Vendors, Buyers, and Dispute Admins—built for real Nigerian social commerce and inter-state motor parks.
          </p>

          <div className="space-y-5 pt-2">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#7C5CFC] flex items-center justify-center text-white shrink-0 shadow-lg">
                <ScanText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-base text-white">
                  Multimodal Video Upload & AI OCR
                </h4>
                <p className="text-xs text-[#9496A1] mt-1 leading-relaxed">
                  Upload a packing video or record live via WebRTC; Gemini 3.8 Flash verifies the item and reads handwritten motor-park waybill tickets automatically.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#7C5CFC] flex items-center justify-center text-white shrink-0 shadow-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-base text-white">
                  Zero-Redirect Paystack Popup
                </h4>
                <p className="text-xs text-[#9496A1] mt-1 leading-relaxed">
                  Buyers fund escrow right inside an inline modal popup using Card, Bank Transfer, or USSD without leaving the Deal Room.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#7C5CFC] flex items-center justify-center text-white shrink-0 shadow-lg">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-base text-white">
                  4-Digit OTP Instant NUBAN Settlement
                </h4>
                <p className="text-xs text-[#9496A1] mt-1 leading-relaxed">
                  Once the buyer inspects the package at Tempsite, Upper Iweka, or their doorstep, entering the 4-digit OTP settles the vendor&apos;s bank account immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: "Our Service" 6-Card Grid (Exact iZPAY Layout) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="font-display font-bold text-3xl text-white">Our Service</h2>
          <p className="text-xs sm:text-sm text-[#9496A1]">
            End-to-end escrow protection and motor-park logistics visibility across Vendor, Buyer, and Admin workspaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Lock,
              title: 'Vendor Escrow Console',
              desc: 'Generate shareable escrow links in 20 seconds with automatic 10-digit Nigerian NUBAN bank name resolution.',
              link: '/dashboard/vendor',
            },
            {
              icon: Camera,
              title: 'Video Upload & AI OCR',
              desc: 'Upload your packing video or record live; Gemini 3.8 Flash audits the physical item and extracts waybill text.',
              link: '/create',
            },
            {
              icon: Truck,
              title: 'Motor-Park Waybill Tracker',
              desc: 'Digitizes Peace Mass, GUO, ITC, and local rider receipts with a 1-tap zero-install GPS ping link for drivers.',
              link: '/dashboard/buyer',
            },
            {
              icon: Smartphone,
              title: 'Paystack Inline Popup',
              desc: 'Instant modal checkout supporting Card, Virtual Account Transfer, and USSD without page redirects.',
              link: '/dashboard/buyer',
            },
            {
              icon: ShieldCheck,
              title: 'Ghost-Buyer Waybill Shield',
              desc: 'Separates item principal from waybill transport fees so honest vendors never lose delivery costs.',
              link: '/dashboard/vendor',
            },
          ].map((srv, i) => {
            const Icon = srv.icon;
            return (
              <div key={i} className="iz-card p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#7C5CFC]/20 border border-[#7C5CFC]/40 flex items-center justify-center text-[#9B82FF]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-base text-white">{srv.title}</h3>
                  <p className="text-xs text-[#9496A1] leading-relaxed">{srv.desc}</p>
                </div>
                <Link
                  to={srv.link}
                  className="text-xs font-display font-semibold text-[#9B82FF] hover:text-white inline-flex items-center gap-1"
                >
                  <span>Explore Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}

          {/* 6th CTA Card (Matches iZPAY "View More" slot) */}
          <div className="iz-card p-6 flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="font-display font-bold text-base text-white">
              Explore All 3 Role Dashboards
            </h3>
            <p className="text-xs text-[#9496A1]">
              Switch seamlessly between Vendor, Buyer, and Admin views for your live showcase.
            </p>
            <Link to="/dashboard/vendor" className="iz-btn-pill">
              Open Dashboards
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4: iZPAY Slanted Violet Testimonial / Trust Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <div className="iz-slanted-banner p-8 sm:p-12 text-center space-y-4 relative">
          <div className="w-12 h-12 rounded-full bg-[#0B0B10] text-white flex items-center justify-center mx-auto -mt-14 shadow-xl border border-white/15">
            <Quote className="w-5 h-5 text-[#9B82FF]" />
          </div>
          <p className="font-display text-sm sm:text-base text-white max-w-2xl mx-auto leading-relaxed">
            &ldquo;Before Confam, buyers in Awka were scared to send ₦200k for an iPhone on WhatsApp, and Peace Mass waybill paper tickets kept getting lost. Now I upload a 10-second packing video, Gemini OCR reads the waybill, and I get my payout the second the buyer enters the 4-digit OTP.&rdquo;
          </p>
          <div className="pt-2">
            <div className="font-display font-bold text-sm text-white">Eminent Gadgets Awka</div>
            <div className="text-xs text-white/75">Verified UNIZIK Campus Merchant</div>
          </div>
        </div>
      </section>
    </div>
  );
};