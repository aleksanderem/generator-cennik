
import React from 'react';
import { AuditResult } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, FileDown, ArrowRight, TrendingUp } from 'lucide-react';

interface AuditResultsProps {
  result: AuditResult;
  onProceed: (text: string) => void;
}

const AuditResults: React.FC<AuditResultsProps> = ({ result, onProceed }) => {
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusIcon = (status: 'ok' | 'warning' | 'error') => {
    switch(status) {
      case 'ok': return <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />;
      case 'warning': return <AlertTriangle size={18} className="text-amber-500 shrink-0" />;
      case 'error': return <XCircle size={18} className="text-red-500 shrink-0" />;
    }
  };

  const downloadCsv = () => {
    const blob = new Blob([result.rawCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cennik_booksy_raw.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif font-bold text-slate-800 mb-2">Wynik Audytu Cennika</h2>
        <p className="text-slate-500">Oto co znaleźliśmy i co poprawiliśmy.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Col: Audit Stats */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Overall Score Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
             <div className="flex justify-between items-start mb-4">
               <div>
                 <h3 className="text-lg font-bold text-slate-700">Jakość Cennika</h3>
                 <p className="text-sm text-slate-400">Ocena AI według 5 kryteriów</p>
               </div>
               <div className={`flex items-center justify-center w-16 h-16 rounded-full border-4 text-xl font-bold ${getScoreColor(result.overallScore)}`}>
                 {result.overallScore}%
               </div>
             </div>
             <p className="text-sm text-slate-600 italic border-l-2 border-indigo-200 pl-3">
               "{result.generalFeedback}"
             </p>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Szczegóły Audytu</h3>
             <div className="space-y-4">
               {result.categories.map((cat, idx) => (
                 <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                       <span className="font-medium text-slate-700 flex items-center gap-2">
                         {getStatusIcon(cat.status)} {cat.name}
                       </span>
                       <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cat.score > 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                         {cat.score}/100
                       </span>
                    </div>
                    <p className="text-xs text-slate-500 pl-7">{cat.message}</p>
                    {cat.suggestion && (
                      <p className="text-xs text-indigo-600 pl-7 mt-1 font-medium">💡 Sugestia: {cat.suggestion}</p>
                    )}
                 </div>
               ))}
             </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
             <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
               <div className="text-2xl font-bold text-slate-800">{result.stats.serviceCount}</div>
               <div className="text-[10px] uppercase text-slate-400 font-bold">Usług</div>
             </div>
             <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
               <div className={`text-2xl font-bold ${result.stats.missingDescriptions > 0 ? 'text-amber-500' : 'text-green-500'}`}>{result.stats.missingDescriptions}</div>
               <div className="text-[10px] uppercase text-slate-400 font-bold">Brak opisów</div>
             </div>
             <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
               <div className="text-2xl font-bold text-slate-800">{result.stats.missingDurations}</div>
               <div className="text-[10px] uppercase text-slate-400 font-bold">Brak czasu</div>
             </div>
          </div>

        </div>

        {/* Right Col: Actions & Optimization */}
        <div className="lg:col-span-7 space-y-6">
           
           <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-200 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <TrendingUp className="text-emerald-400" />
                  Optymalizacja zakończona
                </h3>
                <p className="text-indigo-200 text-sm mb-6">
                  AI przygotowało nową wersję cennika. Opisy zostały rozszerzone o język korzyści, dodano tagi marketingowe i poprawiono formatowanie.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => onProceed(result.optimizedText)}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:-translate-y-1 shadow-lg shadow-emerald-900/20"
                  >
                    Generuj Cennik HTML <ArrowRight size={18} />
                  </button>
                  <button 
                    onClick={downloadCsv}
                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-colors backdrop-blur-sm"
                  >
                    <FileDown size={18} /> Pobierz Surowe CSV
                  </button>
                </div>
              </div>
              
              {/* Bg Decoration */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
           </div>

           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px]">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Podgląd zoptymalizowanej treści</span>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">Ready to use</span>
              </div>
              <textarea 
                readOnly
                className="flex-1 w-full p-5 text-sm font-mono text-slate-600 resize-none outline-none"
                value={result.optimizedText}
              />
           </div>

        </div>

      </div>
    </div>
  );
};

export default AuditResults;
