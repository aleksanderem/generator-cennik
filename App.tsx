
import React, { useState, useEffect } from 'react';
import { AppState, PricingData, ThemeConfig, DEFAULT_THEME } from './types';
import { parsePricingData } from './services/geminiService';
import InputSection from './components/InputSection';
import Accordion from './components/Accordion';
import EmbedCode from './components/EmbedCode';
import ConfigPanel from './components/ConfigPanel';
import TerminalLoader from './components/TerminalLoader';
import { LightRays } from './components/LightRays';
import BooksyOptimizer from './components/BooksyOptimizer';
import { ArrowLeft, Check, FileText, Link, Settings, X, Sparkles, LayoutList, Loader2, Columns2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'beauty_pricer_local_last';

type InputMode = 'PASTE' | 'IMPORT';
type ViewMode = 'ORIGINAL' | 'OPTIMIZED' | 'SPLIT';

const App: React.FC = () => {
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
      
      {/* Ambient Background */}
      <LightRays />

      {/* Inject selected fonts dynamically for preview */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=${themeConfig.fontHeading.replace(/ /g, '+')}:wght@400;600;700&family=${themeConfig.fontBody.replace(/ /g, '+')}:wght@300;400;500;700&display=swap');
          
          body { font-family: '${themeConfig.fontBody}', sans-serif; }
        `}
      </style>

      {/* Navbar */}
      <nav className="border-b border-rose-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold leading-none transition-colors" style={{ fontFamily: themeConfig.fontHeading, color: themeConfig.primaryColor }}>
                Generator Cennika
                </span>
                <span className="font-handwriting text-3xl text-slate-500 -mt-2 ml-auto transform -rotate-2 origin-center" style={{ color: themeConfig.mutedColor }}>
                by Alex M.
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3 md:space-x-4">
              <button
                onClick={() => setIsConfigOpen(true)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200"
                title="Ustawienia"
              >
                <Settings size={20} />
              </button>
              <div className="hidden md:flex">
                <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-md border border-green-200">
                  Gemini Ai
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex-grow w-full relative z-10">
        
        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="font-bold">&times;</button>
          </div>
        )}

        {/* State: INPUT */}
        {appState === AppState.INPUT && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4" style={{ fontFamily: themeConfig.fontHeading }}>
                  Zamień arkusz w cennik
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto" style={{ fontFamily: themeConfig.fontBody }}>
                  Nie trać czasu na ręczne formatowanie HTML.
                  Wklej dane, a AI zrobi resztę.
                </p>
             </div>

             {/* Mode Navigation Tabs */}
             <div className="flex justify-center mb-8">
                <div className="bg-slate-100 p-1.5 rounded-full inline-flex">
                   <button 
                    onClick={() => setInputMode('PASTE')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${inputMode === 'PASTE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     <FileText size={16} />
                     Wklej tekst
                   </button>
                   <button 
                    onClick={() => setInputMode('IMPORT')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${inputMode === 'IMPORT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     <Link size={16} />
                     Audyt i Import (Beta)
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

        {/* State: PROCESSING */}
        {appState === AppState.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-10 lg:py-20 animate-in fade-in duration-500">
            
            <TerminalLoader 
              isDataReady={isApiDataReady} 
              onComplete={handleLoaderComplete} 
            />
            
            <h2 className="mt-12 text-2xl font-medium text-slate-800" style={{ fontFamily: themeConfig.fontHeading }}>
              Przetwarzanie danych...
            </h2>
            <p className="mt-2 text-slate-500 text-center max-w-md mx-auto" style={{ fontFamily: themeConfig.fontBody }}>
              Proszę czekać, AI analizuje i kategoryzuje Twoje usługi.
            </p>
          </div>
        )}

        {/* State: PREVIEW */}
        {appState === AppState.PREVIEW && pricingData && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
            <button 
              onClick={resetApp}
              className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={16} />
              Wróć i edytuj dane
            </button>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* Main Preview Area: Expands to full width in Split Mode */}
              <div className={viewMode === 'SPLIT' ? "lg:col-span-12" : "lg:col-span-7"}>
                 <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2" style={{ fontFamily: themeConfig.fontHeading }}>
                       Podgląd na żywo
                    </h2>
                    
                    {/* View Mode Toggle - ADDED Z-INDEX */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg relative z-20">
                       <button
                         onClick={() => handleViewChange('ORIGINAL')}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'ORIGINAL' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                       >
                         <LayoutList size={14} /> Oryginał
                       </button>
                       <button
                         onClick={() => handleViewChange('OPTIMIZED')}
                         disabled={isOptimizing && viewMode === 'OPTIMIZED'}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'OPTIMIZED' ? 'bg-indigo-600 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700'}`}
                       >
                         {isOptimizing && viewMode === 'OPTIMIZED' ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />} 
                         {isOptimizing && viewMode === 'OPTIMIZED' ? 'Gen...' : 'AI Optymalizacja'}
                       </button>
                       <button
                         onClick={() => handleViewChange('SPLIT')}
                         disabled={isOptimizing && viewMode === 'SPLIT'}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'SPLIT' ? 'bg-indigo-600 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700'}`}
                       >
                         {isOptimizing && viewMode === 'SPLIT' ? <Loader2 size={14} className="animate-spin"/> : <Columns2 size={14} />}
                         Porównaj
                       </button>
                    </div>
                 </div>
                 
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
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm animate-in fade-in">
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
                   // SINGLE VIEW (Original or Optimized)
                   <div 
                    className="p-6 md:p-8 rounded-2xl shadow-xl border relative overflow-hidden transition-all"
                    style={{ 
                      backgroundColor: themeConfig.boxBgColor,
                      borderColor: themeConfig.boxBorderColor,
                      boxShadow: `0 20px 25px -5px ${themeConfig.primaryColor}15`
                    }}
                   >
                      <div 
                        className="absolute top-0 left-0 w-full h-1.5"
                        style={{ background: `linear-gradient(to right, ${themeConfig.secondaryColor}, ${themeConfig.primaryColor})` }}
                      ></div>
                      
                      <div className="text-center mb-8">
                         <h3 
                          className="text-2xl font-bold" 
                          style={{ 
                            fontFamily: themeConfig.fontHeading,
                            color: themeConfig.textColor 
                          }}
                         >
                           {currentDisplayData.salonName || "Cennik Usług"}
                         </h3>
                         <div 
                          className="w-12 h-1 mx-auto mt-4 rounded-full"
                          style={{ backgroundColor: themeConfig.secondaryColor }}
                         ></div>
                      </div>

                      <div className="space-y-2 relative min-h-[200px]">
                        {viewMode === 'OPTIMIZED' && !optimizedPricingData && isOptimizing && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                             <Loader2 size={32} className="text-indigo-500 animate-spin mb-3" />
                             <p className="text-sm font-medium text-indigo-800">Sztuczna inteligencja przebudowuje ofertę...</p>
                          </div>
                        )}

                        {/* Render Current View Data */}
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

              {/* Right Column: Config & Code - Moves below if Split View */}
              <div className={viewMode === 'SPLIT' ? "lg:col-span-12 grid md:grid-cols-2 gap-8" : "lg:col-span-5 space-y-6 lg:sticky lg:top-24"}>
                 
                 {/* Configuration Panel */}
                 <div className={viewMode === 'SPLIT' ? "" : "hidden lg:block"}>
                    <ConfigPanel config={themeConfig} onChange={handleThemeChange} />
                 </div>

                 <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-fit">
                    <h2 className="text-xl font-bold text-slate-800 mb-4" style={{ fontFamily: themeConfig.fontHeading }}>
                       Gotowe!
                    </h2>
                    <p className="text-slate-600 mb-6 text-sm" style={{ fontFamily: themeConfig.fontBody }}>
                       Twój cennik jest gotowy. Wygenerowany kod dotyczy <strong>{viewMode === 'ORIGINAL' ? 'Wersji Oryginalnej' : 'Wersji Zoptymalizowanej'}</strong>.
                    </p>
                    
                    <ul className="space-y-2 mb-6">
                       <li className="flex items-start gap-3 text-sm text-slate-600">
                          <Check className="mt-0.5 shrink-0" size={16} style={{ color: themeConfig.primaryColor }} />
                          <span>Podział na {currentDisplayData.categories.length} kategorii</span>
                       </li>
                       <li className="flex items-start gap-3 text-sm text-slate-600">
                          <Check className="mt-0.5 shrink-0" size={16} style={{ color: themeConfig.primaryColor }} />
                          <span>Zapisano preferencje wyglądu</span>
                       </li>
                    </ul>

                    {/* Embed Code always reflects currently visible data (or optimized if split) */}
                    <EmbedCode 
                      data={currentDisplayData} 
                      theme={themeConfig} 
                    />
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 text-center border-t border-slate-100 mt-auto bg-white/50 backdrop-blur-sm relative z-10">
        <p className="text-slate-400 text-sm flex items-center justify-center gap-1 font-medium">
          Best Ideas by Alex Miesak
        </p>
      </footer>

      {/* Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="absolute inset-0" 
            onClick={() => setIsConfigOpen(false)} 
          />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative z-10 animate-in zoom-in-95 duration-200 scrollbar-hide">
            <button 
              onClick={() => setIsConfigOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white text-slate-400 hover:text-slate-600 rounded-full z-20 transition-colors shadow-sm"
            >
              <X size={20} />
            </button>
            <ConfigPanel config={themeConfig} onChange={handleThemeChange} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
