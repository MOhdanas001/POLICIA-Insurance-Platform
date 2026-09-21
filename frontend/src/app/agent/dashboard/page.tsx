'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { MetricCard } from '@/components/MetricCard';
import { getStoredUser, UserSession } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { Users, ShieldCheck, FileText, ChevronRight, Clock } from 'lucide-react';

export default function AgentDashboardPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    fetchAgentClaims();
  }, []);

  const fetchAgentClaims = async () => {
    setLoading(true);
    const res = await apiRequest('/claims');
    if (res.success && res.data) {
      setClaims(res.data.claims || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopHeader user={user} title="Agent Workspace" subtitle="Overview of assigned customers, pending reviews, and claim state transitions." />

        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <MetricCard
              title="Assigned Customers"
              value="14"
              trend="2 New"
              isPositive={true}
              icon={Users}
              sparklineColor="#FF6B4A"
            />
            <MetricCard
              title="Active Policies"
              value="28"
              trend="100%"
              isPositive={true}
              icon={ShieldCheck}
              sparklineColor="#FF8A65"
            />
            <MetricCard
              title="Open Claims"
              value="3"
              trend="Action Req."
              isPositive={false}
              icon={FileText}
              sparklineColor="#E0533C"
            />
            <MetricCard
              title="Avg. Resolution"
              value="2.4 Days"
              trend="Fastest"
              isPositive={true}
              icon={Clock}
              sparklineColor="#FF6B4A"
            />
          </div>

          <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-charcoal">Assigned Claims Queue</h3>
                <p className="text-xs text-charcoal-muted">Review incident details, inspect documents, and advance claim status state machine</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-warm-border text-[11px] font-extrabold uppercase tracking-wider text-charcoal-muted">
                    <th className="py-3 px-3">Claim ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Policy</th>
                    <th className="py-3 px-3">Claim Amount</th>
                    <th className="py-3 px-3">Current Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-border/60 text-xs">
                  {claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-cream-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-charcoal">{claim.claim_number}</td>
                      <td className="py-3 px-3 font-medium text-charcoal">{claim.customer_name}</td>
                      <td className="py-3 px-3 text-charcoal-muted">{claim.policy_name}</td>
                      <td className="py-3 px-3 font-extrabold text-charcoal">₹{Number(claim.claim_amount).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          claim.status === 'APPROVED' || claim.status === 'CLOSED'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                            : claim.status === 'UNDER_REVIEW'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                            : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                        }`}>
                          {claim.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/agent/claims/${claim.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline bg-brand-peach/60 px-3 py-1.5 rounded-xl border border-brand-orange/20"
                        >
                          <span>Process Workspace</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
