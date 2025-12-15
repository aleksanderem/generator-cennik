"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useAction } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
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
  Eye,
  Zap,
} from 'lucide-react';
import { exportToPDFFromData } from '../../lib/pricelist-templates/utils/pdfExport';
import { PricingData, OptimizationResult, ThemeConfig, DEFAULT_THEME, PricelistCategoryConfig } from '../../types';
import { RainbowButton } from '../ui/rainbow-button';
import { Button } from '../ui/button';
import { HeroHighlight } from '../ui/hero-highlight';
import { BlurFade } from '../ui/blur-fade';
import { AuroraText } from '../ui/aurora-text';
import { optimizePricelist } from '../../services/geminiService';
import { getTemplate } from '../../lib/pricelist-templates';
import type { Id } from '../../convex/_generated/dataModel';
import Header from '../layout/Header';
import { AnimatedCircularProgressBar } from '../ui/animated-circular-progress-bar';
import { StripedPattern } from '../ui/striped-pattern';
import EmbedCode from '../EmbedCode';
import CategoryConfigStep from '../CategoryConfigStep';
import { applyConfigToPricingData, serializeCategoryConfig } from '../../lib/categoryUtils';
import { MultiStepLoader } from '../ui/multi-step-loader';

// Loading states for the multi-step loader (mapped to geminiService progress)
const optimizationLoadingStates = [
  { text: "Przygotowuję cennik do analizy..." },
  { text: "Analizuję strukturę i nazwy usług..." },
  { text: "Optymalizuję opisy i copywriting..." },
  { text: "Weryfikuję wyniki optymalizacji..." },
  { text: "Zapisuję zoptymalizowany cennik..." },
];

