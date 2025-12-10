
import React, { useState, useEffect } from 'react';
import { ClipboardList, Wand2, Sparkles, FileSpreadsheet, Image, Tag } from 'lucide-react';
import { ShineBorder } from './ShineBorder';

interface InputSectionProps {
  onProcess: (data: string) => void;
  isLoading: boolean;
  initialValue?: string; // New prop for pre-filling data
}

const InputSection: React.FC<InputSectionProps> = ({ onProcess, isLoading, initialValue = '' }) => {
  const [inputText, setInputText] = useState(initialValue);

  // Update internal state if prop changes (e.g. coming from Optimizer)
  useEffect(() => {
    if (initialValue) {
      setInputText(initialValue);
    }
  }, [initialValue]);

  const handleExample = () => {
    // Richer example data with images and tags
    const example = `Manicure Hybrydowy	120 zł	Zdjęcie poprzedniej stylizacji, opracowanie skórek, malowanie.	60 min	Bestseller
Pedicure SPA	180 zł	Peeling, maska, masaż, malowanie. PROMOCJA!	90 min
Strzyżenie damskie	150 zł	Mycie, strzyżenie, modelowanie.	60 min	Nowość
Koloryzacja globalna	od 300 zł	Jeden kolor, bez rozjaśniania.	120 min	https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=200&auto=format&fit=crop
Masaż Relaksacyjny	200 zł	Pełny masaż ciała olejkami eterycznymi.	60 min	Hit Sezonu`;
    setInputText(example);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-3xl shadow-2xl shadow-[#722F37]/10 relative overflow-hidden border border-slate-100">

      {/* Shine Border Effect - Premium Colors */}
      <ShineBorder
        shineColor={["#722F37", "#B76E79", "#D4AF37"]}
        duration={12}
        borderWidth={2}
        className="opacity-60"
      />


      <div className="text-center mb-8 relative z-20">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#722F37]/10 to-[#B76E79]/10 text-[#722F37] mb-5 border border-[#B76E79]/20">
          <ClipboardList size={26} />
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 mb-3">
          Krok 1: <span className="text-[#722F37]">Wprowadź dane</span>
        </h2>
        <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
          Skopiuj komórki ze swojego arkusza Google Sheets lub Excela i wklej je poniżej.
        </p>

        {/* Feature hints */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-xs text-slate-500 border border-slate-100">
            <FileSpreadsheet size={12} className="text-[#722F37]" />
            Excel / Sheets
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-xs text-slate-500 border border-slate-100">
            <Image size={12} className="text-[#B76E79]" />
            Zdjęcia URL
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-xs text-slate-500 border border-slate-100">
            <Tag size={12} className="text-[#D4AF37]" />
            Tagi (Bestseller, Nowość)
          </div>
        </div>
      </div>

      <textarea
        className="w-full h-64 p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#B76E79] focus:ring-4 focus:ring-[#B76E79]/10 transition-all outline-none resize-none font-mono text-sm relative z-20 placeholder:text-slate-400"
        placeholder="Wklej tutaj dane (np. Nazwa usługi, Cena, Opis, URL zdjęcia, Tagi)..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={isLoading}
      />

      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-20">
        <button
          onClick={handleExample}
          className="text-sm text-slate-400 hover:text-[#722F37] transition-colors flex items-center gap-1.5 group"
          disabled={isLoading}
        >
          <Sparkles size={14} className="group-hover:text-[#D4AF37] transition-colors" />
          Załaduj przykładowe dane
        </button>
        <button
          onClick={() => onProcess(inputText)}
          disabled={!inputText.trim() || isLoading}
          className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-[#722F37] to-[#B76E79] text-white rounded-xl font-semibold shadow-lg shadow-[#722F37]/20 hover:shadow-xl hover:shadow-[#722F37]/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <>
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full block"></span>
              Przetwarzanie...
            </>
          ) : (
            <>
              <Wand2 size={18} className="group-hover:rotate-12 transition-transform" />
              Generuj cennik
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputSection;
