"use client";
import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Sparkles, Layers } from 'lucide-react';
import { AnimatedCircularProgressBar } from '../ui/animated-circular-progress-bar';
import { StripedPattern } from '../ui/striped-pattern';
import type { QualityScoreCardProps } from './types';

/**
 * QualityScoreCard - Displays quality score, sales potential, and stats
 *
 * Features:
 * - Animated circular progress bar for score
 * - Sales potential gauge bar
 * - Stats grid (categories, changes, services)
 * - Hover effects with radial gradient
 */
const QualityScoreCard: React.FC<QualityScoreCardProps> = ({
  qualityScore,
  stats,
  salesPotentialDescription,
  variant = 'after',
}) => {
  const isBefore = variant === 'before';

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'Wysoka';
    if (score >= 60) return 'Dobra';
    return 'Średnia';
  };

  const getSalesPotentialText = (score: number) => {
    if (isBefore) {
      // Before optimization - show potential for improvement
      if (score >= 80) return 'Wysoki. Cennik jest dobrze przygotowany pod sprzedaż.';
      if (score >= 60) return 'Średni. Po wdrożeniu rekomendacji potencjał może znacznie wzrosnąć.';
      return 'Niski do Średniego. Cennik wymaga optymalizacji - wdrożenie rekomendacji znacznie zwiększy potencjał sprzedażowy.';
    }
    // After optimization
    if (score >= 80) return 'Wysoki. Cennik jest bardzo dobrze zoptymalizowany pod sprzedaż.';
    if (score >= 60) return 'Średni do Wysokiego. Po wdrożeniu zmian potencjał może wzrosnąć do Wysokiego.';
    return 'Niski do Średniego. Po wdrożeniu zmian potencjał może wzrosnąć do Wysokiego.';
  };

  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(4px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ delay: 0.05 }}
      className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
    >
      <StripedPattern
        className="text-slate-300"
        style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
      <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
      <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
        {/* Quality Score Section */}
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400 uppercase tracking-wide">Jakość</span>
          <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
            {getQualityLabel(qualityScore)}
          </span>
        </div>
        <div className="flex items-center gap-6 mb-6">
          <AnimatedCircularProgressBar
            value={qualityScore}
            max={100}
            min={0}
            gaugePrimaryColor="#10b981"
            gaugeSecondaryColor="#e2e8f0"
            className="size-28 text-2xl"
          />
          <div className="flex-1">
            <h3 className="font-sans text-lg font-semibold tracking-tight text-slate-800 mb-1">
              Wynik jakości
            </h3>
            <p className="text-sm text-slate-500 mb-3">
              {isBefore
                ? 'Ocena cennika przed optymalizacją'
                : 'Cennik zoptymalizowany pod kątem sprzedaży i SEO'}
            </p>
            {!isBefore && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-600 font-medium">Po optymalizacji</span>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 my-2" />

        {/* Sales Potential Section */}
        <div className="flex items-center gap-2 mb-4 mt-4">
          <Sparkles className="w-4 h-4 text-[#D4A574]" />
          <span className="text-sm text-slate-400 uppercase tracking-wide">Potencjał Sprzedażowy</span>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          {salesPotentialDescription || getSalesPotentialText(qualityScore)}
        </p>

        {/* Gradient gauge bar */}
        <div className="relative mb-3">
          <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500 overflow-hidden" />
          {/* Marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-700 rounded-full shadow-lg transition-all duration-700"
            style={{ left: `calc(${qualityScore}% - 8px)` }}
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between text-[10px] font-medium text-slate-400 mb-4">
          <span>NISKI</span>
          <span>ŚREDNI</span>
          <span>WYSOKI</span>
        </div>

        {/* Improvement badge */}
        {isBefore ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-700 font-medium">
              Możliwy wzrost: +{Math.min(50, Math.round((100 - qualityScore) * 0.7))}% po optymalizacji
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-700 font-medium">
              Po optymalizacji: +{Math.min(50, Math.round((100 - qualityScore) * 0.7))}% potencjał
            </span>
          </div>
        )}

        {/* Stats summary */}
        <div className="mt-6 bg-slate-50 rounded-2xl p-5 flex flex-col justify-evenly">
          <div className="flex items-center justify-center gap-2 mb-5">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400 uppercase tracking-wide">Statystyki</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {/* Categories */}
            <div className="text-center p-3">
              <div className="flex items-center justify-center gap-1.5">
                <p className="text-2xl font-bold text-slate-800">{stats.categories.count}</p>
                {stats.categories.delta !== undefined && stats.categories.delta !== 0 && (
                  <span className={`flex items-center text-sm font-semibold ${stats.categories.delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    <TrendingUp className={`w-3 h-3 mr-0.5 ${stats.categories.delta < 0 ? 'rotate-180' : ''}`} />
                    {stats.categories.delta > 0 ? '+' : ''}{stats.categories.delta}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">kategorii</p>
            </div>
            {/* Changes */}
            <div className="text-center p-3">
              <p className="text-2xl font-bold text-slate-800">{stats.changes.count}</p>
              <p className="text-sm text-slate-500 mt-0.5">zmian</p>
            </div>
            {/* Services */}
            <div className="text-center p-3">
              <div className="flex items-center justify-center gap-1.5">
                <p className="text-2xl font-bold text-slate-800">{stats.services.count}</p>
                {stats.services.delta !== undefined && stats.services.delta !== 0 && (
                  <span className={`flex items-center text-sm font-semibold ${stats.services.delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    <TrendingUp className={`w-3 h-3 mr-0.5 ${stats.services.delta < 0 ? 'rotate-180' : ''}`} />
                    {stats.services.delta > 0 ? '+' : ''}{stats.services.delta}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">usług</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QualityScoreCard;
