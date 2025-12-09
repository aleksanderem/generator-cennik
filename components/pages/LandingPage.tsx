import React from 'react';
import { Sparkles, FileText, Zap, ArrowRight, CheckCircle2, Star } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: 'generator' | 'audit') => void;
  onOpenPaywall: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenPaywall }) => {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#B76E79]/10 to-[#D4AF37]/10 rounded-full border border-[#D4AF37]/30 mb-6">
          <Star size={14} className="text-[#D4AF37]" />
          <span className="text-sm font-medium text-[#722F37]">
            Narzędzie dla profesjonalistów beauty
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 mb-6 leading-tight">
          Twój cennik z Booksy
          <span className="block text-[#722F37]">zasługuje na więcej</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
          Przekształć nudny cennik w profesjonalną wizytówkę.
          AI pomoże Ci zoptymalizować opisy i przyciągnąć więcej klientów.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('generator')}
            className="flex items-center gap-2 px-8 py-4 bg-[#722F37] hover:bg-[#5a252c] text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            <FileText size={20} />
            Generator cennika
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded">FREE</span>
          </button>

          <button
            onClick={onOpenPaywall}
            className="flex items-center gap-2 px-8 py-4 text-[#722F37] font-semibold rounded-xl transition-all border-2 border-[#722F37] hover:bg-[#722F37]/5"
          >
            <Sparkles size={20} className="text-[#D4AF37]" />
            Audyt AI cennika
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 border-t border-slate-100">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-center text-slate-900 mb-12">
          Co możesz zrobić?
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1: Generator (FREE) */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:border-[#B76E79]/30 transition-all group">
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#722F37]/10 transition-colors">
              <FileText size={28} className="text-slate-600 group-hover:text-[#722F37]" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xl font-bold text-slate-900">Generator cennika</h3>
              <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded">FREE</span>
            </div>
            <p className="text-slate-600 mb-6">
              Wklej dane z arkusza lub skopiuj z Booksy. AI zamieni je w elegancki HTML gotowy do wklejenia.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={16} className="text-green-500" />
                Automatyczne kategoryzowanie
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={16} className="text-green-500" />
                Responsywny design
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={16} className="text-green-500" />
                Kopiuj-wklej do Booksy
              </li>
            </ul>
            <button
              onClick={() => onNavigate('generator')}
              className="w-full py-3 text-[#722F37] font-semibold rounded-lg border border-[#722F37] hover:bg-[#722F37]/5 transition-colors"
            >
              Wypróbuj za darmo
            </button>
          </div>

          {/* Feature 2: Audyt AI (PREMIUM) */}
          <div className="bg-gradient-to-br from-[#722F37] to-[#5a252c] p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#D4AF37] text-[#722F37] text-xs font-bold px-3 py-1 rounded-bl-lg">
              BESTSELLER
            </div>
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-6">
              <Sparkles size={28} className="text-[#D4AF37]" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xl font-bold">Audyt AI cennika</h3>
              <span className="text-xs font-bold px-2 py-1 bg-[#D4AF37] text-[#722F37] rounded">49 zł</span>
            </div>
            <p className="text-white/80 mb-6">
              Pełna analiza Twojego cennika z Booksy. Dowiedz się co poprawić, żeby przyciągnąć więcej klientów.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-white/90">
                <CheckCircle2 size={16} className="text-[#D4AF37]" />
                Ocena 0-100 z wyjaśnieniem
              </li>
              <li className="flex items-center gap-2 text-sm text-white/90">
                <CheckCircle2 size={16} className="text-[#D4AF37]" />
                Analiza mocnych i słabych stron
              </li>
              <li className="flex items-center gap-2 text-sm text-white/90">
                <CheckCircle2 size={16} className="text-[#D4AF37]" />
                Konkretne rekomendacje zmian
              </li>
            </ul>
            <button
              onClick={onOpenPaywall}
              className="w-full py-3 bg-[#D4AF37] text-[#722F37] font-bold rounded-lg hover:bg-[#c9a432] transition-colors"
            >
              Kup teraz
            </button>
          </div>

          {/* Feature 3: AI Optymalizacja (PREMIUM) */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:border-[#D4AF37]/30 transition-all group">
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#D4AF37]/10 transition-colors">
              <Zap size={28} className="text-slate-600 group-hover:text-[#D4AF37]" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xl font-bold text-slate-900">AI Optymalizacja</h3>
              <span className="text-xs font-bold px-2 py-1 bg-[#D4AF37]/20 text-[#722F37] rounded">29 zł</span>
            </div>
            <p className="text-slate-600 mb-6">
              AI przepisze Twój cennik używając języka korzyści. Lepsze opisy = więcej rezerwacji.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={16} className="text-[#D4AF37]" />
                Profesjonalne opisy usług
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={16} className="text-[#D4AF37]" />
                Optymalna struktura
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={16} className="text-[#D4AF37]" />
                Gotowy HTML do wklejenia
              </li>
            </ul>
            <button
              onClick={onOpenPaywall}
              className="w-full py-3 text-[#722F37] font-semibold rounded-lg border border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors"
            >
              Kup teraz
            </button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-t border-slate-100">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-lg text-slate-600 mb-6">
            Dołącz do setek właścicieli salonów beauty, którzy już zoptymalizowali swoje cenniki
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#722F37]">500+</div>
              <div className="text-sm text-slate-500">cenników</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#722F37]">95%</div>
              <div className="text-sm text-slate-500">zadowolonych</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#722F37]">+23%</div>
              <div className="text-sm text-slate-500">więcej rezerwacji</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#722F37] to-[#B76E79] rounded-3xl text-white text-center my-8">
        <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">
          Gotowy na lepszy cennik?
        </h2>
        <p className="text-white/80 mb-8 max-w-xl mx-auto">
          Zacznij od darmowego generatora lub zainwestuj w pełny audyt AI.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('generator')}
            className="px-8 py-4 bg-white text-[#722F37] font-bold rounded-xl hover:bg-slate-100 transition-colors"
          >
            Zacznij za darmo
          </button>
          <button
            onClick={onOpenPaywall}
            className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
          >
            Zobacz pakiety premium
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
