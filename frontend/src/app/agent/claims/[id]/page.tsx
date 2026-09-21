'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { getStoredUser, UserSession } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { FileText, CheckCircle2, Clock, AlertCircle, ArrowLeft, Download, ShieldCheck } from 'lucide-react';

export default function AgentClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const claimId = params.id as string;

  const [user, setUser] = useState<UserSession | null>(null);
  const [claim, setClaim] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [allowedNext, setAllowedNext] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Transition form
  const [targetStatus, setTargetStatus] = useState('');
  const [comments, setComments] = useState('');
  const [approvedAmount, setApprovedAmount] = useState<number>(0);

  useEffect(() => {
    setUser(getStoredUser());
    fetchClaimDetail();
  }, [claimId]);

  const fetchClaimDetail = async () => {
    setLoading(true);
    const res = await apiRequest(`/claims/${claimId}`);
    if (res.success && res.data) {
      setClaim(res.data.claim);
      setTimeline(res.data.timeline || []);
      setDocuments(res.data.documents || []);
      setAllowedNext(res.data.allowedNextStatuses || []);
      setApprovedAmount(res.data.claim.claim_amount);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async () => {
    if (!targetStatus) return alert('Please select a target status transition.');

    const res = await apiRequest(`/claims/${claimId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        newStatus: targetStatus,
        comments,
        approvedAmount: Number(approvedAmount),
      }),
    });

    if (res.success) {
      alert(`Claim status updated to ${targetStatus} successfully!`);
      setTargetStatus('');
      setComments('');
      fetchClaimDetail();
    } else {
      alert(res.message || 'Failed to update claim status');
    }
  };

  if (loading || !claim) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <p className="text-sm font-bold text-charcoal">Loading claim workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopHeader user={user} title={`Claim #${claim.claim_number}`} subtitle="Interactive Agent Claim State Machine & Document Verification Workspace" />

        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
          
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-xl bg-white border border-warm-border hover:bg-cream-50 text-charcoal">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-charcoal uppercase tracking-wider">Back to Claims Queue</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Col: Claim Info & Attachments */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-brand-peach text-brand-orange border border-brand-orange/20">
                    {claim.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-charcoal-muted">Incident: {new Date(claim.incident_date).toLocaleDateString('en-IN')}</span>
                </div>

                <h3 className="text-xl font-extrabold text-charcoal mt-3">{claim.policy_name}</h3>
                <p className="text-xs text-charcoal-muted mt-1">Customer: <strong className="text-charcoal">{claim.customer_name}</strong> ({claim.customer_email})</p>

                <div className="mt-5 p-4 rounded-2xl bg-cream-50 border border-warm-border/60 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-charcoal-muted">Claimed Amount:</span>
                    <span className="font-extrabold text-charcoal">₹{Number(claim.claim_amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-muted">Approved Amount:</span>
                    <span className="font-extrabold text-brand-orange">₹{Number(claim.approved_amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-[11px] font-bold text-charcoal uppercase tracking-wider block mb-1">Incident Description</span>
                  <p className="text-xs text-charcoal leading-relaxed p-3 rounded-2xl bg-cream-50/50 border border-warm-border/40">
                    {claim.description}
                  </p>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm">
                <h4 className="text-sm font-extrabold text-charcoal mb-3">Submitted Claim Documents</h4>
                <div className="flex flex-col gap-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-2xl bg-cream-50 border border-warm-border text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-brand-orange shrink-0" />
                        <span className="font-medium text-charcoal truncate">{doc.name}</span>
                      </div>
                      <button className="text-brand-orange font-bold text-[11px] hover:underline flex items-center gap-1 shrink-0">
                        <Download className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <p className="text-xs text-charcoal-muted italic">No documents attached yet.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Center Col: State Machine Controller */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-charcoal">Claim Status Transition Workspace</h3>
                <p className="text-xs text-charcoal-muted mt-0.5">Enforce business state rules and advance claim status</p>

                <div className="mt-5 p-4 rounded-2xl bg-brand-peach/50 border border-brand-orange/20">
                  <span className="text-xs font-bold text-brand-orange block mb-2">Allowed Next State Transitions:</span>
                  <div className="flex flex-wrap gap-2">
                    {allowedNext.map((st) => (
                      <button
                        key={st}
                        onClick={() => setTargetStatus(st)}
                        className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${
                          targetStatus === st
                            ? 'bg-brand-orange text-white shadow-soft-sm ring-2 ring-brand-orange'
                            : 'bg-white text-charcoal border border-warm-border hover:border-brand-orange'
                        }`}
                      >
                        → {st.replace('_', ' ')}
                      </button>
                    ))}
                    {allowedNext.length === 0 && (
                      <span className="text-xs text-charcoal-muted font-bold">This claim has reached terminal state ({claim.status}).</span>
                    )}
                  </div>
                </div>

                {targetStatus && (
                  <div className="mt-5 flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-bold text-charcoal uppercase block mb-1">Approved Settlement Amount (₹)</label>
                      <input
                        type="number"
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(Number(e.target.value))}
                        className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs font-extrabold text-charcoal"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-charcoal uppercase block mb-1">Review Notes & Instructions</label>
                      <textarea
                        rows={4}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Detail why status was advanced or what document is missing..."
                        className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs text-charcoal"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-warm-border">
                <button
                  disabled={!targetStatus}
                  onClick={handleUpdateStatus}
                  className="w-full bg-gradient-to-r from-brand-orange to-brand-dark text-white font-bold py-3.5 px-6 rounded-2xl shadow-soft-md hover:opacity-95 transition-all disabled:opacity-40"
                >
                  Confirm State Transition to {targetStatus || 'Selected State'}
                </button>
              </div>
            </div>

            {/* Right Col: Timeline */}
            <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm">
              <h4 className="text-sm font-extrabold text-charcoal mb-4">Claim Audit Timeline</h4>
              
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-warm-border">
                {timeline.map((item, idx) => (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-[23px] top-0 w-4 h-4 rounded-full bg-brand-orange ring-4 ring-brand-peach flex items-center justify-center text-white" />
                    <div>
                      <span className="text-xs font-extrabold text-charcoal">{item.new_status.replace('_', ' ')}</span>
                      <p className="text-[10px] text-charcoal-muted mt-0.5">{new Date(item.created_at).toLocaleString('en-IN')}</p>
                      {item.comments && (
                        <p className="text-[11px] text-charcoal-muted mt-1 bg-cream-50 p-2 rounded-xl border border-warm-border/40">
                          {item.comments}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
