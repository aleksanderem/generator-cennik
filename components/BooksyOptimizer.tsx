
import React, { useState } from 'react';
import { Search, Wand2, Link as LinkIcon, Info, CheckCircle, ChevronDown, ChevronUp, Zap, Workflow } from 'lucide-react';
import { optimizeBooksyContent } from '../services/geminiService';
import { ShineBorder } from './ShineBorder';
import TerminalLoader from './TerminalLoader';
import AuditResults from './AuditResults';
import { AuditResult, IntegrationMode } from '../types';

interface BooksyOptimizerProps {
  onUseData: (data: string) => void;
  integrationMode: IntegrationMode;
}

const N8N_AUDIT_STEPS = [
  "Inicjalizacja workflow...",
  "Wysyłanie URL do silnika analizy...",
  "Scraping i przetwarzanie treści...",
  "Wykonywanie audytu UX/Copywriting...",
  "Generowanie zoptymalizowanej treści...",
  "Pobieranie raportu końcowego..."
];

const NATIVE_AUDIT_STEPS = [
  "Inicjalizacja Firecrawl & Gemini...",
  "Scrapowanie struktury (Symulacja)...",
  "Pobieranie surowych danych...",
  "Analiza marketingowa AI...",
  "Przygotowanie raportu..."
];

const BooksyOptimizer: React.FC<BooksyOptimizerProps> = ({ onUseData, integrationMode }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [customSteps, setCustomSteps] = useState<string[]>(N8N_AUDIT_STEPS);

  const handleProgress = (msg: string) => {
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
    setCustomSteps(integrationMode === 'N8N' ? N8N_AUDIT_STEPS : NATIVE_AUDIT_STEPS);

    try {
      // Pass integration mode to service
      const auditResult = await optimizeBooksyContent(url, integrationMode, handleProgress);
      
      setResult(auditResult);
      setIsDataReady(true);
      
    } catch (e: any) {
      setError(e.message || "Nie udało się pobrać danych. Sprawdź link lub spróbuj ponownie.");
      console.error(e);
      setIsLoading(false);
    }
  };

  const handleLoaderComplete = () => {
    setIsLoading(false);
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
            {integrationMode === 'N8N' ? 'Workflow n8n przetwarza dane...' : 'Native Mock AI analizuje dane...'}
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
            <div className="flex items-center justify-center gap-2 mb-2">
               <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${integrationMode === 'N8N' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                 Tryb: {integrationMode === 'N8N' ? 'n8n Workflow' : 'Native Mock'}
               </span>
            </div>
            <p className="text-slate-500 max-w-lg mx-auto">
              {integrationMode === 'N8N' 
                ? 'Wklej link do profilu Booksy lub strony salonu. Uruchomimy zewnętrzny workflow n8n.' 
                : 'Użyj natywnej integracji (symulacja) do szybkiego sprawdzenia audytu na przykładowych danych.'}
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
