import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { dealApi } from '../api/dealApi';
import { ShieldCheck, Loader2, Sparkles, Lock, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = (location.state as any)?.from || '/dashboard/vendor';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await dealApi.loginVendor(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid vendor email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoVendor = async () => {
    setError(null);
    setLoading(true);
    try {
      await dealApi.loginVendor('vendor@confam.test', 'password123');
      navigate('/dashboard/vendor', { replace: true });
    } catch {
      try {
        await dealApi.registerVendor({
          name: 'Eminent Gadgets Awka',
          email: 'vendor@confam.test',
          phone: '09045383655',
          password: 'password123',
          bank_code: '058',
          bank_name: 'Guaranty Trust Bank (GTBank)',
          account_number: '0123456789',
          account_name: 'EMINENT GADGETS AWKA',
        });
        navigate('/dashboard/vendor', { replace: true });
      } catch (regErr: any) {
        setError(regErr?.response?.data?.message || 'Could not initialize demo vendor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative max-w-md mx-auto px-4 py-16">
      {/* Subtle Background Glow */}
      <div className="w-72 h-72 rounded-full bg-[#7C5CFC]/20 blur-3xl absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative iz-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-display font-semibold uppercase tracking-widest text-[#9B82FF]">
              MERCHANT ESCROW ACCESS
            </span>
            <h1 className="font-display font-bold text-2xl text-white">
              Welcome Back
            </h1>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#7C5CFC] flex items-center justify-center text-white shadow-lg">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        {/* 1-Click Judge / Demo Vendor Button */}
        <button
          type="button"
          onClick={handleQuickDemoVendor}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-full bg-[#7C5CFC]/15 border border-[#7C5CFC]/40 hover:border-[#7C5CFC] text-xs font-display font-semibold text-[#9B82FF] hover:text-white flex items-center justify-center gap-2 cursor-pointer transition"
        >
          <Sparkles className="w-4 h-4 text-[#10B981]" />
          <span>1-Click Judge / Demo Vendor Login</span>
        </button>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#EF4444]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-display font-medium text-[#9496A1] mb-1.5">
              Merchant Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@confam.test"
              className="iz-input"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-display font-medium text-[#9496A1] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="iz-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="iz-btn-pill w-full !py-3.5 uppercase tracking-wider"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Login to Vendor Hub</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 text-center text-xs text-[#9496A1]">
          Don&apos;t have a verified merchant vault yet?{' '}
          <Link to="/register" className="text-[#9B82FF] font-display font-semibold hover:text-white transition">
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
};