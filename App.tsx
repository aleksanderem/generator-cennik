
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppState, PricingData, ThemeConfig, DEFAULT_THEME } from './types';
import { parsePricingData } from './services/geminiService';
import InputSection from './components/InputSection';
import Accordion from './components/Accordion';
import EmbedCode from './components/EmbedCode';
import ConfigPanel from './components/ConfigPanel';
import TerminalLoader from './components/TerminalLoader';
import BooksyOptimizer from './components/BooksyOptimizer';
import Header from './components/layout/Header';
import PaywallModal from './components/shared/PaywallModal';
import LandingPage from './components/pages/LandingPage';
import GeneratorPage from './components/pages/GeneratorPage';
import SuccessPage from './components/pages/SuccessPage';
import ProfilePage from './components/pages/ProfilePage';
import StartAuditPage from './components/pages/StartAuditPage';
import MetaAdsPage from './components/pages/MetaAdsPage';
import GoogleAdsPage from './components/pages/GoogleAdsPage';
import DevMenu from './components/dev/DevMenu';
import { StickyBanner } from './components/ui/sticky-banner';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { ChevronRight } from 'lucide-react';
import { ArrowLeft, Check, FileText, Link, Settings, X, Sparkles, LayoutList, Loader2, Columns2, Code2, Palette, Copy, CheckCircle, PanelRightOpen, PanelRightClose, LogIn } from 'lucide-react';

type Page = 'home' | 'generator' | 'audit' | 'settings' | 'success' | 'profile' | 'start-audit' | 'campaigns-meta' | 'campaigns-google';

const LOCAL_STORAGE_KEY = 'beauty_pricer_local_last';

