
import React, { useState, useEffect } from 'react';
import { AppState, PricingData, ThemeConfig, DEFAULT_THEME } from './types';
import { parsePricingData } from './services/geminiService';
import InputSection from './components/InputSection';
import Accordion from './components/Accordion';
import EmbedCode from './components/EmbedCode';
import ConfigPanel from './components/ConfigPanel';
import TerminalLoader from './components/TerminalLoader';
import { ArrowLeft, Check } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'beauty_pricer_local_last';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INPUT);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  
  // New State for Loader Logic
  const [isApiDataReady, setIsApiDataReady] = useState(false);

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

    setAppState(AppState.PROCESSING);
    setIsApiDataReady(false);
    setErrorMsg(null);

    try {
      // 1. Start fetching in "background" while loader plays
      const data = await parsePricingData(rawData);
      
      // 2. Data is ready, notify loader
      setPricingData(data);
      setIsApiDataReady(true);
      
    } catch (err) {
      console.error(err);
      setErrorMsg("Wystąpił błąd podczas przetwarzania danych. Spróbuj ponownie lub sprawdź format danych.");
      setAppState(AppState.INPUT);
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
    setErrorMsg(null);
    setIsApiDataReady(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-800 font-sans selection:bg-rose-200 selection:text-rose-900 flex flex-col">
      
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
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-xs font-medium px-2 py-1 bg-primary-100 text-green-700 rounded-md border border-green-200">
                Gemini Ai
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex-grow w-full">
        
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
             <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4" style={{ fontFamily: themeConfig.fontHeading }}>
                  Zamień arkusz w cennik <span className="font-handwriting text-3xl text-slate-500">kropka</span>
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto" style={{ fontFamily: themeConfig.fontBody }}>
                  Nie trać czasu na ręczne formatowanie HTML.
                  Wklej dane, a AI zrobi resztę.
                </p>
             </div>
             <InputSection onProcess={handleProcessData} isLoading={false} />
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
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <button 
              onClick={resetApp}
              className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={16} />
              Wróć i edytuj dane
            </button>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Preview (Larger) */}
              <div className="lg:col-span-7">
                 <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2" style={{ fontFamily: themeConfig.fontHeading }}>
                       Podgląd na żywo
                    </h2>
                    <span className="text-xs uppercase tracking-widest text-slate-400">Preview</span>
                 </div>
                 
                 <div 
                  className="p-6 md:p-8 rounded-2xl shadow-xl border relative overflow-hidden transition-all"
                  style={{ 
                    backgroundColor: themeConfig.boxBgColor,
                    borderColor: themeConfig.boxBorderColor,
                    boxShadow: `0 20px 25px -5px ${themeConfig.primaryColor}15`
                  }}
                 >
                    {/* Decorative header element */}
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
                         {(pricingData.salonName) ? pricingData.salonName : "Cennik Usług"}
                       </h3>
                       <div 
                        className="w-12 h-1 mx-auto mt-4 rounded-full"
                        style={{ backgroundColor: themeConfig.secondaryColor }}
                       ></div>
                    </div>

                    <div className="space-y-2">
                      {pricingData.categories.map((category, idx) => (
                        <Accordion 
                          key={idx} 
                          category={category} 
                          defaultOpen={idx === 0}
                          theme={themeConfig}
                        />
                      ))}
                    </div>
                 </div>
              </div>

              {/* Right Column: Config & Code */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                 
                 {/* Configuration Panel */}
                 <ConfigPanel config={themeConfig} onChange={handleThemeChange} />

                 <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-4" style={{ fontFamily: themeConfig.fontHeading }}>
                       Gotowe!
                    </h2>
                    <p className="text-slate-600 mb-6 text-sm" style={{ fontFamily: themeConfig.fontBody }}>
                       Twój cennik jest gotowy. Kod zawiera wszystkie Twoje ustawienia kolorystyczne.
                    </p>
                    
                    <ul className="space-y-2 mb-6">
                       <li className="flex items-start gap-3 text-sm text-slate-600">
                          <Check className="mt-0.5 shrink-0" size={16} style={{ color: themeConfig.primaryColor }} />
                          <span>Podział na {pricingData.categories.length} kategorii</span>
                       </li>
                       <li className="flex items-start gap-3 text-sm text-slate-600">
                          <Check className="mt-0.5 shrink-0" size={16} style={{ color: themeConfig.primaryColor }} />
                          <span>Zapisano preferencje wyglądu</span>
                       </li>
                    </ul>

                    <EmbedCode data={pricingData} theme={themeConfig} />
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 text-center border-t border-slate-100 mt-auto bg-white/50 backdrop-blur-sm">
        <p className="text-slate-400 text-sm flex items-center justify-center gap-1 font-medium">
          Best Ideas by Alex Miesak
        </p>
      </footer>
    </div>
  );
};

export default App;
