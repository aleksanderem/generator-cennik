import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, AlertTriangle, Flame, Star, ArrowRight, Settings2, Lightbulb, Check, Loader2, Layers } from 'lucide-react';
import CategoryTree from './CategoryTree';
import { PricingData, CategoryConfig, PricelistCategoryConfig, CategorySuggestionsResult, CategorySuggestion } from '../types';
import { suggestCategories } from '../services/geminiService';
import { Modal, ModalTrigger, ModalBody, ModalContent } from './ui/animated-modal';
import { RainbowButton } from './ui/rainbow-button';

interface CategoryConfigStepProps {
  pricingData: PricingData;
  onConfigComplete: (config: PricelistCategoryConfig) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CategoryConfigStep({
  pricingData,
  onConfigComplete,
  onCancel,
  isLoading = false,
}: CategoryConfigStepProps) {
  // Initialize categories from pricingData
  const initialCategories: CategoryConfig[] = useMemo(() => {
    return pricingData.categories.map((cat, index) => ({
      categoryName: cat.categoryName,
      order: index,
      originalIndex: index,
      isAggregation: false,
    }));
  }, [pricingData]);

  const [categories, setCategories] = useState<CategoryConfig[]>(initialCategories);
  const [aggregationMode, setAggregationMode] = useState<'copy' | 'move'>('move');
  const [enablePromotions, setEnablePromotions] = useState(false);
  const [enableBestsellers, setEnableBestsellers] = useState(false);

  // AI suggestions state
  const [suggestions, setSuggestions] = useState<CategorySuggestionsResult | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());

  // Fetch AI suggestions on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      setSuggestionsLoading(true);
      setSuggestionsError(null);
      try {
        const result = await suggestCategories(pricingData);
        setSuggestions(result);
      } catch (error) {
        console.error('Error fetching category suggestions:', error);
        setSuggestionsError('Nie udało się pobrać sugestii AI');
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, [pricingData]);

  // Apply suggestion - add new category to the list
  const applySuggestion = (suggestion: CategorySuggestion, suggestionIndex: number) => {
    // Check if at least 1 service matches (requirement: even 1 service is enough)
    if (suggestion.matchingServices.length >= 1) {
      // Add new category at the end of the list
      const newCategory: CategoryConfig = {
        categoryName: suggestion.name,
        order: categories.length, // Add at the end
        originalIndex: -100 - suggestionIndex, // Negative index to mark as AI-suggested
        isAggregation: false,
      };

      setCategories(prev => [...prev, newCategory]);
      setAppliedSuggestions(prev => new Set([...prev, suggestionIndex]));
    }
  };

  // Count totals
  const totalCategories = pricingData.categories.length;
  const totalServices = pricingData.categories.reduce((acc, cat) => acc + cat.services.length, 0);

  // Count promo and bestseller services
  const promoCount = pricingData.categories.reduce((count, cat) =>
    count + cat.services.filter(s => s.isPromo).length, 0
  );
  const bestsellerCount = pricingData.categories.reduce((count, cat) =>
    count + cat.services.filter(s => s.tags?.includes('Bestseller')).length, 0
  );

  // Build display categories (including aggregations if enabled)
  const displayCategories = useMemo(() => {
    const result: CategoryConfig[] = [...categories];

    // Add aggregation categories if enabled
    if (enablePromotions && promoCount > 0) {
      result.push({
        categoryName: '🔥 Promocje',
        order: -2, // Always at top
        originalIndex: -1,
        isAggregation: true,
        aggregationType: 'promotions',
      });
    }

    if (enableBestsellers && bestsellerCount > 0) {
      result.push({
        categoryName: '⭐ Bestsellery',
        order: -1, // Just below promotions
        originalIndex: -2,
        isAggregation: true,
        aggregationType: 'bestsellers',
      });
    }

    return result;
  }, [categories, enablePromotions, enableBestsellers, promoCount, bestsellerCount]);

