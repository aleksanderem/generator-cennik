
import React, { useState } from 'react';
import { Search, Wand2, Link as LinkIcon, Info, CheckCircle, ChevronDown, ChevronUp, Zap, Workflow, Sparkles, TrendingUp, FileText, BarChart3 } from 'lucide-react';
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

      {/* Educational Header - Premium Style */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 mb-8 overflow-hidden">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#722F37]/5 to-[#B76E79]/5 hover:from-[#722F37]/10 hover:to-[#B76E79]/10 transition-colors"
        >
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-[#722F37]/10 to-[#B76E79]/10 p-2.5 rounded-xl text-[#722F37] border border-[#B76E79]/20">
               <Info size={20} />
             </div>
             <div className="text-left">
               <h3 className="font-bold text-slate-800">Dlaczego warto wykonać Audyt Cennika?</h3>
               <p className="text-xs text-slate-500">Sprawdź, czy Twój cennik sprzedaje, a nie tylko informuje.</p>
             </div>
          </div>
          {showInfo ? <ChevronUp className="text-[#722F37]" /> : <ChevronDown className="text-[#722F37]" />}
        </button>

        {showInfo && (
          <div className="p-6 pt-0 border-t border-[#B76E79]/20 bg-gradient-to-b from-[#B76E79]/5 to-transparent animate-in slide-in-from-top-2">
            <div className="mt-4 grid md:grid-cols-2 gap-6 text-sm text-slate-600">
              <div className="space-y-3">
                <h4 className="font-bold text-[#722F37]">Co sprawdzamy?</h4>
                <ul className="space-y-2">
                  <li className="flex gap-2"><CheckCircle size={16} className="text-[#D4AF37] shrink-0" /> Struktura i podział na kategorie</li>
                  <li className="flex gap-2"><CheckCircle size={16} className="text-[#D4AF37] shrink-0" /> Transparentność (co zawiera cena?)</li>
                  <li className="flex gap-2"><CheckCircle size={16} className="text-[#D4AF37] shrink-0" /> Język korzyści w opisach</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-[#722F37]">Dlaczego to ważne?</h4>
                <p className="leading-relaxed">
                  Dobrze skonstruowany cennik to narzędzie sprzedażowe. Klienci muszą widzieć <strong className="text-[#722F37]">wartość</strong>, a nie tylko cenę. Audyt pomoże Ci wyłapać braki, które mogą zniechęcać klientów do rezerwacji.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 relative">

          <TerminalLoader
            isDataReady={isDataReady}
            onComplete={handleLoaderComplete}
            customSteps={customSteps}
          />
          <p className="mt-8 text-slate-500 animate-pulse font-medium">
            {integrationMode === 'N8N' ? 'Workflow n8n przetwarza dane...' : 'Native Mock AI analizuje dane...'}
          </p>

          {/* Progress indicators */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 bg-[#722F37] rounded-full animate-pulse" />
              Scraping
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 bg-[#B76E79] rounded-full animate-pulse animation-delay-200" />
              Analiza
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse animation-delay-400" />
              Raport
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl shadow-[#722F37]/10 relative overflow-hidden border border-slate-100">
          {/* Shine Border - Premium Colors */}
          <ShineBorder
            shineColor={["#722F37", "#B76E79", "#D4AF37"]}
            duration={12}
            borderWidth={2}
            className="opacity-60"
          />


          <div className="text-center mb-8 relative z-20">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#722F37]/10 to-[#B76E79]/10 text-[#722F37] mb-5 border border-[#B76E79]/20">
              <Wand2 size={26} />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 mb-3">
              Importuj i <span className="text-[#722F37]">Audytuj</span>
            </h2>
            <div className="flex items-center justify-center gap-2 mb-3">
               <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${integrationMode === 'N8N' ? 'bg-[#722F37]/10 text-[#722F37] border-[#722F37]/20' : 'bg-[#B76E79]/10 text-[#B76E79] border-[#B76E79]/20'}`}>
                 Tryb: {integrationMode === 'N8N' ? 'n8n Workflow' : 'Native Mock'}
               </span>
            </div>
            <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
              {integrationMode === 'N8N'
                ? 'Wklej link do profilu Booksy lub strony salonu. Uruchomimy zewnętrzny workflow n8n.'
                : 'Użyj natywnej integracji (symulacja) do szybkiego sprawdzenia audytu na przykładowych danych.'}
            </p>

            {/* Feature hints */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-xs text-slate-500 border border-slate-100">
                <BarChart3 size={12} className="text-[#722F37]" />
                Analiza UX
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-xs text-slate-500 border border-slate-100">
                <FileText size={12} className="text-[#B76E79]" />
                Copywriting AI
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-xs text-slate-500 border border-slate-100">
                <TrendingUp size={12} className="text-[#D4AF37]" />
                Rekomendacje
              </div>
            </div>
          </div>

          <div className="relative z-20 space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="https://booksy.com/pl-pl/..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-[#B76E79]/10 focus:border-[#B76E79] outline-none transition-all placeholder:text-slate-400"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOptimize()}
                />
              </div>
              <button
                onClick={handleOptimize}
                disabled={!url}
                className="px-6 py-3.5 bg-gradient-to-r from-[#722F37] to-[#B76E79] text-white font-semibold rounded-xl shadow-lg shadow-[#722F37]/20 hover:shadow-xl hover:shadow-[#722F37]/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center gap-2"
              >
                <Search size={20} />
                <span className="hidden sm:inline">Audytuj</span>
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
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