// Map progress messages from geminiService to step numbers
const mapProgressToStep = (msg: string): number => {
  if (msg.includes("pamięci podręcznej")) return 4; // Cache hit = skip to end
  if (msg.includes("Analizuję cennik")) return 1;
  if (msg.includes("Optymalizuję nazwy")) return 2;
  if (msg.includes("Weryfikuję")) return 3;
  if (msg.includes("zakończona")) return 4;
  return 0;
};

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
  label?: string;
  variant: 'original' | 'optimized';
  isLoading?: boolean;
  showLabel?: boolean;
}> = ({ data, theme, templateId, label, variant, isLoading, showLabel = true }) => {
  const isOriginal = variant === 'original';
  const template = getTemplate(templateId);
  const TemplateComponent = template?.Component;

  return (
    <div className="relative">
      {showLabel && label && (
        <div className="mb-3 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isOriginal ? 'bg-slate-400' : 'bg-[#D4A574]'}`}
          />
          <span className={`text-sm font-semibold ${isOriginal ? 'text-slate-500' : 'text-[#D4A574]'}`}>
            {label}
          </span>
        </div>
      )}

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
  const { isLoaded: isAuthLoaded, isSignedIn } = useUser();

  // Get pricelist ID from URL - draft mode is no longer supported
  const pricelistId = searchParams.get('pricelist') as Id<"pricelists"> | null;
  const sessionId = searchParams.get('session_id');

  // Step flow: configure (category setup) -> optimizing (AI running) -> results (display)
  const [flowStep, setFlowStep] = useState<'configure' | 'optimizing' | 'results'>('configure');
  const [categoryConfig, setCategoryConfig] = useState<PricelistCategoryConfig | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStep, setOptimizationStep] = useState(0);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [originalPricingData, setOriginalPricingData] = useState<PricingData | null>(null);
  const [optimizedPricingData, setOptimizedPricingData] = useState<PricingData | null>(null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const [templateId, setTemplateId] = useState<string>('modern');
  const [error, setError] = useState<string | null>(null);
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
  const [criterionModalOpen, setCriterionModalOpen] = useState<string | null>(null);
  const optimizationTriggered = useRef(false);
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
  const existingPricelist = useQuery(
    api.pricelists.getPricelist,
    pricelistId ? { pricelistId } : "skip"
  );
  // Secondary query to check access - helps detect race conditions
  // where getPricelist returns null before auth is ready
  const accessCheck = useQuery(
    api.pricelists.checkPricelistAccess,
    pricelistId ? { pricelistId } : "skip"
  );

  const updatePricelist = useMutation(api.pricelists.updatePricelist);
  const verifySession = useAction(api.stripe.verifySession);

  // Load pricelist data
  useEffect(() => {
    // Debug logging
    console.log('[OptimizationResults] Pricelist loading state:', {
      pricelistId,
      isAuthLoaded,
      isSignedIn,
      existingPricelist: existingPricelist === undefined ? 'loading' : existingPricelist === null ? 'not found' : 'found',
    });

    // Wait for auth to be loaded before showing "not found" error
    // This prevents false negatives when Clerk is still loading after Stripe redirect
    if (!isAuthLoaded) {
      return;
    }

    // Handle not signed in
    if (!isSignedIn) {
      setError('Musisz być zalogowany, aby zobaczyć wyniki optymalizacji.');
      return;
    }

    // Handle pricelist not found (only after auth is confirmed AND accessCheck confirms no access)
    // This prevents race condition where getPricelist returns null before auth is ready
    if (pricelistId && existingPricelist === null) {
      // Wait for accessCheck to confirm - it runs with same auth state
      if (accessCheck && accessCheck.hasIdentity && !accessCheck.hasAccess) {
        // Auth is ready and we confirmed no access
        if (!accessCheck.pricelistExists) {
          setError('Cennik nie istnieje.');
        } else {
          setError(`Nie masz dostępu do tego cennika.`);
        }
      }
      // Otherwise keep waiting - query might re-run with proper auth
      return;
    }

    if (existingPricelist) {
      // Clear any previous error - pricelist found!
      setError(null);
      try {
        // If pricelist is already optimized, load both original and optimized data
        if (existingPricelist.isOptimized && existingPricelist.originalPricingDataJson) {
          const origData = JSON.parse(existingPricelist.originalPricingDataJson);
          const optimizedData = JSON.parse(existingPricelist.pricingDataJson);
          setOriginalPricingData(origData);
          setOptimizedPricingData(optimizedData);

          // Load optimization result if available
          if (existingPricelist.optimizationResultJson) {
            const result = JSON.parse(existingPricelist.optimizationResultJson) as OptimizationResult;
            setOptimizationResult(result);
          }

          // Already optimized - skip to results
          setFlowStep('results');
        } else {
          // Not yet optimized - load current data as original
          const data = JSON.parse(existingPricelist.pricingDataJson);
          setOriginalPricingData(data);
        }

        // Load theme and template
        if (existingPricelist.themeConfigJson) {
          setThemeConfig(JSON.parse(existingPricelist.themeConfigJson));
        }
        if (existingPricelist.templateId) {
          setTemplateId(existingPricelist.templateId);
        }

        // Load saved category config (for "Edytuj kategorie" feature)
        if (existingPricelist.categoryConfigJson) {
          try {
            const savedConfig = JSON.parse(existingPricelist.categoryConfigJson) as PricelistCategoryConfig;
            setCategoryConfig(savedConfig);
            console.log('[OptimizationResults] Loaded saved category config');
          } catch (e) {
            console.warn('Error parsing category config:', e);
          }
        }

        console.log('[OptimizationResults] Pricelist data loaded successfully');
      } catch (e) {
        console.error('Error parsing pricelist data:', e);
        setError('Błąd wczytywania danych cennika');
      }
    }
  }, [existingPricelist, pricelistId, isAuthLoaded, isSignedIn, accessCheck]);

  // Verify payment - only verify, don't run optimization yet
  const [paymentVerified, setPaymentVerified] = useState(false);
  useEffect(() => {
    // Skip if no pricelist or already verified
    if (!pricelistId || paymentVerified) {
      return;
    }

    // If pricelist is already optimized, skip to results (handled in load effect)
    if (existingPricelist?.isOptimized) {
      setPaymentVerified(true);
      return;
    }

    // If pricelist has purchaseId but is not optimized, payment was already made
    // Allow user to continue to CategoryConfigStep without re-verifying
    if (existingPricelist?.purchaseId && !existingPricelist?.isOptimized) {
      console.log('[Payment] Pricelist has purchaseId, allowing to continue optimization');
      setPaymentVerified(true);
      return;
    }

    // If there's a sessionId, verify the payment with Stripe
    if (sessionId) {
      const verifyPayment = async () => {
        try {
          const verification = await verifySession({ sessionId });
          if (verification.success) {
            setPaymentVerified(true);
            // Stay on 'configure' step to let user configure categories
          } else {
            setError('Płatność nie została zweryfikowana. Spróbuj ponownie.');
          }
        } catch (e) {
          console.error('[Payment] Verification error:', e);
          setError('Błąd weryfikacji płatności.');
        }
      };
      verifyPayment();
    }
  }, [sessionId, pricelistId, paymentVerified, existingPricelist?.isOptimized, existingPricelist?.purchaseId, verifySession]);

  // Handle category configuration complete - run optimization
  const handleCategoryConfigComplete = async (config: PricelistCategoryConfig) => {
    if (!originalPricingData || !pricelistId) return;

    setCategoryConfig(config);
    setFlowStep('optimizing');
    setIsOptimizing(true);
    setOptimizationStep(0);
    optimizationTriggered.current = true;

    try {
      // Apply category configuration to pricing data before optimization
      const configuredData = applyConfigToPricingData(originalPricingData, config);

      // Run AI optimization on configured data with progress callback
      console.log('[Optimization] Starting AI optimization with category config...');
      const result = await optimizePricelist(configuredData, (progressMsg) => {
        console.log('[Optimization Progress]', progressMsg);
        const step = mapProgressToStep(progressMsg);
        setOptimizationStep(step);
      });
      console.log('[Optimization] Completed with', result.changes.length, 'changes');

      setOptimizationResult(result);
      setOptimizedPricingData(result.optimizedPricingData);
      setFlowStep('results');

      // Update pricelist with optimized data AND store original for comparison
      await updatePricelist({
        pricelistId,
        pricingDataJson: JSON.stringify(result.optimizedPricingData),
        isOptimized: true,
        originalPricingDataJson: JSON.stringify(originalPricingData),
        optimizationResultJson: JSON.stringify(result),
        categoryConfigJson: serializeCategoryConfig(config),
      });

      console.log('[Optimization] Pricelist updated successfully');

      // Fire confetti on success
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (e) {
      console.error('[Optimization] Error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Nieznany błąd';
      setError(`Wystąpił błąd podczas optymalizacji: ${errorMessage}`);
      setFlowStep('configure'); // Go back to configure step on error
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handle cancel from category config
  const handleCategoryConfigCancel = () => {
    navigate('/start-generator' + (pricelistId ? `?pricelist=${pricelistId}` : ''));
  };


  // Handle go to profile - pricelists are now auto-saved
  const handleGoToProfile = () => {
    navigate('/profil');
  };

  // Handle PDF export for original pricelist
  const handleExportOriginalPDF = async () => {
    if (!originalPricingData || isExportingOriginalPDF) return;
    setIsExportingOriginalPDF(true);
    try {
      const salonName = originalPricingData.salonName || 'cennik-oryginalny';
      const filename = salonName.toLowerCase().replace(/\s+/g, '-') + '-oryginalny';
      await exportToPDFFromData(originalPricingData, { filename });
    } finally {
      setIsExportingOriginalPDF(false);
    }
  };

  // Handle PDF export for optimized pricelist
  const handleExportOptimizedPDF = async () => {
    if (!optimizedPricingData || isExportingOptimizedPDF) return;
    setIsExportingOptimizedPDF(true);
    try {
      const salonName = optimizedPricingData.salonName || 'cennik-zoptymalizowany';
      const filename = salonName.toLowerCase().replace(/\s+/g, '-') + '-zoptymalizowany';
      await exportToPDFFromData(optimizedPricingData, { filename });
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

  // Loading state - wait for auth and pricelist data
  const isLoading = !isAuthLoaded || !existingPricelist || !originalPricingData;

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

  // Optimizing state - show MultiStepLoader overlay with real progress
  if (isOptimizing) {
    return (
      <MultiStepLoader
        loadingStates={optimizationLoadingStates}
        loading={isOptimizing}
        value={optimizationStep}
      />
    );
  }

  // Category Configuration Step (shown after payment verification, before optimization)
  if (paymentVerified && flowStep === 'configure' && originalPricingData) {
    return (
      <CategoryConfigStep
        pricingData={originalPricingData}
        onConfigComplete={handleCategoryConfigComplete}
        onCancel={handleCategoryConfigCancel}
        isLoading={isOptimizing}
        initialConfig={categoryConfig}
      />
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
        onNavigate={() => { }}
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
                        // Navigate to generator with pricelist, will load original data
                        if (pricelistId) {
                          navigate(`/start-generator?pricelist=${pricelistId}&mode=original`);
                        }
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
                  <div className="flex border-b border-slate-200">
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
                        // Navigate to generator with optimized pricelist
                        if (pricelistId) {
                          navigate(`/start-generator?pricelist=${pricelistId}`);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 hover:bg-[#D4A574]/5 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-[#D4A574]" />
                      <span className="text-sm text-slate-700">Edytuj</span>
                    </button>
                  </div>

                  {/* Edytuj kategorie - re-run optimization with new config */}
                  <button
                    onClick={() => {
                      setIsActionsDropdownOpen(false);
                      // Go back to category config step to reconfigure and re-optimize
                      setFlowStep('configure');
                      setPaymentVerified(true);
                      setOptimizationResult(null);
                      setOptimizedPricingData(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition-colors"
                  >
                    <Layers className="w-4 h-4 text-amber-600" />
                    <div className="text-left">
                      <span className="text-sm font-medium text-slate-700">Edytuj kategorie</span>
                      <p className="text-xs text-slate-500">Zmień kolejność i uruchom optymalizację ponownie</p>
                    </div>
                  </button>
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
            {/* Hero Section - New Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              {/* Left Column: Quality + Sales Potential in ONE card */}
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
                      {optimizationResult.qualityScore >= 80 ? 'Wysoka' : optimizationResult.qualityScore >= 60 ? 'Dobra' : 'Średnia'}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 mb-6">
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

                  {/* Divider */}
                  <div className="border-t border-slate-100 my-2" />

                  {/* Sales Potential Section */}
                  <div className="flex items-center gap-2 mb-4 mt-4">
                    <Sparkles className="w-4 h-4 text-[#D4A574]" />
                    <span className="text-sm text-slate-400 uppercase tracking-wide">Potencjał Sprzedażowy</span>
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

                  {/* Stats summary */}
                  <div className="mt-6 bg-slate-50 rounded-2xl p-5 flex flex-col justify-evenly">
                    <div className="flex items-center justify-center gap-2 mb-5">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400 uppercase tracking-wide">Statystyki</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {(() => {
                        const originalCategories = originalPricingData?.categories.length || 0;
                        const optimizedCategories = optimizedPricingData?.categories.length || 0;
                        const categoriesDelta = optimizedCategories - originalCategories;
                        return (
                          <div className="text-center p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <p className="text-2xl font-bold text-slate-800">{optimizedCategories}</p>
                              {categoriesDelta !== 0 && (
                                <span className={`flex items-center text-sm font-semibold ${categoriesDelta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  <TrendingUp className={`w-3 h-3 mr-0.5 ${categoriesDelta < 0 ? 'rotate-180' : ''}`} />
                                  {categoriesDelta > 0 ? '+' : ''}{categoriesDelta}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">kategorii</p>
                          </div>
                        );
                      })()}
                      <div className="text-center p-3">
                        <p className="text-2xl font-bold text-slate-800">{optimizationResult.summary.totalChanges}</p>
                        <p className="text-sm text-slate-500 mt-0.5">zmian</p>
                      </div>
                      {(() => {
                        const originalServices = originalPricingData?.categories.reduce((acc, cat) => acc + cat.services.length, 0) || 0;
                        const optimizedServices = optimizedPricingData?.categories.reduce((acc, cat) => acc + cat.services.length, 0) || 0;
                        const servicesDelta = optimizedServices - originalServices;
                        return (
                          <div className="text-center p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <p className="text-2xl font-bold text-slate-800">{optimizedServices}</p>
                              {servicesDelta !== 0 && (
                                <span className={`flex items-center text-sm font-semibold ${servicesDelta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  <TrendingUp className={`w-3 h-3 mr-0.5 ${servicesDelta < 0 ? 'rotate-180' : ''}`} />
                                  {servicesDelta > 0 ? '+' : ''}{servicesDelta}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">usług</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Quick Actions + Optimization Summary */}
              <div className="space-y-4">
                {/* Quick Actions Card */}
                <motion.div
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 0.15 }}
                  className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
                >
                  <StripedPattern
                    className="text-slate-300"
                    style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                  <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
                  <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4 text-[#D4A574]" />
                      <span className="text-sm text-slate-400 uppercase tracking-wide">Szybkie akcje</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setActiveTab('optimized')}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Eye className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Zobacz cennik</span>
                        <p className="text-xs text-slate-500 text-center">Podgląd zoptymalizowanego cennika</p>
                      </button>
                      <button
                        onClick={handleExportOptimizedPDF}
                        disabled={isExportingOptimizedPDF}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50"
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          {isExportingOptimizedPDF ? (
                            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                          ) : (
                            <Download className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-700">Pobierz PDF</span>
                        <p className="text-xs text-slate-500 text-center">Eksportuj cennik do pliku PDF</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('changes')}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Lista zmian</span>
                        <p className="text-xs text-slate-500 text-center">Wszystkie wprowadzone zmiany</p>
                      </button>
                      <button
                        onClick={handleGoToProfile}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <ArrowRight className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Mój profil</span>
                        <p className="text-xs text-slate-500 text-center">Przejdź do panelu użytkownika</p>
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Optimization Summary Card */}
                <motion.div
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 0.2 }}
                  className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
                >
                  <StripedPattern
                    className="text-slate-300"
                    style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                  <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
                  <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquareText className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400 uppercase tracking-wide">Podsumowanie optymalizacji</span>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {(() => {
                        const descCount = optimizationResult.changes.filter(c => c.type === 'description_added' || c.type === 'description_improved').length;
                        const seoCount = optimizationResult.changes.filter(c => c.type === 'name_improved').length;
                        const catCount = optimizationResult.changes.filter(c => c.type === 'category_renamed' || c.type === 'category_reordered').length;
                        const tagCount = optimizationResult.changes.filter(c => c.type === 'tag_added').length;
                        const dupeCount = optimizationResult.changes.filter(c => c.type === 'duplicate_merged' || c.type === 'typo_fixed').length;

                        const parts: Array<string> = [];
                        if (descCount > 0) parts.push(`dodano lub poprawiono ${descCount} ${descCount === 1 ? 'opis usługi' : descCount < 5 ? 'opisy usług' : 'opisów usług'} z językiem korzyści`);
                        if (seoCount > 0) parts.push(`zoptymalizowano ${seoCount} ${seoCount === 1 ? 'nazwę' : seoCount < 5 ? 'nazwy' : 'nazw'} pod kątem SEO`);
                        if (catCount > 0) parts.push(`uporządkowano ${catCount} ${catCount === 1 ? 'kategorię' : catCount < 5 ? 'kategorie' : 'kategorii'}`);
                        if (tagCount > 0) parts.push(`dodano ${tagCount} ${tagCount === 1 ? 'tag' : tagCount < 5 ? 'tagi' : 'tagów'} do usług`);
                        if (dupeCount > 0) parts.push(`naprawiono ${dupeCount} ${dupeCount === 1 ? 'błąd' : dupeCount < 5 ? 'błędy' : 'błędów'} i duplikaty`);

                        if (parts.length === 0) {
                          return 'Twój cennik był już dobrze zoptymalizowany. Nie znaleźliśmy elementów wymagających poprawy.';
                        }

                        return `AI przeanalizowało Twój cennik i wprowadziło ${optimizationResult.summary.totalChanges} zmian: ${parts.join(', ')}.`;
                      })()}
                    </p>

                    {optimizationResult.recommendations && optimizationResult.recommendations.length > 0 && (
                      <p className="text-sm text-slate-500 mt-3">
                        Dodatkowo przygotowaliśmy {optimizationResult.recommendations.length} {optimizationResult.recommendations.length === 1 ? 'rekomendację' : optimizationResult.recommendations.length < 5 ? 'rekomendacje' : 'rekomendacji'} do samodzielnego wdrożenia.
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              {/* Card 1: Zakres optymalizacji */}
              <motion.div
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.2 }}
                className="group relative h-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
              >
                <StripedPattern
                  className="text-slate-300"
                  style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
                />
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
                <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#D4A574]" />
                    <span className="text-sm text-slate-400 uppercase tracking-wide">Zakres</span>
                  </div>

                  <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800 mb-1">
                    Kryteria optymalizacji
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">Kliknij znak zapytania, aby dowiedzieć się więcej</p>

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
                        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm transition-colors ${item.active
                          ? 'bg-emerald-50'
                          : 'bg-slate-50/50'
                          }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className={`flex-1 ${item.active ? 'text-slate-700' : 'text-slate-400'}`}>
                          {item.label}
                        </span>
                        {item.active && item.count > 0 && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
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
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
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
                  variant="original"
                  showLabel={false}
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
                          <span className="text-slate-500">Typ</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                            <span className="font-medium text-slate-600">Oryginalny</span>
                          </div>
                        </div>
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
                          <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{(pricelistId || '—').toString().slice(-8)}</span>
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

                  <EmbedCode pricelistId={pricelistId} />
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
                  variant="optimized"
                  showLabel={false}
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
                          <span className="text-slate-500">Typ</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#D4A574]" />
                            <span className="font-medium text-[#D4A574]">Zoptymalizowany</span>
                          </div>
                        </div>
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
                          <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{(pricelistId || '—').toString().slice(-8)}</span>
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

                  <EmbedCode pricelistId={pricelistId} />

                  {/* Go to Profile CTA */}
                  {optimizationResult && (
                    <RainbowButton onClick={handleGoToProfile} className="w-full h-11 text-sm">
                      Zobacz w profilu
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
