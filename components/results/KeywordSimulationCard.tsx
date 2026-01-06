"use client";
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  ArrowRight,
  Sparkles,
  Search,
  Eye,
  EyeOff,
  Plus,
  Minus,
} from 'lucide-react';
import { StripedPattern } from '../ui/striped-pattern';
import type { ServiceTransformation, MissingSeoKeyword } from '../../convex/auditHelpers';

// Common SEO keywords for beauty industry
const BEAUTY_SEO_KEYWORDS = [
  // Full phrases (high value)
  "depilacja laserowa", "mezoterapia igłowa", "kwas hialuronowy", "botox toksyna botulinowa",
  "lifting twarzy", "peeling chemiczny", "mikrodermabrazja", "redukcja cellulitu",
  "modelowanie sylwetki", "usuwanie zmarszczek", "powiększanie ust", "wypełnianie bruzd",
  // Medium phrases
  "odmładzanie skóry", "nawilżanie twarzy", "oczyszczanie twarzy", "manicure hybrydowy",
  "pedicure leczniczy", "masaż relaksacyjny", "epilacja woskiem", "henna brwi",
  // Common short keywords (lower SEO value)
  "laser", "botox", "peeling", "lifting", "masaż", "manicure", "pedicure",
];

interface KeywordSimulationCardProps {
  /** Current keywords found in the pricelist */
  currentKeywords: Array<{ keyword: string; count: number }>;
  /** Transformations from V2 audit report */
  transformations: ServiceTransformation[];
  /** Missing SEO keywords from V2 audit report */
  missingSeoKeywords: MissingSeoKeyword[];
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Extracts potential keywords from text
 */
function extractKeywordsFromText(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const found: string[] = [];

  for (const keyword of BEAUTY_SEO_KEYWORDS) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      found.push(keyword);
    }
  }

  return found;
}

/**
 * KeywordSimulationCard - Shows before/after keyword simulation
 * Demonstrates how optimization will improve SEO visibility
 */
const KeywordSimulationCard: React.FC<KeywordSimulationCardProps> = ({
  currentKeywords,
  transformations,
  missingSeoKeywords,
  isLoading = false,
}) => {
  // Calculate simulated keywords after applying transformations
  const simulation = useMemo(() => {
    // Current keywords (normalized)
    const currentSet = new Set(currentKeywords.map(k => k.keyword.toLowerCase()));

    // Keywords that would be added from transformations
    const addedKeywords: Array<{ keyword: string; source: string }> = [];
    const improvedPhrases: Array<{ before: string; after: string; keywords: string[] }> = [];

    transformations.forEach(t => {
      const beforeKeywords = extractKeywordsFromText(t.before);
      const afterKeywords = extractKeywordsFromText(t.after);

      // Find new keywords introduced by transformation
      const newKeywords = afterKeywords.filter(k =>
        !beforeKeywords.includes(k) && !currentSet.has(k.toLowerCase())
      );

      if (newKeywords.length > 0) {
        newKeywords.forEach(k => {
          if (!addedKeywords.find(ak => ak.keyword.toLowerCase() === k.toLowerCase())) {
            addedKeywords.push({ keyword: k, source: t.serviceName });
          }
        });

        // Track the phrase improvement
        if (beforeKeywords.length < afterKeywords.length) {
          improvedPhrases.push({
            before: t.before,
            after: t.after,
            keywords: newKeywords,
          });
        }
      }
    });

    // Keywords from missingSeoKeywords that would be added
    const suggestedToAdd = missingSeoKeywords.filter(mk =>
      !currentSet.has(mk.keyword.toLowerCase().replace(/"/g, ''))
    );

    // Calculate improvement metrics
    const currentCount = currentKeywords.length;
    const afterCount = currentCount + addedKeywords.length;
    const improvementPercent = currentCount > 0
      ? Math.round(((afterCount - currentCount) / currentCount) * 100)
      : 0;

    return {
      currentCount,
      afterCount,
      addedKeywords,
      improvedPhrases: improvedPhrases.slice(0, 5), // Top 5 examples
      suggestedToAdd: suggestedToAdd.slice(0, 5),
      improvementPercent,
    };
  }, [currentKeywords, transformations, missingSeoKeywords]);

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
            <span className="text-sm text-slate-300 uppercase tracking-wide">Symulacja zmian</span>
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
      transition={{ delay: 0.2 }}
      className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-emerald-300/50 overflow-hidden"
    >
      <StripedPattern
        className="text-emerald-200"
        style={{
          zIndex: 0,
          left: '-10%',
          height: '130%',
          width: '100%',
          top: '-17%',
          transform: 'scale(1.1)',
          maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)',
          opacity: 0.4,
        }}
      />

      <div className="relative z-10 overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-slate-400 uppercase tracking-wide">Symulacja po optymalizacji</span>
          </div>
          {simulation.improvementPercent > 0 && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{simulation.improvementPercent}% widoczność
            </span>
          )}
        </div>

        {/* Before/After comparison */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Before */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <EyeOff className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase">Teraz</span>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-700">{simulation.currentCount}</p>
              <p className="text-xs text-slate-400 mt-1">słów kluczowych</p>
            </div>
          </div>

          {/* After */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600 uppercase">Po zmianach</span>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600">{simulation.afterCount}</p>
              <p className="text-xs text-emerald-500 mt-1">słów kluczowych</p>
            </div>
          </div>
        </div>

        {/* Examples of phrase improvements */}
        {simulation.improvedPhrases.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-500" />
              Przykłady ulepszeń fraz
            </h4>
            <div className="space-y-2">
              {simulation.improvedPhrases.map((phrase, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gradient-to-r from-slate-50 to-emerald-50 rounded-lg border border-slate-100"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 line-through truncate max-w-[40%]">
                      {phrase.before.length > 30 ? phrase.before.slice(0, 30) + '...' : phrase.before}
                    </span>
                    <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-emerald-700 font-medium truncate max-w-[40%]">
                      {phrase.after.length > 30 ? phrase.after.slice(0, 30) + '...' : phrase.after}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {phrase.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full"
                      >
                        +{kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New keywords that would be added */}
        {simulation.addedKeywords.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              Nowe słowa kluczowe
            </h4>
            <div className="flex flex-wrap gap-2">
              {simulation.addedKeywords.slice(0, 10).map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {kw.keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggested keywords from AI */}
        {simulation.suggestedToAdd.length > 0 && (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Sugerowane do dodania
            </h4>
            <div className="space-y-2">
              {simulation.suggestedToAdd.map((kw, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    kw.searchVolume === 'high'
                      ? 'bg-emerald-100 text-emerald-700'
                      : kw.searchVolume === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {kw.searchVolume === 'high' ? 'WYSOKA' : kw.searchVolume === 'medium' ? 'ŚREDNIA' : 'NISKA'}
                  </span>
                  <div>
                    <span className="font-medium text-slate-700">{kw.keyword.replace(/"/g, '')}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{kw.suggestedPlacement}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {simulation.addedKeywords.length === 0 && simulation.suggestedToAdd.length === 0 && (
          <div className="text-center py-4 text-slate-500">
            <p className="text-sm">Brak danych do symulacji. Uruchom optymalizację, aby zobaczyć zmiany.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default KeywordSimulationCard;
