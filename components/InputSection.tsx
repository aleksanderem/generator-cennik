import React, { useState } from 'react';
import { ClipboardList, Wand2 } from 'lucide-react';

interface InputSectionProps {
  onProcess: (data: string) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onProcess, isLoading }) => {
  const [inputText, setInputText] = useState('');

  const handleExample = () => {
    const example = `Manicure Hybrydowy	120 zł	Zdjęcie poprzedniej stylizacji, opracowanie skórek, malowanie.	60 min
Pedicure SPA	180 zł	Peeling, maska, masaż, malowanie. PROMOCJA!	90 min
Strzyżenie damskie (włosy krótkie)	100 zł	Mycie, strzyżenie, modelowanie.	45 min
Strzyżenie damskie (włosy długie)	150 zł	Mycie, strzyżenie, modelowanie.	60 min
Koloryzacja globalna	od 300 zł	Jeden kolor, bez rozjaśniania.	120 min`;
    setInputText(example);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-xl shadow-rose-100/50 border border-rose-50">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-600 mb-4">
          <ClipboardList size={24} />
        </div>
        <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-2">
          Krok 1: Wprowadź dane
        </h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Skopiuj komórki ze swojego arkusza Google Sheets lub Excela i wklej je poniżej. 
          AI automatycznie rozpozna strukturę.
        </p>
      </div>

      <textarea
        className="w-full h-64 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all outline-none resize-none font-mono text-sm"
        placeholder="Wklej tutaj dane (np. Nazwa usługi, Cena, Opis)..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={isLoading}
      />

      <div className="mt-4 flex justify-between items-center">
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