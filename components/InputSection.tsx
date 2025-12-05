
import React, { useState, useEffect } from 'react';
import { ClipboardList, Wand2 } from 'lucide-react';
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
    <div className="w-full max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-xl shadow-rose-100/50 relative overflow-hidden">
      
      {/* Shine Border Effect */}
      <ShineBorder 
        shineColor={["#fb7185", "#fda4af", "#e11d48"]} 
        duration={10} 
        borderWidth={2}
        className="opacity-80"
      />

      <div className="text-center mb-8 relative z-20">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-600 mb-4">
          <ClipboardList size={24} />
        </div>
        <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-2">
          Krok 1: Wprowadź dane
        </h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Skopiuj komórki ze swojego arkusza Google Sheets lub Excela i wklej je poniżej. 
          AI automatycznie rozpozna strukturę, zdjęcia (linki URL) oraz oznaczenia takie jak "Bestseller" czy "Nowość".
        </p>
      </div>

      <textarea
        className="w-full h-64 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all outline-none resize-none font-mono text-sm relative z-20"
        placeholder="Wklej tutaj dane (np. Nazwa usługi, Cena, Opis, URL zdjęcia, Tagi)..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={isLoading}
      />

      <div className="mt-4 flex justify-between items-center relative z-20">
        <button
          onClick={handleExample}
          className="text-sm text-slate-400 hover:text-rose-500 underline underline-offset-2 transition-colors"
          disabled={isLoading}
        >
          Załaduj przykładowe dane
        </button>
        <button
          onClick={() => onProcess(inputText)}
          disabled={!inputText.trim() || isLoading}
          className="group relative inline-flex items-center gap-2 px-8 py-3 bg-rose-600 text-white rounded-full font-medium shadow-lg shadow-rose-200 hover:bg-rose-700 hover:shadow-rose-300 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
