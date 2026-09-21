'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { getStoredUser, UserSession } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { UserCheck, Plus, Users, FileText, X } from 'lucide-react';

export default function AdminAgentsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'DemoAgent@123',
    department: 'Health & Claims',
  });

  useEffect(() => {
    setUser(getStoredUser());
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    const res = await apiRequest('/agents');
    if (res.success && res.data) {
      setAgents(res.data.agents || []);
    }
    setLoading(false);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/agents', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    if (res.success) {
      setIsModalOpen(false);
      fetchAgents();
    } else {
      alert(res.message || 'Failed to create agent account');
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopHeader user={user} title="Agent Roster" subtitle="Manage insurance agents and customer assignments." />

        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
          
          <div className="flex items-center justify-between bg-white rounded-3xl p-5 border border-warm-border shadow-soft-sm">
            <div>
              <h3 className="text-lg font-extrabold text-charcoal">Active Insurance Agents</h3>
              <p className="text-xs text-charcoal-muted">{agents.length} agent representatives registered</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-brand-orange to-brand-dark text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-soft-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Agent</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((ag) => (
              <div key={ag.id} className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 font-extrabold flex items-center justify-center text-lg border border-amber-200">
                      {ag.first_name[0]}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-charcoal">{ag.first_name} {ag.last_name}</h3>
                      <span className="text-xs font-semibold text-brand-orange">{ag.employee_id} · {ag.department}</span>
                    </div>
                  </div>

                  <p className="text-xs text-charcoal-muted mt-3">{ag.email}</p>

                  <div className="grid grid-cols-2 gap-3 mt-5 p-3 rounded-2xl bg-cream-50/80 border border-warm-border/60">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand-orange" />
                      <div>
                        <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Customers</span>
                        <span className="text-sm font-extrabold text-charcoal">{ag.assigned_customers_count || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <div>
                        <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Open Claims</span>
                        <span className="text-sm font-extrabold text-charcoal">{ag.open_claims_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-warm-border flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
                    {ag.status}
                  </span>
                  <button className="text-xs font-bold text-brand-orange hover:underline">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateAgent} className="bg-white rounded-4xl border border-warm-border shadow-soft-lg w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-6 border-b border-warm-border bg-cream-50/50">
              <h3 className="text-lg font-extrabold text-charcoal">Create Agent Account</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-cream-200">
                <X className="w-5 h-5 text-charcoal-muted" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-charcoal uppercase block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-charcoal uppercase block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal uppercase block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal uppercase block mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-cream-50 border border-warm-border rounded-2xl p-3 text-xs"
                />
              </div>
            </div>

            <div className="p-6 border-t border-warm-border bg-cream-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-charcoal-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-brand-orange text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-soft-sm"
              >
                Save Agent
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
