import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, AlertTriangle, Flame, Star, ArrowRight, Lightbulb, Check, Loader2, Layers, ArrowRightLeft, Copy } from 'lucide-react';
import CategoryTree from './CategoryTree';
import { PricingData, CategoryConfig, PricelistCategoryConfig, CategorySuggestionsResult, CategorySuggestion } from '../types';
import { suggestCategories } from '../services/geminiService';
import { Modal, ModalTrigger, ModalBody, ModalContent } from './ui/animated-modal';
import { RainbowButton } from './ui/rainbow-button';
import { DottedGlowBackground } from './ui/dotted-glow-background';

interface CategoryConfigStepProps {
  pricingData: PricingData;
  onConfigComplete: (config: PricelistCategoryConfig) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialConfig?: PricelistCategoryConfig | null;
}

export default function CategoryConfigStep({
  pricingData,
  onConfigComplete,
  onCancel,
  isLoading = false,
  initialConfig,
}: CategoryConfigStepProps) {
  // Initialize categories from initialConfig (if editing) or from pricingData (if new)
  const initialCategories: CategoryConfig[] = useMemo(() => {
    if (initialConfig?.categories && initialConfig.categories.length > 0) {
      // Use saved config
      return initialConfig.categories;
    }
    // Default: create from pricingData
    return pricingData.categories.map((cat, index) => ({
      categoryName: cat.categoryName,
      order: index,
      originalIndex: index,
      isAggregation: false,
    }));
  }, [pricingData, initialConfig]);

  const [categories, setCategories] = useState<CategoryConfig[]>(initialCategories);
  const [aggregationMode, setAggregationMode] = useState<'copy' | 'move'>(
    initialConfig?.aggregationMode || 'move'
  );
  const [enablePromotions, setEnablePromotions] = useState(
    initialConfig?.enablePromotions || false
  );
  const [enableBestsellers, setEnableBestsellers] = useState(
    initialConfig?.enableBestsellers || false
  );

  // AI suggestions state
  const [suggestions, setSuggestions] = useState<CategorySuggestionsResult | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  // Track applied suggestions by name (more robust than index-based tracking)
  const appliedSuggestionNames = useMemo(() => {
    return new Set(categories.map(cat => cat.categoryName));
  }, [categories]);

  // Check if a suggestion has already been applied (by name)
  const isSuggestionApplied = (suggestionName: string) => {
    return appliedSuggestionNames.has(suggestionName);
  };

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
  const applySuggestion = (suggestion: CategorySuggestion) => {
    // Check if at least 1 service matches and not already applied
    if (suggestion.matchingServices.length >= 1 && !isSuggestionApplied(suggestion.name)) {
      // Use timestamp to create unique originalIndex
      const uniqueOffset = Date.now() % 1000000;
      const newCategory: CategoryConfig = {
        categoryName: suggestion.name,
        order: categories.length, // Add at the end
        originalIndex: -100 - uniqueOffset, // Unique negative index
        isAggregation: false,
        matchingServiceNames: suggestion.matchingServices, // Store service names for AI category
      };

      setCategories(prev => [...prev, newCategory]);
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

  // Generate unique key for category
  const getCategoryKey = (cat: CategoryConfig) =>
    `${cat.isAggregation ? 'agg' : 'cat'}-${cat.originalIndex}-${cat.aggregationType || ''}`;

  // Handle move up - receives category key from CategoryTree
  const handleMoveUp = (categoryKey: string) => {
    setCategories(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const currentIndex = sorted.findIndex(c => getCategoryKey(c) === categoryKey);

      if (currentIndex <= 0) return prev; // Already at top

      const current = sorted[currentIndex];
      const above = sorted[currentIndex - 1];

      // Swap orders
      return prev.map(c => {
        const key = getCategoryKey(c);
        if (key === categoryKey) {
          return { ...c, order: above.order };
        }
        if (key === getCategoryKey(above)) {
          return { ...c, order: current.order };
        }
        return c;
      });
    });
  };

  // Handle move down - receives category key from CategoryTree
  const handleMoveDown = (categoryKey: string) => {
    setCategories(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const currentIndex = sorted.findIndex(c => getCategoryKey(c) === categoryKey);

      if (currentIndex >= sorted.length - 1) return prev; // Already at bottom

      const current = sorted[currentIndex];
      const below = sorted[currentIndex + 1];

      // Swap orders
      return prev.map(c => {
        const key = getCategoryKey(c);
        if (key === categoryKey) {
          return { ...c, order: below.order };
        }
        if (key === getCategoryKey(below)) {
          return { ...c, order: current.order };
        }
        return c;
      });
    });
  };

  // Handle rename - receives category key
  const handleRename = (categoryKey: string, newName: string) => {
    setCategories(prev =>
      prev.map(cat => getCategoryKey(cat) === categoryKey ? { ...cat, categoryName: newName } : cat)
    );
  };

  // Handle delete - receives category key
  const handleDelete = (categoryKey: string) => {
    setCategories(prev => {
      const newCategories = prev.filter(cat => getCategoryKey(cat) !== categoryKey);
      // Recalculate orders
      const sorted = [...newCategories].sort((a, b) => a.order - b.order);
      return sorted.map((cat, i) => ({ ...cat, order: i }));
    });
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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30 overflow-hidden">
      {/* Dotted background like homepage hero */}
      <DottedGlowBackground
        className="pointer-events-none opacity-20"
        opacity={1}
        gap={10}
        radius={1.6}
        color="rgba(115, 115, 115, 0.7)"
        glowColor="#D4A574"
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={1.6}
        speedScale={1}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4">
            <img
              src="/emblem.png"
              alt="Beauty Audit"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Konfiguracja kategorii
          </h1>
          <p className="text-sm text-slate-500">
            Możesz je edytować i układać dowolnie poniżej.
          </p>
        </div>

        {/* Two column layout: LEFT = AI suggestions, RIGHT = categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories column (order-2 on desktop = right side) */}
          <div className="group relative z-0 h-fit rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 lg:order-2">
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
              onDelete={handleDelete}
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
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  aggregationMode === 'move'
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="aggregationMode"
                    value="move"
                    checked={aggregationMode === 'move'}
                    onChange={() => setAggregationMode('move')}
                    className="sr-only"
                  />
                  <ArrowRightLeft size={20} className={aggregationMode === 'move' ? 'text-amber-600' : 'text-slate-400'} />
                  <span className={`text-sm font-medium ${aggregationMode === 'move' ? 'text-amber-700' : 'text-slate-700'}`}>Przenieś</span>
                  <p className="text-xs text-slate-500 text-center">
                    Usługi znikają z oryginalnej kategorii
                  </p>
                </label>

                <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  aggregationMode === 'copy'
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="aggregationMode"
                    value="copy"
                    checked={aggregationMode === 'copy'}
                    onChange={() => setAggregationMode('copy')}
                    className="sr-only"
                  />
                  <Copy size={20} className={aggregationMode === 'copy' ? 'text-amber-600' : 'text-slate-400'} />
                  <span className={`text-sm font-medium ${aggregationMode === 'copy' ? 'text-amber-700' : 'text-slate-700'}`}>Kopiuj</span>
                  <p className="text-xs text-slate-500 text-center">
                    Usługi widoczne w obu miejscach
                  </p>
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
                      absolute left-0 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform
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
                      absolute left-0 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform
                      ${enableBestsellers ? 'translate-x-7' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Actions - dark theme with golden accents like LandingPage pricing */}
          <div className="relative overflow-hidden rounded-b-xl">
            {/* Dark background with circular golden glow */}
            <div className="absolute inset-0 bg-[#0a0a0a]" />
            <div
              className="absolute bg-[radial-gradient(circle_at_30%_50%,rgb(212_165_116/70%),transparent_50%)]"
              style={{ top: '-340%', width: '160%', height: '500%', left: '-30%' }}
            />

            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-4 py-2 text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                >
                  Anuluj
                </button>
                {isLoading ? (
                  <button
                    disabled
                    className="flex items-center gap-2 px-6 py-3 text-[13px] font-semibold text-slate-900 bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl opacity-50 cursor-not-allowed"
                  >
                    <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    Optymalizowanie...
                  </button>
                ) : (
                  <RainbowButton onClick={handleSubmit} className="px-6 text-[13px]">
                    <span className="flex items-center gap-2">
                      Rozpocznij optymalizację
                      <ArrowRight size={16} />
                    </span>
                  </RainbowButton>
                )}
              </div>
            </div>
          </div>
            </div>
          </div>
          {/* END Categories COLUMN */}

          {/* AI Suggestions column (order-1 on desktop = left side) */}
          <div className="space-y-4 lg:order-1">
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

                {/* Sugerowane kategorie - preview with modal */}
                <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300">
                  <div className="relative z-10 flex flex-col rounded-xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)] overflow-hidden">
                    {/* Header like other cards */}
                    <div className="p-5 pb-3">
                      <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Lightbulb size={16} className="text-amber-500" />
                        Sugerowane kategorie
                      </h2>
                    </div>

                    {/* Preview of first 2 categories */}
                    <div className="px-5 relative">
                      <div className="space-y-2">
                        {suggestions.suggestions.slice(0, 2).map((suggestion, index) => (
                          <div
                            key={index}
                            className={`relative rounded-lg p-3 border transition-all ${
                              index === 1 ? '' : 'border-slate-200 bg-slate-50'
                            } ${index === 1 ? 'border-slate-200/50 bg-slate-50/50' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-slate-700 truncate">{suggestion.name}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium shrink-0">
                                    {suggestion.matchingServices.length} usług
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2">{suggestion.description}</p>
                              </div>
                              <button
                                onClick={() => applySuggestion(suggestion)}
                                disabled={isSuggestionApplied(suggestion.name)}
                                className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  isSuggestionApplied(suggestion.name)
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-500 text-white hover:bg-amber-600'
                                }`}
                              >
                                {isSuggestionApplied(suggestion.name) ? <Check className="w-3 h-3" /> : 'Dodaj'}
                              </button>
                            </div>
                            {/* Gradient overlay on second item */}
                            {index === 1 && (
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white rounded-lg pointer-events-none" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Fade overlay at bottom */}
                      {suggestions.suggestions.length > 2 && (
                        <div className="absolute bottom-0 left-5 right-5 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                      )}
                    </div>

                    {/* Zobacz więcej link */}
                    <div className="px-5 pb-5 pt-2">
                      <Modal>
                        <ModalTrigger className="w-full p-0 border-0 bg-transparent">
                          <span className="text-xs text-slate-400 hover:text-amber-600 cursor-pointer transition-colors">
                            Zobacz wszystkie ({suggestions.suggestions.length})
                          </span>
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
                                    ${isSuggestionApplied(suggestion.name)
                                      ? 'border-green-300 bg-green-50'
                                      : 'border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50/50'}
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
                                      onClick={() => applySuggestion(suggestion)}
                                      disabled={isSuggestionApplied(suggestion.name)}
                                      className={`
                                        shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all
                                        ${isSuggestionApplied(suggestion.name)
                                          ? 'bg-green-100 text-green-700 cursor-default'
                                          : 'bg-amber-500 text-white hover:bg-amber-600'}
                                      `}
                                    >
                                      {isSuggestionApplied(suggestion.name) ? (
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
