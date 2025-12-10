
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
import { useUser, SignInButton } from '@clerk/clerk-react';
import { ArrowLeft, Check, FileText, Link, Settings, X, Sparkles, LayoutList, Loader2, Columns2, Code2, Palette, Copy, CheckCircle, PanelRightOpen, PanelRightClose, LogIn } from 'lucide-react';

type Page = 'home' | 'generator' | 'audit' | 'settings';

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

      {/* Header with Navigation */}
      <Header
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenPaywall={() => setIsPaywallOpen(true)}
      />

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        defaultProduct="audit"
      />

      <main className="pt-10 flex-grow w-full relative z-10">

        {/* Error Notification */}
        {errorMsg && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-center gap-3">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="font-bold">&times;</button>
          </div>
        )}

        {/* Page: HOME (Landing) - Full width */}
        {currentPage === 'home' && (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenPaywall={() => setIsPaywallOpen(true)}
          />
        )}

        {/* Pages with constrained width (not landing) */}
        {currentPage !== 'home' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page: GENERATOR */}
        {currentPage === 'generator' && appState === AppState.INPUT && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Premium Header with gradient accent */}
             <div className="text-center mb-12 relative">

                <div className="relative">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#722F37]/10 to-[#B76E79]/10 rounded-full text-sm font-medium text-[#722F37] mb-6 border border-[#B76E79]/20">
                    <Sparkles size={14} className="text-[#D4AF37]" />
                    Generator Cenników AI
                  </div>

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 mb-5 tracking-tight" style={{ fontFamily: themeConfig.fontHeading }}>
                    Zamień <span className="text-[#722F37]">arkusz</span> w <span className="bg-gradient-to-r from-[#722F37] to-[#B76E79] bg-clip-text text-transparent">elegancki cennik</span>
                  </h1>
                  <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: themeConfig.fontBody }}>
                    Nie trać czasu na ręczne formatowanie HTML.
                    <br className="hidden sm:block" />
                    <span className="text-[#722F37] font-medium">Wklej dane, a AI zrobi resztę.</span>
                  </p>
                </div>
             </div>

             {/* Mode Navigation Tabs - Premium Style */}
             <div className="flex justify-center mb-10">
                <div className="bg-white p-1.5 rounded-2xl inline-flex shadow-lg shadow-slate-200/50 border border-slate-200/50">
                   <button
                    onClick={() => setInputMode('PASTE')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${inputMode === 'PASTE' ? 'bg-gradient-to-r from-[#722F37] to-[#B76E79] text-white shadow-lg shadow-[#722F37]/20' : 'text-slate-500 hover:text-[#722F37] hover:bg-[#722F37]/5'}`}
                   >
                     <FileText size={16} />
                     Wklej tekst
                   </button>
                   <button
                    onClick={() => setInputMode('IMPORT')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${inputMode === 'IMPORT' ? 'bg-gradient-to-r from-[#722F37] to-[#B76E79] text-white shadow-lg shadow-[#722F37]/20' : 'text-slate-500 hover:text-[#722F37] hover:bg-[#722F37]/5'}`}
                   >
                     <Link size={16} />
                     Audyt i Import
                     <span className="text-[10px] bg-[#D4AF37] text-white px-1.5 py-0.5 rounded-full font-bold">BETA</span>
                   </button>
                </div>
             </div>

             {/* Content based on Mode */}
             <div className="transition-all duration-300">
               {inputMode === 'PASTE' ? (
                 <InputSection
                   onProcess={handleProcessData}
                   isLoading={false}
                   initialValue={importedText}
                 />
               ) : (
                 <BooksyOptimizer
                   onUseData={handleImportedData}
                   integrationMode={themeConfig.integrationMode}
                 />
               )}
             </div>
          </div>
        )}

        {/* Page: GENERATOR - State: PROCESSING */}
        {currentPage === 'generator' && appState === AppState.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-16 lg:py-24 animate-in fade-in duration-500 relative">

            <TerminalLoader
              isDataReady={isApiDataReady}
              onComplete={handleLoaderComplete}
            />

            <h2 className="mt-12 text-2xl md:text-3xl font-serif font-bold text-slate-800" style={{ fontFamily: themeConfig.fontHeading }}>
              <span className="bg-gradient-to-r from-[#722F37] to-[#B76E79] bg-clip-text text-transparent">AI</span> przetwarza dane...
            </h2>
            <p className="mt-3 text-slate-500 text-center max-w-md mx-auto leading-relaxed" style={{ fontFamily: themeConfig.fontBody }}>
              Proszę czekać, sztuczna inteligencja analizuje i kategoryzuje Twoje usługi.
            </p>

            {/* Progress indicators */}
            <div className="flex items-center gap-6 mt-8">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-2 h-2 bg-[#722F37] rounded-full animate-pulse" />
                Analiza struktury
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-2 h-2 bg-[#B76E79] rounded-full animate-pulse animation-delay-300" />
                Kategoryzacja
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse animation-delay-600" />
                Formatowanie
              </div>
            </div>
          </div>
        )}

        {/* Page: GENERATOR - State: PREVIEW */}
        {currentPage === 'generator' && appState === AppState.PREVIEW && pricingData && (
          <div className="animate-in fade-in duration-300 pb-16 max-w-none">
            {/* Clean Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={resetApp}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-xl font-semibold text-slate-800" style={{ fontFamily: themeConfig.fontHeading }}>
                  Podgląd cennika
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle - Clean Style */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg relative z-20">
                   <button
                     onClick={() => handleViewChange('ORIGINAL')}
                     className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'ORIGINAL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     <LayoutList size={14} /> Oryginał
                   </button>
                   <button
                     onClick={() => handleViewChange('OPTIMIZED')}
                     disabled={isOptimizing && viewMode === 'OPTIMIZED'}
                     className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'OPTIMIZED' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     {isOptimizing && viewMode === 'OPTIMIZED' ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />}
                     AI
                   </button>
                   <button
                     onClick={() => handleViewChange('SPLIT')}
                     disabled={isOptimizing && viewMode === 'SPLIT'}
                     className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'SPLIT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     {isOptimizing && viewMode === 'SPLIT' ? <Loader2 size={14} className="animate-spin"/> : <Columns2 size={14} />}
                     Porównaj
                   </button>
                </div>

                {/* Config Panel Toggle Button */}
                <button
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className={`p-2 rounded-lg transition-colors ${isConfigOpen ? 'bg-[#722F37] text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                  title="Personalizacja"
                >
                  {isConfigOpen ? <PanelRightClose size={18} /> : <Palette size={18} />}
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 items-start">

              {/* Main Preview Area */}
              <div className={viewMode === 'SPLIT' ? "lg:col-span-12" : "lg:col-span-8"}>
                 
                 {viewMode === 'SPLIT' ? (
                   // SIDE-BY-SIDE COMPARISON
                   <div className="grid md:grid-cols-2 gap-6 animate-in fade-in">
                      {/* Left: Original */}
                      <div 
                        className="p-6 rounded-xl shadow-sm border border-slate-200 bg-white relative overflow-hidden"
                        style={{ borderTop: `4px solid ${themeConfig.mutedColor}` }}
                      >
                         <div className="mb-6 text-left">
                            <h3 className="font-bold text-lg text-slate-700 font-serif">Wersja Oryginalna</h3>
                            <p className="text-xs text-slate-400">Bez zmian</p>
                         </div>
                         <div className="space-y-2">
                            {pricingData.categories.map((category, idx) => (
                              <Accordion key={idx} category={category} defaultOpen={false} theme={themeConfig} />
                            ))}
                         </div>
                      </div>

                      {/* Right: Optimized */}
                      <div 
                        className="p-6 rounded-xl shadow-lg border border-indigo-100 bg-white relative overflow-hidden"
                        style={{ borderTop: `4px solid ${themeConfig.primaryColor}` }}
                      >
                         <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">AI</div>
                         <div className="mb-6 text-left">
                            <h3 className="font-bold text-lg font-serif" style={{ color: themeConfig.primaryColor }}>Wersja Zoptymalizowana</h3>
                            <p className="text-xs text-slate-400">Po audycie i poprawkach</p>
                         </div>
                         <div className="space-y-2 relative min-h-[200px]">
                            {isOptimizing || !optimizedPricingData ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 animate-in fade-in">
                                 <Loader2 size={32} className="text-indigo-500 animate-spin mb-3" />
                                 <p className="text-sm font-medium text-indigo-800 animate-pulse">Sztuczna inteligencja przebudowuje ofertę...</p>
                              </div>
                            ) : (
                              optimizedPricingData?.categories.map((category, idx) => (
                                <Accordion key={idx} category={category} defaultOpen={false} theme={themeConfig} />
                              ))
                            )}
                         </div>
                      </div>
                   </div>
                 ) : (
                   // SINGLE VIEW (Original or Optimized) - Clean Design
                   <div
                     className="p-6 rounded-xl border bg-white"
                     style={{
                       borderColor: themeConfig.boxBorderColor,
                     }}
                   >
                      {/* Simple header */}
                      <div className="mb-6 pb-4 border-b" style={{ borderColor: themeConfig.boxBorderColor }}>
                        <h3
                          className="text-lg font-semibold"
                          style={{
                            fontFamily: themeConfig.fontHeading,
                            color: themeConfig.textColor
                          }}
                        >
                          {currentDisplayData.salonName || "Cennik usług"}
                        </h3>
                        {viewMode === 'OPTIMIZED' && (
                          <span className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1">
                            <Sparkles size={10} /> Wersja zoptymalizowana
                          </span>
                        )}
                      </div>

                      {/* Services list */}
                      <div className="relative min-h-[200px]">
                        {viewMode === 'OPTIMIZED' && !optimizedPricingData && isOptimizing && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10">
                             <Loader2 size={24} className="text-slate-400 animate-spin mb-2" />
                             <p className="text-sm text-slate-500">Optymalizowanie...</p>
                          </div>
                        )}

                        {currentDisplayData.categories.map((category, idx) => (
                          <Accordion
                            key={idx}
                            category={category}
                            defaultOpen={idx === 0}
                            theme={themeConfig}
                          />
                        ))}
                      </div>
                   </div>
                 )}
              </div>

              {/* Right Column: Export Card Only */}
              <div className={viewMode === 'SPLIT' ? "lg:col-span-12" : "lg:col-span-4 lg:sticky lg:top-24"}>
                 {/* Export Card - Clean Style */}
                 <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
                    {/* Card Header */}
                    <div className="p-5 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <CheckCircle size={20} className="text-[#722F37]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-slate-800" style={{ fontFamily: themeConfig.fontHeading }}>
                            Cennik gotowy
                          </h2>
                          <p className="text-sm text-slate-500">Pobierz kod HTML</p>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                      {/* Stats - simplified */}
                      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-semibold text-slate-800">{currentDisplayData.categories.length}</span>
                          <span className="text-sm text-slate-500">kategorii</span>
                        </div>
                        <div className="w-px h-4 bg-slate-200" />
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-semibold text-slate-800">
                            {currentDisplayData.categories.reduce((acc, cat) => acc + cat.services.length, 0)}
                          </span>
                          <span className="text-sm text-slate-500">usług</span>
                        </div>
                      </div>

                      {/* Version info */}
                      <div className="flex items-center gap-2 mb-5">
                        <div className={`w-2 h-2 rounded-full ${viewMode === 'OPTIMIZED' ? 'bg-[#D4AF37]' : 'bg-[#722F37]'}`} />
                        <span className="text-sm text-slate-600">
                          Wersja: <span className="font-medium">{viewMode === 'ORIGINAL' ? 'Oryginalna' : 'Zoptymalizowana AI'}</span>
                        </span>
                      </div>

                      {/* Checklist - simplified */}
                      <div className="space-y-1.5 mb-5">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Check size={14} className="text-green-600" />
                          <span>Responsywny design</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Check size={14} className="text-green-600" />
                          <span>Gotowy do wklejenia w Booksy</span>
                        </div>
                      </div>

                      {/* Embed Code */}
                      <EmbedCode
                        data={currentDisplayData}
                        theme={themeConfig}
                      />
                    </div>
                 </div>
              </div>
            </div>

            {/* Slide-over Config Panel Drawer */}
            {isConfigOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
                  onClick={() => setIsConfigOpen(false)}
                />
                {/* Drawer */}
                <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 animate-in slide-in-from-right duration-300 overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
                    <h2 className="text-lg font-semibold text-slate-800">Personalizacja</h2>
                    <button
                      onClick={() => setIsConfigOpen(false)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-5">
                    <ConfigPanel config={themeConfig} onChange={handleThemeChange} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

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

                  <div className="flex items-baseline justify-center gap-2 mb-6">
                    <span className="text-4xl font-serif font-bold">49 zł</span>
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
                  Raport w 5 minut
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

          </div>
        )}
      </main>

      {/* Footer only for non-landing pages (Landing has its own) */}
      {currentPage !== 'home' && (
        <footer className="py-8 text-center border-t border-slate-100 mt-auto bg-white relative z-10">
          <p className="text-slate-400 text-sm flex items-center justify-center gap-1 font-medium">
            Best Ideas by Alex Miesak
          </p>
        </footer>
      )}

    </div>
  );
};

export default App;
