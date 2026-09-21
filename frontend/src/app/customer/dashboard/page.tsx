'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { MetricCard } from '@/components/MetricCard';
import { getStoredUser, UserSession } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { ShieldCheck, CreditCard, FileText, Bot, ArrowUpRight, ChevronRight, Plus, CheckCircle2 } from 'lucide-react';

export default function CustomerDashboardPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    if (u && u.customerId) {
      fetchCustomerDashboard(u.customerId);
    }
  }, []);

  const fetchCustomerDashboard = async (customerId: string) => {
    setLoading(true);
    const polRes = await apiRequest(`/customers/${customerId}/policies`);
    if (polRes.success && polRes.data) {
      setPolicies(polRes.data.policies || []);
    }

    const payRes = await apiRequest('/payments/upcoming');
    if (payRes.success && payRes.data) {
      setUpcoming(payRes.data.upcoming || []);
    }

    const clRes = await apiRequest('/claims');
    if (clRes.success && clRes.data) {
      setClaims(clRes.data.claims || []);
    }
    setLoading(false);
  };

  const totalCoverage = policies.reduce((acc, p) => acc + Number(p.coverage_amount || 0), 0);
  const nextPayment = upcoming[0];

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopHeader user={user} title="Customer Portal" subtitle={`Welcome back, ${user?.firstName || 'Valued Policyholder'} · Here's an overview of your active coverage.`} />

        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
          
          {/* Top 4 Metrics Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <MetricCard
              title="Active Policies"
              value={policies.length || 3}
              trend="Covered"
              isPositive={true}
              icon={ShieldCheck}
              sparklineColor="#FF6B4A"
            />
            <MetricCard
              title="Next Payment"
              value={nextPayment ? `₹${Number(nextPayment.amount).toLocaleString('en-IN')}` : '₹0'}
              trend={nextPayment ? `Due ${new Date(nextPayment.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Paid'}
              isPositive={true}
              icon={CreditCard}
              sparklineColor="#FF8A65"
            />
            <MetricCard
              title="Open Claims"
              value={claims.filter(c => c.status !== 'CLOSED').length || 1}
              trend="In Review"
              isPositive={true}
              icon={FileText}
              sparklineColor="#E0533C"
            />
            <MetricCard
              title="Total Coverage"
              value={`₹${(totalCoverage / 100000).toFixed(1)}L`}
              trend="Shielded"
              isPositive={true}
              icon={ShieldCheck}
              sparklineColor="#FF6B4A"
            />
          </div>

          {/* AI Banner Callout */}
          <div className="bg-gradient-to-r from-brand-orange to-brand-dark rounded-3xl p-6 text-white shadow-soft-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">Meet Your Personal Insurance AI Assistant</h3>
                <p className="text-xs text-white/90 mt-0.5">Ask questions about your coverage, terms, claim status, or next installment payment.</p>
              </div>
            </div>
            <Link
              href="/customer/assistant"
              className="bg-white text-brand-orange font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-soft-sm hover:bg-cream-50 transition-all shrink-0 flex items-center gap-2"
            >
              <span>Launch AI Assistant</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Customer Active Policies Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-charcoal">My Active Policies</h3>
                <p className="text-xs text-charcoal-muted">Your current active insurance coverage plans</p>
              </div>
              <Link href="/customer/policies" className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
                <span>View all details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {policies.map((p) => (
                <div key={p.id} className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
                        {p.status}
                      </span>
                      <span className="text-xs font-bold text-charcoal-muted">{p.policy_number}</span>
                    </div>

                    <h4 className="text-base font-extrabold text-charcoal mt-3">{p.policy_name}</h4>
                    <span className="text-xs font-semibold text-brand-orange">{p.policy_type} Insurance</span>

                    <div className="mt-4 p-3 rounded-2xl bg-cream-50 border border-warm-border/60 flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-charcoal-muted">Sum Insured:</span>
                        <span className="font-extrabold text-charcoal">₹{Number(p.coverage_amount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal-muted">Premium:</span>
                        <span className="font-extrabold text-brand-orange">₹{Number(p.premium).toLocaleString('en-IN')}/mo</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-warm-border flex items-center justify-between">
                    <Link href="/customer/payments" className="text-xs font-bold text-brand-orange hover:underline">
                      Pay Installment
                    </Link>
                    <Link href="/customer/claims" className="text-xs font-bold text-charcoal hover:underline">
                      File Claim
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Claims Section */}
          <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-charcoal">Recent Claims</h3>
                <p className="text-xs text-charcoal-muted">Track the progress of your submitted claims</p>
              </div>
              <Link href="/customer/claims" className="bg-brand-orange text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-soft-sm flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Apply for Claim</span>
              </Link>
            </div>

            <div className="divide-y divide-warm-border/60 text-xs">
              {claims.map((claim) => (
                <div key={claim.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-charcoal">{claim.claim_number}</span>
                      <span className="text-charcoal-muted">({claim.policy_name})</span>
                    </div>
                    <p className="text-[11px] text-charcoal-muted mt-0.5">{claim.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-charcoal">₹{Number(claim.claim_amount).toLocaleString('en-IN')}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      claim.status === 'APPROVED' || claim.status === 'CLOSED'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {claim.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
