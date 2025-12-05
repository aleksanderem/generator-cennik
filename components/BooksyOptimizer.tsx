
import React, { useState } from 'react';
import { Search, Wand2, Loader2, Link as LinkIcon, Info, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { optimizeBooksyContent } from '../services/geminiService';
import { ShineBorder } from './ShineBorder';
import TerminalLoader from './TerminalLoader';
import AuditResults from './AuditResults';
import { AuditResult } from '../types';

interface BooksyOptimizerProps {
  onUseData: (data: string) => void;
}

const AUDIT_STEPS = [
  "Nawiązywanie połączenia z Firecrawl API...",
  "Pobieranie surowej treści strony (Markdown)...",
  "Ekstrakcja usług i cen...",
  "AUDYT: Analiza struktury i kategoryzacji...",
  "AUDYT: Weryfikacja transparentności cen...",
  "AUDYT: Ocena języka korzyści...",
  "OPTYMALIZACJA: Przeredagowywanie opisów...",
  "Generowanie raportu końcowego..."
];

const BooksyOptimizer: React.FC<BooksyOptimizerProps> = ({ onUseData }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const handleOptimize = async () => {
    if (!url) return;
    setIsLoading(true);
    setIsDataReady(false);
    setError(null);
    setResult(null);

    try {
      // 1. Fetch data in background
      const auditResult = await optimizeBooksyContent(url);
      
      // 2. Set ready flag for loader
      setResult(auditResult);
      setIsDataReady(true);
      
    } catch (e) {
      setError("Nie udało się pobrać danych. Sprawdź link lub spróbuj ponownie.");
      console.error(e);
      setIsLoading(false);
    }
  };

  const handleLoaderComplete = () => {
    setIsLoading(false);
    // At this point, 'result' is populated, so the view will switch to AuditResults
  };

  if (result && !isLoading) {
    return <AuditResults result={result} onProceed={onUseData} />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      
      {/* Educational Header - Why Audit? */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-8 overflow-hidden">
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="w-full flex items-center justify-between px-6 py-4 bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
        >
          <div className="flex items-center gap-3">
             <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
               <Info size={20} />
             </div>
             <div className="text-left">
               <h3 className="font-bold text-slate-800">Dlaczego warto wykonać Audyt Cennika?</h3>
               <p className="text-xs text-slate-500">Sprawdź, czy Twój cennik sprzedaje, a nie tylko informuje.</p>
             </div>
          </div>
          {showInfo ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
        </button>
        
        {showInfo && (
          <div className="p-6 pt-0 border-t border-indigo-100 bg-indigo-50/30 animate-in slide-in-from-top-2">
            <div className="mt-4 grid md:grid-cols-2 gap-6 text-sm text-slate-600">
              <div className="space-y-3">
                <h4 className="font-bold text-indigo-900">Co sprawdzamy?</h4>
                <ul className="space-y-2">
                  <li className="flex gap-2"><CheckCircle size={16} className="text-green-500 shrink-0" /> Struktura i podział na kategorie</li>
                  <li className="flex gap-2"><CheckCircle size={16} className="text-green-500 shrink-0" /> Transparentność (co zawiera cena?)</li>
                  <li className="flex gap-2"><CheckCircle size={16} className="text-green-500 shrink-0" /> Język korzyści w opisach</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-indigo-900">Dlaczego to ważne?</h4>
                <p>
                  Dobrze skonstruowany cennik to narzędzie sprzedażowe. Klienci muszą widzieć <strong>wartość</strong>, a nie tylko cenę. Audyt pomoże Ci wyłapać braki (np. brak czasu trwania, niejasne opisy), które mogą zniechęcać klientów do rezerwacji.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <TerminalLoader 
            isDataReady={isDataReady} 
            onComplete={handleLoaderComplete}
            customSteps={AUDIT_STEPS}
          />
          <p className="mt-8 text-slate-500 animate-pulse font-medium">
            AI Audytor analizuje Twój salon...
          </p>
        </div>
      ) : (
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl shadow-indigo-100/50 relative overflow-hidden">
          {/* Shine Border */}
          <ShineBorder 
            shineColor={["#818cf8", "#c7d2fe", "#4f46e5"]} 
            duration={12} 
            borderWidth={2}
            className="opacity-60"
          />

          <div className="text-center mb-8 relative z-20">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <Wand2 size={24} />
            </div>
            <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-2">
              Importuj i Audytuj
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Wklej link do profilu Booksy lub strony salonu. Przeprowadzimy <strong className="text-indigo-600">pełny audyt</strong> i przygotujemy zoptymalizowaną wersję cennika.
            </p>
          </div>

          <div className="relative z-20 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="https://booksy.com/pl-pl/..." 
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOptimize()}
                />
              </div>
              <button 
                onClick={handleOptimize}
                disabled={!url}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center gap-2"
              >
                <Search size={20} />
                <span className="hidden sm:inline">Audytuj</span>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BooksyOptimizer;
