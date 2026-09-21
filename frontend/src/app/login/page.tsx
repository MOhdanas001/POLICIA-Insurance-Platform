'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, ShieldCheck, ArrowRight, UserCheck, Users, Lock, Mail } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { setStoredSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (res.success && res.data) {
      setStoredSession(res.data.user, res.data.accessToken);
      redirectUserByRole(res.data.user.role);
    } else {
      setError(res.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleDemoLogin = async (role: 'ADMIN' | 'AGENT' | 'CUSTOMER') => {
    setLoading(true);
    setError('');

    const res = await apiRequest('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });

    setLoading(false);

    if (res.success && res.data) {
      setStoredSession(res.data.user, res.data.accessToken);
      redirectUserByRole(res.data.user.role);
    } else {
      setError(res.message || `Demo login as ${role} failed.`);
    }
  };

  const redirectUserByRole = (role: string) => {
    if (role === 'ADMIN') router.push('/admin/dashboard');
    else if (role === 'AGENT') router.push('/agent/dashboard');
    else router.push('/customer/dashboard');
  };

  return (
    <main className="min-h-screen bg-cream-100 flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-5xl bg-white rounded-4xl border border-warm-border shadow-soft-lg grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Visual Hero Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-brand-orange via-brand-coral to-brand-dark p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 ring-4 ring-white/10">
              <Sun className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-white/80 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Enterprise Policy Platform
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4 leading-tight">
              Insurance & Claims Management
            </h1>
            <p className="text-sm text-white/90 mt-3 leading-relaxed">
              Powered by Google Gemini AI Tool Calling & Policy RAG Architecture. Experience the next generation of SaaS policy administration.
            </p>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/20 mt-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                AI
              </div>
              <div>
                <p className="text-xs font-bold">Hybrid Gemini Assistant</p>
                <p className="text-[11px] text-white/80">Vector search & real-time tool calling</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form & Demo Access Card */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            
            <div className="text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">Welcome back</h2>
              <p className="text-xs sm:text-sm text-charcoal-muted mt-1">Sign in to your account or launch instant demo mode</p>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Standard Login Form */}
            <form onSubmit={handleStandardLogin} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-charcoal uppercase tracking-wider block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-cream-50 border border-warm-border rounded-2xl pl-10 pr-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-brand-orange/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal uppercase tracking-wider block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-muted" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-cream-50 border border-warm-border rounded-2xl pl-10 pr-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-brand-orange/40 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-orange to-brand-dark text-white font-bold py-3.5 px-6 rounded-2xl shadow-soft-md hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Prominent Demo Accounts Section */}
            <div className="mt-8 pt-6 border-t border-warm-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-charcoal uppercase tracking-wider">Try Demo Accounts</span>
                <span className="text-[10px] font-bold bg-brand-peach text-brand-orange px-2 py-0.5 rounded-full border border-brand-orange/20">
                  For Recruiter Demo
                </span>
              </div>
              <p className="text-xs text-charcoal-muted mb-4">Click any role below to automatically authenticate with pre-seeded data:</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('ADMIN')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cream-50 border border-warm-border hover:border-brand-orange hover:bg-brand-peach/40 transition-all group shadow-soft-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-extrabold text-charcoal">Admin Demo</span>
                  <span className="text-[10px] text-charcoal-muted">Full Platform</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('AGENT')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cream-50 border border-warm-border hover:border-brand-orange hover:bg-brand-peach/40 transition-all group shadow-soft-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-extrabold text-charcoal">Agent Demo</span>
                  <span className="text-[10px] text-charcoal-muted">Claims & Assigned</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('CUSTOMER')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cream-50 border border-warm-border hover:border-brand-orange hover:bg-brand-peach/40 transition-all group shadow-soft-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-extrabold text-charcoal">Customer Demo</span>
                  <span className="text-[10px] text-charcoal-muted">Policies & AI Chat</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
