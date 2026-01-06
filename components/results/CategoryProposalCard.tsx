"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderTree,
  ArrowRight,
  Check,
  X,
  Edit3,
  ChevronDown,
  ChevronUp,
  MoveRight,
  Merge,
  Split,
  Edit,
  ArrowUpDown,
  Plus,
} from 'lucide-react';
import { StripedPattern } from '../ui/striped-pattern';
import { stripMarkdown } from '@/lib/utils';
import type { CategoryProposalCardProps, CategoryChange } from './types';

/**
 * CategoryProposalCard - Displays AI category reorganization proposal
 *
 * Features:
 * - Side-by-side original vs proposed structure
 * - List of changes with icons and reasons
 * - Accept/Reject/Modify actions
 * - Expandable change details
 */

const changeTypeIcons: Record<CategoryChange['type'], React.ElementType> = {
  move_service: MoveRight,
  merge_categories: Merge,
  split_category: Split,
  rename_category: Edit,
  reorder_categories: ArrowUpDown,
  create_category: Plus,
};

const changeTypeLabels: Record<CategoryChange['type'], string> = {
  move_service: 'Przeniesienie',
  merge_categories: 'Połączenie',
  split_category: 'Podział',
  rename_category: 'Zmiana nazwy',
  reorder_categories: 'Zmiana kolejności',
  create_category: 'Nowa kategoria',
};

const CategoryProposalCard: React.FC<CategoryProposalCardProps> = ({
  originalStructure,
  proposedStructure,
  changes,
  status,
  onAccept,
  onReject,
  onModify,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedChanges = isExpanded ? changes : changes.slice(0, 3);

  const statusConfig = {
    pending: { color: 'amber', label: 'Oczekuje na decyzję', icon: Edit3 },
    accepted: { color: 'emerald', label: 'Zaakceptowano', icon: Check },
    modified: { color: 'blue', label: 'Zmodyfikowano', icon: Edit3 },
    rejected: { color: 'red', label: 'Odrzucono', icon: X },
  };

  const currentStatus = statusConfig[status];

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, filter: 'blur(4px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 overflow-hidden"
      >
        <div className="relative z-10 overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
          <div className="flex items-center gap-2 mb-4">
            <FolderTree className="w-4 h-4 text-slate-300 animate-pulse" />
            <span className="text-sm text-slate-300 uppercase tracking-wide">Struktura kategorii</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(4px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ delay: 0.15 }}
      className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
    >
      <StripedPattern
        className="text-slate-300"
        style={{
          zIndex: 0,
          left: '-10%',
          height: '130%',
          width: '100%',
          top: '-17%',
          transform: 'scale(1.1)',
          maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)',
          opacity: 0.6,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)',
        }}
      />

      <div className="relative z-10 overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-[#D4A574]" />
            <span className="text-sm text-slate-400 uppercase tracking-wide">Propozycja kategorii</span>
          </div>
          <span
            className={`px-2 py-0.5 bg-${currentStatus.color}-100 text-${currentStatus.color}-700 text-[10px] font-bold rounded-full flex items-center gap-1`}
            style={{
              backgroundColor: status === 'pending' ? '#fef3c7' : status === 'accepted' ? '#d1fae5' : status === 'modified' ? '#dbeafe' : '#fee2e2',
              color: status === 'pending' ? '#b45309' : status === 'accepted' ? '#047857' : status === 'modified' ? '#1d4ed8' : '#dc2626',
            }}
          >
            {currentStatus.label}
          </span>
        </div>

        {/* Structure comparison */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Original */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Obecna</h4>
            <div className="space-y-1.5">
              {originalStructure.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 truncate">{stripMarkdown(cat.name)}</span>
                  <span className="text-slate-400 text-xs">{cat.servicesCount}</span>
                </div>
              ))}
              {originalStructure.length > 5 && (
                <p className="text-xs text-slate-400">+{originalStructure.length - 5} więcej</p>
              )}
            </div>
          </div>

          {/* Proposed */}
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <h4 className="text-xs font-semibold text-emerald-600 uppercase mb-2">Proponowana</h4>
            <div className="space-y-1.5">
              {proposedStructure.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 truncate font-medium">{stripMarkdown(cat.name)}</span>
                  <span className="text-emerald-600 text-xs font-medium">{cat.servicesCount}</span>
                </div>
              ))}
              {proposedStructure.length > 5 && (
                <p className="text-xs text-emerald-500">+{proposedStructure.length - 5} więcej</p>
              )}
            </div>
          </div>
        </div>

        {/* Changes list */}
        {changes.length > 0 && (
          <>
            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-[#D4A574]" />
              Proponowane zmiany ({changes.length})
            </h4>
            <div className="space-y-2 mb-4">
              {displayedChanges.map((change, idx) => {
                const Icon = changeTypeIcons[change.type];
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50/50 rounded-lg border border-slate-100"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#D4A574]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-[#D4A574]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-[#D4A574] uppercase">
                            {changeTypeLabels[change.type]}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{stripMarkdown(change.description)}</p>
                        <p className="text-xs text-slate-500 mt-1 italic">{stripMarkdown(change.reason)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expand/collapse button */}
            {changes.length > 3 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 transition-colors"
              >
                {isExpanded ? (
                  <>
                    Zwiń listę
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Pokaż wszystkie ({changes.length})
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </>
        )}

        {/* Action buttons */}
        {status === 'pending' && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={onAccept}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Akceptuj
            </button>
            <button
              onClick={onModify}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Modyfikuj
            </button>
            <button
              onClick={onReject}
              className="py-2.5 px-4 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 text-sm font-medium rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status indicator for non-pending states */}
        {status !== 'pending' && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div
              className="flex items-center justify-center gap-2 py-2 rounded-lg"
              style={{
                backgroundColor: status === 'accepted' ? '#d1fae5' : status === 'modified' ? '#dbeafe' : '#fee2e2',
              }}
            >
              {React.createElement(currentStatus.icon, {
                className: `w-4 h-4`,
                style: {
                  color: status === 'accepted' ? '#047857' : status === 'modified' ? '#1d4ed8' : '#dc2626',
                },
              })}
              <span
                className="text-sm font-medium"
                style={{
                  color: status === 'accepted' ? '#047857' : status === 'modified' ? '#1d4ed8' : '#dc2626',
                }}
              >
                {currentStatus.label}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CategoryProposalCard;
