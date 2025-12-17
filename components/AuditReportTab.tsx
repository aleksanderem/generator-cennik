"use client";
import React from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  ArrowRightCircle,
  ArrowRight,
  Lightbulb,
  Search,
  MousePointerClick,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { AuditResult, GrowthTip } from '../types';
import { BlurFade } from './ui/blur-fade';
import { RainbowButton } from './ui/rainbow-button';
import { StripedPattern } from './ui/striped-pattern';

interface AuditReportTabProps {
  auditReport: AuditResult;
  onEditPricelist?: () => void;
  /** Whether the pricelist has already been optimized */
  isPricelistOptimized?: boolean;
  /** Called when user wants to start optimization */
  onOptimizePricelist?: () => void;
}

// Score gauge component
const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-600';
    if (s >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-slate-100"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          className={getScoreColor(score)}
          strokeDasharray={`${score}, 100`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-serif font-bold ${getScoreColor(score)}`}>
          {score}
        </span>
        <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Score</span>
      </div>
    </div>
  );
};

// Growth tip icon helper
const getTipIcon = (category: string) => {
  switch (category) {
    case 'SEO': return <Search size={16} />;
    case 'Konwersja': return <MousePointerClick size={16} />;
    case 'Retencja': return <Repeat size={16} />;
    default: return <Lightbulb size={16} />;
  }
};

const getImpactColor = (impact: string) => {
  if (impact === 'Wysoki') return 'bg-rose-100 text-rose-700 border-rose-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
};

const AuditReportTab: React.FC<AuditReportTabProps> = ({
  auditReport,
  onEditPricelist,
  isPricelistOptimized = true,
  onOptimizePricelist,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="grid lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Analysis */}
        <div className="lg:col-span-8 space-y-8">

          {/* 1. Score & General Feedback */}
          <BlurFade delay={0.1} inView>
            <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
              <StripedPattern
                className="text-slate-300"
                style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
              <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <ScoreGauge score={auditReport.overallScore} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-[#D4A574]" />
                      <span className="text-sm text-slate-400 uppercase tracking-wide">Werdykt Audytora</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed italic border-l-4 border-[#D4A574]/30 pl-4 py-1">
                      "{auditReport.generalFeedback}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>

          {/* 2. Holistic Growth Strategy */}
          {auditReport.growthTips && auditReport.growthTips.length > 0 && (
            <BlurFade delay={0.2} inView>
              <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
                <StripedPattern
                  className="text-slate-300"
                  style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
                />
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="w-4 h-4 text-[#D4A574]" />
                    <span className="text-sm text-slate-400 uppercase tracking-wide">Strategia Naturalnego Wzrostu</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {auditReport.growthTips.map((tip, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-[#D4A574]/30 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                            {getTipIcon(tip.category)}
                            {tip.category}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getImpactColor(tip.impact)}`}>
                            {tip.impact} Impact
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2 text-sm md:text-base">{tip.title}</h4>
                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                          {tip.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BlurFade>
          )}

          {/* 3. Before vs After Comparison */}
          {auditReport.beforeAfter && (
            <BlurFade delay={0.3} inView>
              <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
                <StripedPattern
                  className="text-slate-300"
                  style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
                />
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <div className="flex items-center gap-2 mb-5">
                    <ArrowRightCircle className="w-4 h-4 text-[#D4A574]" />
                    <span className="text-sm text-slate-400 uppercase tracking-wide">Transformacja Struktury</span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 relative">
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full items-center justify-center z-10 text-slate-400 shadow-sm">
                      <ArrowRight size={16} />
                    </div>

                    <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                      <div className="flex items-center gap-2 mb-3 text-rose-700 font-bold text-xs uppercase tracking-wider">
                        <XCircle size={14} /> Przed (Błędy)
                      </div>
                      <pre className="text-xs text-rose-900/70 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {auditReport.beforeAfter.before}
                      </pre>
                    </div>

                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-2 mb-3 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                        <CheckCircle2 size={14} /> Po (Poprawa)
                      </div>
                      <pre className="text-xs text-emerald-900/70 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {auditReport.beforeAfter.after}
                      </pre>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3 text-sm text-slate-600 bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                    <Lightbulb className="shrink-0 text-amber-500" size={18} />
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">Dlaczego to lepsze?</span>
                      {auditReport.beforeAfter.explanation}
                    </div>
                  </div>
                </div>
              </div>
            </BlurFade>
          )}

          {/* 4. Strengths & Weaknesses Grid */}
          <BlurFade delay={0.4} inView>
            <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
              <StripedPattern
                className="text-slate-300"
                style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
              <div className="relative z-10 grid md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <ThumbsUp size={18} className="text-emerald-500" />
                    Mocne Strony
                  </h3>
                  <ul className="space-y-3">
                    {auditReport.strengths?.map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-slate-600">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item.replace(/^✅ /, '')}</span>
                      </li>
                    ))}
                    {!auditReport.strengths?.length && <li className="text-slate-400 text-sm">Brak danych.</li>}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <h3 className="font-bold text-rose-900 mb-4 flex items-center gap-2">
                    <ThumbsDown size={18} className="text-rose-500" />
                    Błędy i Konsekwencje
                  </h3>
                  <div className="space-y-4">
                    {auditReport.weaknesses?.map((item, idx) => (
                      <div key={idx} className="text-sm border-b border-rose-50 last:border-0 pb-3 last:pb-0">
                        <div className="flex gap-2 font-medium text-rose-800 mb-1">
                          <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                          {item.point}
                        </div>
                        <p className="text-slate-500 pl-6 text-xs leading-relaxed">
                          <span className="italic">{item.consequence}</span>
                        </p>
                      </div>
                    ))}
                    {!auditReport.weaknesses?.length && <p className="text-slate-400 text-sm">Brak danych.</p>}
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>
        </div>

        {/* RIGHT COLUMN: Action Plan */}
        <div className="lg:col-span-4 space-y-6">

          {/* Sales Potential Card */}
          <BlurFade delay={0.2} inView>
            <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
              <StripedPattern
                className="text-slate-300"
                style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
              <div className="relative z-10 bg-indigo-900 text-white p-6 rounded-xl shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)] overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                    <TrendingUp className="text-emerald-400" />
                    Potencjał Sprzedażowy
                  </h3>
                  <p className="text-indigo-100 text-sm mb-4 leading-relaxed opacity-90">
                    {auditReport.salesPotential || "Brak danych o potencjale."}
                  </p>

                  <div className="w-full bg-indigo-800/50 rounded-full h-2 mb-1">
                    <div
                      className="bg-emerald-400 h-2 rounded-full transition-all duration-1000 group-hover:bg-emerald-300"
                      style={{ width: auditReport.salesPotential?.includes('Wysoki') ? '85%' : auditReport.salesPotential?.includes('Średni') ? '55%' : '25%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] uppercase font-bold text-indigo-300">
                    <span>Niski</span>
                    <span>Wysoki</span>
                  </div>
                </div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-40 group-hover:opacity-50 transition-opacity"></div>
              </div>
            </div>
          </BlurFade>

          {/* Recommendations List */}
          <BlurFade delay={0.3} inView>
            <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
              <StripedPattern
                className="text-slate-300"
                style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
              <div className="relative z-10 bg-white p-6 rounded-xl shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                <h3 className="font-bold text-slate-800 mb-4">Plan Naprawczy (Krok po Kroku)</h3>
                <ul className="space-y-3">
                  {auditReport.recommendations?.map((rec, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="font-bold text-[#D4A574] font-serif text-lg leading-none">{idx + 1}.</span>
                      <span className="leading-snug">{rec}</span>
                    </li>
                  ))}
                  {!auditReport.recommendations?.length && (
                    <li className="text-slate-400 text-sm">Brak rekomendacji.</li>
                  )}
                </ul>
              </div>
            </div>
          </BlurFade>

          {/* CTA - Edit pricelist or optimize */}
          <BlurFade delay={0.4} inView>
            <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden sticky top-24">
              <StripedPattern
                className="text-slate-300"
                style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
              <div className="relative z-10 bg-white p-6 rounded-xl shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)] text-center">
                {isPricelistOptimized ? (
                  <>
                    <h3 className="font-bold text-slate-800 mb-2">Gotowy na zmiany?</h3>
                    <p className="text-xs text-slate-500 mb-6">
                      Przejdź do edytora, aby dostosować cennik PRO i wygenerować kod HTML.
                    </p>
                    {onEditPricelist && (
                      <RainbowButton
                        onClick={onEditPricelist}
                        className="w-full"
                      >
                        Edytuj cennik PRO <ArrowRight size={18} />
                      </RainbowButton>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-slate-800 mb-2">Zastosuj rekomendacje</h3>
                    <p className="text-xs text-slate-500 mb-6">
                      Zoptymalizuj cennik na podstawie wskazówek z audytu i wygeneruj profesjonalny cennik PRO.
                    </p>
                    {onOptimizePricelist && (
                      <RainbowButton
                        onClick={onOptimizePricelist}
                        className="w-full"
                      >
                        Zoptymalizuj cennik <ArrowRight size={18} />
                      </RainbowButton>
                    )}
                  </>
                )}
              </div>
            </div>
          </BlurFade>
        </div>
      </div>
    </motion.div>
  );
};

export default AuditReportTab;