type InputMode = 'PASTE' | 'IMPORT';
type ViewMode = 'ORIGINAL' | 'OPTIMIZED' | 'SPLIT';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn, isLoaded } = useUser();

  // Derive current page from URL
  const getCurrentPage = (): Page => {
    const path = location.pathname;
    if (path === '/generator') return 'generator';
    if (path === '/audit') return 'audit';
    if (path === '/settings') return 'settings';
    if (path === '/success') return 'success';
    if (path === '/profile') return 'profile';
    if (path === '/start-audit') return 'start-audit';
    if (path === '/campaigns-meta') return 'campaigns-meta';
    if (path === '/campaigns-google') return 'campaigns-google';
    return 'home';
  };

  const currentPage = getCurrentPage();
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  const [appState, setAppState] = useState<AppState>(AppState.INPUT);
  const [inputMode, setInputMode] = useState<InputMode>('PASTE');
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [optimizedPricingData, setOptimizedPricingData] = useState<PricingData | null>(null);

  // Replaced boolean isOptimizedView with tri-state viewMode
  const [viewMode, setViewMode] = useState<ViewMode>('ORIGINAL');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const [importedText, setImportedText] = useState<string>(''); // For transfer from Optimizer
  const [rawInputData, setRawInputData] = useState<string>(''); // Store for optimization re-fetch

  // New State for Loader Logic
  const [isApiDataReady, setIsApiDataReady] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Navigation handler - uses React Router
  const handleNavigate = (page: Page) => {
    if (page === 'home') {
      navigate('/');
    } else {
      navigate(`/${page}`);
    }
  };

  // Load last session from local storage immediately for better UX
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setThemeConfig(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
  }, []);

  const handleThemeChange = (newTheme: ThemeConfig) => {
    setThemeConfig(newTheme);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTheme));
  };

  const handleProcessData = async (rawData: string) => {
    if (!rawData.trim()) return;

    setRawInputData(rawData); // Save for optimization later
    setAppState(AppState.PROCESSING);
    setIsApiDataReady(false);
    setErrorMsg(null);
    setOptimizedPricingData(null); // Reset optimized
    setViewMode('ORIGINAL'); // Reset view

    try {
      // 1. Start fetching in "background" while loader plays
      const data = await parsePricingData(rawData, false);
      
      // 2. Data is ready, notify loader
      setPricingData(data);
      setIsApiDataReady(true);
      
    } catch (err) {
      console.error(err);
      setErrorMsg("Wystąpił błąd podczas przetwarzania danych. Spróbuj ponownie lub sprawdź format danych.");
      setAppState(AppState.INPUT);
    }
  };

  const handleViewChange = async (mode: ViewMode) => {
    // Immediate view switch for better UX
    setViewMode(mode);

    if (mode === 'ORIGINAL') return;

    // If we already have data, no need to fetch
    if (optimizedPricingData) return;

    // Fallback: If rawInputData is somehow missing, reconstruct it from current pricingData
    const dataToOptimize = rawInputData || JSON.stringify(pricingData);

    if (!dataToOptimize) {
        console.error("No data available to optimize");
        setErrorMsg("Błąd danych. Nie można wygenerować optymalizacji.");
        return;
    }

    setIsOptimizing(true);
    try {
      // Call Gemini with optimization mode = true
      const optimized = await parsePricingData(dataToOptimize, true);
      setOptimizedPricingData(optimized);
    } catch (err) {
      console.error("Optimization failed", err);
      setErrorMsg("Nie udało się wygenerować wersji zoptymalizowanej. Sprawdź połączenie.");
      setViewMode('ORIGINAL'); // Revert on error
    } finally {
      setIsOptimizing(false);
    }
  };

  // Called by TerminalLoader when it finishes all animations
  const handleLoaderComplete = () => {
    if (pricingData) {
      setAppState(AppState.PREVIEW);
    }
  };

  const resetApp = () => {
    setAppState(AppState.INPUT);
    setPricingData(null);
    setOptimizedPricingData(null);
    setViewMode('ORIGINAL');
    setErrorMsg(null);
    setIsApiDataReady(false);
  };

  // Handler for data coming from BooksyOptimizer (Audit)
  const handleImportedData = (data: string) => {
    setImportedText(data);
    setInputMode('PASTE');
    // Scroll to input just in case
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentDisplayData = (viewMode === 'OPTIMIZED' || viewMode === 'SPLIT') && optimizedPricingData 
    ? optimizedPricingData 
    : (pricingData || { categories: [] });

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-800 font-sans selection:bg-rose-200 selection:text-rose-900 flex flex-col relative overflow-hidden">
      

      {/* Inject selected fonts dynamically for preview */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=${themeConfig.fontHeading.replace(/ /g, '+')}:wght@400;600;700&family=${themeConfig.fontBody.replace(/ /g, '+')}:wght@300;400;500;700&display=swap');
          
          body { font-family: '${themeConfig.fontBody}', sans-serif; }
        `}
      </style>

      {/* Sticky Banner - at the very top (hidden on success/start-audit pages) */}
      {currentPage !== 'success' && currentPage !== 'start-audit' && (
        <StickyBanner>
          <span className="text-[#D4A574]">✨</span>
          <p className="text-white/90">
            Zrób audyt swojego profilu w{' '}
            <span className="font-semibold text-[#D4A574]">Booksy.pl</span>
            {' '}i zyskaj nawet{' '}
            <span className="font-bold text-white">50% więcej klientów!</span>
          </p>
          <a
            href="/audit"
            className="ml-2 inline-flex items-center gap-1 text-[#D4A574] font-medium hover:text-[#E8C4A0] transition-colors"
          >
            Dowiedz się więcej
            <ChevronRight className="w-4 h-4" />
          </a>
        </StickyBanner>
      )}

      {/* Header with Navigation (hidden on success/start-audit pages) */}
      {currentPage !== 'success' && currentPage !== 'start-audit' && (
        <Header
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onOpenPaywall={() => setIsPaywallOpen(true)}
        />
      )}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        defaultProduct="audit"
      />

      <main className="flex-grow w-full relative z-10">

        {/* Error Notification */}
        {errorMsg && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-center gap-3">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="font-bold">&times;</button>
          </div>
        )}

        {/* Page: SUCCESS - Full screen without header */}
        {currentPage === 'success' && (
          <SuccessPage />
        )}

        {/* Page: START-AUDIT - Full screen for users with credits */}
        {currentPage === 'start-audit' && (
          <StartAuditPage />
        )}

        {/* Page: HOME (Landing) - Full width */}
        {currentPage === 'home' && (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenPaywall={() => setIsPaywallOpen(true)}
          />
        )}

        {/* Page: GENERATOR - Hero Section (full width) */}
        {currentPage === 'generator' && (
          <GeneratorPage
            onOpenPaywall={() => setIsPaywallOpen(true)}
          />
        )}

        {/* Page: CAMPAIGNS-META (full width) */}
        {currentPage === 'campaigns-meta' && (
          <MetaAdsPage
            onOpenPaywall={() => setIsPaywallOpen(true)}
          />
        )}

        {/* Page: CAMPAIGNS-GOOGLE (full width) */}
        {currentPage === 'campaigns-google' && (
          <GoogleAdsPage
            onOpenPaywall={() => setIsPaywallOpen(true)}
          />
        )}

        {/* Pages with constrained width (not landing/generator/success/start-audit/campaigns) */}
        {currentPage !== 'home' && currentPage !== 'generator' && currentPage !== 'success' && currentPage !== 'start-audit' && currentPage !== 'campaigns-meta' && currentPage !== 'campaigns-google' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page: AUDIT (Premium) */}
        {currentPage === 'audit' && (
          <div className="animate-in fade-in duration-500 py-8">
            {/* Hero Section */}
            <div className="text-center mb-16 relative">

              <div className="relative">
                {/* Premium Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#D4AF37]/20 to-[#B76E79]/20 rounded-full text-sm font-semibold text-[#722F37] mb-6 border border-[#D4AF37]/30">
                  <Sparkles size={14} className="text-[#D4AF37]" />
                  Premium Feature
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 mb-6 tracking-tight">
                  Profesjonalny <span className="bg-gradient-to-r from-[#722F37] to-[#B76E79] bg-clip-text text-transparent">Audyt AI</span>
                  <br />
                  Twojego cennika
                </h1>
                <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
                  Pełna analiza Twojego profilu Booksy z eksperckimi rekomendacjami AI.
                  <br className="hidden sm:block" />
                  Dowiedz się, <span className="text-[#722F37] font-medium">co poprawić, żeby przyciągnąć więcej klientów</span>.
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-gradient-to-br from-[#722F37]/10 to-[#B76E79]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <LayoutList size={24} className="text-[#722F37]" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">Analiza struktury</h3>
                <p className="text-sm text-slate-500">Sprawdzamy podział na kategorie, czytelność i logikę prezentacji usług.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-gradient-to-br from-[#B76E79]/10 to-[#D4AF37]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles size={24} className="text-[#B76E79]" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">Copywriting AI</h3>
                <p className="text-sm text-slate-500">AI przepisuje opisy, dodając język korzyści i emotionalne triggery.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37]/10 to-[#722F37]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Check size={24} className="text-[#D4AF37]" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">Plan naprawczy</h3>
                <p className="text-sm text-slate-500">Otrzymujesz konkretne rekomendacje krok po kroku.</p>
              </div>
            </div>

            {/* CTA Card */}
            <div className="max-w-lg mx-auto">
              <div className="bg-gradient-to-br from-[#722F37] to-[#5a252c] p-8 rounded-3xl text-white text-center relative overflow-hidden shadow-2xl shadow-[#722F37]/30">

                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-6 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
                    <Sparkles size={32} className="text-[#D4AF37]" />
                  </div>

                  <h2 className="text-2xl font-serif font-bold mb-3">Audyt AI Cennika</h2>
                  <p className="text-white/80 mb-6 text-sm">
                    Jednorazowa analiza z pełnym raportem PDF i rekomendacjami do wdrożenia.
                  </p>

                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-white/40 line-through text-lg">149,99 zł</span>
                  </div>
                  <div className="flex items-baseline justify-center gap-2 mb-6">
                    <span className="text-4xl font-serif font-bold">79,90 zł</span>
                    <span className="text-white/60 text-sm">jednorazowo</span>
                  </div>

                  <button
                    onClick={() => setIsPaywallOpen(true)}
                    className="w-full px-8 py-4 bg-white text-[#722F37] font-bold rounded-xl hover:bg-[#D4AF37] hover:text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Zamów Audyt
                  </button>

                  <p className="text-xs text-white/50 mt-4">
                    Bez subskrypcji. Płacisz raz, raport Twój na zawsze.
                  </p>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-green-500" />
                  Bezpieczna płatność
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-green-500" />
                  Raport do 90 min
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-green-500" />
                  Faktura VAT
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page: SETTINGS */}
        {currentPage === 'settings' && (
          <div className="animate-in fade-in duration-500 py-8">
            {/* Header */}
            <div className="mb-8 relative">
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#722F37]/10 rounded-full text-xs font-semibold text-[#722F37] mb-4">
                  <Settings size={12} />
                  Personalizacja
                </div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-2">
                  Ustawienia <span className="text-[#722F37]">cennika</span>
                </h1>
                <p className="text-slate-500">Dostosuj wygląd generowanego cennika do swojej marki.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <ConfigPanel config={themeConfig} onChange={handleThemeChange} />
            </div>
          </div>
        )}

        {/* Page: PROFILE */}
        {currentPage === 'profile' && (
          <ProfilePage />
        )}

          </div>
        )}
      </main>

      {/* Footer only for non-landing/success/start-audit pages (Landing has its own) */}
      {currentPage !== 'home' && currentPage !== 'success' && currentPage !== 'start-audit' && (
        <footer className="py-8 text-center border-t border-slate-100 mt-auto bg-white relative z-10">
          <p className="text-slate-400 text-sm flex items-center justify-center gap-1 font-medium">
            Best Ideas by Alex Miesak
          </p>
        </footer>
      )}

      {/* Dev Menu - only in development */}
      <DevMenu />

    </div>
  );
};

export default App;
