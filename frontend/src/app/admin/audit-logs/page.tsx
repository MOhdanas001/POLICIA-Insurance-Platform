'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { getStoredUser, UserSession } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { History, Shield, Search, Terminal } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const res = await apiRequest('/audit');
    if (res.success && res.data) {
      setLogs(res.data.logs || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopHeader user={user} title="System Audit Logs" subtitle="Security audit trail recording platform state mutations." />

        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
          
          <div className="bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-charcoal">Audit Trail Entries</h3>
                <p className="text-xs text-charcoal-muted">All administrative and status change events logged with IP and actor metadata</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-warm-border text-[11px] font-extrabold uppercase tracking-wider text-charcoal-muted">
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Actor / User</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-3">Resource</th>
                    <th className="py-3 px-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-border/60 text-xs">
                  {logs.map((log) => {
                    const timeStr = new Date(log.created_at).toLocaleString('en-IN');
                    return (
                      <tr key={log.id} className="hover:bg-cream-50/80 transition-colors">
                        <td className="py-3 px-3 text-charcoal-muted font-mono text-[11px]">{timeStr}</td>
                        <td className="py-3 px-3 font-bold text-charcoal">
                          {log.user_name || 'System User'} <span className="text-[10px] text-brand-orange">({log.role || 'ADMIN'})</span>
                        </td>
                        <td className="py-3 px-3 font-extrabold text-charcoal">
                          <span className="px-2.5 py-1 rounded-full text-[10px] bg-brand-peach text-brand-orange border border-brand-orange/20 font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-charcoal-muted font-mono">{log.resource} ({log.resource_id?.substring(0, 8)})</td>
                        <td className="py-3 px-3 text-charcoal-muted font-mono text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
