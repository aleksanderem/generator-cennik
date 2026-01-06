"use client";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Hash,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Layers,
  Download,
  Sparkles,
  ArrowRight,
  Plus,
  Eye,
  EyeOff,
  Search,
} from 'lucide-react';
import { StripedPattern } from '../ui/striped-pattern';
import { stripMarkdown } from '@/lib/utils';
import type { KeywordReportCardProps, KeywordData, ProposedKeyword } from './types';

type TabType = 'current' | 'proposed';

/**
 * KeywordReportCard - Displays keyword analysis results from audit
 *
 * Features:
 * - Tabs: "Obecne" (current) and "Proponowane" (proposed/improved)
 * - Top keywords with counts and category distribution
 * - Category-wise keyword distribution chart
 * - AI-generated SEO suggestions with before/after comparisons
 * - Expandable keyword list
 * - Export to CSV functionality
 */
const KeywordReportCard: React.FC<KeywordReportCardProps> = ({
  keywords,
  categoryDistribution,
  suggestions,
  proposedKeywords = [],
  improvementPercent,
  onExportCSV,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedKeywords = isExpanded ? keywords : keywords.slice(0, 8);

  // Calculate total keyword occurrences
  const totalOccurrences = keywords.reduce((sum, k) => sum + k.count, 0);

  // Split proposed keywords by source
  const { transformationKeywords, suggestionKeywords } = useMemo(() => {
    const transformations = proposedKeywords.filter(k => k.source === 'transformation');
    const suggestions = proposedKeywords.filter(k => k.source === 'suggestion');
    return { transformationKeywords: transformations, suggestionKeywords: suggestions };
  }, [proposedKeywords]);

  // Calculate proposed stats
  const proposedStats = useMemo(() => {
    const currentCount = keywords.length;
    const newKeywordsCount = proposedKeywords.length;
    const afterCount = currentCount + newKeywordsCount;
    const improvement = currentCount > 0
      ? Math.round(((afterCount - currentCount) / currentCount) * 100)
      : 0;
    return {
      currentCount,
      newKeywordsCount,
      afterCount,
      improvement: improvementPercent ?? improvement,
    };
  }, [keywords, proposedKeywords, improvementPercent]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, filter: 'blur(4px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 overflow-hidden"
      >
        <div className="relative z-10 overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-4 h-4 text-slate-300 animate-pulse" />
            <span className="text-sm text-slate-300 uppercase tracking-wide">Słowa kluczowe</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
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
      transition={{ delay: 0.1 }}
      className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
    >
      <StripedPattern
        className={activeTab === 'proposed' ? "text-emerald-200" : "text-slate-300"}
        style={{
          zIndex: 0,
          left: '-10%',
          height: '130%',
          width: '100%',
          top: '-17%',
          transform: 'scale(1.1)',
          maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)',
          opacity: activeTab === 'proposed' ? 0.4 : 0.6,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: activeTab === 'proposed'
            ? 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(16, 185, 129, 0.3), transparent 40%)'
            : 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)',
        }}
      />

      <div className="relative z-10 overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
        {/* Header with tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#D4A574]" />
            <span className="text-sm text-slate-400 uppercase tracking-wide">Słowa kluczowe SEO</span>
          </div>
          <div className="flex items-center gap-2">
            {proposedStats.improvement > 0 && activeTab === 'proposed' && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{proposedStats.improvement}% widoczność
              </span>
            )}
            {onExportCSV && (
              <button
                onClick={onExportCSV}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Eksportuj do CSV"
              >
                <Download className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'current'
                ? 'bg-slate-100 text-slate-800 shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <EyeOff className="w-4 h-4" />
            Obecne
            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-full">
              {keywords.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('proposed')}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'proposed'
                ? 'bg-emerald-100 text-emerald-800 shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:bg-emerald-50'
            }`}
          >
            <Eye className="w-4 h-4" />
            Po optymalizacji
            {proposedKeywords.length > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-700 text-[10px] font-bold rounded-full">
                +{proposedKeywords.length}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Current keywords tab */}
          {activeTab === 'current' && (
            <motion.div
              key="current"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xl font-bold text-slate-800">{keywords.length}</p>
                  <p className="text-xs text-slate-500">słów kluczowych</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xl font-bold text-slate-800">{totalOccurrences}</p>
                  <p className="text-xs text-slate-500">wystąpień</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xl font-bold text-slate-800">{categoryDistribution.length}</p>
                  <p className="text-xs text-slate-500">kategorii</p>
                </div>
              </div>

              {/* Keywords list */}
              {keywords.length > 0 ? (
                <>
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Najczęstsze słowa kluczowe
                  </h4>
                  <div className="space-y-2 mb-4">
                    {displayedKeywords.map((keyword, idx) => {
                      const maxCount = keywords[0]?.count || 1;
                      const percentage = (keyword.count / maxCount) * 100;

                      return (
                        <div
                          key={keyword.keyword}
                          className="relative flex items-center gap-3 p-2.5 bg-slate-50/50 rounded-lg overflow-hidden"
                        >
                          {/* Progress bar background */}
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-emerald-100/50 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />

                          {/* Content */}
                          <div className="relative z-10 flex items-center gap-3 w-full">
                            <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">
                                {stripMarkdown(keyword.keyword)}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {keyword.categories.slice(0, 2).join(', ')}
                                {keyword.categories.length > 2 && ` +${keyword.categories.length - 2}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-emerald-600">{keyword.count}x</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Expand/collapse button */}
                  {keywords.length > 8 && (
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
                          Pokaż wszystkie ({keywords.length})
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <Hash className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Nie znaleziono słów kluczowych beauty</p>
                </div>
              )}

              {/* Category distribution - radar chart */}
              {categoryDistribution.length > 0 && (
                <>
                  <div className="border-t border-slate-100 my-4" />
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#D4A574]" />
                    Rozkład per kategoria
                  </h4>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        data={categoryDistribution.slice(0, 6).map(cat => ({
                          category: cat.categoryName.length > 12
                            ? cat.categoryName.substring(0, 12) + '…'
                            : cat.categoryName,
                          value: cat.keywordCount,
                          fullName: cat.categoryName,
                        }))}
                        margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
                      >
                        <PolarGrid
                          stroke="#e2e8f0"
                          strokeDasharray="3 3"
                        />
                        <PolarAngleAxis
                          dataKey="category"
                          tick={{ fontSize: 10, fill: '#64748b' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            padding: '8px 12px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [`${value} słów kluczowych`, 'Ilość']}
                        />
                        <Radar
                          dataKey="value"
                          stroke="#D4A574"
                          strokeWidth={2}
                          fill="#D4A574"
                          fillOpacity={0.3}
                          dot={{
                            r: 4,
                            fill: '#D4A574',
                            strokeWidth: 0,
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Proposed keywords tab */}
          {activeTab === 'proposed' && (
            <motion.div
              key="proposed"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Hero visibility improvement banner */}
              {proposedStats.improvement > 0 && (
                <div className="relative mb-6 p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                  </div>

                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium mb-1">Wzrost widoczności w Google</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white">+{proposedStats.improvement}%</span>
                        <TrendingUp className="w-8 h-8 text-emerald-200" />
                      </div>
                      <p className="text-emerald-100 text-xs mt-2">
                        Z {proposedStats.currentCount} do {proposedStats.afterCount} słów kluczowych
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                        <Eye className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* New keywords to add - PROMINENT section */}
              {proposedKeywords.length > 0 && (
                <div className="mb-6 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-bold text-emerald-800 flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Nowe słowa kluczowe
                    </h4>
                    <span className="px-3 py-1 bg-emerald-600 text-white text-sm font-bold rounded-full">
                      +{proposedKeywords.length}
                    </span>
                  </div>

                  {/* All keywords in one unified list */}
                  <div className="flex flex-wrap gap-2">
                    {proposedKeywords.slice(0, 20).map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {stripMarkdown(kw.keyword)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Transformation examples - before/after phrases */}
              {transformationKeywords.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-500" />
                    Przykłady ulepszonych fraz
                  </h4>
                  <div className="space-y-2">
                    {transformationKeywords.map((kw, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gradient-to-r from-slate-50 to-emerald-50 rounded-lg border border-slate-100"
                      >
                        <div className="flex items-start gap-2 text-sm">
                          <span className="text-slate-500 line-through flex-1">
                            {stripMarkdown(kw.beforePhrase || 'brak')}
                          </span>
                          <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-emerald-700 font-medium flex-1">
                            {stripMarkdown(kw.afterPhrase || kw.keyword)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {proposedKeywords.length === 0 && suggestions.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm">Brak propozycji słów kluczowych.</p>
                  <p className="text-xs text-slate-400 mt-1">Uruchom optymalizację, aby zobaczyć sugestie.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default KeywordReportCard;
