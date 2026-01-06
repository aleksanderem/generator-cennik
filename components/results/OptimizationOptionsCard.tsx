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
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { StripedPattern } from '../ui/striped-pattern';
import type { OptimizationOptionsCardProps, OptimizationOptionType } from './types';

/**
 * OptimizationOptionsCard - Untitled UI style checkbox group
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
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4A574]" />
            <span className="text-sm text-slate-400 uppercase tracking-wide">Opcje optymalizacji</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              disabled={allSelected}
              className="text-xs text-emerald-600 hover:text-emerald-700 disabled:text-slate-300 transition-colors font-medium"
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

        {/* Options grid - Untitled UI checkbox card style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {optionConfigs.map((config) => {
            const isSelected = isOptionSelected(config.key);
            const isDisabled = config.key === 'categories' && categoryDisabled;
            const Icon = config.icon;

            return (
              <label
                key={config.key}
                className={`
                  relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                  ${isSelected
                    ? 'border-[#D4A574] bg-[#D4A574]/5 ring-1 ring-[#D4A574]/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* Custom checkbox */}
                <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(config.key)}
                    disabled={isDisabled}
                    className="sr-only"
                  />
                  <div
                    className={`
                      w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200
                      ${isSelected
                        ? 'bg-[#D4A574] border-[#D4A574]'
                        : 'bg-white border-slate-300'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#D4A574]' : 'text-slate-400'}`}
                    />
                    <span
                      className={`text-sm font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{config.description}</p>
                </div>

                {/* Category warning overlay */}
                {config.key === 'categories' && categoryDisabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      <span>Zaakceptuj propozycję kategorii</span>
                    </div>
                  </div>
                )}
              </label>
            );
          })}
        </div>

        {/* Selected summary */}
        <div className="flex items-center justify-between mb-5 py-3 px-4 bg-slate-50 rounded-lg">
          <span className="text-sm text-slate-600">
            Wybrano <span className="font-bold text-slate-900">{selectedOptions.length}</span> z {optionConfigs.length} obszarów
          </span>
          {selectedOptions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedOptions.slice(0, 3).map((opt) => (
                <span
                  key={opt}
                  className="px-2 py-0.5 bg-[#D4A574]/10 text-[#B8860B] text-xs font-medium rounded-full"
                >
                  {optionConfigs.find((c) => c.key === opt)?.label}
                </span>
              ))}
              {selectedOptions.length > 3 && (
                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-medium rounded-full">
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
            w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200
            flex items-center justify-center gap-2
            ${noneSelected || isOptimizing
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#D4A574] to-[#B8860B] text-white shadow-lg shadow-[#D4A574]/25 hover:shadow-xl hover:shadow-[#D4A574]/30 hover:-translate-y-0.5'
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
