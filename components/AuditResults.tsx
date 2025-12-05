
import React, { useState } from 'react';
import { AuditResult } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Printer, ArrowRight, Loader2, ThumbsUp, ThumbsDown, Activity } from 'lucide-react';
import { pdfService } from '../services/pdfService';

interface AuditResultsProps {
  result: AuditResult;
  onProceed: (text: string) => void;
}

const AuditResults: React.FC<AuditResultsProps> = ({ result, onProceed }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Fallback if structured data is missing (backward compatibility)
  const report = result.structuredReport || {
    executiveSummary: result.generalFeedback,
    strengths: ["Brak szczegółowych danych o mocnych stronach."],
    weaknesses: result.recommendations || ["Brak szczegółowych danych o słabych stronach."],
    marketingScore: result.overallScore,
    toneVoice: "Standardowy"
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    await pdfService.generateAuditReport('audit-report-content', 'Raport_Audytu_Cennika.pdf');
    setIsGeneratingPdf(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* ACTION HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-serif font-bold text-slate-800">Wynik Audytu</h2>
           <p className="text-slate-500">Przeanalizowaliśmy Twój cennik pod kątem sprzedaży.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm"
          >
             {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
             Pobierz PDF
          </button>
          <button 
            onClick={() => onProceed(result.optimizedText)}
            className="flex items-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-bold text-sm shadow-lg shadow-rose-200"
          >
             Generuj Cennik <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* PRINTABLE REPORT CONTAINER */}
      <div id="audit-report-content" className="bg-white rounded-none md:rounded-2xl shadow-none md:shadow-xl overflow-hidden print:shadow-none print:rounded-none">
        
        {/* REPORT HEADER */}
        <div className="bg-slate-900 text-white p-8 md:p-12 relative overflow-hidden print:bg-slate-900 print:text-white">
           <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div>
                <span className="text-rose-400 font-bold tracking-widest uppercase text-xs mb-2 block">Raport Optymalizacji</span>
                <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">Audyt Skuteczności Cennika</h1>
                <div className="flex items-center gap-4 text-sm text-slate-300">
                   <div className="flex items-center gap-1">
                      <Activity size={16} className="text-rose-400" />
                      <span>{result.stats.serviceCount} analizowanych usług</span>
                   </div>
                   <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                   <div>Ton oferty: <span className="text-white font-medium">{report.toneVoice}</span></div>
                </div>
              </div>
              
              {/* Score Chart */}
              <div className="flex flex-col items-center shrink-0">
                 <div className="relative w-28 h-28 rounded-full flex items-center justify-center bg-slate-800 border-4 border-slate-700 shadow-xl">
                    <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                      <circle cx="50%" cy="50%" r="46" fill="transparent" stroke="#334155" strokeWidth="8" />
                      <circle 
                        cx="50%" cy="50%" r="46" fill="transparent" stroke={report.marketingScore > 80 ? '#10b981' : '#f59e0b'} strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 46}`}
                        strokeDashoffset={`${2 * Math.PI * 46 * (1 - report.marketingScore / 100)}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                      />
                    </svg>
                    <div className="text-center">
                       <span className="text-3xl font-bold block leading-none">{report.marketingScore}</span>
                       <span className="text-[10px] text-slate-400 uppercase">Punkty</span>
                    </div>
                 </div>
                 <span className="text-xs text-rose-400 mt-3 font-bold uppercase tracking-wider">Potencjał Sprzedażowy</span>
              </div>
           </div>
        </div>

        <div className="p-8 md:p-12 grid gap-10">
          
          {/* Executive Summary */}
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
               Podsumowanie Eksperckie
            </h3>
            <div className="bg-slate-50 p-6 rounded-xl border-l-4 border-slate-900 text-slate-700 leading-relaxed text-sm md:text-base">
               {report.executiveSummary}
            </div>
          </section>

          {/* Pros & Cons Grid */}
          <section className="grid md:grid-cols-2 gap-8">
             {/* Strengths */}
             <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-6">
                <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                   <ThumbsUp size={20} className="text-emerald-600" />
                   Mocne Strony
                </h3>
                <ul className="space-y-3">
                   {report.strengths.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-emerald-800">
                         <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                         <span>{item}</span>
                      </li>
                   ))}
                   {report.strengths.length === 0 && <li className="text-sm text-slate-400 italic">Brak wyraźnych mocnych stron.</li>}
                </ul>
             </div>

             {/* Weaknesses */}
             <div className="bg-rose-50/50 rounded-xl border border-rose-100 p-6">
                <h3 className="text-lg font-bold text-rose-900 mb-4 flex items-center gap-2">
                   <ThumbsDown size={20} className="text-rose-600" />
                   Obszary do Poprawy
                </h3>
                <ul className="space-y-3">
                   {report.weaknesses.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-rose-800">
                         <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                         <span>{item}</span>
                      </li>
                   ))}
                   {report.weaknesses.length === 0 && <li className="text-sm text-slate-400 italic">Brak krytycznych błędów.</li>}
                </ul>
             </div>
          </section>

          {/* Sample Data Preview */}
          <section className="break-inside-avoid">
             <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Przykład Zoptymalizowanej Treści</h3>
             <div className="font-mono text-xs bg-slate-900 text-slate-300 p-6 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-64 border border-slate-700 shadow-inner">
                {result.optimizedText.split('\n').slice(0, 8).join('\n')}
                {result.optimizedText.split('\n').length > 8 && '\n... (dalsza część przygotowana do generowania) ...'}
             </div>
             <p className="text-xs text-slate-400 mt-2 text-center">
               Kliknij "Generuj Cennik", aby zobaczyć pełny efekt wizualny.
             </p>
          </section>

        </div>

        {/* Footer for PDF */}
        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
           <p className="text-xs text-slate-400 font-serif italic">
             Raport wygenerowany automatycznie przez BeautyPricer AI • {new Date().toLocaleDateString()}
           </p>
        </div>
      </div>
    </div>
  );
};

export default AuditResults;
