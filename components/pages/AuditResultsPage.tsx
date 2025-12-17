"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'motion/react';
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  FileSearch,
  Eye,
  Download,
  ArrowRight,
  Sparkles,
  MessageSquareText,
  Check,
  TrendingUp,
  RefreshCw,
  Zap,
  Layers,
  Lightbulb,
  HelpCircle,
  X,
  FileText,
  Scissors,
  BarChart3,
} from 'lucide-react';
import type { Id } from '../../convex/_generated/dataModel';
import { AuditResult, PricingData, ThemeConfig, DEFAULT_THEME, OptimizationResult, ServiceItem } from '../../types';
import { exportToPDFFromData } from '../../lib/pricelist-templates/utils/pdfExport';

// Import reusable results components
import {
  ResultsLayout,
  ResultsTabNavigation,
  FullPricelistDisplay,
  PricelistInfoSidebar,
  QualityScoreCard,
  QuickActionsCard,
  KeywordReportCard,
  CategoryProposalCard,
  OptimizationOptionsCard,
  CategoryEditorModal,
  type Tab,
  type QuickAction,
  type OptimizationOptionType,
} from '../results';
import AuditReportTab from '../AuditReportTab';
import { RainbowButton } from '../ui/rainbow-button';
import { StripedPattern } from '../ui/striped-pattern';
import { BorderBeam } from '../ui/border-beam';
import { MultiStepLoader } from '../ui/multi-step-loader';
import { AnimatedCircularProgressBar } from '../ui/animated-circular-progress-bar';

// Criterion explanations for the modal
const criterionExplanations: Record<string, { title: string; description: string }> = {
  descriptions: {
    title: 'Język korzyści w opisach',
    description: 'Opisy usług powinny podkreślać korzyści dla klienta, a nie tylko cechy techniczne. Np. zamiast "zabieg trwa 60 minut" lepiej "60 minut relaksu i regeneracji". Dzięki temu klienci lepiej rozumieją wartość usługi i chętniej ją wybierają.',
  },
  seo: {
    title: 'Słowa kluczowe SEO',
    description: 'Nazwy usług powinny zawierać słowa kluczowe, które klienci wpisują w Google. To pomaga w pozycjonowaniu Twojego cennika i zwiększa widoczność w wyszukiwarkach.',
  },
  categories: {
    title: 'Struktura kategorii',
    description: 'Logiczna struktura kategorii ułatwia klientom nawigację po cenniku. Kategorie powinny być intuicyjne i grupować podobne usługi.',
  },
  order: {
    title: 'Kolejność usług',
    description: 'Kolejność usług w kategorii wpływa na konwersję. Najpopularniejsze lub najbardziej dochodowe usługi powinny być na górze.',
  },
  prices: {
    title: 'Formatowanie cen',
    description: 'Spójne formatowanie cen (np. "150 zł" zamiast "150,-") zwiększa profesjonalizm cennika i ułatwia porównywanie.',
  },
  duplicates: {
    title: 'Duplikaty i błędy',
    description: 'Duplikaty usług i błędy w nazwach obniżają profesjonalizm cennika i mogą dezorientować klientów.',
  },
  duration: {
    title: 'Szacowanie czasu',
    description: 'Podanie czasu trwania usługi pomaga klientom planować wizyty i zwiększa transparentność oferty.',
  },
  tags: {
    title: 'Tagi i oznaczenia',
    description: 'Tagi jak "Bestseller" lub "Nowość" przyciągają uwagę i pomagają wyróżnić kluczowe usługi.',
  },
};

// Map criterion keys to change types
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

type AuditTabType = 'report' | 'analysis' | 'summary' | 'original' | 'optimized';

/**
 * AuditResultsPage - Displays audit results with reusable components
 *
 * URL: /audit-results?audit=<auditId>
 *
 * Tabs:
 * - Raport z audytu: AuditReportTab widgets
 * - Podsumowanie: QualityScoreCard + QuickActionsCard + optimization summary
 * - Cennik pobrany z Booksy: Original pricelist from Booksy
 * - Zoptymalizowany cennik Booksy: Optimized PRO pricelist (with loading indicator if generating)
 */
const AuditResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auditId = searchParams.get('audit') as Id<"audits"> | null;

  const [activeTab, setActiveTab] = useState<AuditTabType>('report');
  const [isExportingOriginalPDF, setIsExportingOriginalPDF] = useState(false);
  const [isExportingOptimizedPDF, setIsExportingOptimizedPDF] = useState(false);
  const [dismissedErrorJobId, setDismissedErrorJobId] = useState<string | null>(null);
  const [isRefetchingFromBooksy, setIsRefetchingFromBooksy] = useState(false);
  const [criterionModalOpen, setCriterionModalOpen] = useState<string | null>(null);
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);

  // Convex mutations for background optimization
  const startOptimization = useMutation(api.optimizationJobs.startOptimization);
  const refetchFromBooksy = useMutation(api.pricelists.refetchFromBooksy);

  // Fetch audit data
  const audit = useQuery(
    api.audits.getAudit,
    auditId ? { auditId } : "skip"
  );

  // Fetch linked PRO pricelist
  const proPricelist = useQuery(
    api.pricelists.getPricelist,
    audit?.proPricelistId ? { pricelistId: audit.proPricelistId } : "skip"
  );

  // Fetch optimization job status (real-time updates from backend)
  const optimizationJob = useQuery(
    api.optimizationJobs.getJobForPricelist,
    audit?.proPricelistId ? { pricelistId: audit.proPricelistId } : "skip"
  );

  // Fetch multi-step analysis data
  const keywordReport = useQuery(
    api.auditAnalysisQueries.getKeywordReportForAudit,
    auditId ? { auditId } : "skip"
  );

  const categoryProposal = useQuery(
    api.auditAnalysisQueries.getCategoryProposalForAudit,
    auditId ? { auditId } : "skip"
  );

  // Mutations for analysis workflow
  const updateProposalStatus = useMutation(api.auditAnalysisQueries.updateCategoryProposalStatus);
  const saveOptimizationOptions = useMutation(api.auditAnalysisQueries.saveOptimizationOptions);

  // Local state for selected optimization options
  const [selectedOptimizationOptions, setSelectedOptimizationOptions] = useState<OptimizationOptionType[]>([
    'descriptions', 'seo', 'order', 'prices', 'duplicates', 'tags'
  ]);

  // Derived optimization state from job
  const isJobRunning = optimizationJob?.status === "pending" || optimizationJob?.status === "processing";
  const jobProgress = optimizationJob?.progress ?? 0;
  const jobMessage = optimizationJob?.progressMessage ?? "";
  const jobCurrentStep = optimizationJob?.currentStep ?? 0;
  const jobError = optimizationJob?.status === "failed" ? optimizationJob.errorMessage : null;

  // Track previous job status to detect status transitions (not just current state)
  const prevJobStatusRef = React.useRef<string | null>(null);

  // Auto-switch to optimized tab ONLY when job transitions from "processing" to "completed"
  // This prevents auto-switching when the page is refreshed after optimization is already done
  useEffect(() => {
    const currentStatus = optimizationJob?.status ?? null;
    const prevStatus = prevJobStatusRef.current;

    // Only auto-switch if we just transitioned FROM "processing" TO "completed"
    if (prevStatus === "processing" && currentStatus === "completed") {
      const timer = setTimeout(() => {
        setActiveTab("optimized");
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Update the ref with current status for next comparison
    prevJobStatusRef.current = currentStatus;
  }, [optimizationJob?.status]);

  // Parse audit report
  const auditReport: AuditResult | null = useMemo(() => {
    if (!audit?.reportJson) return null;
    try {
      return JSON.parse(audit.reportJson) as AuditResult;
    } catch (e) {
      console.error('Failed to parse audit reportJson:', e);
      return null;
    }
  }, [audit?.reportJson]);

  // Build loading states from audit recommendations
  const optimizationLoadingStates = useMemo(() => {
    const baseSteps = [
      { text: "Analizuję rekomendacje z audytu..." },
    ];

    // Add steps from audit recommendations (max 5)
    const recommendations = auditReport?.recommendations?.slice(0, 5) || [];
    recommendations.forEach((rec) => {
      // Truncate long recommendations
      const shortRec = rec.length > 60 ? rec.substring(0, 57) + '...' : rec;
      baseSteps.push({ text: `Wdrażam: ${shortRec}` });
    });

    // Add final steps
    baseSteps.push(
      { text: "Optymalizuję nazwy i opisy usług..." },
      { text: "Weryfikuję spójność cennika..." },
      { text: "Zapisuję zoptymalizowany cennik..." }
    );

    return baseSteps;
  }, [auditReport?.recommendations]);

  // Parse original pricelist data (from Booksy)
  const originalPricingData: PricingData | null = useMemo(() => {
    if (!audit?.rawData) return null;
    try {
      const raw = JSON.parse(audit.rawData);
      return {
        salonName: audit.salonName || 'Salon',
        categories: raw.categories || [],
      };
    } catch (e) {
      console.error('Failed to parse audit rawData:', e);
      return null;
    }
  }, [audit?.rawData, audit?.salonName]);

  // Parse optimized pricelist data
  const optimizedPricingData: PricingData | null = useMemo(() => {
    if (!proPricelist?.pricingDataJson) return null;
    try {
      return JSON.parse(proPricelist.pricingDataJson) as PricingData;
    } catch (e) {
      console.error('Failed to parse pricelist data:', e);
      return null;
    }
  }, [proPricelist?.pricingDataJson]);

  // Parse optimization result (for changes list)
  const optimizationResult: OptimizationResult | null = useMemo(() => {
    if (!proPricelist?.optimizationResultJson) return null;
    try {
      return JSON.parse(proPricelist.optimizationResultJson) as OptimizationResult;
    } catch (e) {
      console.error('Failed to parse optimization result:', e);
      return null;
    }
  }, [proPricelist?.optimizationResultJson]);

  /**
   * Pricelist optimization state machine:
   *
   * 1. NO_PRICELIST: audit.proPricelistId is null/undefined
   *    - No PRO pricelist exists yet
   *    - User needs to trigger optimization
   *
   * 2. LOADING: proPricelist === undefined
   *    - Convex query is still loading
   *
   * 3. OPTIMIZING: proPricelist exists but isOptimized !== true
   *    - PRO pricelist was created but optimization is in progress
   *
   * 4. OPTIMIZED_WITH_CHANGES: isOptimized === true AND changes.length > 0
   *    - Optimization completed with actual improvements
   *
   * 5. OPTIMIZED_NO_CHANGES: isOptimized === true AND changes.length === 0
   *    - Optimization ran but found nothing to improve
   *    - This is a valid state - pricelist was already good
   */
  type OptimizationState =
    | 'no_pricelist'
    | 'loading'
    | 'optimizing'
    | 'optimized_with_changes'
    | 'optimized_no_changes';

  const optimizationState: OptimizationState = useMemo(() => {
    // No PRO pricelist linked to audit
    if (!audit?.proPricelistId) return 'no_pricelist';

    // Query still loading
    if (proPricelist === undefined) return 'loading';

    // Pricelist exists but query returned null (shouldn't happen, but handle it)
    if (proPricelist === null) return 'no_pricelist';

    // Optimization in progress
    if (!proPricelist.isOptimized) return 'optimizing';

    // Optimization complete - check if there were changes
    const changesCount = optimizationResult?.changes?.length ?? 0;
    return changesCount > 0 ? 'optimized_with_changes' : 'optimized_no_changes';
  }, [audit?.proPricelistId, proPricelist, optimizationResult]);

  // Derived states for UI
  const isPricelistLoading = optimizationState === 'loading';
  const isPricelistOptimizing = optimizationState === 'optimizing';
  const isPricelistReady = optimizationState === 'optimized_with_changes' || optimizationState === 'optimized_no_changes';
  const hasOptimizationChanges = optimizationState === 'optimized_with_changes';
  const canViewOptimizedPricelist = isPricelistReady && optimizedPricingData !== null;

  // Theme config
  const themeConfig: ThemeConfig = useMemo(() => {
    if (!proPricelist?.themeConfigJson) return DEFAULT_THEME;
    try {
      return JSON.parse(proPricelist.themeConfigJson) as ThemeConfig;
    } catch {
      return DEFAULT_THEME;
    }
  }, [proPricelist?.themeConfigJson]);

  const templateId = proPricelist?.templateId || 'modern';

  // Tab configuration with loading indicators and disabled state
  const tabs: Tab[] = useMemo(() => {
    // Determine optimized tab label based on state
    let optimizedTabLabel = 'Zoptymalizowany cennik Booksy';
    let optimizedTabDisabled = false;

    if (isPricelistOptimizing) {
      optimizedTabLabel = 'Zoptymalizowany cennik Booksy ⏳';
      optimizedTabDisabled = true; // Disabled during optimization
    } else if (optimizationState === 'optimized_no_changes') {
      // No changes = nothing to show, disable the tab
      optimizedTabDisabled = true;
    } else if (!canViewOptimizedPricelist) {
      // No pricelist at all
      optimizedTabDisabled = true;
    }

    const baseTabs: Tab[] = [
      { id: 'report', label: 'Raport z audytu' },
      {
        id: 'analysis',
        label: 'Analiza AI',
        badge: keywordReport?.keywords?.length || undefined,
      },
      {
        id: 'summary',
        label: 'Podsumowanie',
        badge: hasOptimizationChanges ? optimizationResult?.changes.length : undefined,
      },
      { id: 'original', label: 'Cennik pobrany z Booksy' },
      {
        id: 'optimized',
        label: optimizedTabLabel,
        disabled: optimizedTabDisabled,
      },
    ];
    return baseTabs;
  }, [optimizationState, isPricelistOptimizing, hasOptimizationChanges, canViewOptimizedPricelist, optimizationResult?.changes.length, keywordReport?.keywords?.length]);

  // Handle PDF exports
  const handleExportOriginalPDF = async () => {
    if (!originalPricingData || isExportingOriginalPDF) return;
    setIsExportingOriginalPDF(true);
    try {
      const filename = (audit?.salonName || 'cennik-oryginalny').toLowerCase().replace(/\s+/g, '-') + '-oryginalny';
      await exportToPDFFromData(originalPricingData, { filename });
    } finally {
      setIsExportingOriginalPDF(false);
    }
  };

  const handleExportOptimizedPDF = async () => {
    if (!optimizedPricingData || isExportingOptimizedPDF) return;
    setIsExportingOptimizedPDF(true);
    try {
      const filename = (audit?.salonName || 'cennik-pro').toLowerCase().replace(/\s+/g, '-') + '-pro';
      await exportToPDFFromData(optimizedPricingData, { filename });
    } finally {
      setIsExportingOptimizedPDF(false);
    }
  };

  // Handle starting optimization process (now uses background jobs)
  const handleStartOptimization = async () => {
    if (!audit?.proPricelistId || isJobRunning) {
      return;
    }

    try {
      console.log('[AuditResults] Starting background optimization job...');

      // Start optimization as a background job
      await startOptimization({
        pricelistId: audit.proPricelistId,
        auditId: auditId ?? undefined,
        auditRecommendations: auditReport?.recommendations?.slice(0, 5),
      });

      console.log('[AuditResults] Optimization job started successfully');
      // The job status will be tracked via the optimizationJob query
      // UI will update automatically through Convex real-time subscriptions

    } catch (e) {
      console.error('[AuditResults] Failed to start optimization:', e);
      // Error will be shown via jobError from the query
    }
  };

  // Handle re-fetching data from Booksy (for corrupted/empty data recovery)
  const handleRefetchFromBooksy = async (pricelistId: Id<"pricelists">) => {
    if (isRefetchingFromBooksy) return;

    setIsRefetchingFromBooksy(true);
    try {
      console.log('[AuditResults] Starting Booksy re-fetch for pricelist:', pricelistId);
      const result = await refetchFromBooksy({ pricelistId });

      if (result.success) {
        console.log('[AuditResults] Re-fetch started:', result.message);
        // Data will be updated via Convex real-time subscriptions
      } else {
        console.error('[AuditResults] Re-fetch failed:', result.message);
        alert(`Nie udało się odświeżyć danych: ${result.message}`);
      }
    } catch (e) {
      console.error('[AuditResults] Re-fetch error:', e);
      alert('Wystąpił błąd podczas odświeżania danych z Booksy.');
    } finally {
      setIsRefetchingFromBooksy(false);
    }
  };

  // Detect if pricelist data is empty/corrupted (has no categories or services)
  const isOriginalDataEmpty = originalPricingData
    ? (originalPricingData.categories?.length || 0) === 0
    : false;

  const isOptimizedDataEmpty = optimizedPricingData
    ? (optimizedPricingData.categories?.length || 0) === 0
    : false;

  // Quick actions for summary tab
  const quickActions: QuickAction[] = useMemo(() => [
    {
      icon: Eye,
      label: canViewOptimizedPricelist ? 'Zobacz cennik PRO' : 'Cennik PRO',
      description: canViewOptimizedPricelist
        ? 'Podgląd zoptymalizowanego cennika'
        : isPricelistOptimizing
          ? 'Trwa optymalizacja...'
          : 'Brak zoptymalizowanego cennika',
      onClick: () => setActiveTab('optimized'),
      disabled: !canViewOptimizedPricelist,
    },
    {
      icon: Download,
      label: 'Pobierz PDF',
      description: canViewOptimizedPricelist
        ? 'Eksportuj cennik PRO do PDF'
        : 'Niedostępne',
      onClick: handleExportOptimizedPDF,
      loading: isExportingOptimizedPDF,
      disabled: !canViewOptimizedPricelist,
    },
    {
      icon: Eye,
      label: 'Cennik Booksy',
      description: 'Podgląd oryginalnego cennika',
      onClick: () => setActiveTab('original'),
    },
    {
      icon: ArrowRight,
      label: 'Mój profil',
      description: 'Przejdź do panelu użytkownika',
      onClick: () => navigate('/profil'),
    },
  ], [canViewOptimizedPricelist, isPricelistOptimizing, isExportingOptimizedPDF, navigate]);

  // Stats for quality score card - show original stats since this is "before" state
  const stats = useMemo(() => {
    const originalCats = originalPricingData?.categories.length || 0;
    const originalServices = originalPricingData?.categories.reduce((acc, c) => acc + c.services.length, 0) || 0;

    // In "before" state, we show original counts without deltas
    return {
      categories: { count: originalCats },
      changes: { count: optimizationResult?.changes.length || 0 },
      services: { count: originalServices },
    };
  }, [originalPricingData, optimizationResult]);

  // No audit ID provided
  if (!auditId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center px-4">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">
            Brak ID audytu
          </h1>
          <p className="text-slate-600 mb-6">
            Nie podano ID audytu do wyświetlenia.
          </p>
          <button
            onClick={() => navigate('/profil')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={18} />
            Wróć do profilu
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (audit === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#D4A574] animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Ładowanie audytu...</p>
        </div>
      </div>
    );
  }

  // Audit not found
  if (audit === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">
            Audyt nie znaleziony
          </h1>
          <p className="text-slate-600 mb-6">
            Nie znaleziono audytu o podanym ID lub nie masz do niego dostępu.
          </p>
          <button
            onClick={() => navigate('/profil')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={18} />
            Wróć do profilu
          </button>
        </div>
      </div>
    );
  }

  // Audit not completed
  if (audit.status !== 'completed') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center px-4">
          <Loader2 className="w-16 h-16 text-[#D4A574] animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">
            Audyt w trakcie
          </h1>
          <p className="text-slate-600 mb-6">
            Ten audyt jest jeszcze przetwarzany. Poczekaj na zakończenie.
          </p>
          <button
            onClick={() => navigate('/profil')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={18} />
            Wróć do profilu
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <ResultsLayout
      title={audit.salonName || 'Wyniki audytu'}
      subtitle="Wyniki audytu"
      backPath="/profil"
      backLabel="Powrót"
      icon={<FileSearch className="w-4 h-4 text-[#D4A574]" />}
    >
      <ResultsTabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as AuditTabType)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ===== RAPORT Z AUDYTU TAB ===== */}
        {activeTab === 'report' && auditReport && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Show CTA to apply audit suggestions when no optimization or no changes - AT TOP */}
            {(optimizationState === 'no_pricelist' || optimizationState === 'optimized_no_changes') && !isJobRunning && (
              <motion.div
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                className="mb-12"
              >
                {/* Outer wrapper with golden border and glow */}
                <div
                  className="relative rounded-[20px]"
                  style={{
                    border: '4px solid rgb(255, 179, 72)',
                    boxShadow: 'rgba(245, 244, 219, 0.25) 0px 0px 25px 15px',
                  }}
                >
                  {/* Right shadow */}
                  <div
                    className="absolute top-3 bottom-3 rounded-r-xl pointer-events-none"
                    style={{
                      background: 'linear-gradient(to right, rgba(10, 10, 10, 0.5), rgba(0, 0, 0, 0.61))',
                      filter: 'blur(8px)',
                      zIndex: 50,
                      right: 0,
                      width: '30px',
                    }}
                  />
                  {/* Bottom shadow */}
                  <div
                    className="absolute left-3 right-3 rounded-b-xl pointer-events-none"
                    style={{
                      background: 'linear-gradient(rgba(10, 10, 10, 0.9), rgba(10, 10, 10, 0.3))',
                      filter: 'blur(12px)',
                      zIndex: 50,
                      bottom: '-8px',
                      height: '30px',
                    }}
                  />

                  {/* Main content container */}
                  <div className="bg-gradient-to-br from-[#1a1a1a] via-[#141414] to-[#0d0d0d] rounded-2xl p-4 relative overflow-hidden">
                    {/* Video background */}
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover scale-150 rounded-2xl"
                      style={{ opacity: 0.7, zIndex: 1, mixBlendMode: 'normal' }}
                    >
                      <source src="/tunnel.mp4" type="video/mp4" />
                    </video>

                    {/* Radial gradients */}
                    <div
                      className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,165,116,0.15),transparent_60%)]"
                      style={{ zIndex: 3 }}
                    />
                    <div
                      className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(184,134,11,0.1),transparent_50%)]"
                      style={{ zIndex: 3 }}
                    />

                    {/* Border beam effect */}
                    <BorderBeam
                      size={200}
                      duration={8}
                      colorFrom="#D4A574"
                      colorTo="#B8860B"
                      borderWidth={2}
                    />

                    {/* Content with backdrop blur */}
                    <div
                      className="relative z-10 rounded-xl overflow-hidden px-5 py-4"
                      style={{ backdropFilter: 'blur(6px) brightness(1.1)' }}
                    >
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        {/* Text content */}
                        <div className="flex-1 text-center md:text-left">
                          <h3 className="text-lg md:text-xl font-serif font-bold text-white mb-1">
                            Zastosuj sugestie z audytu
                          </h3>
                          <p className="text-white/60 text-sm leading-relaxed">
                            AI może automatycznie zoptymalizować Twój cennik na podstawie rekomendacji z tego audytu.
                          </p>
                        </div>

                        {/* CTA Button */}
                        <RainbowButton
                          onClick={handleStartOptimization}
                          className="shrink-0"
                        >
                          <Sparkles className="w-4 h-4" />
                          Zoptymalizuj cennik
                        </RainbowButton>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Show pricelist generation status - only for backend-triggered optimization */}
            {isPricelistOptimizing && !isJobRunning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900">Trwa optymalizacja cennika AI</h3>
                    <p className="text-sm text-amber-700">
                      Na podstawie wyników audytu optymalizujemy Twój cennik. To może potrwać kilka minut.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Show completion status only when pricelist has actual changes */}
            {hasOptimizationChanges && optimizationResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-emerald-900">Cennik PRO został wygenerowany</h3>
                    <p className="text-sm text-emerald-700">
                      Wprowadzono {optimizationResult.changes.length} zmian na podstawie rekomendacji z audytu.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('optimized')}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Zobacz cennik PRO
                  </button>
                </div>
              </motion.div>
            )}

            <AuditReportTab
              auditReport={auditReport}
              isPricelistOptimized={hasOptimizationChanges}
              onEditPricelist={hasOptimizationChanges ? () => {
                if (audit.proPricelistId) {
                  navigate(`/start-generator?pricelist=${audit.proPricelistId}`);
                }
              } : undefined}
              onOptimizePricelist={!hasOptimizationChanges && !isJobRunning ? handleStartOptimization : undefined}
            />
          </motion.div>
        )}

        {/* ===== ANALIZA AI TAB ===== */}
        {activeTab === 'analysis' && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Keyword Report Card */}
              <KeywordReportCard
                keywords={keywordReport?.keywords || []}
                categoryDistribution={keywordReport?.categoryDistribution || []}
                suggestions={keywordReport?.suggestions || []}
                isLoading={keywordReport === undefined}
                onExportCSV={() => {
                  // Export keywords to CSV
                  if (keywordReport?.keywords) {
                    const csv = [
                      'Słowo kluczowe,Liczba wystąpień,Kategorie,Usługi',
                      ...keywordReport.keywords.map(k =>
                        `"${k.keyword}",${k.count},"${k.categories.join('; ')}","${k.services.join('; ')}"`
                      )
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `slowa-kluczowe-${audit?.salonName || 'audyt'}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
              />

              {/* Category Proposal Card */}
              <CategoryProposalCard
                originalStructure={categoryProposal?.originalStructureJson
                  ? (() => {
                      try {
                        const parsed = JSON.parse(categoryProposal.originalStructureJson);
                        return (parsed.categories || []).map((c: { name: string; services?: unknown[] }) => ({
                          name: c.name,
                          servicesCount: c.services?.length || 0
                        }));
                      } catch { return []; }
                    })()
                  : originalPricingData?.categories?.map(c => ({ name: c.categoryName, servicesCount: c.services?.length || 0 })) || []
                }
                proposedStructure={categoryProposal?.proposedStructureJson
                  ? (() => {
                      try {
                        const parsed = JSON.parse(categoryProposal.proposedStructureJson);
                        return (parsed.categories || []).map((c: { name: string; services?: unknown[] }) => ({
                          name: c.name,
                          servicesCount: c.services?.length || 0
                        }));
                      } catch { return []; }
                    })()
                  : []
                }
                changes={categoryProposal?.changes || []}
                status={categoryProposal?.status || 'pending'}
                isLoading={categoryProposal === undefined && auditId !== null}
                onAccept={async () => {
                  if (auditId) {
                    await updateProposalStatus({ auditId, status: 'accepted' });
                  }
                }}
                onReject={async () => {
                  if (auditId) {
                    await updateProposalStatus({ auditId, status: 'rejected' });
                  }
                }}
                onModify={() => {
                  // Open the category editor modal
                  setIsCategoryEditorOpen(true);
                }}
              />
            </div>

            {/* Optimization Options Card - Full Width */}
            <OptimizationOptionsCard
              selectedOptions={selectedOptimizationOptions}
              onToggleOption={(option) => {
                setSelectedOptimizationOptions(prev =>
                  prev.includes(option)
                    ? prev.filter(o => o !== option)
                    : [...prev, option]
                );
              }}
              onSelectAll={() => {
                setSelectedOptimizationOptions([
                  'descriptions', 'seo', 'categories', 'order', 'prices', 'duplicates', 'duration', 'tags'
                ]);
              }}
              onDeselectAll={() => setSelectedOptimizationOptions([])}
              onStartOptimization={async () => {
                if (!auditId) return;
                // Save selected options and start optimization
                await saveOptimizationOptions({
                  auditId,
                  selectedOptions: selectedOptimizationOptions,
                  isFullAuto: selectedOptimizationOptions.length === 8,
                });
                // Then start the optimization job
                handleStartOptimization();
              }}
              hasCategoryProposal={categoryProposal !== null && categoryProposal !== undefined}
              categoryProposalAccepted={categoryProposal?.status === 'accepted' || categoryProposal?.status === 'modified'}
              isLoading={false}
              isOptimizing={isJobRunning}
            />
          </motion.div>
        )}

        {/* ===== PODSUMOWANIE TAB ===== */}
        {activeTab === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isPricelistOptimizing ? (
              // Show loading state when pricelist is still being generated
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">
                  Trwa generowanie cennika PRO
                </h2>
                <p className="text-slate-600 max-w-md mx-auto">
                  Na podstawie wyników audytu tworzymy zoptymalizowany cennik.
                  Podsumowanie będzie dostępne po zakończeniu procesu.
                </p>
              </div>
            ) : (
              // Show summary when pricelist is ready - same layout as OptimizationResultsPage
              <>
                {/* Hero Section - Same as OptimizationResultsPage */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                  {/* Left Column: Quality + Sales Potential + Stats */}
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
                    <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                      {/* Quality Score Section */}
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-400 uppercase tracking-wide">Jakość</span>
                        <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                          {(optimizationResult?.qualityScore ?? auditReport?.overallScore ?? 0) >= 80 ? 'Wysoka' : (optimizationResult?.qualityScore ?? auditReport?.overallScore ?? 0) >= 60 ? 'Dobra' : 'Średnia'}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 mb-6">
                        <AnimatedCircularProgressBar
                          value={optimizationResult?.qualityScore ?? auditReport?.overallScore ?? 0}
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
                        {(optimizationResult?.qualityScore ?? auditReport?.overallScore ?? 0) >= 80
                          ? 'Wysoki. Cennik jest bardzo dobrze zoptymalizowany pod sprzedaż.'
                          : (optimizationResult?.qualityScore ?? auditReport?.overallScore ?? 0) >= 60
                            ? 'Średni do Wysokiego. Po wdrożeniu zmian potencjał może wzrosnąć do Wysokiego.'
                            : 'Niski do Średniego. Po wdrożeniu zmian potencjał może wzrosnąć do Wysokiego.'}
                      </p>

                      {/* Gradient gauge bar */}
                      <div className="relative mb-3">
                        <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500 overflow-hidden" />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-700 rounded-full shadow-lg transition-all duration-700"
                          style={{ left: `calc(${optimizationResult?.qualityScore ?? auditReport?.overallScore ?? 0}% - 8px)` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-medium text-slate-400 mb-4">
                        <span>NISKI</span>
                        <span>ŚREDNI</span>
                        <span>WYSOKI</span>
                      </div>

                      {/* Improvement badge */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-emerald-700 font-medium">
                          Po optymalizacji: +{Math.min(50, Math.round((100 - (optimizationResult?.qualityScore ?? auditReport?.overallScore ?? 0)) * 0.7))}% potencjał
                        </span>
                      </div>

                      {/* Stats summary */}
                      <div className="mt-6 bg-slate-50 rounded-2xl p-5 flex flex-col justify-evenly">
                        <div className="flex items-center justify-center gap-2 mb-5">
                          <Layers className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Statystyki</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <p className="text-2xl font-bold text-slate-800">{optimizedPricingData?.categories.length || originalPricingData?.categories.length || 0}</p>
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">kategorii</p>
                          </div>
                          <div className="text-center p-3">
                            <p className="text-2xl font-bold text-slate-800">{optimizationResult?.summary?.totalChanges ?? 0}</p>
                            <p className="text-sm text-slate-500 mt-0.5">zmian</p>
                          </div>
                          <div className="text-center p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <p className="text-2xl font-bold text-slate-800">
                                {optimizedPricingData?.categories.reduce((acc, cat) => acc + cat.services.length, 0) ||
                                 originalPricingData?.categories.reduce((acc, cat) => acc + cat.services.length, 0) || 0}
                              </p>
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">usług</p>
                          </div>
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
                            onClick={() => setActiveTab('report')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all"
                          >
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-slate-400" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">Raport audytu</span>
                            <p className="text-xs text-slate-500 text-center">Szczegółowy raport z analizy</p>
                          </button>
                          <button
                            onClick={() => navigate('/profile')}
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
                      <div className="relative z-10 flex flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                        <div className="flex items-center gap-2 mb-4">
                          <MessageSquareText className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Podsumowanie optymalizacji</span>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed">
                          {optimizationResult ? (() => {
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
                          })() : 'Optymalizacja cennika w toku...'}
                        </p>

                        {optimizationResult?.recommendations && optimizationResult.recommendations.length > 0 && (
                          <p className="text-sm text-slate-500 mt-3">
                            Dodatkowo przygotowaliśmy {optimizationResult.recommendations.length} {optimizationResult.recommendations.length === 1 ? 'rekomendację' : optimizationResult.recommendations.length < 5 ? 'rekomendacje' : 'rekomendacji'} do samodzielnego wdrożenia.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Stats Cards Row: Zakres + Sugestie */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                  {/* Card 1: Zakres optymalizacji */}
                  {optimizationResult && (
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
                  )}

                  {/* Card 2: Recommendations */}
                  <motion.div
                    initial={{ opacity: 0, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    transition={{ delay: 0.3 }}
                    className="group relative h-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
                  >
                    <StripedPattern
                      className="text-slate-300"
                      style={{ zIndex: 0, left: '-10%', height: '130%', width: '100%', top: '-17%', transform: 'scale(1.1)', maskImage: 'linear-gradient(115deg, rgba(255, 255, 255, 1) 44%, rgba(255, 255, 255, 0) 75%)', opacity: 0.6 }}
                    />
                    <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Sugestie</span>
                        <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                          {(auditReport?.recommendations?.length || 0) + (optimizationResult?.recommendations?.length || 0)} wskazówek
                        </span>
                      </div>

                      <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800 mb-4">
                        Dodatkowe rekomendacje
                      </h3>

                      {((auditReport?.recommendations && auditReport.recommendations.length > 0) || (optimizationResult?.recommendations && optimizationResult.recommendations.length > 0)) ? (
                        <div className="space-y-2">
                          {[...(auditReport?.recommendations || []), ...(optimizationResult?.recommendations || [])].slice(0, 3).map((rec, idx) => (
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
                          {((auditReport?.recommendations?.length || 0) + (optimizationResult?.recommendations?.length || 0)) > 3 && (
                            <p className="text-xs text-slate-400 text-center pt-1">
                              +{((auditReport?.recommendations?.length || 0) + (optimizationResult?.recommendations?.length || 0)) - 3} więcej sugestii
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-sm text-slate-400 text-center">
                            Brak dodatkowych sugestii - Twój cennik jest dobrze zoptymalizowany!
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

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
              </>
            )}
          </motion.div>
        )}

        {/* ===== CENNIK ORYGINALNY TAB ===== */}
        {activeTab === 'original' && (
          <motion.div
            key="original"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {originalPricingData ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <FullPricelistDisplay
                    data={originalPricingData}
                    theme={themeConfig}
                    templateId={templateId}
                    variant="original"
                    showLabel={false}
                  />
                </div>
                <div className="lg:col-span-1">
                  <PricelistInfoSidebar
                    pricingData={originalPricingData}
                    themeConfig={themeConfig}
                    templateId={templateId}
                    variant="original"
                    pricelistId={audit.basePricelistId?.toString()}
                    onExportPDF={handleExportOriginalPDF}
                    isExportingPDF={isExportingOriginalPDF}
                    showEmbedCode={false}
                    showRefetchButton={isOriginalDataEmpty && !!audit.basePricelistId}
                    onRefetchFromBooksy={audit.basePricelistId
                      ? () => handleRefetchFromBooksy(audit.basePricelistId!)
                      : undefined}
                    isRefetching={isRefetchingFromBooksy}
                  />
                  {/* Stats Card - Categories & Services */}
                  <div className="mt-4 group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
                    <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                    <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
                    <div className="relative z-10 overflow-hidden rounded-xl bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Statystyki cennika</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Layers className="w-4 h-4 text-[#D4A574]" />
                            <span className="text-2xl font-bold text-slate-800">{originalPricingData.categories?.length || 0}</span>
                          </div>
                          <span className="text-xs text-slate-500">Kategorie</span>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Scissors className="w-4 h-4 text-[#D4A574]" />
                            <span className="text-2xl font-bold text-slate-800">
                              {originalPricingData.categories?.reduce((sum, cat) => sum + (cat.services?.length || 0), 0) || 0}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">Usługi</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <p className="text-slate-600">Brak danych oryginalnego cennika.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ===== CENNIK ZOPTYMALIZOWANY TAB ===== */}
        {activeTab === 'optimized' && (
          <motion.div
            key="optimized"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isPricelistOptimizing ? (
              // Loading state
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-[#D4A574]/10 flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-10 h-10 text-[#D4A574] animate-spin" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">
                  Trwa optymalizacja cennika
                </h2>
                <p className="text-slate-600 max-w-md mx-auto mb-6">
                  AI pracuje nad optymalizacją Twojego cennika na podstawie wyników audytu.
                  To może potrwać kilka minut.
                </p>
                <button
                  onClick={() => setActiveTab('report')}
                  className="text-sm text-[#D4A574] hover:underline"
                >
                  ← Wróć do raportu
                </button>
              </div>
            ) : optimizedPricingData ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <FullPricelistDisplay
                    data={optimizedPricingData}
                    theme={themeConfig}
                    templateId={templateId}
                    variant="optimized"
                    showLabel={false}
                  />
                </div>
                <div className="lg:col-span-1">
                  <PricelistInfoSidebar
                    pricingData={optimizedPricingData}
                    themeConfig={themeConfig}
                    templateId={templateId}
                    variant="optimized"
                    pricelistId={audit.proPricelistId?.toString()}
                    onExportPDF={handleExportOptimizedPDF}
                    isExportingPDF={isExportingOptimizedPDF}
                    showEmbedCode={true}
                    showRefetchButton={isOptimizedDataEmpty && !!audit.proPricelistId}
                    onRefetchFromBooksy={audit.proPricelistId
                      ? () => handleRefetchFromBooksy(audit.proPricelistId!)
                      : undefined}
                    isRefetching={isRefetchingFromBooksy}
                  />
                  {/* Stats Card - Categories & Services */}
                  <div className="mt-4 group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
                    <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
                    <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
                    <div className="relative z-10 overflow-hidden rounded-xl bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Statystyki cennika</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Layers className="w-4 h-4 text-[#D4A574]" />
                            <span className="text-2xl font-bold text-slate-800">{optimizedPricingData.categories?.length || 0}</span>
                          </div>
                          <span className="text-xs text-slate-500">Kategorie</span>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Scissors className="w-4 h-4 text-[#D4A574]" />
                            <span className="text-2xl font-bold text-slate-800">
                              {optimizedPricingData.categories?.reduce((sum, cat) => sum + (cat.services?.length || 0), 0) || 0}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">Usługi</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <RainbowButton
                      onClick={() => navigate('/profil')}
                      className="w-full h-11 text-sm"
                    >
                      Zobacz w profilu
                      <ArrowRight size={16} />
                    </RainbowButton>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <p className="text-slate-600">Brak cennika zoptymalizowanego.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Fallback for report tab */}
        {activeTab === 'report' && !auditReport && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-slate-600">Brak danych raportu audytu.</p>
          </div>
        )}
      </div>

      {/* Error banner for optimization failures */}
      {jobError && optimizationJob?._id && dismissedErrorJobId !== optimizationJob._id && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 rounded-xl px-6 py-4 shadow-lg flex items-center gap-4 max-w-lg"
        >
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700 font-medium">
              {jobError.includes("overloaded")
                ? "Serwis AI jest chwilowo przeciążony. Spróbuj ponownie później."
                : jobError}
            </p>
          </div>
          <button
            onClick={() => setDismissedErrorJobId(optimizationJob._id)}
            className="text-red-400 hover:text-red-600 text-lg font-bold px-2"
          >
            ×
          </button>
        </motion.div>
      )}

      {/* Global Multi-Step Loader for optimization process */}
      <MultiStepLoader
        loadingStates={optimizationLoadingStates}
        loading={isJobRunning}
        value={jobCurrentStep}
      />

      {/* Category Editor Modal */}
      <CategoryEditorModal
        isOpen={isCategoryEditorOpen}
        onClose={() => setIsCategoryEditorOpen(false)}
        originalStructure={originalPricingData?.categories || []}
        proposedStructure={categoryProposal?.proposedStructureJson
          ? (() => {
              try {
                const parsed = JSON.parse(categoryProposal.proposedStructureJson);
                console.log('[CategoryEditor] Raw parsed:', Array.isArray(parsed) ? 'is array' : 'is object', parsed[0] || parsed.categories?.[0]);

                // Handle both formats: array of categories OR { categories: [...] }
                const categoriesArray = Array.isArray(parsed) ? parsed : (parsed.categories || []);
                console.log('[CategoryEditor] Categories array first item:', categoriesArray[0]);

                // Build a lookup map of all services from original data
                const serviceMap = new Map<string, ServiceItem>();
                (originalPricingData?.categories || []).forEach(cat => {
                  cat.services?.forEach(service => {
                    if (service.name) {
                      // Store by exact name and normalized name
                      serviceMap.set(service.name, service);
                      serviceMap.set(service.name.toLowerCase().trim(), service);
                    }
                  });
                });

                // Convert AI format to Category format
                // AI saves services as array of strings (service names) OR array of objects
                return categoriesArray.map((c: { name: string; services?: Array<string | Record<string, unknown>> }) => ({
                  categoryName: c.name,
                  services: (c.services || []).map(s => {
                    // Check if service is a string (just the name) or an object
                    if (typeof s === 'string') {
                      // Find full service data from original structure
                      const fullService = serviceMap.get(s) || serviceMap.get(s.toLowerCase().trim());
                      if (fullService) {
                        return fullService;
                      }
                      // Fallback: create minimal service object
                      return {
                        name: s,
                        price: '',
                        isPromo: false,
                      };
                    }
                    // Service is already an object
                    const serviceName = (s.name || s.serviceName || s.title || s.nazwa || '') as string;
                    const servicePrice = (s.price || s.cena || s.priceFrom || '') as string;
                    return {
                      name: serviceName,
                      price: servicePrice,
                      description: (s.description || s.opis || '') as string | undefined,
                      duration: (s.duration || s.czas || s.time || '') as string | undefined,
                      isPromo: Boolean(s.isPromo || s.promo || false),
                    };
                  }),
                }));
              } catch (e) {
                console.error('[CategoryEditor] Failed to parse proposedStructure:', e);
                return [];
              }
            })()
          : []
        }
        onSave={async (modifiedStructure) => {
          if (!auditId) return;
          // Save user modifications and update status to 'modified'
          // Convert back to AI format for storage
          const aiFormat = {
            categories: modifiedStructure.map(c => ({
              name: c.categoryName,
              services: c.services.map(s => ({
                name: s.name,
                price: s.price,
                description: s.description,
                duration: s.duration,
                isPromo: s.isPromo,
              })),
            })),
          };
          await updateProposalStatus({
            auditId,
            status: 'modified',
            userModificationsJson: JSON.stringify(aiFormat),
          });
        }}
        proposedChanges={categoryProposal?.changes || []}
      />
    </ResultsLayout>
  );
};

export default AuditResultsPage;
