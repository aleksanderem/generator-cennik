
import React, { useState } from 'react';
import { Search, Wand2, Link as LinkIcon, Info, CheckCircle, ChevronDown, ChevronUp, AlertOctagon } from 'lucide-react';
import { optimizeBooksyContent } from '../services/geminiService';
import { ShineBorder } from './ShineBorder';
import TerminalLoader from './TerminalLoader';
import AuditResults from './AuditResults';
import { AuditResult } from '../types';

interface BooksyOptimizerProps {
  onUseData: (data: string) => void;
}

const N8N_AUDIT_STEPS = [
  "Inicjalizacja workflow...",
  "Wysyłanie URL do silnika analizy...",
  "Scraping i przetwarzanie treści...",
  "Wykonywanie audytu UX/Copywriting...",
  "Generowanie zoptymalizowanej treści...",
  "Pobieranie raportu końcowego..."
];

const BooksyOptimizer: React.FC<BooksyOptimizerProps> = ({ onUseData }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [customSteps, setCustomSteps] = useState<string[]>(N8N_AUDIT_STEPS);

  const handleProgress = (msg: string) => {
    // Optional: if n8n supported streaming progress, we'd use this. 
    // For now we just stick to the predefined steps mostly.
    // console.log(msg);
  };

  const handleOptimize = async () => {
    if (!url) return;
    
    // Validate URL lightly
    if (!url.startsWith('http')) {
      setError("Link musi zaczynać się od http:// lub https://");
      return;
    }

    setIsLoading(true);
    setIsDataReady(false);
    setError(null);
    setResult(null);
    setCustomSteps(N8N_AUDIT_STEPS);

    try {
      // 1. Fetch data from n8n
      const auditResult = await optimizeBooksyContent(url, handleProgress);
      
      // 2. Set ready flag for loader
      setResult(auditResult);
      setIsDataReady(true);
      
    } catch (e: any) {
      // Use specific error message
      setError(e.message || "Nie udało się pobrać danych. Sprawdź link lub spróbuj ponownie.");
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
            customSteps={customSteps}
          />
          <p className="mt-8 text-slate-500 animate-pulse font-medium">
            Workflow n8n przetwarza dane...
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
              Wklej link do profilu Booksy lub strony salonu. Uruchomimy zewnętrzny <strong>workflow n8n</strong>, który przeprowadzi audyt i zwróci zoptymalizowaną treść.
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
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-start gap-3">
                <AlertOctagon className="shrink-0 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="font-bold mb-1">Błąd Audytu</p>
                  <p className="font-mono text-xs opacity-90">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BooksyOptimizer;
