"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Loader2,
  Check,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FileText,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  Palette,
  Copy,
  Pencil,
  Lightbulb,
  MessageSquareText,
  Layers,
  Type,
  Trash2,
  HelpCircle,
  X,
  Download,
} from 'lucide-react';
import { exportToPDF } from '../../lib/pricelist-templates/utils/pdfExport';
import { PricingData, OptimizationResult, ThemeConfig, DEFAULT_THEME } from '../../types';
import { RainbowButton } from '../ui/rainbow-button';
import { HeroHighlight } from '../ui/hero-highlight';
import { BlurFade } from '../ui/blur-fade';
import { AuroraText } from '../ui/aurora-text';
import { optimizePricelist } from '../../services/geminiService';
import { getTemplate } from '../../lib/pricelist-templates';
import type { Id } from '../../convex/_generated/dataModel';
import Header from '../layout/Header';
import { AnimatedCircularProgressBar } from '../ui/animated-circular-progress-bar';
import EmbedCode from '../EmbedCode';

type TabType = 'summary' | 'original' | 'optimized' | 'changes' | 'suggestions';

const tabConfig: { id: TabType; label: string }[] = [
  { id: 'summary', label: 'Podsumowanie' },
  { id: 'original', label: 'Cennik oryginalny' },
  { id: 'optimized', label: 'Cennik zoptymalizowany' },
  { id: 'changes', label: 'Lista zmian' },
  { id: 'suggestions', label: 'Sugestie' },
];

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

