"use client";
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Loader2,
  Sparkles,
  Check,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  FileText,
  TrendingUp,
  GitCompare,
  ClipboardCheck,
} from 'lucide-react';
import { PricingData, OptimizationResult, ThemeConfig, AuditResult } from '../types';
import AuditReportTab from './AuditReportTab';
import { ShineBorder } from './ui/shine-border';
import { RainbowButton } from './ui/rainbow-button';
import { HeroHighlight } from './ui/hero-highlight';
import { BlurFade } from './ui/blur-fade';
import { AuroraText } from './ui/aurora-text';

interface OptimizationAnalysisViewProps {
  originalData: PricingData;
  optimizationResult: OptimizationResult | null;
  isOptimizing: boolean;
  themeConfig: ThemeConfig;
  onComplete: () => void;
  // Optional audit report - when provided, adds "Raport" tab
  auditReport?: AuditResult | null;
  onEditPricelist?: () => void;
}

type TabId = 'comparison' | 'changes' | 'summary' | 'report';

// Change type label mapping
const changeTypeLabels: Record<string, { label: string; color: string }> = {
  name_improved: { label: 'Poprawiona nazwa', color: '#3B82F6' },
  description_added: { label: 'Dodany opis', color: '#10B981' },
  description_improved: { label: 'Poprawiony opis', color: '#8B5CF6' },
  duplicate_merged: { label: 'Duplikat', color: '#F59E0B' },
  category_renamed: { label: 'Nowa nazwa kategorii', color: '#EC4899' },
  category_reordered: { label: 'Zmiana kolejności kategorii', color: '#6366F1' },
  service_reordered: { label: 'Zmiana kolejności usług', color: '#6366F1' },
  price_formatted: { label: 'Format ceny', color: '#14B8A6' },
  tag_added: { label: 'Dodany tag', color: '#F97316' },
  duration_estimated: { label: 'Oszacowany czas', color: '#06B6D4' },
  typo_fixed: { label: 'Poprawiona literówka', color: '#EF4444' },
};

