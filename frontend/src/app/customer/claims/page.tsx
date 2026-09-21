'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { getStoredUser, UserSession } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { FileText, Plus, Upload, CheckCircle2, Clock, X } from 'lucide-react';

export default function CustomerClaimsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Claim Form State
  const [customerPolicyId, setCustomerPolicyId] = useState('');
  const [claimType, setClaimType] = useState('Inpatient Hospitalization');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [claimAmount, setClaimAmount] = useState<number>(25000);
  const [docName, setDocName] = useState('Hospital_Discharge_Summary.pdf');

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    if (u && u.customerId) {
      apiRequest(`/customers/${u.customerId}/policies`).then((res) => {
        if (res.success && res.data) {
          setPolicies(res.data.policies || []);
          if (res.data.policies?.length > 0) setCustomerPolicyId(res.data.policies[0].id);
        }
      });
      fetchClaims();
    }
  }, []);

  const fetchClaims = async () => {
    const res = await apiRequest('/claims');
    if (res.success && res.data) {
      setClaims(res.data.claims || []);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPolicyId || !description || !claimAmount) {
      return alert('Please fill in all claim details');
    }

    const res = await apiRequest('/claims', {
      method: 'POST',
      body: JSON.stringify({
        customerPolicyId,
        claimType,
        incidentDate,
        description,
        claimAmount: Number(claimAmount),
        documents: [
          { name: docName, type: 'PDF', url: `/uploads/${docName}`, size: 1024000 }
        ]
      }),
    });

    if (res.success) {
      alert('Claim submitted successfully! Our claims team will review your application.');
      setIsModalOpen(false);
      setDescription('');
      fetchClaims();
    } else {
      alert(res.message || 'Failed to submit claim');
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopHeader user={user} title="Claim Center" subtitle="File new claims and track active reimbursement status in real-time." />

        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
          
          <div className="flex items-center justify-between bg-white rounded-3xl p-5 border border-warm-border shadow-soft-sm">
            <div>
              <h3 className="text-lg font-extrabold text-charcoal">My Filed Claims</h3>
              <p className="text-xs text-charcoal-muted">Track step-by-step progress and document requests</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-brand-orange to-brand-dark text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-soft-md hover:opacity-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>File New Claim</span>
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {claims.map((cl) => (
              <div key={cl.id} className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-warm-border/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-charcoal">{cl.claim_number}</h4>
                      <span className="text-xs font-semibold text-charcoal-muted">({cl.policy_name})</span>
                    </div>
                    <p className="text-xs text-charcoal-muted mt-0.5">Incident Date: {new Date(cl.incident_date).toLocaleDateString('en-IN')}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Claim Amount</span>
                      <span className="text-base font-extrabold text-charcoal">₹{Number(cl.claim_amount).toLocaleString('en-IN')}</span>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      cl.status === 'APPROVED' || cl.status === 'CLOSED'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {cl.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-[11px] font-bold text-charcoal uppercase tracking-wider block mb-1">Description</span>
                  <p className="text-xs text-charcoal leading-relaxed p-3 rounded-2xl bg-cream-50/60 border border-warm-border/40">
                    {cl.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>

      {/* Apply Claim Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmitClaim} className="bg-white rounded-4xl border border-warm-border shadow-soft-lg w-full max-w-xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-6 border-b border-warm-border bg-cream-50/50">
              <h3 className="text-lg font-extrabold text-charcoal">Apply for Insurance Claim</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-cream-200">
                <X className="w-5 h-5 text-charcoal-muted" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-charcoal uppercase block mb-1">Select Policy</label>
                <select
                  value={customerPolicyId}
                  onChange={(e) => setCustomerPolicyId(e.target.value)}
                  className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs font-bold"
                >
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.policy_name} ({p.policy_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-charcoal uppercase block mb-1">Claim Type</label>
                  <input
                    type="text"
                    required
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value)}
                    className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-charcoal uppercase block mb-1">Incident Date</label>
                  <input
                    type="date"
                    required
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal uppercase block mb-1">Claim Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(Number(e.target.value))}
                  className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs font-extrabold text-charcoal"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal uppercase block mb-1">Incident Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened..."
                  className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs"
                />
              </div>

              {/* Drag and Drop Document Simulator */}
              <div>
                <label className="text-xs font-bold text-charcoal uppercase block mb-1">Upload Supporting Documents</label>
                <div className="border-2 border-dashed border-warm-border rounded-2xl p-4 text-center bg-cream-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-brand-orange transition-colors">
                  <Upload className="w-6 h-6 text-brand-orange mb-1" />
                  <span className="text-xs font-bold text-charcoal">Drag & drop files or click to upload</span>
                  <span className="text-[10px] text-charcoal-muted mt-0.5">PDF, PNG, JPG up to 10MB</span>
                  <span className="text-[11px] font-bold text-brand-orange mt-2 bg-white px-2.5 py-0.5 rounded-full border border-brand-orange/20">
                    Attached: {docName}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-warm-border bg-cream-50/50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-charcoal-muted">
                Cancel
              </button>
              <button type="submit" className="bg-gradient-to-r from-brand-orange to-brand-dark text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-soft-sm">
                Submit Claim
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
