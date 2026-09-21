'use client';

import React from 'react';
import { Search, Calendar, ChevronDown, User } from 'lucide-react';
import { UserSession } from '@/lib/auth';

interface TopHeaderProps {
  user: UserSession | null;
  title?: string;
  subtitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ user, title, subtitle }) => {
  return (
    <header className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-6 bg-cream-100/60 backdrop-blur-md sticky top-0 z-20 border-b border-warm-border/40">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-charcoal tracking-tight">
          {title || `Overview`}
        </h1>
        <p className="text-xs md:text-sm text-charcoal-muted mt-0.5">
          {subtitle || `Welcome back, ${user?.firstName || 'User'} · Here's what's happening today`}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative hidden lg:block w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-muted" />
          <input
            type="text"
            placeholder="Search policies, claims, metrics..."
            className="w-full bg-white/80 border border-warm-border rounded-full pl-10 pr-4 py-2 text-xs text-charcoal placeholder-charcoal-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 transition-all shadow-soft-sm"
          />
        </div>

        {/* Date Selector Filter */}
        <button className="hidden sm:flex items-center gap-2 bg-white/90 border border-warm-border px-3.5 py-2 rounded-full text-xs font-semibold text-charcoal shadow-soft-sm hover:border-brand-orange/40 transition-all">
          <Calendar className="w-3.5 h-3.5 text-brand-orange" />
          <span>Last 30 days</span>
          <ChevronDown className="w-3.5 h-3.5 text-charcoal-muted" />
        </button>

        {/* User Role Badge */}
        {user && (
          <div className="flex items-center gap-2.5 bg-white border border-warm-border pl-1.5 pr-4 py-1.5 rounded-full shadow-soft-sm">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-orange to-brand-dark text-white text-xs font-bold flex items-center justify-center shadow-sm">
              {user.firstName[0]}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-charcoal leading-tight">{user.firstName}</span>
              <span className="text-[10px] font-semibold text-brand-orange leading-tight">{user.role}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
