"use client";
import React from 'react';
import { motion } from 'motion/react';
import { Zap, Loader2 } from 'lucide-react';
import { StripedPattern } from '../ui/striped-pattern';
import type { QuickActionsCardProps } from './types';

/**
 * QuickActionsCard - Grid of quick action buttons
 *
 * Features:
 * - 2x2 grid layout
 * - Icon + label + description per action
 * - Loading and disabled states
 * - Hover effects
 */
const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ actions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(4px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ delay: 0.15 }}
      className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
    >
      <StripedPattern
        className="text-slate-300"
        style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
      <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
      <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-[#D4A574]" />
          <span className="text-sm text-slate-400 uppercase tracking-wide">Szybkie akcje</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  {action.loading ? (
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700">{action.label}</span>
                <p className="text-xs text-slate-500 text-center">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default QuickActionsCard;