  // Handle move up
  const handleMoveUp = (index: number) => {
    const category = categories[index];
    if (category.isAggregation) return; // Can't move aggregations

    setCategories(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const currentOrderIndex = sorted.findIndex(c => c.originalIndex === category.originalIndex);

      if (currentOrderIndex <= 0) return prev; // Already at top

      // Swap orders
      const newCategories = prev.map(c => {
        if (c.originalIndex === category.originalIndex) {
          return { ...c, order: sorted[currentOrderIndex - 1].order };
        }
        if (c.originalIndex === sorted[currentOrderIndex - 1].originalIndex) {
          return { ...c, order: category.order };
        }
        return c;
      });

      return newCategories;
    });
  };

  // Handle move down
  const handleMoveDown = (index: number) => {
    const category = categories[index];
    if (category.isAggregation) return; // Can't move aggregations

    setCategories(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const currentOrderIndex = sorted.findIndex(c => c.originalIndex === category.originalIndex);

      if (currentOrderIndex >= sorted.length - 1) return prev; // Already at bottom

      // Swap orders
      const newCategories = prev.map(c => {
        if (c.originalIndex === category.originalIndex) {
          return { ...c, order: sorted[currentOrderIndex + 1].order };
        }
        if (c.originalIndex === sorted[currentOrderIndex + 1].originalIndex) {
          return { ...c, order: category.order };
        }
        return c;
      });

      return newCategories;
    });
  };

  // Handle rename
  const handleRename = (index: number, newName: string) => {
    setCategories(prev =>
      prev.map((cat, i) => i === index ? { ...cat, categoryName: newName } : cat)
    );
  };

  // Handle submit
  const handleSubmit = () => {
    const config: PricelistCategoryConfig = {
      categories,
      enablePromotions,
      enableBestsellers,
      aggregationMode,
    };
    onConfigComplete(config);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30 mb-4">
            <Settings2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Konfiguracja kategorii
          </h1>
          <p className="text-slate-600">
            AuditorAI wygenerował <span className="font-semibold text-amber-600">{totalCategories} kategorii</span> i{' '}
            <span className="font-semibold text-amber-600">{totalServices} usług</span> w Twoim cenniku.
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Możesz je edytować i układać dowolnie poniżej.
          </p>
        </div>

        {/* Two column layout: LEFT = categories, RIGHT = AI suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - Main card with categories */}
          <div className="group relative h-fit rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300">
            <div className="relative z-10 flex flex-col rounded-xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)] overflow-hidden">
              {/* Category tree section */}
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  Kolejność kategorii
                </h2>
            <CategoryTree
              categories={displayCategories}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onRename={handleRename}
              pricingData={pricingData}
              editable={true}
            />
          </div>

          {/* Aggregation settings */}
          <div className="p-6 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Agregacje specjalne
            </h2>

            {/* Aggregation mode selector */}
            <div className="mb-6">
              <p className="text-xs text-slate-500 mb-3">Tryb agregacji:</p>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-amber-300 transition-colors">
                  <input
                    type="radio"
                    name="aggregationMode"
                    value="move"
                    checked={aggregationMode === 'move'}
                    onChange={() => setAggregationMode('move')}
                    className="mt-0.5 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Przenieś</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Usługi pojawiają się tylko w agregacji (znikają z oryginalnej kategorii)
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-amber-300 transition-colors">
                  <input
                    type="radio"
                    name="aggregationMode"
                    value="copy"
                    checked={aggregationMode === 'copy'}
                    onChange={() => setAggregationMode('copy')}
                    className="mt-0.5 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Kopiuj</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Usługi widoczne w agregacji i w oryginalnej kategorii
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                      <AlertTriangle size={12} />
                      <span>Uwaga: może tworzyć zduplikowaną treść</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Toggle switches */}
            <div className="space-y-3">
              {/* Promotions toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Flame size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Promocje</p>
                    <p className="text-xs text-slate-500">
                      Zbiera usługi z flagą promocji ({promoCount} znalezionych)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEnablePromotions(!enablePromotions)}
                  disabled={promoCount === 0}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors
                    ${promoCount === 0 ? 'bg-slate-200 cursor-not-allowed' :
                      enablePromotions ? 'bg-amber-500' : 'bg-slate-300 hover:bg-slate-400'}
                  `}
                >
                  <span
                    className={`
                      absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform
                      ${enablePromotions ? 'translate-x-7' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              {/* Bestsellers toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Star size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Bestsellery</p>
                    <p className="text-xs text-slate-500">
                      Zbiera usługi z tagiem "Bestseller" ({bestsellerCount} znalezionych)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEnableBestsellers(!enableBestsellers)}
                  disabled={bestsellerCount === 0}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors
                    ${bestsellerCount === 0 ? 'bg-slate-200 cursor-not-allowed' :
                      enableBestsellers ? 'bg-amber-500' : 'bg-slate-300 hover:bg-slate-400'}
                  `}
                >
                  <span
                    className={`
                      absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform
                      ${enableBestsellers ? 'translate-x-7' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded-lg transition-colors disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="
                  flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white
                  bg-gradient-to-r from-amber-500 to-orange-500
                  hover:from-amber-600 hover:to-orange-600
                  rounded-xl shadow-lg shadow-amber-500/30
                  transition-all disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Optymalizowanie...
                  </>
                ) : (
                  <>
                    Rozpocznij optymalizację
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
            </div>
          </div>
          {/* END LEFT COLUMN */}

          {/* RIGHT COLUMN - AI Suggestions */}
          <div className="space-y-4">
            {suggestionsLoading ? (
              <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3">
                <div className="relative z-10 flex flex-col rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3 text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Analizuję cennik i generuję sugestie...</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : suggestionsError ? (
              <div className="group relative rounded-2xl border border-red-200 bg-red-50/50 p-2 md:rounded-3xl md:p-3">
                <div className="relative z-10 flex flex-col rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <p className="text-center text-sm text-red-500">{suggestionsError}</p>
                </div>
              </div>
            ) : suggestions ? (
              <>
                {/* Card: Mocne strony (Analysis notes) */}
                {suggestions.analysisNotes && (
                  <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-emerald-300/50">
                    <div className="relative z-10 flex flex-col rounded-xl bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Analiza AI</span>
                      </div>
                      <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800 mb-2">Mocne strony</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{suggestions.analysisNotes}</p>
                    </div>
                  </div>
                )}

                {/* Card: Do poprawy (Current issues) */}
                {suggestions.currentIssues.length > 0 && (
                  <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-amber-300/50">
                    <div className="relative z-10 flex flex-col rounded-xl bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Uwagi</span>
                      </div>
                      <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800 mb-2">Do poprawy</h3>
                      <ul className="space-y-1.5">
                        {suggestions.currentIssues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Header: Znalezione kategorie with Modal */}
                <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300">
                  <div className="relative z-10 flex flex-col items-center rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg mb-4">
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-800 mb-1">Znalezione kategorie</h3>
                    <p className="text-sm text-slate-500 mb-5">{suggestions.suggestions.length} sugestii od AI</p>

                    <Modal>
                      <ModalTrigger className="p-0 border-0 bg-transparent">
                        <RainbowButton variant="white" className="h-10 px-6 text-sm">
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Zobacz kategorie
                        </RainbowButton>
                      </ModalTrigger>
                      <ModalBody className="md:max-w-[600px]">
                        <ModalContent>
                          <h4 className="text-xl font-bold text-slate-800 text-center mb-2">
                            Sugerowane kategorie
                          </h4>
                          <p className="text-sm text-slate-500 text-center mb-6">
                            Wybierz kategorie, które chcesz dodać do swojego cennika
                          </p>

                          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                            {suggestions.suggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className={`
                                  rounded-xl p-4 border transition-all
                                  ${appliedSuggestions.has(index)
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/50'}
                                `}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-sm text-slate-800">{suggestion.name}</h4>
                                      <span className={`
                                        text-[10px] px-1.5 py-0.5 rounded-full font-medium
                                        ${suggestion.priority === 'high'
                                          ? 'bg-green-100 text-green-700'
                                          : suggestion.priority === 'medium'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-slate-100 text-slate-600'}
                                      `}>
                                        {suggestion.matchingServices.length} usług
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">{suggestion.description}</p>
                                    {suggestion.matchingServices.length > 0 && (
                                      <p className="text-[10px] text-slate-400">
                                        np. {suggestion.matchingServices.slice(0, 3).join(', ')}
                                        {suggestion.matchingServices.length > 3 && '...'}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => applySuggestion(suggestion, index)}
                                    disabled={appliedSuggestions.has(index)}
                                    className={`
                                      shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all
                                      ${appliedSuggestions.has(index)
                                        ? 'bg-green-100 text-green-700 cursor-default'
                                        : 'bg-violet-500 text-white hover:bg-violet-600'}
                                    `}
                                  >
                                    {appliedSuggestions.has(index) ? (
                                      <span className="flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        Dodano
                                      </span>
                                    ) : (
                                      'Dodaj'
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ModalContent>
                      </ModalBody>
                    </Modal>
                  </div>
                </div>
              </>
            ) : null}
          </div>
          {/* END RIGHT COLUMN */}
        </div>
        {/* END GRID */}

        {/* Info note */}
        <p className="text-center text-xs text-slate-500 mt-6 max-w-md mx-auto">
          Po optymalizacji będziesz mógł edytować kategorie oraz przypisywać usługi do różnych kategorii.
        </p>
      </div>
    </div>
  );
}
