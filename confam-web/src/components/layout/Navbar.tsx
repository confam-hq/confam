import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const navLinkClass = (path: string) =>
    `text-xs font-display font-medium uppercase tracking-wider transition ${
      location.pathname.startsWith(path) ? 'text-[#9B82FF]' : 'text-white/80 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 h-20 bg-[#0B0B10]/90 backdrop-blur-md border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        {/* iZPAY Style Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#7C5CFC] flex items-center justify-center text-white shadow-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-white">
            CONFAM<span className="text-[#9B82FF]">.</span>
          </span>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          <Link to="/" className={location.pathname === '/' ? 'text-xs font-display font-semibold uppercase text-[#9B82FF]' : 'text-xs font-display font-medium uppercase text-white/80 hover:text-white'}>
            Home
          </Link>
          <Link to="/dashboard/vendor" className={navLinkClass('/dashboard/vendor')}>
            Vendor Hub
          </Link>
          <Link to="/dashboard/buyer" className={navLinkClass('/dashboard/buyer')}>
            Buyer Hub
          </Link>
          <Link to="/dashboard/admin" className={navLinkClass('/dashboard/admin')}>
            Admin Desk
          </Link>
        </nav>

        {/* Right Pill CTA */}
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden sm:inline-block text-xs font-display font-semibold uppercase text-white/80 hover:text-white px-2">
            Login
          </Link>
          <Link to="/create" className="iz-btn-pill !py-2.5 !px-6 uppercase text-xs">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
};