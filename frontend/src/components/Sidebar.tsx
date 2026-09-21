'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sun,
  LayoutDashboard,
  ShieldCheck,
  Users,
  UserCheck,
  FileText,
  CreditCard,
  Bot,
  HelpCircle,
  History,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { UserSession, clearStoredSession } from '@/lib/auth';

interface SidebarProps {
  user: UserSession | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const pathname = usePathname();
  const role = user?.role || 'ADMIN';

  const adminNav: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Policies', href: '/admin/policies', icon: ShieldCheck },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Agents', href: '/admin/agents', icon: UserCheck },
    { label: 'Claims', href: '/admin/claims', icon: FileText },
    { label: 'Payments', href: '/admin/payments', icon: CreditCard },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: History },
  ];

  const agentNav: NavItem[] = [
    { label: 'Dashboard', href: '/agent/dashboard', icon: LayoutDashboard },
    { label: 'My Customers', href: '/agent/customers', icon: Users },
    { label: 'Claims Queue', href: '/agent/claims', icon: FileText },
    { label: 'Payments', href: '/agent/payments', icon: CreditCard },
  ];

  const customerNav: NavItem[] = [
    { label: 'Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
    { label: 'My Policies', href: '/customer/policies', icon: ShieldCheck },
    { label: 'Claims', href: '/customer/claims', icon: FileText },
    { label: 'Payments', href: '/customer/payments', icon: CreditCard },
    { label: 'AI Assistant', href: '/customer/assistant', icon: Bot, badge: 'AI' },
  ];

  let navItems = adminNav;
  if (role === 'AGENT') navItems = agentNav;
  if (role === 'CUSTOMER') navItems = customerNav;

  const handleLogout = () => {
    clearStoredSession();
    window.location.href = '/login';
  };

  return (
    <aside className="w-20 md:w-64 bg-cream-100/90 border-r border-warm-border h-screen sticky top-0 flex flex-col justify-between py-6 px-3 z-30 transition-all duration-300">
      <div className="flex flex-col gap-6">
        {/* Top Logo / Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-dark flex items-center justify-center text-white shadow-soft-md ring-4 ring-brand-peach">
            <Sun className="w-6 h-6 animate-spin-slow" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-extrabold text-lg text-charcoal tracking-tight leading-none">POLICIA</span>
            <span className="text-[11px] font-medium text-brand-orange tracking-widest uppercase mt-0.5">Insurance Platform</span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-orange text-white shadow-soft-sm font-semibold'
                    : 'text-charcoal-muted hover:text-brand-orange hover:bg-brand-peach/60'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  isActive ? 'bg-white/20' : 'bg-transparent'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="hidden md:inline text-sm tracking-tight">{item.label}</span>
                {item.badge && (
                  <span className="hidden md:inline-flex ml-auto text-[10px] font-extrabold bg-brand-peach text-brand-orange px-2 py-0.5 rounded-full border border-brand-orange/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Logout Drawer */}
      <div className="flex flex-col gap-2 pt-4 border-t border-warm-border">
        {user && (
          <div className="hidden md:flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/70 border border-warm-border shadow-soft-sm">
            <div className="w-9 h-9 rounded-full bg-brand-peach text-brand-orange font-bold flex items-center justify-center text-sm border border-brand-orange/30">
              {user.firstName[0]}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-charcoal truncate">{user.firstName} {user.lastName}</span>
              <span className="text-[10px] font-semibold text-brand-orange uppercase tracking-wider">{user.role}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-charcoal-muted hover:text-red-600 hover:bg-red-50 transition-colors w-full"
          title="Sign Out"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="hidden md:inline text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
