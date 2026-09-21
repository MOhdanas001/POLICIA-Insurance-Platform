'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { MetricCard } from '@/components/MetricCard';
import { getStoredUser, UserSession } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { ShieldCheck, Users, FileText, IndianRupee, ArrowUpRight, ChevronRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function AdminDashboardPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const res = await apiRequest('/claims?limit=6');
    if (res.success && res.data) {
      setRecentClaims(res.data.claims || []);
    }
    setLoading(false);
  };

  // Recharts Monthly Revenue dataset
  const revenueData = [
    { month: 'Jan', thisYear: 6200000, lastYear: 4800000 },
    { month: 'Feb', thisYear: 6400000, lastYear: 5100000 },
    { month: 'Mar', thisYear: 6800000, lastYear: 5300000 },
    { month: 'Apr', thisYear: 6700000, lastYear: 5600000 },
    { month: 'May', thisYear: 7300000, lastYear: 5900000 },
    { month: 'Jun', thisYear: 7200000, lastYear: 6100000 },
    { month: 'Jul', thisYear: 7800000, lastYear: 6400000 },
    { month: 'Aug', thisYear: 8100000, lastYear: 6700000 },
    { month: 'Sep', thisYear: 8420000, lastYear: 7000000 },
  ];

  // Donut chart dataset
  const claimsDistribution = [
    { name: 'Approved', value: 48, color: '#FF6B4A' },
    { name: 'Under Review', value: 27, color: '#FF8A65' },
    { name: 'Pending Docs', value: 15, color: '#FFB74D' },
    { name: 'Rejected', value: 10, color: '#E0533C' },
  ];

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopHeader user={user} title="Overview" subtitle="Good morning. Here's what's happening with your policies today." />

        <main className="p-4 sm:p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          
          {/* Top 4 Metrics Widgets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <MetricCard
              title="Total Policies"
              value="8,921"
              trend="8.2%"
              isPositive={true}
              icon={ShieldCheck}
              sparklineColor="#FF6B4A"
            />
            <MetricCard
              title="Active Customers"
              value="12,847"
              trend="12.4%"
              isPositive={true}
              icon={Users}
              sparklineColor="#FF8A65"
            />
            <MetricCard
              title="Open Claims"
              value="342"
              trend="0.6%"
              isPositive={false}
              icon={FileText}
              sparklineColor="#E0533C"
            />
            <MetricCard
              title="Monthly Premium"
              value="₹84.2L"
              trend="4.1%"
              isPositive={true}
              icon={IndianRupee}
              sparklineColor="#FF6B4A"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Area Chart: Premium Collection */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-charcoal tracking-tight">Monthly Premium Collection</h3>
                  <p className="text-xs text-charcoal-muted">Gross premium collected over the last 12 months</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-brand-orange" />
                    <span className="text-charcoal">This year</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-orange-200" />
                    <span className="text-charcoal-muted">Last year</span>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorThisYear" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B4A" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#FF6B4A" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#A0968E" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#A0968E" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid #EFE8E1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      formatter={(val: any) => [`₹${(Number(val) / 100000).toFixed(1)} Lakhs`, '']}
                    />
                    <Area type="monotone" dataKey="thisYear" stroke="#FF6B4A" strokeWidth={3} fillOpacity={1} fill="url(#colorThisYear)" />
                    <Area type="monotone" dataKey="lastYear" stroke="#FFC4B4" strokeWidth={2} strokeDasharray="4 4" fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart: Claims Overview */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-charcoal tracking-tight">Claims Overview</h3>
                <p className="text-xs text-charcoal-muted">Current claim processing distribution</p>
              </div>

              <div className="h-56 w-full relative flex items-center justify-center my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={claimsDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {claimsDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-charcoal">342</span>
                  <span className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider">Claims</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-warm-border">
                {claimsDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-charcoal font-medium truncate">{item.name}</span>
                    </div>
                    <span className="font-bold text-charcoal">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Table & Goals Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Recent Claims Table */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-charcoal tracking-tight">Recent Claims</h3>
                  <p className="text-xs text-charcoal-muted">Latest claims submitted across all active policies</p>
                </div>
                <button className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
                  <span>View all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-warm-border text-[11px] font-extrabold uppercase tracking-wider text-charcoal-muted">
                      <th className="py-3 px-3">Claim ID</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Policy</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-border/60 text-xs">
                    {recentClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-cream-50/80 transition-colors">
                        <td className="py-3 px-3 font-bold text-charcoal">{claim.claim_number}</td>
                        <td className="py-3 px-3 font-medium text-charcoal">{claim.customer_name}</td>
                        <td className="py-3 px-3 text-charcoal-muted truncate max-w-[140px]">{claim.policy_name}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Target & Policy Types */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-charcoal tracking-tight">Monthly Premium Goal</h3>
                <p className="text-xs text-charcoal-muted">₹84.2L of ₹108L target achieved</p>
                
                <div className="mt-6 flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="80" cy="80" r="70" stroke="#F4ECE1" strokeWidth="16" fill="transparent" />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#FF6B4A"
                        strokeWidth="16"
                        strokeDasharray={440}
                        strokeDashoffset={440 - (440 * 0.78)}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-extrabold text-charcoal">78%</span>
                      <span className="text-[10px] font-bold text-brand-orange uppercase">Target</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-warm-border">
                <p className="text-xs font-bold text-charcoal mb-2">Policy Type Split</p>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-charcoal-muted">Health Insurance</span>
                    <span className="font-bold text-charcoal">42%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-muted">Vehicle Insurance</span>
                    <span className="font-bold text-charcoal">31%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-muted">Life & Travel</span>
                    <span className="font-bold text-charcoal">27%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
