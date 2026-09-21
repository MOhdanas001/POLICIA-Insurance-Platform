'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { getStoredUser, UserSession } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { ShieldCheck, ChevronDown, Download, FileText, CheckCircle2 } from 'lucide-react';

export default function CustomerPoliciesPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    if (u && u.customerId) {
      apiRequest(`/customers/${u.customerId}/policies`).then((res) => {
        if (res.success && res.data) setPolicies(res.data.policies || []);
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopHeader user={user} title="My Insurance Policies" subtitle="View coverage details, benefits, terms, exclusions, and download policy wording documents." />

        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
          
          <div className="flex flex-col gap-6">
            {policies.map((p) => {
              const isExpanded = expandedId === p.id;
              return (
                <div key={p.id} className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm hover:shadow-soft-md transition-all">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-peach text-brand-orange flex items-center justify-center font-bold text-lg border border-brand-orange/20">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-extrabold text-charcoal">{p.policy_name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
                            {p.status}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal-muted mt-0.5">Policy #{p.policy_number} · {p.policy_type} Insurance</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Coverage</span>
                        <span className="text-base font-extrabold text-charcoal">₹{Number(p.coverage_amount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Premium</span>
                        <span className="text-base font-extrabold text-brand-orange">₹{Number(p.premium).toLocaleString('en-IN')}/mo</span>
                      </div>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                        className="p-2.5 rounded-2xl bg-cream-50 hover:bg-brand-peach/60 border border-warm-border text-charcoal font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <span>{isExpanded ? 'Hide Terms' : 'View Terms'}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-warm-border grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                      <div className="flex flex-col gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1">Key Benefits</h4>
                          <p className="text-xs text-charcoal leading-relaxed p-3 rounded-2xl bg-cream-50 border border-warm-border/60">
                            {p.benefits || 'Cashless hospitalization, 24/7 assistance, free annual checkups.'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1">Terms & Conditions</h4>
                          <p className="text-xs text-charcoal leading-relaxed p-3 rounded-2xl bg-cream-50 border border-warm-border/60">
                            {p.terms_conditions || 'Subject to policy terms and initial waiting period.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Exclusions</h4>
                          <p className="text-xs text-charcoal leading-relaxed p-3 rounded-2xl bg-rose-50/50 border border-rose-200/60">
                            {p.exclusions || 'Pre-existing illnesses waiting period 24 months, cosmetic surgery.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-2xl bg-brand-peach/40 border border-brand-orange/20">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-brand-orange" />
                            <span className="text-xs font-bold text-charcoal">Official Policy Wording v1.0 (PDF)</span>
                          </div>
                          <button className="text-xs font-extrabold text-brand-orange hover:underline flex items-center gap-1">
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </main>
      </div>
    </div>
  );
}
