'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { getStoredUser, UserSession } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { ShieldCheck, Plus, Search, Filter, FileText, CheckCircle2, ChevronRight, X } from 'lucide-react';

export default function AdminPoliciesPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    policyType: 'Health',
    description: '',
    coverageAmount: 1000000,
    annualPremium: 24000,
    paymentFrequency: 'MONTHLY',
    eligibility: '',
    termsConditions: '',
    exclusions: '',
    benefits: '',
    claimRequirements: '',
  });

  useEffect(() => {
    setUser(getStoredUser());
    fetchPolicies();
  }, [typeFilter, search]);

  const fetchPolicies = async () => {
    setLoading(true);
    const res = await apiRequest(`/policies?search=${search}&type=${typeFilter}`);
    if (res.success && res.data) {
      setPolicies(res.data.policies || []);
    }
    setLoading(false);
  };

  const handleCreatePolicy = async () => {
    const res = await apiRequest('/policies', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    if (res.success) {
      setIsModalOpen(false);
      setCurrentStep(1);
      fetchPolicies();
    } else {
      alert(res.message || 'Failed to create policy');
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopHeader user={user} title="Policy Management" subtitle="Create, version, and administer insurance products." />

        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-5 border border-warm-border shadow-soft-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'Health', 'Vehicle', 'Life', 'Travel', 'Property'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    typeFilter === t
                      ? 'bg-brand-orange text-white shadow-soft-sm'
                      : 'bg-cream-50 text-charcoal-muted hover:bg-brand-peach/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-brand-orange to-brand-dark text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-soft-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Policy</span>
            </button>
          </div>

          {/* Policy Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies.map((p) => (
              <div key={p.id} className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-brand-peach text-brand-orange border border-brand-orange/20">
                      {p.policy_type}
                    </span>
                    <span className="text-xs font-bold text-charcoal-muted">{p.policy_number}</span>
                  </div>

                  <h3 className="text-lg font-extrabold text-charcoal tracking-tight mt-3">{p.name}</h3>
                  <p className="text-xs text-charcoal-muted mt-1.5 line-clamp-2">{p.description}</p>

                  <div className="grid grid-cols-2 gap-3 mt-5 p-3 rounded-2xl bg-cream-50/80 border border-warm-border/60">
                    <div>
                      <span className="text-[10px] font-bold text-charcoal-muted uppercase">Coverage</span>
                      <p className="text-sm font-extrabold text-charcoal">₹{Number(p.coverage_amount).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-charcoal-muted uppercase">Premium</span>
                      <p className="text-sm font-extrabold text-brand-orange">₹{Number(p.annual_premium).toLocaleString('en-IN')}/yr</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-warm-border flex items-center justify-between">
                  <span className="text-xs font-medium text-charcoal-muted">
                    {p.active_customers_count || 0} active policyholders
                  </span>
                  <span className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1 cursor-pointer">
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>

      {/* Multi-Step Policy Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl border border-warm-border shadow-soft-lg w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between p-6 border-b border-warm-border bg-cream-50/50">
              <div>
                <h3 className="text-lg font-extrabold text-charcoal">Create Insurance Policy</h3>
                <p className="text-xs text-charcoal-muted">Step {currentStep} of 5</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-cream-200">
                <X className="w-5 h-5 text-charcoal-muted" />
              </button>
            </div>

            <div className="p-6">
              {currentStep === 1 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-charcoal uppercase block mb-1">Policy Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Health Secure Platinum"
                      className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-charcoal uppercase block mb-1">Policy Type</label>
                    <select
                      value={formData.policyType}
                      onChange={(e) => setFormData({ ...formData, policyType: e.target.value })}
                      className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs"
                    >
                      <option value="Health">Health</option>
                      <option value="Vehicle">Vehicle</option>
                      <option value="Life">Life</option>
                      <option value="Travel">Travel</option>
                      <option value="Property">Property</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-charcoal uppercase block mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief overview of coverage..."
                      className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-charcoal uppercase block mb-1">Coverage Amount (₹)</label>
                      <input
                        type="number"
                        value={formData.coverageAmount}
                        onChange={(e) => setFormData({ ...formData, coverageAmount: Number(e.target.value) })}
                        className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-charcoal uppercase block mb-1">Annual Premium (₹)</label>
                      <input
                        type="number"
                        value={formData.annualPremium}
                        onChange={(e) => setFormData({ ...formData, annualPremium: Number(e.target.value) })}
                        className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-charcoal uppercase block mb-1">Benefits List</label>
                    <textarea
                      rows={4}
                      value={formData.benefits}
                      onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                      placeholder="Cashless hospitalization, zero depreciation, organ donor cover..."
                      className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-charcoal uppercase block mb-1">Terms & Conditions</label>
                    <textarea
                      rows={3}
                      value={formData.termsConditions}
                      onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })}
                      placeholder="Detailed coverage clause..."
                      className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-charcoal uppercase block mb-1">Policy Exclusions</label>
                    <textarea
                      rows={3}
                      value={formData.exclusions}
                      onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
                      placeholder="Pre-existing waiting period 24 months, self harm..."
                      className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs"
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-charcoal uppercase block mb-1">Claim Requirements</label>
                    <textarea
                      rows={3}
                      value={formData.claimRequirements}
                      onChange={(e) => setFormData({ ...formData, claimRequirements: e.target.value })}
                      placeholder="Original hospital bills, discharge summary, FIR copy..."
                      className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-charcoal uppercase block mb-1">Eligibility Criteria</label>
                    <textarea
                      rows={2}
                      value={formData.eligibility}
                      onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                      placeholder="Age 18 to 65..."
                      className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs"
                    />
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="flex flex-col gap-4 p-4 rounded-2xl bg-cream-50 border border-warm-border">
                  <h4 className="text-sm font-extrabold text-charcoal">Review Policy Details</h4>
                  <div className="text-xs flex flex-col gap-2">
                    <p><span className="font-bold">Name:</span> {formData.name}</p>
                    <p><span className="font-bold">Type:</span> {formData.policyType}</p>
                    <p><span className="font-bold">Coverage:</span> ₹{formData.coverageAmount.toLocaleString('en-IN')}</p>
                    <p><span className="font-bold">Annual Premium:</span> ₹{formData.annualPremium.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-6 border-t border-warm-border bg-cream-50/50">
              <button
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((s) => s - 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-charcoal-muted disabled:opacity-40"
              >
                Back
              </button>

              {currentStep < 5 ? (
                <button
                  onClick={() => setCurrentStep((s) => s + 1)}
                  className="bg-brand-orange text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-soft-sm"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleCreatePolicy}
                  className="bg-gradient-to-r from-brand-orange to-brand-dark text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-soft-md"
                >
                  Publish Policy v1.0
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
