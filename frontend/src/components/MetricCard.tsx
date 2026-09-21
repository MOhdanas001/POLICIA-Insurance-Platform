'use client';

import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  sparklineColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  isPositive = true,
  icon: Icon,
  sparklineColor = '#FF6B4A',
}) => {
  return (
    <div className="relative bg-white rounded-3xl p-6 border border-warm-border shadow-soft-sm hover:shadow-soft-md transition-all duration-300 overflow-hidden group">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-2xl bg-brand-peach/80 border border-brand-orange/20 flex items-center justify-center text-brand-orange shadow-sm group-hover:scale-105 transition-transform">
          <Icon className="w-5 h-5" />
        </div>

        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
            isPositive
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
              : 'bg-rose-50 text-rose-600 border border-rose-200/60'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-4 relative z-10">
        <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">{title}</span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-charcoal tracking-tight mt-1">
          {value}
        </h2>
      </div>

      {/* Bottom Sparkline Wave */}
      <div className="mt-4 h-8 w-full">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
          <path
            d="M 0 18 Q 15 5, 30 14 T 60 8 T 80 18 T 100 4"
            fill="none"
            stroke={sparklineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};
