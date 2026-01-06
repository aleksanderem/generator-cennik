"use client";
import React from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  BarChart3,
  FileText,
  Tag,
  Search,
  Layers,
  DollarSign,
  MousePointerClick,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import type { EnhancedAuditReport, AuditIssue, QuickWin, ScoreBreakdown } from '../convex/auditHelpers';
import { BlurFade } from './ui/blur-fade';
import { StripedPattern } from './ui/striped-pattern';
import { AnimatedCircularProgressBar } from './ui/animated-circular-progress-bar';

interface EnhancedAuditReportTabProps {
  report: EnhancedAuditReport;
  onOptimizePricelist?: () => void;
}

// Dimension info for labels and icons
const dimensionInfo: Record<keyof ScoreBreakdown, { label: string; icon: React.ReactNode; maxScore: number; description: string }> = {
  completeness: {
    label: 'Kompletność',
    icon: <FileText size={14} />,
    maxScore: 15,
    description: 'Czy usługi mają opisy, czas trwania i ceny',
  },
  naming: {
    label: 'Nazewnictwo',
    icon: <Tag size={14} />,
    maxScore: 20,
    description: 'Jakość nazw usług - czy są zrozumiałe i komunikują korzyści',
  },
  descriptions: {
    label: 'Opisy',
    icon: <FileText size={14} />,
    maxScore: 20,
    description: 'Jakość opisów - czy mówią co klient zyska',
  },
  structure: {
    label: 'Struktura',
    icon: <Layers size={14} />,
    maxScore: 15,
    description: 'Logiczne grupowanie usług w kategorie',
  },
  pricing: {
    label: 'Strategia cen',
    icon: <DollarSign size={14} />,
    maxScore: 15,
    description: 'Pakiety, spójność cenowa, psychologia cen',
  },
  seo: {
    label: 'SEO',
    icon: <Search size={14} />,
    maxScore: 10,
    description: 'Słowa kluczowe w nazwach usług',
  },
  ux: {
    label: 'UX',
    icon: <MousePointerClick size={14} />,
    maxScore: 5,
    description: 'Nawigacja i doświadczenie użytkownika',
  },
};