// Simple pricelist card
const PricelistCard: React.FC<{
  data: PricingData;
  label: string;
  variant: 'original' | 'optimized';
  isLoading?: boolean;
}> = ({ data, label, variant, isLoading }) => {
  const isOriginal = variant === 'original';

  return (
    <div className="relative">
      <div className="mb-3 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${isOriginal ? 'bg-slate-400' : 'bg-[#D4A574]'}`}
        />
        <span className={`text-sm font-semibold ${isOriginal ? 'text-slate-500' : 'text-[#D4A574]'}`}>
          {label}
        </span>
      </div>

      <div className={`relative rounded-2xl border ${isOriginal ? 'bg-slate-50 border-slate-200' : 'bg-white border-[#D4A574]/30'} p-5 min-h-[300px]`}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-[#D4A574] animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-600">AI optymalizuje cennik...</p>
            </div>
          </div>
        ) : null}

        <div className={`space-y-4 ${isLoading ? 'opacity-30' : ''}`}>
          {data.categories.slice(0, 3).map((cat, catIdx) => (
            <div key={catIdx}>
              <h4 className={`text-xs font-bold uppercase tracking-wide mb-2 ${isOriginal ? 'text-slate-400' : 'text-[#D4A574]'}`}>
                {cat.categoryName}
              </h4>
              <div className="space-y-2">
                {cat.services.slice(0, 3).map((svc, svcIdx) => (
                  <div
                    key={svcIdx}
                    className={`flex items-start justify-between text-sm py-2 border-b ${isOriginal ? 'border-slate-100' : 'border-[#D4A574]/10'}`}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <span className="text-slate-800 font-medium">{svc.name}</span>
                      {svc.description && (
                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">
                          {svc.description}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold text-slate-700 whitespace-nowrap">{svc.price}</span>
                  </div>
                ))}
                {cat.services.length > 3 && (
                  <p className="text-xs text-slate-400">
                    +{cat.services.length - 3} więcej...
                  </p>
                )}
              </div>
            </div>
          ))}
          {data.categories.length > 3 && (
            <p className="text-xs text-slate-400 pt-2">
              +{data.categories.length - 3} więcej kategorii...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const OptimizationAnalysisView: React.FC<OptimizationAnalysisViewProps> = ({
  originalData,
  optimizationResult,
  isOptimizing,
  themeConfig,
  onComplete,
  auditReport,
  onEditPricelist,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('comparison');

  // Build tabs dynamically - add "Raport" tab if auditReport is provided
  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'comparison', label: 'Porównanie', icon: GitCompare },
    { id: 'changes', label: 'Lista zmian', icon: FileText },
    { id: 'summary', label: 'Podsumowanie', icon: TrendingUp },
    ...(auditReport ? [{ id: 'report' as TabId, label: 'Raport', icon: ClipboardCheck }] : []),
  ];

  // Loading state
  if (isOptimizing) {
    return (
      <div className="overflow-x-hidden">
        <HeroHighlight
          containerClassName="relative py-12 md:py-16 min-h-screen flex items-center bg-gradient-to-b from-slate-50 to-white"
          dotColor="rgba(212, 165, 116, 0.12)"
          dotColorHighlight="rgba(212, 165, 116, 0.8)"
        >
          <div className="relative max-w-4xl mx-auto w-full px-4">
            <BlurFade delay={0.1} inView>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A574]/10 rounded-full border border-[#D4A574]/30 mb-8">
                  <RefreshCw className="w-4 h-4 text-[#D4A574] animate-spin" />
                  <span className="text-sm font-medium text-[#D4A574]">
                    AI analizuje cennik
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-6">
                  Optymalizuję{' '}
                  <AuroraText colors={["#D4A574", "#C9956C", "#E8C4A0", "#B8860B"]}>
                    Twój cennik
                  </AuroraText>
                  {' '}<span className="inline-block">✨</span>
                </h1>

                <p className="text-lg text-slate-600 mb-12 max-w-xl mx-auto">
                  Analizuję nazwy usług, opisy, kategoryzację i strukturę cennika.
                  To zajmie tylko chwilę.
                </p>

                {/* Progress cards */}
                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <PricelistCard
                    data={originalData}
                    label="Oryginalny cennik"
                    variant="original"
                  />
                  <PricelistCard
                    data={originalData}
                    label="Zoptymalizowany cennik"
                    variant="optimized"
                    isLoading={true}
                  />
                </div>
              </motion.div>
            </BlurFade>
          </div>
        </HeroHighlight>
      </div>
    );
  }

  // Results view
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-serif font-bold text-slate-900">
                  Optymalizacja zakończona
                </h1>
                <p className="text-xs text-slate-500">
                  Przejrzyj zmiany i zastosuj je do cennika
                </p>
              </div>
            </div>

            {optimizationResult && (
              <RainbowButton onClick={onComplete} className="h-10 px-6 text-sm">
                Zastosuj zmiany
                <ArrowRight size={16} />
              </RainbowButton>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 border-t border-slate-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = !optimizationResult && tab.id !== 'comparison';

              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all
                    border-b-2 -mb-px
                    ${isActive
                      ? 'border-[#D4A574] text-[#D4A574]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tab: Comparison */}
        {activeTab === 'comparison' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-8"
          >
            <PricelistCard
              data={originalData}
              label="Oryginalny cennik"
              variant="original"
            />
            {optimizationResult && (
              <PricelistCard
                data={optimizationResult.optimizedPricingData}
                label="Zoptymalizowany cennik"
                variant="optimized"
              />
            )}
          </motion.div>
        )}

        {/* Tab: Changes */}
        {activeTab === 'changes' && optimizationResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {optimizationResult.changes.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900 mb-3">
                  Cennik jest już zoptymalizowany!
                </h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Nie znaleźliśmy żadnych elementów wymagających poprawy.
                  Twój cennik wygląda świetnie!
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="px-3 py-1.5 bg-[#D4A574]/10 rounded-full border border-[#D4A574]/20">
                    <span className="text-sm font-medium text-[#D4A574]">
                      {optimizationResult.changes.length} zmian
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {optimizationResult.changes.map((change, idx) => {
                    const typeInfo = changeTypeLabels[change.type] || {
                      label: change.type,
                      color: '#6B7280',
                    };

                    return (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                            style={{
                              backgroundColor: `${typeInfo.color}15`,
                              color: typeInfo.color,
                            }}
                          >
                            {typeInfo.label}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1.5 font-medium">
                                  Przed
                                </p>
                                <p className="text-sm text-slate-500 line-through">
                                  {change.originalValue || '(brak)'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1.5 font-medium">
                                  Po
                                </p>
                                <p className="text-sm text-slate-900 font-medium">
                                  {change.newValue}
                                </p>
                              </div>
                            </div>
                            {change.reason && (
                              <p className="text-xs text-slate-500 mt-3 italic border-t border-slate-100 pt-3">
                                💡 {change.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Tab: Summary */}
        {activeTab === 'summary' && optimizationResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-medium">
                  Łącznie zmian
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {optimizationResult.summary.totalChanges}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-medium">
                  Dodanych opisów
                </p>
                <p className="text-3xl font-bold text-emerald-600">
                  +{optimizationResult.summary.descriptionsAdded}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-medium">
                  Poprawionych nazw
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {optimizationResult.summary.namesImproved}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 font-medium">
                  Wynik jakości
                </p>
                <p className="text-3xl font-bold text-[#D4A574]">
                  {optimizationResult.qualityScore}/100
                </p>
              </div>
            </div>

            {/* Quality score bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Wynik jakości cennika
              </h3>
              <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${optimizationResult.qualityScore}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#D4A574] to-[#E8C4A0]"
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Recommendations - ALWAYS show with marketing upsells */}
            {(() => {
              // Marketing upsell recommendations - ALWAYS show these
              const marketingRecs = [
                "🚀 Kampania Google Ads dla salonu beauty – zwiększ widoczność i przyciągnij nowych klientów szukających usług w Twojej okolicy",
                "📱 Kampania reklamowa na Instagramie i Facebooku – docieraj do idealnych klientów z targetowanymi reklamami",
                "📈 Profesjonalne pozycjonowanie SEO – bądź na pierwszej stronie Google gdy klienci szukają usług beauty",
              ];

              // Combine existing recs with marketing recs
              const existingRecs = optimizationResult.recommendations || [];
              const displayRecs = existingRecs.length > 0
                ? [...existingRecs.slice(0, 2), ...marketingRecs.slice(0, 1)]
                : marketingRecs;

              return (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-[#D4A574]" />
                    Rekomendacje i propozycje rozwoju
                  </h3>
                  <div className="space-y-3">
                    {displayRecs.map((rec, idx) => {
                      const isMarketing = rec.startsWith('🚀') || rec.startsWith('📱') || rec.startsWith('📈');
                      return (
                        <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${isMarketing ? 'bg-emerald-50 border border-emerald-100' : ''}`}>
                          <ChevronRight size={16} className={`${isMarketing ? 'text-emerald-600' : 'text-[#D4A574]'} mt-0.5 shrink-0`} />
                          <p className={`text-sm ${isMarketing ? 'text-emerald-800' : 'text-slate-700'}`}>{rec}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-emerald-600 text-center font-medium">
                      💡 Skontaktuj się z nami, aby dowiedzieć się więcej o kampaniach reklamowych
                    </p>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Tab: Report (only shown when auditReport is provided) */}
        {activeTab === 'report' && auditReport && (
          <AuditReportTab
            auditReport={auditReport}
            onEditPricelist={onEditPricelist}
          />
        )}
      </div>
    </div>
  );
};

export default OptimizationAnalysisView;
