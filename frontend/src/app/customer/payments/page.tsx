'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { getStoredUser, UserSession } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { CreditCard, CheckCircle2, Clock, ShieldCheck, ArrowUpRight, X, Lock } from 'lucide-react';

export default function CustomerPaymentsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock Payment Modal
  const [selectedInst, setSelectedInst] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    fetchPaymentsData();
  }, []);

  const fetchPaymentsData = async () => {
    setLoading(true);
    const upRes = await apiRequest('/payments/upcoming');
    if (upRes.success && upRes.data) setUpcoming(upRes.data.upcoming || []);

    const hRes = await apiRequest('/payments/history');
    if (hRes.success && hRes.data) setHistory(hRes.data.history || []);
    setLoading(false);
  };

  const handlePayNow = async () => {
    if (!selectedInst) return;
    setProcessing(true);

    // Step 1: Create payment intent
    const intentRes = await apiRequest('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ installmentId: selectedInst.id, paymentMethod }),
    });

    if (!intentRes.success) {
      setProcessing(false);
      return alert(intentRes.message || 'Payment intent failed');
    }

    const { transactionId } = intentRes.data;

    // Step 2: Simulate Payment Gateway Webhook Callback
    const webhookRes = await apiRequest('/payments/webhook', {
      method: 'POST',
      body: JSON.stringify({
        installmentId: selectedInst.id,
        transactionId,
        amount: selectedInst.amount,
        status: 'PAID',
        paymentMethod,
      }),
    });

    setProcessing(false);
    setSelectedInst(null);

    if (webhookRes.success) {
      alert(`Payment of ₹${Number(selectedInst.amount).toLocaleString('en-IN')} successful! Transaction ID: ${transactionId}`);
      fetchPaymentsData();
    } else {
      alert('Payment processing failed');
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopHeader user={user} title="Payment Plans & Installments" subtitle="Review payment schedules, view receipts, and make secure installment payments." />

        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm">
              <span className="text-xs font-bold text-charcoal-muted uppercase">Total Annual Premium</span>
              <h3 className="text-2xl font-extrabold text-charcoal mt-1">₹24,000</h3>
              <p className="text-xs text-charcoal-muted mt-2">Health Secure Plus Plan</p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm">
              <span className="text-xs font-bold text-emerald-600 uppercase">Total Paid to Date</span>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">₹16,000</h3>
              <p className="text-xs text-charcoal-muted mt-2">8 Installments Completed</p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm">
              <span className="text-xs font-bold text-brand-orange uppercase">Remaining Balance</span>
              <h3 className="text-2xl font-extrabold text-brand-orange mt-1">₹8,000</h3>
              <p className="text-xs text-charcoal-muted mt-2">4 Monthly Installments Left</p>
            </div>
          </div>

          {/* Upcoming Installments Table */}
          <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm">
            <h3 className="text-lg font-extrabold text-charcoal mb-4">Pending & Upcoming Installments</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-warm-border text-[11px] font-extrabold uppercase tracking-wider text-charcoal-muted">
                    <th className="py-3 px-3">Installment</th>
                    <th className="py-3 px-3">Policy</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-border/60 text-xs">
                  {upcoming.map((inst) => {
                    const dueDateStr = new Date(inst.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    return (
                      <tr key={inst.id} className="hover:bg-cream-50/80 transition-colors">
                        <td className="py-3 px-3 font-bold text-charcoal">Installment #{inst.installment_number}</td>
                        <td className="py-3 px-3 font-medium text-charcoal">{inst.policy_name}</td>
                        <td className="py-3 px-3 text-charcoal-muted">{dueDateStr}</td>
                        <td className="py-3 px-3 font-extrabold text-brand-orange">₹{Number(inst.amount).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-600 border border-amber-200">
                            {inst.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedInst(inst)}
                            className="bg-brand-orange text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow-soft-sm hover:opacity-95 transition-all"
                          >
                            Pay Now
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {upcoming.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-charcoal-muted italic">
                        No pending installments. All payments are up to date!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm">
            <h3 className="text-lg font-extrabold text-charcoal mb-4">Completed Payment Receipts</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-warm-border text-[11px] font-extrabold uppercase tracking-wider text-charcoal-muted">
                    <th className="py-3 px-3">Transaction ID</th>
                    <th className="py-3 px-3">Policy</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Paid Date</th>
                    <th className="py-3 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-border/60 text-xs">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-cream-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-charcoal">{h.transaction_id}</td>
                      <td className="py-3 px-3 font-medium text-charcoal">{h.policy_name}</td>
                      <td className="py-3 px-3 text-charcoal-muted uppercase">{h.payment_method}</td>
                      <td className="py-3 px-3 font-extrabold text-emerald-600">₹{Number(h.amount).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-charcoal-muted">{new Date(h.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-3 text-right">
                        <button className="text-xs font-bold text-brand-orange hover:underline">
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* Mock Payment Checkout Modal */}
      {selectedInst && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl border border-warm-border shadow-soft-lg w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-6 border-b border-warm-border bg-cream-50/50">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-extrabold text-charcoal">Secure Mock Checkout</h3>
              </div>
              <button onClick={() => setSelectedInst(null)} className="p-2 rounded-full hover:bg-cream-200">
                <X className="w-5 h-5 text-charcoal-muted" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-cream-50 border border-warm-border text-xs flex flex-col gap-1.5">
                <span className="text-charcoal-muted">Payment for {selectedInst.policy_name}</span>
                <span className="font-bold text-charcoal">Installment #{selectedInst.installment_number}</span>
                <span className="text-xl font-extrabold text-brand-orange mt-1">₹{Number(selectedInst.amount).toLocaleString('en-IN')}</span>
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal uppercase block mb-1">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['CARD', 'UPI', 'NET_BANKING'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                        paymentMethod === m
                          ? 'border-brand-orange bg-brand-peach/50 text-brand-orange'
                          : 'border-warm-border bg-white text-charcoal-muted'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-warm-border bg-cream-50/50 flex justify-end gap-3">
              <button onClick={() => setSelectedInst(null)} className="px-4 py-2 text-xs font-bold text-charcoal-muted">
                Cancel
              </button>
              <button
                disabled={processing}
                onClick={handlePayNow}
                className="bg-gradient-to-r from-brand-orange to-brand-dark text-white font-bold text-xs px-6 py-3 rounded-xl shadow-soft-md disabled:opacity-50"
              >
                {processing ? 'Processing Webhook...' : `Pay ₹${Number(selectedInst.amount).toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