// Full pricelist display using user's template
const FullPricelistDisplay: React.FC<{
  data: PricingData;
  theme: ThemeConfig;
  templateId: string;
  label: string;
  variant: 'original' | 'optimized';
  isLoading?: boolean;
}> = ({ data, theme, templateId, label, variant, isLoading }) => {
  const isOriginal = variant === 'original';
  const template = getTemplate(templateId);
  const TemplateComponent = template?.Component;

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

      <div className={`relative rounded-2xl border overflow-hidden ${isOriginal ? 'bg-slate-50/50 border-slate-200' : 'bg-white border-[#D4A574]/30 shadow-lg shadow-[#D4A574]/5'}`}>
        {isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-[#D4A574] animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">AI optymalizuje cennik...</p>
              <p className="text-xs text-slate-500 mt-1">To może potrwać chwilę</p>
            </div>
          </div>
        ) : null}

        <div className={isLoading ? 'opacity-20' : ''}>
          {TemplateComponent ? (
            <TemplateComponent
              data={data}
              theme={theme}
              editMode={false}
            />
          ) : (
            <div className="p-8 text-center text-slate-500">
              Nie można załadować szablonu
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple pricelist card for loading state only
const PricelistCardSimple: React.FC<{
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

// Mapping from criterion key to change types
const criterionToChangeTypes: Record<string, string[]> = {
  descriptions: ['description_added', 'description_improved'],
  seo: ['name_improved'],
  categories: ['category_renamed', 'category_reordered'],
  order: ['service_reordered'],
  prices: ['price_formatted'],
  duplicates: ['duplicate_merged', 'typo_fixed'],
  duration: ['duration_estimated'],
  tags: ['tag_added'],
};

// Sales-focused explanations for each optimization criterion
const criterionExplanations: Record<string, { title: string; description: string }> = {
  descriptions: {
    title: 'Język korzyści w opisach',
    description: 'Opisy usług pisane językiem korzyści zwiększają konwersję nawet o 40%. Klientki nie kupują "zabiegu na twarz" - kupują "gładką, promienną skórę bez zmarszczek". Dobrze napisany opis odpowiada na pytanie "co z tego będę mieć?" zanim klientka je zada.',
  },
  seo: {
    title: 'Słowa kluczowe SEO',
    description: 'Nazwy usług ze słowami kluczowymi pomagają klientkom znaleźć Twój salon w Google i Booksy. "Manicure hybrydowy" ma 10x więcej wyszukiwań niż "stylizacja paznokci". Właściwe nazewnictwo to darmowa reklama 24/7.',
  },
  categories: {
    title: 'Struktura kategorii',
    description: 'Logicznie pogrupowane kategorie zmniejszają "paraliż decyzyjny". Gdy klientka widzi przejrzysty cennik, szybciej podejmuje decyzję i częściej wybiera droższe opcje. Chaos w kategoriach = utracone rezerwacje.',
  },
  order: {
    title: 'Kolejność usług',
    description: 'Usługi premium na początku kategorii wykorzystują efekt zakotwiczenia cenowego. Klientka widząc najpierw zabieg za 500 zł, postrzega ten za 200 zł jako "okazję". Kolejność wpływa na średnią wartość koszyka.',
  },
  prices: {
    title: 'Formatowanie cen',
    description: 'Spójne formatowanie cen buduje profesjonalny wizerunek i zaufanie. "150 zł" vs "150,-" vs "150.00" - niespójność sugeruje bałagan. Ceny psychologiczne (np. 149 zł zamiast 150 zł) zwiększają sprzedaż o 5-9%.',
  },
  duplicates: {
    title: 'Duplikaty i błędy',
    description: 'Literówki i duplikaty to sygnał dla klientki: "ten salon nie dba o szczegóły". Jeśli nie dbasz o cennik, to jak dbasz o jej paznokcie? Każdy błąd to potencjalnie utracona klientka.',
  },
  duration: {
    title: 'Szacowanie czasu',
    description: 'Czas trwania zabiegu to kluczowa informacja przy planowaniu wizyty. Brak tej informacji generuje pytania, wahanie i porzucone rezerwacje. Podany czas = mniej pytań = więcej rezerwacji.',
  },
  tags: {
    title: 'Tagi i oznaczenia',
    description: 'Tagi "BESTSELLER", "NOWOŚĆ", "PROMOCJA" kierują uwagę na wybrane usługi. To jak sprzedawca w sklepie pokazujący najlepsze produkty. Bez tagów klientka może przegapić Twoje najlepsze oferty.',
  },
};

const OptimizationResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Two modes: draft mode (new optimization) or pricelist mode (view saved results)
  const draftId = searchParams.get('draft');
  const pricelistId = searchParams.get('pricelist') as Id<"pricelists"> | null;
  const sessionId = searchParams.get('session_id');

  const isViewOnlyMode = !!pricelistId; // Viewing saved results vs new optimization

  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [originalPricingData, setOriginalPricingData] = useState<PricingData | null>(null);
  const [optimizedPricingData, setOptimizedPricingData] = useState<PricingData | null>(null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const [templateId, setTemplateId] = useState<string>('modern');
  const [error, setError] = useState<string | null>(null);
  const [savedPricelistId, setSavedPricelistId] = useState<Id<"pricelists"> | null>(null);
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
  const [criterionModalOpen, setCriterionModalOpen] = useState<string | null>(null);
  const optimizationTriggered = useRef(false);
  const pricelistSaved = useRef(false);
  const actionsDropdownRef = useRef<HTMLDivElement>(null);
  const originalPricelistRef = useRef<HTMLDivElement>(null);
  const optimizedPricelistRef = useRef<HTMLDivElement>(null);
  const [isExportingOriginalPDF, setIsExportingOriginalPDF] = useState(false);
  const [isExportingOptimizedPDF, setIsExportingOptimizedPDF] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target as Node)) {
        setIsActionsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Convex queries
  const existingDraft = useQuery(
    api.pricelistDrafts.getDraft,
    draftId ? { draftId } : "skip"
  );
  const existingPricelist = useQuery(
    api.pricelists.getPricelist,
    pricelistId ? { pricelistId } : "skip"
  );
  const updateDraft = useMutation(api.pricelistDrafts.updateDraft);
  const convertDraftToPricelist = useMutation(api.pricelistDrafts.convertDraftToPricelist);
  const verifySession = useAction(api.stripe.verifySession);

  // Load pricelist data (view mode)
  useEffect(() => {
    if (isViewOnlyMode && existingPricelist) {
      try {
        // Load optimized (current) data
        const currentData = JSON.parse(existingPricelist.pricingDataJson);
        setOptimizedPricingData(currentData);

        // Load original data if available
        if (existingPricelist.originalPricingDataJson) {
          const origData = JSON.parse(existingPricelist.originalPricingDataJson);
          setOriginalPricingData(origData);
        } else {
          // Fallback: show same data on both sides if original not saved
          setOriginalPricingData(currentData);
        }

        // Load optimization result if available
        if (existingPricelist.optimizationResultJson) {
          const result = JSON.parse(existingPricelist.optimizationResultJson) as OptimizationResult;
          setOptimizationResult(result);
        }

        // Load theme and template
        if (existingPricelist.themeConfigJson) {
          setThemeConfig(JSON.parse(existingPricelist.themeConfigJson));
        }
        if (existingPricelist.templateId) {
          setTemplateId(existingPricelist.templateId);
        }
      } catch (e) {
        console.error('Error parsing pricelist data:', e);
        setError('Błąd wczytywania danych cennika');
      }
    }
  }, [isViewOnlyMode, existingPricelist]);

  // Load draft data (optimization mode)
  useEffect(() => {
    if (!isViewOnlyMode && existingDraft) {
      try {
        // If draft is already optimized, load both original and optimized data
        if (existingDraft.isOptimized && existingDraft.originalPricingDataJson) {
          const origData = JSON.parse(existingDraft.originalPricingDataJson);
          const optimizedData = JSON.parse(existingDraft.pricingDataJson);
          setOriginalPricingData(origData);
          setOptimizedPricingData(optimizedData);

          // Load optimization result if available
          if (existingDraft.optimizationResultJson) {
            const result = JSON.parse(existingDraft.optimizationResultJson) as OptimizationResult;
            setOptimizationResult(result);
          }
        } else {
          // Not yet optimized - load current data as original
          const data = JSON.parse(existingDraft.pricingDataJson);
          setOriginalPricingData(data);
        }

        if (existingDraft.themeConfigJson) {
          setThemeConfig(JSON.parse(existingDraft.themeConfigJson));
        }
        if (existingDraft.templateId) {
          setTemplateId(existingDraft.templateId);
        }
      } catch (e) {
        console.error('Error parsing draft data:', e);
        setError('Błąd wczytywania danych cennika');
      }
    }
  }, [isViewOnlyMode, existingDraft]);

  // Verify payment and run optimization
  useEffect(() => {
    // Skip if already optimized (data loaded from draft), in view mode, or missing required data
    if (isViewOnlyMode || !sessionId || !draftId || !originalPricingData || optimizationTriggered.current) {
      return;
    }

    // If draft is already optimized, don't run optimization again
    if (existingDraft?.isOptimized && optimizationResult) {
      return;
    }

    const runOptimization = async () => {
      optimizationTriggered.current = true;
      setIsOptimizing(true);

      try {
        // Verify Stripe session
        const verification = await verifySession({ sessionId });

        if (!verification.success) {
          setError('Płatność nie została zweryfikowana. Spróbuj ponownie.');
          setIsOptimizing(false);
          return;
        }

        // Run AI optimization
        console.log('[Optimization] Starting AI optimization...');
        const result = await optimizePricelist(originalPricingData);
        console.log('[Optimization] Completed with', result.changes.length, 'changes');

        setOptimizationResult(result);
        setOptimizedPricingData(result.optimizedPricingData);

        // Update draft with optimized data AND store original for comparison
        await updateDraft({
          draftId,
          pricingDataJson: JSON.stringify(result.optimizedPricingData),
          isOptimized: true,
          originalPricingDataJson: JSON.stringify(originalPricingData),
          optimizationResultJson: JSON.stringify(result),
        });

        // Auto-save pricelists (original + optimized) after optimization completes
        if (!pricelistSaved.current) {
          pricelistSaved.current = true;
          try {
            console.log('[Optimization] Auto-saving pricelists...');
            const newPricelistId = await convertDraftToPricelist({
              draftId,
              name: existingDraft?.sourcePricelistId ? 'Zaktualizowany cennik' : 'Nowy cennik',
            });
            setSavedPricelistId(newPricelistId);
            console.log('[Optimization] Pricelists saved successfully:', newPricelistId);
          } catch (saveError) {
            console.error('[Optimization] Error saving pricelists:', saveError);
            // Don't fail the optimization if save fails - user can still see results
          }
        }

        // Fire confetti on success
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

      } catch (e) {
        console.error('[Optimization] Error:', e);
        setError('Wystąpił błąd podczas optymalizacji. Spróbuj ponownie.');
      } finally {
        setIsOptimizing(false);
      }
    };

    runOptimization();
  }, [isViewOnlyMode, sessionId, draftId, originalPricingData, verifySession, updateDraft, convertDraftToPricelist, existingDraft?.sourcePricelistId]);

  // Auto-save pricelists when draft is already optimized but pricelists not yet saved
  // This handles the case when user refreshes the page after optimization completed
  useEffect(() => {
    // Skip if in view mode, no draft, or already saved
    if (isViewOnlyMode || !draftId || !existingDraft || pricelistSaved.current || savedPricelistId) {
      return;
    }

    // Only proceed if draft is optimized but we haven't saved yet
    if (existingDraft.isOptimized && existingDraft.originalPricingDataJson) {
      const savePricelists = async () => {
        pricelistSaved.current = true;
        try {
          console.log('[Optimization] Auto-saving pricelists for already optimized draft...');
          const newPricelistId = await convertDraftToPricelist({
            draftId,
            name: existingDraft.sourcePricelistId ? 'Zaktualizowany cennik' : 'Nowy cennik',
          });
          setSavedPricelistId(newPricelistId);
          console.log('[Optimization] Pricelists saved successfully:', newPricelistId);
        } catch (saveError) {
          console.error('[Optimization] Error saving pricelists:', saveError);
          pricelistSaved.current = false; // Allow retry
        }
      };

      savePricelists();
    }
  }, [isViewOnlyMode, draftId, existingDraft, convertDraftToPricelist, savedPricelistId]);

  // Handle go to profile - pricelists are now auto-saved
  const handleGoToProfile = () => {
    navigate('/profil');
  };

  // Handle PDF export for original pricelist
  const handleExportOriginalPDF = async () => {
    if (!originalPricelistRef.current || isExportingOriginalPDF) return;
    setIsExportingOriginalPDF(true);
    try {
      const salonName = originalPricingData?.salonName || 'cennik-oryginalny';
      const filename = salonName.toLowerCase().replace(/\s+/g, '-') + '-oryginalny';
      await exportToPDF(originalPricelistRef.current, { filename });
    } finally {
      setIsExportingOriginalPDF(false);
    }
  };

  // Handle PDF export for optimized pricelist
  const handleExportOptimizedPDF = async () => {
    if (!optimizedPricelistRef.current || isExportingOptimizedPDF) return;
    setIsExportingOptimizedPDF(true);
    try {
      const salonName = optimizedPricingData?.salonName || 'cennik-zoptymalizowany';
      const filename = salonName.toLowerCase().replace(/\s+/g, '-') + '-zoptymalizowany';
      await exportToPDF(optimizedPricelistRef.current, { filename });
    } finally {
      setIsExportingOptimizedPDF(false);
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">!</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">
            Wystąpił błąd
          </h2>
          <p className="text-slate-600 mb-8">{error}</p>
          <button
            onClick={() => navigate('/profil')}
            className="px-6 py-3 bg-[#D4A574] text-white rounded-xl hover:bg-[#C9956C] transition-colors"
          >
            Wróć do profilu
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  const isLoading = isViewOnlyMode
    ? !existingPricelist || !originalPricingData
    : !existingDraft || !originalPricingData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#D4A574] animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Wczytywanie danych...</p>
        </div>
      </div>
    );
  }

  // Optimizing state
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
                  <PricelistCardSimple
                    data={originalPricingData}
                    label="Oryginalny cennik"
                    variant="original"
                  />
                  <PricelistCardSimple
                    data={originalPricingData}
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

  // Determine displayed data for comparison
  const displayedOptimizedData = optimizedPricingData || (optimizationResult?.optimizedPricingData);

  // Get current pricelist data based on active tab
  const currentPricelistData = activeTab === 'original' ? originalPricingData : displayedOptimizedData;

  // Results view
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Application Header/Navbar */}
      <Header
        currentPage="optimization"
        onNavigate={() => {}}
      />

      {/* Dark sub-navigation bar - like in pricelist editor */}
      <div className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/profil')}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Powrót
              </button>
              <div className="h-5 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4A574]" />
                <span className="text-sm text-slate-400">
                  Wyniki optymalizacji
                </span>
              </div>
              <div className="h-5 w-px bg-slate-700" />
              <span className="text-sm font-medium text-white">
                {optimizedPricingData?.salonName || existingPricelist?.name || 'Cennik'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Tabs */}
            <div className="flex items-center gap-1">
              {tabConfig.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all rounded-lg
                      ${isActive
                        ? 'text-[#D4A574] bg-[#D4A574]/10'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }
                    `}
                  >
                    {tab.label}
                    {tab.id === 'changes' && optimizationResult && (
                      <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-[#D4A574]/20' : 'bg-slate-200'}`}>
                        {optimizationResult.changes.length}
                      </span>
                    )}
                    {tab.id === 'suggestions' && optimizationResult && (
                      <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-[#D4A574]/20' : 'bg-slate-200'}`}>
                        {optimizationResult.recommendations.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Actions dropdown */}
            <div className="relative" ref={actionsDropdownRef}>
              <button
                onClick={() => setIsActionsDropdownOpen(!isActionsDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
              >
                Akcje
                <ChevronDown className={`w-4 h-4 transition-transform ${isActionsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isActionsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {/* Oryginalny cennik group */}
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cennik oryginalny</span>
                    </div>
                  </div>
                  <div className="flex border-b border-slate-200">
                    <button
                      onClick={() => {
                        setIsActionsDropdownOpen(false);
                        // TODO: implement duplicate original
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors border-r border-slate-200"
                    >
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700">Duplikuj</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsActionsDropdownOpen(false);
                        // TODO: implement edit original
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700">Edytuj</span>
                    </button>
                  </div>

                  {/* Zoptymalizowany cennik group */}
                  <div className="px-3 py-2 bg-[#D4A574]/5 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#D4A574]" />
                      <span className="text-xs font-medium text-[#D4A574] uppercase tracking-wide">Cennik zoptymalizowany</span>
                    </div>
                  </div>
                  <div className="flex">
                    <button
                      onClick={() => {
                        setIsActionsDropdownOpen(false);
                        // TODO: implement duplicate optimized
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 hover:bg-[#D4A574]/5 transition-colors border-r border-slate-200"
                    >
                      <Copy className="w-4 h-4 text-[#D4A574]" />
                      <span className="text-sm text-slate-700">Duplikuj</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsActionsDropdownOpen(false);
                        // TODO: implement edit optimized
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 hover:bg-[#D4A574]/5 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-[#D4A574]" />
                      <span className="text-sm text-slate-700">Edytuj</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Summary Tab Content */}
        {activeTab === 'summary' && optimizationResult && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Hero Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Quality Score Chart */}
              <motion.div
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.05 }}
                className="group relative h-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
              >
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
                <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Jakość</span>
                    <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                      {optimizationResult.qualityScore >= 80 ? 'Wysoka' : optimizationResult.qualityScore >= 60 ? 'Dobra' : 'Średnia'}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <AnimatedCircularProgressBar
                      value={optimizationResult.qualityScore}
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
                        Cennik zoptymalizowany pod kątem sprzedaży i SEO
                      </p>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-emerald-600 font-medium">Po optymalizacji</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Sales Potential Gauge */}
              <motion.div
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.1 }}
                className="group relative h-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
              >
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
                <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-[#D4A574]" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Potencjał Sprzedażowy</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">
                    {optimizationResult.qualityScore >= 80
                      ? 'Wysoki. Cennik jest bardzo dobrze zoptymalizowany pod sprzedaż.'
                      : optimizationResult.qualityScore >= 60
                      ? 'Średni do Wysokiego. Po wdrożeniu zmian potencjał może wzrosnąć do Wysokiego.'
                      : 'Niski do Średniego. Po wdrożeniu zmian potencjał może wzrosnąć do Wysokiego.'}
                  </p>

                  {/* Gradient gauge bar */}
                  <div className="relative mb-3">
                    <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500 overflow-hidden" />
                    {/* Marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-700 rounded-full shadow-lg transition-all duration-700"
                      style={{ left: `calc(${optimizationResult.qualityScore}% - 8px)` }}
                    />
                  </div>

                  {/* Labels */}
                  <div className="flex justify-between text-[10px] font-medium text-slate-400 mb-4">
                    <span>NISKI</span>
                    <span>ŚREDNI</span>
                    <span>WYSOKI</span>
                  </div>

                  {/* Improvement badge */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-700 font-medium">
                      Po optymalizacji: +{Math.min(50, Math.round((100 - optimizationResult.qualityScore) * 0.7))}% potencjał
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Statistics */}
              <motion.div
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.15 }}
                className="group relative h-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
              >
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
                <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Statystyki</span>
                  </div>

                  <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800 mb-4">
                    Podsumowanie zmian
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <p className="text-xl font-bold text-slate-800">{optimizationResult.summary.totalChanges}</p>
                      <p className="text-[10px] text-slate-500">zmian</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <p className="text-xl font-bold text-slate-800">
                        {optimizationResult.changes.filter(c => c.type === 'description_added' || c.type === 'description_improved').length}
                      </p>
                      <p className="text-[10px] text-slate-500">opisów</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <p className="text-xl font-bold text-slate-800">
                        {optimizedPricingData?.categories.length || 0}
                      </p>
                      <p className="text-[10px] text-slate-500">kategorii</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <p className="text-xl font-bold text-slate-800">
                        {optimizedPricingData?.categories.reduce((acc, cat) => acc + cat.services.length, 0) || 0}
                      </p>
                      <p className="text-[10px] text-slate-500">usług</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Zakres optymalizacji */}
              <motion.div
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.2 }}
                className="group relative h-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
              >
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
                <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#D4A574]" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Zakres</span>
                  </div>

                  <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800 mb-1">
                    Kryteria optymalizacji
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Kliknij znak zapytania, aby dowiedzieć się więcej</p>

                  <div className="space-y-1.5 flex-1">
                    {[
                      { key: 'descriptions', label: 'Język korzyści w opisach', active: optimizationResult.changes.some(c => c.type === 'description_added' || c.type === 'description_improved'), count: optimizationResult.changes.filter(c => c.type === 'description_added' || c.type === 'description_improved').length },
                      { key: 'seo', label: 'Słowa kluczowe SEO', active: optimizationResult.changes.some(c => c.type === 'name_improved'), count: optimizationResult.changes.filter(c => c.type === 'name_improved').length },
                      { key: 'categories', label: 'Struktura kategorii', active: optimizationResult.changes.some(c => c.type === 'category_renamed' || c.type === 'category_reordered'), count: optimizationResult.changes.filter(c => c.type === 'category_renamed' || c.type === 'category_reordered').length },
                      { key: 'order', label: 'Kolejność usług', active: optimizationResult.changes.some(c => c.type === 'service_reordered'), count: optimizationResult.changes.filter(c => c.type === 'service_reordered').length },
                      { key: 'prices', label: 'Formatowanie cen', active: optimizationResult.changes.some(c => c.type === 'price_formatted'), count: optimizationResult.changes.filter(c => c.type === 'price_formatted').length },
                      { key: 'duplicates', label: 'Duplikaty i błędy', active: optimizationResult.changes.some(c => c.type === 'duplicate_merged' || c.type === 'typo_fixed'), count: optimizationResult.changes.filter(c => c.type === 'duplicate_merged' || c.type === 'typo_fixed').length },
                      { key: 'duration', label: 'Szacowanie czasu', active: optimizationResult.changes.some(c => c.type === 'duration_estimated'), count: optimizationResult.changes.filter(c => c.type === 'duration_estimated').length },
                      { key: 'tags', label: 'Tagi i oznaczenia', active: optimizationResult.changes.some(c => c.type === 'tag_added'), count: optimizationResult.changes.filter(c => c.type === 'tag_added').length },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs transition-colors ${
                          item.active
                            ? 'bg-emerald-50'
                            : 'bg-slate-50/50'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`flex-1 ${item.active ? 'text-slate-700' : 'text-slate-400'}`}>
                          {item.label}
                        </span>
                        {item.active && item.count > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                            +{item.count}
                          </span>
                        )}
                        <button
                          onClick={() => setCriterionModalOpen(item.key)}
                          className="p-0.5 rounded hover:bg-slate-200/50 transition-colors"
                          title="Dowiedz się więcej"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Criterion explanation modal */}
              {criterionModalOpen && optimizationResult && (() => {
                const relevantChangeTypes = criterionToChangeTypes[criterionModalOpen] || [];
                const relevantChanges = optimizationResult.changes.filter(c => relevantChangeTypes.includes(c.type));

                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setCriterionModalOpen(null)}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ type: "spring", duration: 0.3 }}
                      className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[85vh] flex flex-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-6 border-b border-slate-100">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#D4A574]/10 flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-[#D4A574]" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-slate-900">
                                {criterionExplanations[criterionModalOpen]?.title}
                              </h3>
                              {relevantChanges.length > 0 && (
                                <span className="text-xs text-emerald-600 font-medium">
                                  {relevantChanges.length} {relevantChanges.length === 1 ? 'zmiana' : relevantChanges.length < 5 ? 'zmiany' : 'zmian'} w Twoim cenniku
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setCriterionModalOpen(null)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <X className="w-5 h-5 text-slate-400" />
                          </button>
                        </div>
                      </div>

                      <div className="p-6 overflow-y-auto flex-1">
                        <p className="text-slate-600 leading-relaxed mb-6">
                          {criterionExplanations[criterionModalOpen]?.description}
                        </p>

                        {relevantChanges.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                              <Check className="w-4 h-4 text-emerald-500" />
                              Zastosowane zmiany w Twoim cenniku
                            </h4>
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-4 py-2.5 font-medium text-slate-600">Przed</th>
                                    <th className="text-left px-4 py-2.5 font-medium text-slate-600">Po</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {relevantChanges.slice(0, 10).map((change, idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                      <td className="px-4 py-3 text-slate-500 border-r border-slate-100">
                                        <span className="line-through">
                                          {change.originalValue || '(brak)'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-slate-800 font-medium">
                                        {change.newValue}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {relevantChanges.length > 10 && (
                                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
                                  +{relevantChanges.length - 10} więcej zmian
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {relevantChanges.length === 0 && (
                          <div className="bg-slate-50 rounded-xl p-4 text-center">
                            <p className="text-sm text-slate-500">
                              To kryterium nie wymagało zmian w Twoim cenniku - jest już dobrze zoptymalizowane.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                        <button
                          onClick={() => setCriterionModalOpen(null)}
                          className="w-full py-2.5 px-4 bg-[#D4A574] hover:bg-[#C9956C] text-white font-medium rounded-xl transition-colors"
                        >
                          Rozumiem
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })()}

              {/* Card 3: Recommendations */}
              <motion.div
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.3 }}
                className="group relative h-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
              >
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
                <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Sugestie</span>
                    <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                      {optimizationResult.recommendations?.length || 0} wskazówek
                    </span>
                  </div>

                  <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800 mb-4">
                    Dodatkowe rekomendacje
                  </h3>

                  {optimizationResult.recommendations && optimizationResult.recommendations.length > 0 ? (
                    <div className="space-y-2">
                      {optimizationResult.recommendations.slice(0, 3).map((rec, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-2.5 bg-amber-50/50 rounded-lg border border-amber-100"
                        >
                          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-amber-700">{idx + 1}</span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{rec}</p>
                        </div>
                      ))}
                      {optimizationResult.recommendations.length > 3 && (
                        <p className="text-xs text-slate-400 text-center pt-1">
                          +{optimizationResult.recommendations.length - 3} więcej sugestii
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                        <Check className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="text-sm text-slate-600">Cennik jest w pełni zoptymalizowany!</p>
                      <p className="text-xs text-slate-400 mt-1">Brak dodatkowych sugestii</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Original Pricelist Tab Content */}
        {activeTab === 'original' && originalPricingData && (
          <motion.div
            key="original"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2" ref={originalPricelistRef}>
                <FullPricelistDisplay
                  data={originalPricingData}
                  theme={themeConfig}
                  templateId={templateId}
                  label="Oryginalny cennik"
                  variant="original"
                />
              </div>
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                  {/* Pricelist Info Card */}
                  <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
                    <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                    <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
                    <div className="relative z-10 overflow-hidden rounded-xl bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Informacje o cenniku</span>
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Nazwa</span>
                          <span className="font-medium text-slate-800 truncate max-w-[150px]">{originalPricingData.salonName || 'Cennik'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Data</span>
                          <span className="font-medium text-slate-800">{new Date().toLocaleDateString('pl-PL')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">ID</span>
                          <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{(savedPricelistId || pricelistId || draftId || '—').toString().slice(-8)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Szablon</span>
                          <span className="font-medium text-slate-800 capitalize">{templateId}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Kolorystyka</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: themeConfig.primaryColor }} />
                            <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: themeConfig.secondaryColor }} />
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-100 mt-2">
                          <button
                            onClick={handleExportOriginalPDF}
                            disabled={isExportingOriginalPDF}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isExportingOriginalPDF ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Eksportowanie...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                <span>Pobierz PDF</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <EmbedCode pricelistId={savedPricelistId || pricelistId} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Optimized Pricelist Tab Content */}
        {activeTab === 'optimized' && optimizedPricingData && (
          <motion.div
            key="optimized"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2" ref={optimizedPricelistRef}>
                <FullPricelistDisplay
                  data={optimizedPricingData}
                  theme={themeConfig}
                  templateId={templateId}
                  label="Zoptymalizowany cennik"
                  variant="optimized"
                />
              </div>
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                  {/* Pricelist Info Card */}
                  <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
                    <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                    <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
                    <div className="relative z-10 overflow-hidden rounded-xl bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-[#D4A574]" />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Cennik zoptymalizowany</span>
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Nazwa</span>
                          <span className="font-medium text-slate-800 truncate max-w-[150px]">{optimizedPricingData.salonName || 'Cennik'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Data</span>
                          <span className="font-medium text-slate-800">{new Date().toLocaleDateString('pl-PL')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">ID</span>
                          <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{(savedPricelistId || pricelistId || draftId || '—').toString().slice(-8)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Szablon</span>
                          <span className="font-medium text-slate-800 capitalize">{templateId}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Kolorystyka</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: themeConfig.primaryColor }} />
                            <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: themeConfig.secondaryColor }} />
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-100 mt-2">
                          <button
                            onClick={handleExportOptimizedPDF}
                            disabled={isExportingOptimizedPDF}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#D4A574] hover:bg-[#C9956C] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isExportingOptimizedPDF ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Eksportowanie...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                <span>Pobierz PDF</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <EmbedCode pricelistId={savedPricelistId || pricelistId} />

                  {/* Save CTA */}
                  {!isViewOnlyMode && optimizationResult && (
                    <RainbowButton onClick={handleGoToProfile} className="w-full h-11 text-sm">
                      Zapisz cennik
                      <ArrowRight size={16} />
                    </RainbowButton>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Changes List Tab Content */}
        {activeTab === 'changes' && optimizationResult && (
          <motion.div
            key="changes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {optimizationResult.changes.length === 0 ? (
              <div className="group relative h-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3">
                <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-xl bg-white p-12 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)] text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Cennik jest już zoptymalizowany!
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Nie znaleźliśmy żadnych elementów wymagających poprawy w Twoim cenniku.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Group changes by criteria */}
                {[
                  { key: 'descriptions', label: 'Język korzyści w opisach', types: ['description_added', 'description_improved'], icon: MessageSquareText },
                  { key: 'seo', label: 'Słowa kluczowe SEO', types: ['name_improved'], icon: Type },
                  { key: 'categories', label: 'Struktura kategorii', types: ['category_renamed', 'category_reordered'], icon: Layers },
                  { key: 'order', label: 'Kolejność usług', types: ['service_reordered'], icon: Layers },
                  { key: 'prices', label: 'Formatowanie cen', types: ['price_formatted'], icon: FileText },
                  { key: 'duplicates', label: 'Duplikaty i błędy', types: ['duplicate_merged', 'typo_fixed'], icon: Trash2 },
                  { key: 'duration', label: 'Szacowanie czasu', types: ['duration_estimated'], icon: RefreshCw },
                  { key: 'tags', label: 'Tagi i oznaczenia', types: ['tag_added'], icon: Sparkles },
                ].map(({ key, label, types, icon: Icon }) => {
                  const groupChanges = optimizationResult.changes.filter(c => types.includes(c.type));
                  if (groupChanges.length === 0) return null;

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      className="group relative h-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
                    >
                      <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                      <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
                      <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                        <div className="px-6 py-4 border-b border-slate-100">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#D4A574]/10 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-[#D4A574]" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-slate-900">{label}</h3>
                                <p className="text-xs text-slate-500 mt-0.5 max-w-md leading-relaxed">
                                  {criterionExplanations[key]?.description}
                                </p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full shrink-0">
                              {groupChanges.length} {groupChanges.length === 1 ? 'zmiana' : groupChanges.length < 5 ? 'zmiany' : 'zmian'}
                            </span>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="space-y-2">
                            {groupChanges.map((change, idx) => {
                              const typeInfo = changeTypeLabels[change.type] || { label: change.type, color: '#6B7280' };
                              return (
                                <div
                                  key={idx}
                                  className="p-3 rounded-xl bg-slate-50 border border-slate-100"
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className="px-2 py-0.5 rounded text-xs font-medium shrink-0"
                                      style={{
                                        backgroundColor: `${typeInfo.color}15`,
                                        color: typeInfo.color,
                                      }}
                                    >
                                      {typeInfo.label}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 text-sm flex-wrap">
                                        <span className="text-slate-400 line-through">
                                          {change.originalValue || '(brak)'}
                                        </span>
                                        <ArrowRight size={14} className="text-slate-300 shrink-0" />
                                        <span className="text-slate-900 font-medium">
                                          {change.newValue}
                                        </span>
                                      </div>
                                      {change.reason && (
                                        <p className="text-xs text-slate-500 mt-1.5 italic">
                                          {change.reason}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Suggestions Tab Content */}
        {activeTab === 'suggestions' && optimizationResult && (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {optimizationResult.recommendations.length === 0 ? (
              <div className="group relative h-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3">
                <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-xl bg-white p-12 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)] text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Brak dodatkowych sugestii
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Twój cennik jest w pełni zoptymalizowany. Wszystkie automatyczne poprawki zostały już zastosowane.
                  </p>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                className="group relative h-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
              >
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
                <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900">Dodatkowe rekomendacje</h3>
                      <p className="text-sm text-slate-500">
                        Sugestie, które mogą jeszcze bardziej ulepszyć Twój cennik
                      </p>
                    </div>
                    <span className="ml-auto px-3 py-1 bg-amber-100 text-amber-700 text-sm font-bold rounded-full">
                      {optimizationResult.recommendations.length} {optimizationResult.recommendations.length === 1 ? 'sugestia' : optimizationResult.recommendations.length < 5 ? 'sugestie' : 'sugestii'}
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      {optimizationResult.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-4 p-4 rounded-xl bg-amber-50/50 border border-amber-100"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-amber-700">{idx + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-700 leading-relaxed">{rec}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default OptimizationResultsPage;
