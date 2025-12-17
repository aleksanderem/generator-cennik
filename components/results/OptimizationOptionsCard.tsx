"use client";
import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  FileText,
  Search,
  FolderTree,
  ArrowUpDown,
  DollarSign,
  Copy,
  Clock,
  Tag,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { StripedPattern } from '../ui/striped-pattern';
import type { OptimizationOptionsCardProps, OptimizationOptionType } from './types';

/**
 * OptimizationOptionsCard - Lets user select which optimization areas to apply
 *
 * Features:
 * - 8 toggleable optimization options
 * - Select all / deselect all
 * - Category option disabled until proposal accepted
 * - Start optimization button
 */

interface OptionConfig {
  key: OptimizationOptionType;
  icon: React.ElementType;
  label: string;
  description: string;
}

const optionConfigs: OptionConfig[] = [
  {
    key: 'descriptions',
    icon: FileText,
    label: 'Opisy usług',
    description: 'Język korzyści, efekty zabiegu',
  },
  {
    key: 'seo',
    icon: Search,
    label: 'Słowa kluczowe SEO',
    description: 'Optymalizacja dla wyszukiwarek',
  },
  {
    key: 'categories',
    icon: FolderTree,
    label: 'Struktura kategorii',
    description: 'Wymaga zaakceptowanej propozycji',
  },
  {
    key: 'order',
    icon: ArrowUpDown,
    label: 'Kolejność usług',
    description: 'Bestsellery i premium na górze',
  },
  {
    key: 'prices',
    icon: DollarSign,
    label: 'Formatowanie cen',
    description: 'Spójne zaokrąglenia i format',
  },
  {
    key: 'duplicates',
    icon: Copy,
    label: 'Wykrywanie duplikatów',
    description: 'Podobne usługi do połączenia',
  },
  {
    key: 'duration',
    icon: Clock,
    label: 'Czas trwania',
    description: 'Szacowanie czasu zabiegów',
  },
  {
    key: 'tags',
    icon: Tag,
    label: 'Tagi i oznaczenia',
    description: 'Bestseller, Nowość, Premium',
  },
];

const OptimizationOptionsCard: React.FC<OptimizationOptionsCardProps> = ({
  selectedOptions,
  onToggleOption,
  onSelectAll,
  onDeselectAll,
  onStartOptimization,
  hasCategoryProposal = false,
  categoryProposalAccepted = false,
  isLoading = false,
  isOptimizing = false,
}) => {
  const allSelected = selectedOptions.length === optionConfigs.length;
  const noneSelected = selectedOptions.length === 0;
  const categoryDisabled = !hasCategoryProposal || !categoryProposalAccepted;

  const isOptionSelected = (option: OptimizationOptionType) =>
    selectedOptions.includes(option);

  const handleToggle = (option: OptimizationOptionType) => {
    if (option === 'categories' && categoryDisabled) return;
    onToggleOption(option);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, filter: 'blur(4px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 overflow-hidden"
      >
        <div className="relative z-10 overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-slate-300 animate-pulse" />
            <span className="text-sm text-slate-300 uppercase tracking-wide">Opcje optymalizacji</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
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
      transition={{ delay: 0.2 }}
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
            <Sparkles className="w-4 h-4 text-[#D4A574]" />
            <span className="text-sm text-slate-400 uppercase tracking-wide">Opcje optymalizacji</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              disabled={allSelected}
              className="text-xs text-emerald-600 hover:text-emerald-700 disabled:text-slate-300 transition-colors"
            >
              Zaznacz wszystkie
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={onDeselectAll}
              disabled={noneSelected}
              className="text-xs text-slate-500 hover:text-slate-700 disabled:text-slate-300 transition-colors"
            >
              Odznacz
            </button>
          </div>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {optionConfigs.map((config) => {
            const isSelected = isOptionSelected(config.key);
            const isDisabled = config.key === 'categories' && categoryDisabled;
            const Icon = config.icon;

            return (
              <button
                key={config.key}
                onClick={() => handleToggle(config.key)}
                disabled={isDisabled}
                className={`
                  relative p-3 rounded-lg border transition-all duration-200 text-left
                  ${isSelected
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                      ${isSelected ? 'bg-emerald-100' : 'bg-slate-100'}
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-500'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}
                      >
                        {config.label}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{config.description}</p>
                  </div>
                </div>

                {/* Category warning */}
                {config.key === 'categories' && categoryDisabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-amber-600">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Zaakceptuj propozycję</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected count */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
          <span className="text-sm text-slate-500">
            Wybrano{' '}
            <span className="font-bold text-slate-700">{selectedOptions.length}</span>
            {' '}z {optionConfigs.length} obszarów
          </span>
          {selectedOptions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.slice(0, 3).map((opt) => (
                <span
                  key={opt}
                  className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium rounded"
                >
                  {optionConfigs.find((c) => c.key === opt)?.label}
                </span>
              ))}
              {selectedOptions.length > 3 && (
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">
                  +{selectedOptions.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Start button */}
        <button
          onClick={onStartOptimization}
          disabled={noneSelected || isOptimizing}
          className={`
            w-full py-3 px-6 rounded-lg font-medium text-sm transition-all duration-200
            flex items-center justify-center gap-2
            ${noneSelected || isOptimizing
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#D4A574] to-[#B8860B] text-white hover:shadow-lg hover:shadow-[#D4A574]/20'
            }
          `}
        >
          {isOptimizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Optymalizuję...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Rozpocznij optymalizację AI
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default OptimizationOptionsCard;
