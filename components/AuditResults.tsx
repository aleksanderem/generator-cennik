
import React, { useState } from 'react';
import { AuditResult } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, FileDown, ArrowRight, TrendingUp, ThumbsUp, ThumbsDown, ArrowRightCircle, Lightbulb, Search, MousePointerClick, Repeat, Save, Eye, Columns } from 'lucide-react';
import { storageService } from '../services/storageService';

interface AuditResultsProps {
  result: AuditResult;
  onProceed: (text: string) => void;
}

const AuditResults: React.FC<AuditResultsProps> = ({ result, onProceed }) => {
  const [activeTab, setActiveTab] = useState<'REPORT' | 'RAW' | 'COMPARE'>('REPORT');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 border-emerald-500';
    if (score >= 50) return 'text-amber-600 border-amber-500';
    return 'text-rose-600 border-rose-500';
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'Wysoki') return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }

  const getTipIcon = (category: string) => {
    switch(category) {
      case 'SEO': return <Search size={16} />;
      case 'Konwersja': return <MousePointerClick size={16} />;
      case 'Retencja': return <Repeat size={16} />;
      default: return <Lightbulb size={16} />;
    }
  }

  const handleSaveReport = async () => {
    setIsSaving(true);
    const success = await storageService.saveAuditReport(result);
    setIsSaving(false);
    setSaveStatus(success ? 'success' : 'error');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const downloadCsv = () => {
    const blob = new Blob([result.rawCsv || result.optimizedText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cennik_booksy_data.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 border-b border-slate-100 pb-4 gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800">Raport Audytu Cennika</h2>
          <p className="text-slate-500 text-sm mt-1">Analiza potencjału sprzedażowego i struktury oferty.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveTab('REPORT')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'REPORT' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <TrendingUp size={16} /> Raport
          </button>
          <button 
            onClick={() => setActiveTab('COMPARE')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'COMPARE' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Columns size={16} /> Porównaj Wersje
          </button>
          <button 
            onClick={() => setActiveTab('RAW')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'RAW' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Eye size={16} /> Surowe Dane
          </button>
          
          <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>

          <button 
            onClick={handleSaveReport}
            disabled={isSaving || saveStatus === 'success'}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 border ${saveStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {isSaving ? 'Zapisywanie...' : saveStatus === 'success' ? 'Zapisano!' : <> <Save size={16} /> Zapisz Raport </>}
          </button>
        </div>
      </div>

      {activeTab === 'RAW' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-700">Oryginalne dane z Booksy</h3>
             <span className="text-xs text-slate-400 font-mono">JSON/CSV Format</span>
          </div>
          <textarea 
            readOnly
            className="w-full h-[500px] font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 outline-none text-slate-600"
            value={result.optimizedText}
          />
        </div>
      )}

      {activeTab === 'COMPARE' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in h-[600px] flex flex-col">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Columns size={18} className="text-indigo-500"/> 
                Weryfikacja zmian
              </h3>
              <div className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100">
                 ⚠️ Sprawdź, czy żadna usługa nie została przypadkowo usunięta.
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
              <div className="flex flex-col h-full">
                 <div className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Oryginał ({result.rawCsv ? result.rawCsv.length : 0} znaków)</div>
                 <textarea 
                    readOnly 
                    className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs resize-none focus:outline-none"
                    value={result.rawCsv || "Brak surowych danych"}
                 />
              </div>
              <div className="flex flex-col h-full">
                 <div className="text-sm font-bold text-indigo-500 mb-2 uppercase tracking-wider">Wersja dla Edytora (AI)</div>
                 <textarea 
                    readOnly 
                    className="flex-1 w-full bg-indigo-50/30 border border-indigo-100 rounded-lg p-3 font-mono text-xs resize-none focus:outline-none text-slate-700"
                    value={result.optimizedText}
                 />
              </div>
           </div>
        </div>
      )}

      {activeTab === 'REPORT' && (
        <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in">
          
          {/* LEFT COLUMN: Analysis */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Score & General Feedback */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
               {/* Decorative background blur */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3 opacity-50"></div>

               {/* Circular Gauge */}
               <div className="relative w-36 h-36 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                    <path
                      className={getScoreColor(result.overallScore).split(' ')[0]}
                      strokeDasharray={`${result.overallScore}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-serif font-bold ${getScoreColor(result.overallScore).split(' ')[0]}`}>
                      {result.overallScore}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Score</span>
                  </div>
               </div>

               <div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2 font-serif">Werdykt Audytora</h3>
                 <p className="text-slate-600 leading-relaxed italic border-l-4 border-indigo-200 pl-4 py-1">
                   "{result.generalFeedback}"
                 </p>
               </div>
            </div>

            {/* 2. Holistic Growth Strategy */}
            {result.growthTips && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
                  <TrendingUp className="text-indigo-600" />
                  Strategia Naturalnego Wzrostu (Booksy)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {result.growthTips.map((tip, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600 transition-colors">
                          {getTipIcon(tip.category)}
                          {tip.category}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getImpactColor(tip.impact)}`}>
                          {tip.impact} Impact
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 mb-2 text-sm md:text-base">{tip.title}</h4>
                      <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                        {tip.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Before vs After Comparison */}
            {result.beforeAfter && (
              <div className="bg-gradient-to-br from-slate-50 to-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                <div className="bg-white rounded-xl p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <ArrowRightCircle className="text-indigo-500" />
                    Transformacja Struktury (Przykład z Twoich danych)
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6 relative">
                    {/* Arrow in middle */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full items-center justify-center z-10 text-slate-400 shadow-sm">
                      <ArrowRight size={16} />
                    </div>

                    {/* BAD */}
                    <div className="bg-rose-50/30 p-4 rounded-xl border border-rose-100">
                       <div className="flex items-center gap-2 mb-3 text-rose-700 font-bold text-xs uppercase tracking-wider">
                         <XCircle size={14} /> Przed (Błędy)
                       </div>
                       <pre className="text-xs text-rose-900/70 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                         {result.beforeAfter.before}
                       </pre>
                    </div>

                    {/* GOOD */}
                    <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                       <div className="flex items-center gap-2 mb-3 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                         <CheckCircle2 size={14} /> Po (Poprawa)
                       </div>
                       <pre className="text-xs text-emerald-900/70 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                         {result.beforeAfter.after}
                       </pre>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-3 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <Lightbulb className="shrink-0 text-amber-500" size={18} />
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">Dlaczego to lepsze?</span> 
                      {result.beforeAfter.explanation}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Strengths & Weaknesses Grid */}
            <div className="grid md:grid-cols-2 gap-6">
               {/* Strengths */}
               <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
                  <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <ThumbsUp size={18} className="text-emerald-500" />
                    Mocne Strony
                  </h3>
                  <ul className="space-y-3">
                    {result.strengths?.map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-slate-600">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item.replace(/^✅ /, '')}</span>
                      </li>
                    ))}
                    {!result.strengths?.length && <li className="text-slate-400 text-sm">Brak danych.</li>}
                  </ul>
               </div>

               {/* Weaknesses */}
               <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm">
                  <h3 className="font-bold text-rose-900 mb-4 flex items-center gap-2">
                    <ThumbsDown size={18} className="text-rose-500" />
                    Błędy i Konsekwencje
                  </h3>
                  <div className="space-y-4">
                    {result.weaknesses?.map((item, idx) => (
                      <div key={idx} className="text-sm border-b border-rose-50 last:border-0 pb-3 last:pb-0">
                        <div className="flex gap-2 font-medium text-rose-800 mb-1">
                          <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                          {item.point}
                        </div>
                        <p className="text-slate-500 pl-6 text-xs leading-relaxed">
                          ⚠️ <span className="italic">{item.consequence}</span>
                        </p>
                      </div>
                    ))}
                    {!result.weaknesses?.length && <li className="text-slate-400 text-sm">Brak danych.</li>}
                  </div>
               </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Action Plan */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Sales Potential Card */}
            <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-200 relative overflow-hidden group">
               <div className="relative z-10">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                    <TrendingUp className="text-emerald-400" />
                    Potencjał Sprzedażowy
                  </h3>
                  <p className="text-indigo-100 text-sm mb-4 leading-relaxed opacity-90">
                    {result.salesPotential || "Brak danych o potencjale."}
                  </p>
                  
                  <div className="w-full bg-indigo-800/50 rounded-full h-2 mb-1">
                     <div 
                       className="bg-emerald-400 h-2 rounded-full transition-all duration-1000 group-hover:bg-emerald-300" 
                       style={{ width: result.salesPotential?.includes('Wysoki') ? '85%' : result.salesPotential?.includes('Średni') ? '55%' : '25%' }}
                     ></div>
                  </div>
                  <div className="flex justify-between text-[10px] uppercase font-bold text-indigo-300">
                    <span>Niski</span>
                    <span>Wysoki</span>
                  </div>
               </div>
               {/* Decor */}
               <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-40 group-hover:opacity-50 transition-opacity"></div>
            </div>

            {/* Recommendations List */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <h3 className="font-bold text-slate-800 mb-4">Plan Naprawczy (Krok po Kroku)</h3>
               <ul className="space-y-3">
                 {result.recommendations?.map((rec, idx) => (
                   <li key={idx} className="flex gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <span className="font-bold text-indigo-500 font-serif text-lg leading-none">{idx + 1}.</span>
                     <span className="leading-snug">{rec}</span>
                   </li>
                 ))}
               </ul>
            </div>

            {/* CTA */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center sticky top-24">
               <h3 className="font-bold text-slate-800 mb-2">Gotowy na zmiany?</h3>
               <p className="text-xs text-slate-500 mb-6">
                 Przejdź do edytora, aby wygenerować kod cennika z pełną listą usług (zachowujemy 100% pozycji).
               </p>
               <button 
                  onClick={() => onProceed(result.optimizedText)}
                  className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-rose-100 hover:-translate-y-0.5"
                >
                  Dalej: Edycja i Generowanie HTML <ArrowRight size={18} />
                </button>
                <button 
                    onClick={downloadCsv}
                    className="mt-3 w-full flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 text-xs font-medium transition-colors p-2 rounded-lg hover:bg-white"
                  >
                    <FileDown size={14} /> Pobierz Surowe Dane
                  </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default AuditResults;