// Get color based on percentage score
function getScoreColor(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 75) return 'bg-emerald-500';
  if (percentage >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

function getScoreTextColor(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 75) return 'text-emerald-600';
  if (percentage >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

// Severity badge
function SeverityBadge({ severity }: { severity: AuditIssue['severity'] }) {
  const colors = {
    critical: 'bg-rose-100 text-rose-700 border-rose-200',
    major: 'bg-amber-100 text-amber-700 border-amber-200',
    minor: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  const labels = {
    critical: 'Krytyczny',
    major: 'Ważny',
    minor: 'Drobny',
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[severity]}`}>
      {labels[severity]}
    </span>
  );
}

// Effort/Impact badge
function EffortBadge({ effort, impact }: { effort: QuickWin['effort']; impact: QuickWin['impact'] }) {
  const effortColors = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-rose-100 text-rose-700',
  };
  const effortLabels = {
    low: 'Szybka',
    medium: 'Średnia',
    high: 'Duża',
  };
  const impactLabels = {
    high: 'Duży wpływ',
    medium: 'Średni wpływ',
    low: 'Mały wpływ',
  };

  return (
    <div className="flex gap-1.5">
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${effortColors[effort]}`}>
        {effortLabels[effort]}
      </span>
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
        {impactLabels[impact]}
      </span>
    </div>
  );
}

const EnhancedAuditReportTab: React.FC<EnhancedAuditReportTabProps> = ({
  report,
  onOptimizePricelist,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="grid lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Main Content */}
        <div className="lg:col-span-8 space-y-8">

          {/* 1. Score Breakdown Card */}
          <BlurFade delay={0.05} inView>
            <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
              <StripedPattern
                className="text-slate-300"
                style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
              />
              <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-[#D4A574]" />
                  <span className="text-sm text-slate-400 uppercase tracking-wide">Wynik audytu</span>
                </div>

                <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                  {/* Total Score */}
                  <div className="flex items-center gap-4">
                    <AnimatedCircularProgressBar
                      value={report.totalScore}
                      max={100}
                      min={0}
                      gaugePrimaryColor={report.totalScore >= 60 ? "#10b981" : report.totalScore >= 40 ? "#f59e0b" : "#ef4444"}
                      gaugeSecondaryColor="#e2e8f0"
                      className="size-28 text-2xl"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{report.totalScore}/100</h3>
                      <p className="text-sm text-slate-500">Wynik ogólny</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {report.summary}
                    </p>
                  </div>
                </div>

                {/* Dimension Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Wyniki w wymiarach</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.entries(report.scoreBreakdown) as [keyof ScoreBreakdown, number][]).map(([key, value]) => {
                      const info = dimensionInfo[key];
                      return (
                        <div key={key} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg group/item">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            {info.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-slate-700">{info.label}</span>
                              <span className={`text-sm font-bold ${getScoreTextColor(value, info.maxScore)}`}>
                                {value}/{info.maxScore}
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${getScoreColor(value, info.maxScore)}`}
                                style={{ width: `${(value / info.maxScore) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>

          {/* 2. Top Issues */}
          <BlurFade delay={0.15} inView>
            <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-rose-200/50 overflow-hidden">
              <StripedPattern
                className="text-slate-300"
                style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
              />
              <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span className="text-sm text-slate-400 uppercase tracking-wide">Problemy do naprawienia</span>
                  <span className="ml-auto text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    {report.topIssues.length} znalezionych
                  </span>
                </div>

                {report.topIssues.length > 0 ? (
                  <div className="space-y-4">
                    {report.topIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <SeverityBadge severity={issue.severity} />
                              <span className="text-xs text-slate-400">{issue.affectedCount} usług dotyczy</span>
                            </div>
                            <h4 className="font-semibold text-slate-800 mb-1">{issue.issue}</h4>
                            <p className="text-sm text-slate-500 mb-2">{issue.impact}</p>
                            <div className="bg-white p-2 rounded-lg border border-slate-200 text-sm">
                              <span className="text-slate-400 text-xs uppercase tracking-wide">Przykład:</span>
                              <p className="text-slate-600">{issue.example}</p>
                            </div>
                            <div className="mt-2 flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                              <span>{issue.fix}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-medium">Brak krytycznych problemów</p>
                    <p className="text-sm">Twój cennik jest dobrze zorganizowany!</p>
                  </div>
                )}
              </div>
            </div>
          </BlurFade>

          {/* 3. Transformations (Before/After) */}
          {report.transformations.length > 0 && (
            <BlurFade delay={0.25} inView>
              <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
                <StripedPattern
                  className="text-slate-300"
                  style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
                />
                <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-[#D4A574]" />
                    <span className="text-sm text-slate-400 uppercase tracking-wide">Propozycje ulepszeń</span>
                  </div>

                  <div className="space-y-4">
                    {report.transformations.map((t, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-slate-500 uppercase">
                            {t.type === 'name' ? 'Nazwa' : 'Opis'}
                          </span>
                          <span className="text-[10px] font-bold text-[#D4A574] bg-[#D4A574]/10 px-1.5 py-0.5 rounded">
                            +{t.impactScore} wpływ
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                            <span className="text-xs text-rose-500 font-medium mb-1 block">Przed</span>
                            <p className="text-sm text-rose-800 line-through">{t.before}</p>
                          </div>
                          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                            <span className="text-xs text-emerald-500 font-medium mb-1 block">Po</span>
                            <p className="text-sm text-emerald-800 font-medium">{t.after}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{t.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BlurFade>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div className="lg:col-span-4 space-y-6">

          {/* Quick Wins */}
          <BlurFade delay={0.1} inView>
            <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-emerald-200/50 overflow-hidden">
              <StripedPattern
                className="text-slate-300"
                style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
              />
              <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-slate-400 uppercase tracking-wide">Quick Wins</span>
                </div>

                {report.quickWins.length > 0 ? (
                  <div className="space-y-3">
                    {report.quickWins.map((win, idx) => (
                      <div key={idx} className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <div className="flex items-start gap-2 mb-2">
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-sm font-medium text-slate-700">{win.action}</p>
                        </div>
                        <EffortBadge effort={win.effort} impact={win.impact} />
                        {win.example && (
                          <p className="text-xs text-slate-500 mt-2 italic">{win.example}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Brak szybkich ulepszeń do wdrożenia.
                  </p>
                )}
              </div>
            </div>
          </BlurFade>

          {/* Stats */}
          <BlurFade delay={0.2} inView>
            <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
              <StripedPattern
                className="text-slate-300"
                style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
              />
              <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400 uppercase tracking-wide">Statystyki</span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Usług</span>
                    <span className="font-bold text-slate-800">{report.stats.totalServices}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Kategorii</span>
                    <span className="font-bold text-slate-800">{report.stats.totalCategories}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Z opisem</span>
                    <span className={`font-bold ${report.stats.servicesWithDescription / report.stats.totalServices > 0.5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {report.stats.servicesWithDescription}/{report.stats.totalServices}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Z czasem trwania</span>
                    <span className={`font-bold ${report.stats.servicesWithDuration / report.stats.totalServices > 0.5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {report.stats.servicesWithDuration}/{report.stats.totalServices}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">Konkretna cena</span>
                    <span className={`font-bold ${report.stats.servicesWithFixedPrice / report.stats.totalServices > 0.8 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {report.stats.servicesWithFixedPrice}/{report.stats.totalServices}
                    </span>
                  </div>

                  {report.stats.duplicateNames.length > 0 && (
                    <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="flex items-center gap-1 text-amber-700 text-xs font-medium mb-1">
                        <AlertCircle size={12} />
                        Duplikaty nazw
                      </div>
                      <p className="text-xs text-amber-600">
                        {report.stats.duplicateNames.slice(0, 3).join(', ')}
                        {report.stats.duplicateNames.length > 3 && ` +${report.stats.duplicateNames.length - 3} więcej`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </BlurFade>

          {/* SEO Keywords */}
          {report.missingSeoKeywords.length > 0 && (
            <BlurFade delay={0.3} inView>
              <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-blue-200/50 overflow-hidden">
                <StripedPattern
                  className="text-slate-300"
                  style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
                />
                <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-slate-400 uppercase tracking-wide">Brakujące SEO</span>
                  </div>

                  <div className="space-y-2">
                    {report.missingSeoKeywords.map((kw, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${kw.searchVolume === 'high' ? 'bg-rose-500' : kw.searchVolume === 'medium' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                        <span className="font-medium text-slate-700">{kw.keyword}</span>
                        <span className="text-xs text-slate-400 ml-auto">{kw.suggestedPlacement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BlurFade>
          )}

          {/* Industry Comparison */}
          <BlurFade delay={0.4} inView>
            <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
              <StripedPattern
                className="text-slate-300"
                style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
              />
              <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-[#D4A574]" />
                  <span className="text-sm text-slate-400 uppercase tracking-wide">Benchmark</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Twój wynik</span>
                    <span className="text-lg font-bold text-slate-800">{report.industryComparison.yourScore}</span>
                  </div>
                  <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400"
                      style={{ width: '100%' }}
                    />
                    <div
                      className="absolute top-0 w-1 h-full bg-slate-600"
                      style={{ left: `${report.industryComparison.industryAverage}%` }}
                      title={`Średnia: ${report.industryComparison.industryAverage}`}
                    />
                    <div
                      className="absolute top-0 w-3 h-3 bg-white border-2 border-slate-800 rounded-full shadow"
                      style={{ left: `${Math.min(97, report.industryComparison.yourScore)}%`, transform: 'translateX(-50%)' }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0</span>
                    <span>Średnia: {report.industryComparison.industryAverage}</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>

          {/* CTA */}
          {onOptimizePricelist && (
            <BlurFade delay={0.5} inView>
              <button
                onClick={onOptimizePricelist}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#D4A574] to-[#C9956C] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
              >
                <Sparkles size={18} />
                Zoptymalizuj cennik automatycznie
                <ArrowRight size={18} />
              </button>
            </BlurFade>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedAuditReportTab;
