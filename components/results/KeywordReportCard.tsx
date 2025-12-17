"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Hash,
  TrendingUp,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Layers,
  Download,
  Sparkles,
} from 'lucide-react';
import { StripedPattern } from '../ui/striped-pattern';
import type { KeywordReportCardProps, KeywordData, CategoryDistribution } from './types';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

/**
 * KeywordReportCard - Displays keyword analysis results from audit
 *
 * Features:
 * - Top keywords with counts and category distribution
 * - Category-wise keyword distribution chart
 * - AI-generated SEO suggestions
 * - Expandable keyword list
 * - Export to CSV functionality
 */
const KeywordReportCard: React.FC<KeywordReportCardProps> = ({
  keywords,
  categoryDistribution,
  suggestions,
  onExportCSV,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedKeywords = isExpanded ? keywords : keywords.slice(0, 8);

  // Calculate total keyword occurrences
  const totalOccurrences = keywords.reduce((sum, k) => sum + k.count, 0);

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
            <Hash className="w-4 h-4 text-[#D4A574]" />
            <span className="text-sm text-slate-400 uppercase tracking-wide">Słowa kluczowe SEO</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
              {keywords.length} znalezionych
            </span>
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
                          {keyword.keyword}
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

        {/* Category distribution chart */}
        {categoryDistribution.length > 0 && (
          <>
            <div className="border-t border-slate-100 my-4" />
            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D4A574]" />
              Rozkład per kategoria
            </h4>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Doughnut Chart */}
              <div className="w-48 h-48 flex-shrink-0">
                <Doughnut
                  data={{
                    labels: categoryDistribution.slice(0, 6).map(cat => cat.categoryName),
                    datasets: [{
                      data: categoryDistribution.slice(0, 6).map(cat => cat.keywordCount),
                      backgroundColor: [
                        '#D4A574',
                        '#B8860B',
                        '#CD853F',
                        '#DEB887',
                        '#F5DEB3',
                        '#FAEBD7',
                      ],
                      borderColor: '#ffffff',
                      borderWidth: 2,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { size: 12, weight: 'bold' },
                        bodyFont: { size: 11 },
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                          label: (context) => {
                            const total = categoryDistribution.reduce((sum, cat) => sum + cat.keywordCount, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.parsed} słów (${percentage}%)`;
                          },
                        },
                      },
                    },
                    cutout: '60%',
                  }}
                />
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-1.5">
                {categoryDistribution.slice(0, 6).map((cat, idx) => {
                  const colors = ['#D4A574', '#B8860B', '#CD853F', '#DEB887', '#F5DEB3', '#FAEBD7'];
                  const total = categoryDistribution.reduce((sum, c) => sum + c.keywordCount, 0);
                  const percentage = ((cat.keywordCount / total) * 100).toFixed(1);
                  return (
                    <div key={cat.categoryName} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colors[idx] }}
                      />
                      <span className="text-slate-600 truncate flex-1">{cat.categoryName}</span>
                      <span className="text-slate-500 font-medium">{cat.keywordCount}</span>
                      <span className="text-slate-400 text-xs">({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <>
            <div className="border-t border-slate-100 my-4" />
            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Sugestie AI
            </h4>
            <div className="space-y-2">
              {suggestions.slice(0, 5).map((suggestion, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 bg-amber-50/50 rounded-lg border border-amber-100"
                >
                  <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-600 leading-relaxed">{suggestion}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default KeywordReportCard;
