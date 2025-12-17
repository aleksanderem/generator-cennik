"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import {
  ClipboardList,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle,
  FileSpreadsheet,
  Image,
  Tag,
  Wand2,
  Check,
  Code2,
  Palette,
  RotateCcw,
  Link2,
  Pencil,
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ShineBorder } from '../ui/shine-border';
import { RainbowButton } from '../ui/rainbow-button';
import { HeroHighlight } from '../ui/hero-highlight';
import { BlurFade } from '../ui/blur-fade';
import { AuroraText } from '../ui/aurora-text';
import { parsePricingData } from '../../services/geminiService';
import { PricingData, ThemeConfig, DEFAULT_THEME } from '../../types';
import { TemplateEditor } from '../../lib/pricelist-templates';
import { useAuth, SignInButton, SignUpButton } from '@clerk/clerk-react';

type AppState = 'INPUT' | 'PROCESSING' | 'PREVIEW';

// Pricelist ID is now managed by Convex, no need to generate locally

const StartGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSignedIn, isLoaded: isClerkLoaded } = useUser();

  const [inputText, setInputText] = useState('');
  const [appState, setAppState] = useState<AppState>('INPUT');
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('modern');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pricelistId, setPricelistId] = useState<string | null>(null);
  const [isLoadingPricelist, setIsLoadingPricelist] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [pricelistName, setPricelistName] = useState(`Cennik ${new Date().toLocaleDateString('pl-PL')}`);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isPricelistOptimized, setIsPricelistOptimized] = useState(false);

  // Convex
  const user = useQuery(api.users.getCurrentUser);
  const savePricelistMutation = useMutation(api.pricelists.savePricelist);
  const updatePricelist = useMutation(api.pricelists.updatePricelist);
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);

  // Get pricelist from URL param
  const urlPricelistId = searchParams.get('pricelist');
  const urlMode = searchParams.get('mode'); // 'original' to load original data

  // Load pricelist from URL on mount (requires auth)
  const existingPricelist = useQuery(
    api.pricelists.getPricelist,
    urlPricelistId ? { pricelistId: urlPricelistId as any } : "skip"
  );

  // Load pricelist when it's fetched
  useEffect(() => {
    if (existingPricelist && !isLoadingPricelist) {
      setIsLoadingPricelist(true);
      try {
        // If mode=original and we have original data, load that instead
        const dataJson = (urlMode === 'original' && existingPricelist.originalPricingDataJson)
          ? existingPricelist.originalPricingDataJson
          : existingPricelist.pricingDataJson;

        const data = JSON.parse(dataJson);
        setPricingData(data);
        setPricelistId(existingPricelist._id);
        setPricelistName(existingPricelist.name);

        if (existingPricelist.themeConfigJson) {
          setThemeConfig(JSON.parse(existingPricelist.themeConfigJson));
        }
        if (existingPricelist.templateId) {
          setSelectedTemplateId(existingPricelist.templateId);
        }
        // Check if pricelist is already optimized (unless loading original mode)
        if (existingPricelist.isOptimized && urlMode !== 'original') {
          setIsPricelistOptimized(true);
        }

        setAppState('PREVIEW');
      } catch (e) {
        console.error('Error loading pricelist:', e);
        setError('Nie udało się załadować zapisanego cennika.');
      }
      setIsLoadingPricelist(false);
    }
  }, [existingPricelist, urlMode]);

  // Load theme from localStorage
  const LOCAL_STORAGE_KEY = 'beauty_pricer_local_last';
  const LOCAL_STORAGE_TEMPLATE_KEY = 'beauty_pricer_template_id';

  useEffect(() => {
    if (!urlPricelistId) {
      const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedTheme) {
        try {
          setThemeConfig(JSON.parse(savedTheme));
        } catch (e) {
          console.error('Error loading theme config:', e);
        }
      }
      const savedTemplateId = localStorage.getItem(LOCAL_STORAGE_TEMPLATE_KEY);
      if (savedTemplateId) {
        setSelectedTemplateId(savedTemplateId);
      }
    }
  }, [urlPricelistId]);

  const handleLoadExample = () => {
    const example = `Manicure Hybrydowy	120 zł	Zdjęcie poprzedniej stylizacji, opracowanie skórek, malowanie.	60 min	Bestseller
Pedicure SPA	180 zł	Peeling, maska, masaż, malowanie. PROMOCJA!	90 min
Strzyżenie damskie	150 zł	Mycie, strzyżenie, modelowanie.	60 min	Nowość
Koloryzacja globalna	od 300 zł	Jeden kolor, bez rozjaśniania.	120 min
Masaż Relaksacyjny	200 zł	Pełny masaż ciała olejkami eterycznymi.	60 min	Hit Sezonu
Makijaż okolicznościowy	180 zł	Make-up na specjalną okazję z konsultacją kolorystyczną.	45 min
Henna brwi i rzęs	65 zł	Farbowanie brwi i rzęs henną.	30 min	Promocja
Depilacja całych nóg	150 zł	Woskiem miękkim lub twardym.	45 min`;
    setInputText(example);
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;

    // Require login before generating
    if (!isSignedIn) {
      setShowLoginPrompt(true);
      return;
    }

    setAppState('PROCESSING');
    setError(null);

    try {
      const data = await parsePricingData(inputText, false);
      setPricingData(data);

      // Save pricelist directly to DB (user is logged in)
      const newPricelistId = await savePricelistMutation({
        name: pricelistName,
        source: 'manual',
        pricingDataJson: JSON.stringify(data),
        themeConfigJson: JSON.stringify(themeConfig),
        templateId: selectedTemplateId,
      });

      setPricelistId(newPricelistId);

      // Update URL with pricelist ID
      setSearchParams({ pricelist: newPricelistId });

      setAppState('PREVIEW');

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Wystąpił błąd podczas generowania cennika. Spróbuj ponownie.');
      setAppState('INPUT');
    }
  };

  // Auto-save pricelist when theme or template changes
  const handleThemeChange = useCallback(async (newTheme: ThemeConfig) => {
    setThemeConfig(newTheme);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTheme));

    if (pricelistId) {
      try {
        await updatePricelist({
          pricelistId: pricelistId as any,
          themeConfigJson: JSON.stringify(newTheme),
        });
      } catch (e) {
        console.error('Error updating pricelist:', e);
      }
    }
  }, [pricelistId, updatePricelist]);

  const handleTemplateChange = useCallback(async (templateId: string) => {
    setSelectedTemplateId(templateId);
    localStorage.setItem(LOCAL_STORAGE_TEMPLATE_KEY, templateId);

    if (pricelistId) {
      try {
        await updatePricelist({
          pricelistId: pricelistId as any,
          templateId,
        });
      } catch (e) {
        console.error('Error updating pricelist:', e);
      }
    }
  }, [pricelistId, updatePricelist]);

  const handleDataChange = useCallback(async (newData: PricingData) => {
    setPricingData(newData);

    if (pricelistId) {
      try {
        await updatePricelist({
          pricelistId: pricelistId as any,
          pricingDataJson: JSON.stringify(newData),
        });
      } catch (e) {
        console.error('Error updating pricelist:', e);
      }
    }
  }, [pricelistId, updatePricelist]);

  // Pricelist is already saved - update name if changed
  const handleSaveName = async () => {
    if (!pricelistId || !isSignedIn) return;

    setIsSaving(true);
    try {
      await updatePricelist({
        pricelistId: pricelistId as any,
        name: pricelistName,
      });
      setIsEditingName(false);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Wystąpił błąd podczas zapisywania nazwy.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!pricelistId) return;
    const url = `${window.location.origin}/preview?pricelist=${pricelistId}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleStartOver = () => {
    setAppState('INPUT');
    setPricingData(null);
    setError(null);
    setPricelistId(null);
    setIsPricelistOptimized(false);
    setPricelistName(`Cennik ${new Date().toLocaleDateString('pl-PL')}`);
    setSearchParams({});
  };

  // Handle optimization purchase
  const handleOptimizeClick = async () => {
    if (!isSignedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (!pricelistId || !pricingData) {
      setError('Najpierw wygeneruj cennik.');
      return;
    }

    try {
      const result = await createCheckoutSession({
        product: 'pricelist_optimization',
        successUrl: `${window.location.origin}/optimization-results?pricelist=${pricelistId}`,
        cancelUrl: `${window.location.origin}/start-generator?pricelist=${pricelistId}`,
        pricelistId: pricelistId as any,
      });

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Wystąpił błąd podczas tworzenia płatności.');
    }
  };

  // Check for pending checkout after login and auto-trigger checkout
  const pendingCheckoutParam = searchParams.get('pending_checkout');

  useEffect(() => {
    const triggerPendingCheckout = async () => {
      if (pendingCheckoutParam === 'true' && isSignedIn && pricelistId && pricingData) {
        // Clear the pending_checkout param first
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('pending_checkout');
        setSearchParams(newParams);

        // Trigger checkout
        try {
          const result = await createCheckoutSession({
            product: 'pricelist_optimization',
            successUrl: `${window.location.origin}/optimization-results?pricelist=${pricelistId}`,
            cancelUrl: `${window.location.origin}/start-generator?pricelist=${pricelistId}`,
            pricelistId: pricelistId as any,
          });

          if (result.url) {
            window.location.href = result.url;
          }
        } catch (err: any) {
          console.error('Checkout error:', err);
          setError(err.message || 'Wystąpił błąd podczas tworzenia płatności.');
        }
      }
    };

    triggerPendingCheckout();
  }, [pendingCheckoutParam, isSignedIn, pricelistId, pricingData]);

  // Processing state
  if (appState === 'PROCESSING') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4A574] to-[#B8860B] rounded-2xl animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">
            AI analizuje Twój cennik...
          </h2>
          <p className="text-slate-600 mb-6">
            Rozpoznajemy strukturę, kategoryzujemy usługi i formatujemy dane.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>To zajmie tylko kilka sekund</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Preview state with sub-navigation
  if (appState === 'PREVIEW' && pricingData) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Login prompt modal */}
        {showLoginPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowLoginPrompt(false)}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#0d0d0d] rounded-2xl p-8 max-w-md w-full mx-4 border border-slate-800 shadow-2xl overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Content */}
              <div className="relative text-center">
                <img
                  src="/ba-logo-light.png"
                  alt="Booksy Auditor"
                  className="h-12 mx-auto mb-4"
                />
                <h3 className="text-2xl font-serif font-bold text-white mb-6">
                  Zaloguj się, aby kontynuować
                </h3>
                {/* Lamp effect */}
                <div className="relative h-6 mb-2">
                  <div className="absolute left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#D4A574] to-transparent" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 w-40 h-6 bg-[#D4A574]/20 blur-xl" />
                </div>
                <p className="text-slate-400 mb-8">
                  Optymalizacja AI wymaga konta. Zaloguj się lub zarejestruj, aby wykorzystać pełen potencjał swojego cennika.
                </p>

                <div className="space-y-3">
                  <SignInButton
                    mode="modal"
                    forceRedirectUrl={`${window.location.pathname}?pricelist=${pricelistId}&pending_checkout=true`}
                  >
                    <button className="w-full py-3 px-6 bg-[#D4A574] hover:bg-[#C9956C] text-white font-medium rounded-xl transition-colors">
                      Zaloguj się
                    </button>
                  </SignInButton>

                  <SignUpButton
                    mode="modal"
                    forceRedirectUrl={`${window.location.pathname}?pricelist=${pricelistId}&pending_checkout=true`}
                  >
                    <button className="w-full py-3 px-6 bg-slate-800/50 hover:bg-slate-800 text-white font-medium rounded-xl border border-slate-700 transition-colors">
                      Załóż konto
                    </button>
                  </SignUpButton>
                </div>

                <p className="text-xs text-slate-500 mt-6">
                  Po zalogowaniu zostaniesz przekierowany do płatności Stripe
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Sub-navigation bar - full width, dark background */}
        <div className="bg-slate-900 border-b border-slate-700">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleStartOver}
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Nowy cennik
                </button>
                <div className="h-5 w-px bg-slate-700" />
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#D4A574]" />
                  <span className="text-sm text-slate-400">
                    Edytor cennika
                  </span>
                </div>
                <div className="h-5 w-px bg-slate-700" />
                {/* Edytowalna nazwa cennika */}
                {isEditingName ? (
                  <input
                    type="text"
                    value={pricelistName}
                    onChange={(e) => setPricelistName(e.target.value)}
                    onBlur={() => {
                      setIsEditingName(false);
                      handleSaveName();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingName(false);
                        handleSaveName();
                      }
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    autoFocus
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent min-w-[200px]"
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-white hover:bg-slate-800 rounded transition-colors group"
                  >
                    <span>{pricelistName}</span>
                    <Pencil className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#D4A574] transition-colors" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Copy link button */}
                {pricelistId && (
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Skopiowano!</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        <span>Kopiuj link</span>
                      </>
                    )}
                  </button>
                )}

                {/* Pricelist is auto-saved - show profile link */}
                {isSignedIn && pricelistId && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-900/50 text-emerald-400 text-sm font-medium rounded-lg border border-emerald-700">
                    <CheckCircle className="w-4 h-4" />
                    Zapisano
                    <button
                      onClick={() => navigate('/profile')}
                      className="ml-2 underline hover:no-underline"
                    >
                      Zobacz w profilu
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Template Editor - full width */}
        <div className="px-6 py-6">
          <TemplateEditor
            initialTemplateId={selectedTemplateId}
            initialTheme={themeConfig}
            data={pricingData}
            onThemeChange={handleThemeChange}
            onTemplateChange={handleTemplateChange}
            onDataChange={handleDataChange}
            enableDataEditing={true}
            pricelistId={pricelistId}
            showOptimizationCard={!isPricelistOptimized}
            onOptimizeClick={handleOptimizeClick}
            isOptimizing={false}
            optimizationPrice="29,90 zł"
          />
        </div>
      </div>
    );
  }

  // Input state (default)
  return (
    <div className="overflow-x-hidden">
      <HeroHighlight
        containerClassName="relative py-12 md:py-16 min-h-[80vh] flex items-center bg-gradient-to-b from-slate-50 to-white"
        dotColor="rgba(212, 165, 116, 0.12)"
        dotColorHighlight="rgba(212, 165, 116, 0.8)"
      >
        <div className="relative max-w-7xl mx-auto w-full px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <BlurFade delay={0.1} inView>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A574]/10 rounded-full border border-[#D4A574]/30 mb-6">
                  <Sparkles size={16} className="text-[#D4A574]" />
                  <span className="text-sm font-medium text-[#D4A574]">
                    Darmowy generator cennika
                  </span>
                </div>
              </BlurFade>

              <BlurFade delay={0.2} inView>
                <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-serif font-bold text-slate-900 mb-6 leading-[1.1]">
                  Stwórz{' '}
                  <br className="hidden sm:block" />
                  <AuroraText colors={["#D4A574", "#C9956C", "#E8C4A0", "#B8860B"]}>
                    profesjonalny cennik
                  </AuroraText>
                  {' '}<span className="inline-block">✨</span>
                </h1>
              </BlurFade>

              <BlurFade delay={0.3} inView>
                <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0">
                  Wklej cennik z Excela, Booksy czy notatnika. AI uporządkuje, skategoryzuje
                  i przygotuje gotowy cennik na Twoją stronę.
                </p>
              </BlurFade>

              {/* What happens next */}
              <BlurFade delay={0.4} inView>
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Jak to działa?</p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-8 h-8 rounded-full bg-[#D4A574]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#D4A574]">1</span>
                      </div>
                      <p className="text-slate-600">Wklej dane z dowolnego źródła</p>
                    </div>

                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-8 h-8 rounded-full bg-[#D4A574]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#D4A574]">2</span>
                      </div>
                      <p className="text-slate-600">AI kategoryzuje i formatuje cennik</p>
                    </div>

                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-8 h-8 rounded-full bg-[#D4A574]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#D4A574]">3</span>
                      </div>
                      <p className="text-slate-600">Dostosuj wygląd i skopiuj kod HTML</p>
                    </div>
                  </div>
                </div>
              </BlurFade>
            </div>

            {/* Right: Form */}
            <BlurFade delay={0.3} inView>
              <div className="relative mt-8 lg:mt-0">
                <div className="relative rounded-3xl">
                  {/* Animated Shine Border */}
                  <ShineBorder
                    borderWidth={3}
                    duration={8}
                    shineColor={["#D4A574", "#B8860B", "#E8C4A0"]}
                    className="rounded-3xl"
                  />

                  <div className="bg-white/90 backdrop-blur-sm p-8 md:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4A574]/10 to-[#B8860B]/10 text-[#D4A574] mb-4">
                        <ClipboardList size={24} />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-slate-900 mb-2">
                        Wklej swój cennik
                      </h3>
                      <p className="text-sm text-slate-500">
                        Z Excela, Google Sheets, Booksy lub notatek
                      </p>
                    </div>

                    {/* Feature hints */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-500 border border-slate-100">
                        <FileSpreadsheet size={12} className="text-[#D4A574]" />
                        Excel / Sheets
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-500 border border-slate-100">
                        <Image size={12} className="text-[#C9956C]" />
                        URL zdjęć
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-500 border border-slate-100">
                        <Tag size={12} className="text-[#B8860B]" />
                        Tagi (Bestseller)
                      </div>
                    </div>

                    <textarea
                      className="w-full h-48 p-4 rounded-xl border-2 border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#D4A574] focus:ring-4 focus:ring-[#D4A574]/10 transition-all outline-none resize-none text-sm placeholder:text-slate-400"
                      placeholder="Wklej tutaj dane...

Przykład:
Manicure Hybrydowy	120 zł	60 min
Pedicure SPA	180 zł	90 min
Strzyżenie damskie	150 zł	60 min"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />

                    {error && (
                      <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={handleLoadExample}
                        className="text-sm text-slate-400 hover:text-[#D4A574] transition-colors flex items-center gap-1.5 group"
                      >
                        <Sparkles size={14} className="group-hover:text-[#B8860B] transition-colors" />
                        Załaduj przykład
                      </button>
                    </div>

                    <RainbowButton
                      onClick={handleGenerate}
                      disabled={!inputText.trim()}
                      className="w-full mt-4 text-lg"
                    >
                      <Wand2 className="w-5 h-5" />
                      Generuj cennik
                      <ArrowRight className="w-5 h-5" />
                    </RainbowButton>

                    {/* Trust badges */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Sparkles size={12} className="text-[#D4A574]" />
                        100% darmowe
                      </div>
                      <div className="flex items-center gap-1">
                        <Code2 size={12} className="text-[#D4A574]" />
                        Gotowy HTML/CSS
                      </div>
                      <div className="flex items-center gap-1">
                        <Palette size={12} className="text-[#D4A574]" />
                        6 szablonów
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </BlurFade>
          </div>
        </div>
      </HeroHighlight>
    </div>
  );
};

export default StartGeneratorPage;
