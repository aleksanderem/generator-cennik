"use client";
import React, { useState, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import {
  IconTarget,
  IconChartBar,
  IconUsers,
  IconTrendingDown,
  IconTrendingUp,
  IconSparkles,
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandMeta,
  IconCurrencyDollar,
  IconGraph,
  IconCheck,
  IconPlus,
  IconMinus,
  IconArrowRight,
  IconPhone,
  IconMail,
  IconCalendar,
  IconRocket,
  IconShieldCheck,
  IconClock,
  IconRefresh,
  IconLayoutGrid,
  IconEye,
  IconThumbUp,
} from '@tabler/icons-react';

// Magic UI Components
import { NumberTicker } from '../ui/number-ticker';
import { BlurFade } from '../ui/blur-fade';
import { MagicCard } from '../ui/magic-card';
import { AuroraText } from '../ui/aurora-text';
import { BorderBeam } from '../ui/border-beam';
import { AnimatedShinyText } from '../ui/animated-shiny-text';
import { DotPattern } from '../ui/dot-pattern';
import { AnimatedBeam } from '../ui/animated-beam';
import { SparklesCore } from '../ui/sparkles';
import { RainbowButton } from '../ui/rainbow-button';
import { ShineBorder } from '../ui/shine-border';
import { DottedGlowBackground } from '../ui/dotted-glow-background';

// Circle component for AnimatedBeam
const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {children}
    </div>
  );
});
Circle.displayName = "Circle";

// ========================================
// TYPES
// ========================================

interface MetaAdsPageProps {
  onOpenPaywall?: () => void;
}

// ========================================
// DATA
// ========================================

const painPoints = [
  {
    icon: IconCurrencyDollar,
    title: 'Drogi lead',
    description: 'Płacisz 50-80 zł za lead, a konkurencja płaci 15-25 zł. Przepalasz budżet na źle zoptymalizowane kampanie.',
  },
  {
    icon: IconUsers,
    title: 'Niska jakość leadów',
    description: 'Klientki dzwonią, pytają o cenę i znikają. Albo umawiają się i nie przychodzą. Zero poważnych rezerwacji.',
  },
  {
    icon: IconGraph,
    title: 'Brak skali',
    description: 'Chcesz więcej klientek, zwiększasz budżet, a koszt leada rośnie 2x. Nie wiesz jak skalować kampanie.',
  },
  {
    icon: IconRefresh,
    title: 'Wypalenie kreacji',
    description: 'Te same grafiki od miesięcy, engagement spada, koszt rośnie. Nie masz czasu robić nowych materiałów.',
  },
];

const results = [
  { value: 47, suffix: '%', label: 'Niższy koszt leada', description: 'średnio po 3 miesiącach' },
  { value: 2.3, suffix: 'x', label: 'Więcej leadów', description: 'przy tym samym budżecie' },
  { value: 68, suffix: '%', label: 'Lepsze show-rate', description: 'klientki przychodzą na wizyty' },
  { value: 80, suffix: '%', label: 'Mniej śmieciowych leadów', description: 'lepsza jakość kontaktów' },
];

const processSteps = [
  {
    step: 1,
    title: 'Audyt konta',
    description: 'Sprawdzamy Twoje obecne kampanie, strukturę konta, piksel Facebooka i wydarzenia konwersji.',
    icon: IconChartBar,
  },
  {
    step: 2,
    title: 'Strategia targetowania',
    description: 'Definiujemy grupy odbiorców: lookalike, remarketing, zainteresowania. Testujemy i optymalizujemy.',
    icon: IconTarget,
  },
  {
    step: 3,
    title: 'Kreacje reklamowe',
    description: 'Projektujemy grafiki i copy, które zatrzymują scroll. Video, karuzele, stories - co działa dla beauty.',
    icon: IconSparkles,
  },
  {
    step: 4,
    title: 'Optymalizacja i skalowanie',
    description: 'Codziennie monitorujemy wyniki. Wyłączamy słabe zestawy, skalujemy zwycięzców.',
    icon: IconRocket,
  },
];

const faqs = [
  {
    question: 'Jaki budżet reklamowy potrzebuję?',
    answer: 'Rekomendujemy minimum 2000-3000 zł miesięcznie na sam budżet reklamowy (bez obsługi). Przy mniejszych kwotach ciężko zebrać wystarczająco danych do optymalizacji. Optymalnie 5000+ zł dla szybszych efektów.',
  },
  {
    question: 'Ile trwa zanim zobaczę efekty?',
    answer: 'Pierwsze leady pojawiają się zazwyczaj w ciągu 48-72h od uruchomienia kampanii. Pełna optymalizacja i stabilne wyniki to 4-6 tygodni. Algorytmy Meta potrzebują około 50 konwersji tygodniowo żeby dobrze się uczyć.',
  },
  {
    question: 'Czy potrzebuję piksela Facebooka?',
    answer: 'Tak, piksel jest kluczowy dla remarketingu i optymalizacji konwersji. Pomagamy go zainstalować i skonfigurować jeśli jeszcze go nie masz. To jeden z pierwszych kroków w naszym procesie.',
  },
  {
    question: 'Robicie też kreacje reklamowe?',
    answer: 'Tak, w ramach obsługi projektujemy grafiki i piszemy copy reklamowe. Potrzebujemy od Ciebie zdjęć z salonu, efektów prac i ewentualnie krótkich filmików. Im lepsze materiały źródłowe, tym lepsze wyniki.',
  },
  {
    question: 'Co jeśli mam złe doświadczenia z agencjami?',
    answer: 'Rozumiemy - branża reklamowa ma dużo firm, które obiecują gruszki na wierzbie. My pokazujemy realne liczby, dajemy dostęp do dashboardu z wynikami w czasie rzeczywistym i rozliczamy się z efektów, nie z "działań".',
  },
  {
    question: 'Czy obsługujecie tylko salony beauty?',
    answer: 'Specjalizujemy się w branży beauty - salony kosmetyczne, fryzjerskie, paznokcie, brwi/rzęsy, spa, medycyna estetyczna. To nasza główna ekspertyza. Dzięki temu znamy specyfikę i wiemy co działa.',
  },
];

// ========================================
// COMPONENTS
// ========================================

const FAQItem = ({ faq, isOpen, onClick }: { faq: typeof faqs[0]; isOpen: boolean; onClick: () => void }) => (
  <div className="border-b border-slate-100 last:border-0">
    <button onClick={onClick} className="w-full py-4 flex items-center justify-between text-left">
      <span className="font-medium text-slate-900 pr-4">{faq.question}</span>
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0",
        isOpen ? "bg-[#171717] rotate-180" : "bg-slate-100"
      )}>
        {isOpen ? <IconMinus size={14} className="text-white" /> : <IconPlus size={14} className="text-slate-600" />}
      </div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <p className="pb-4 text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ========================================
// PAIN POINTS SECTION COMPONENT
// ========================================

const PainPointsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);

  // Input refs (problems)
  const input1Ref = useRef<HTMLDivElement>(null);
  const input2Ref = useRef<HTMLDivElement>(null);
  const input3Ref = useRef<HTMLDivElement>(null);
  const input4Ref = useRef<HTMLDivElement>(null);

  // Output refs (results)
  const output1Ref = useRef<HTMLDivElement>(null);
  const output2Ref = useRef<HTMLDivElement>(null);
  const output3Ref = useRef<HTMLDivElement>(null);
  const output4Ref = useRef<HTMLDivElement>(null);

  // Glow state for output cards
  const [glowingCards, setGlowingCards] = useState<Record<number, boolean>>({});

  const triggerGlow = (cardIndex: number) => {
    setGlowingCards(prev => ({ ...prev, [cardIndex]: true }));
    setTimeout(() => {
      setGlowingCards(prev => ({ ...prev, [cardIndex]: false }));
    }, 600);
  };

  const problems = [
    { ref: input1Ref, icon: IconCurrencyDollar, title: 'Drogi lead', desc: '50-80 zł za kontakt' },
    { ref: input2Ref, icon: IconUsers, title: 'Niska jakość leadów', desc: 'Klienci nie przychodzą' },
    { ref: input3Ref, icon: IconGraph, title: 'Brak możliwości skali', desc: 'Więcej budżetu = drożej' },
    { ref: input4Ref, icon: IconRefresh, title: 'Wypalenie kreacji', desc: 'Engagement spada' },
  ];

  const outputs = [
    { ref: output1Ref, icon: IconLayoutGrid, title: 'Ustrukturyzowana kampania' },
    { ref: output2Ref, icon: IconEye, title: 'Pełna kontrola nad wydatkami' },
    { ref: output3Ref, icon: IconTrendingDown, title: 'Tańsze pozyskiwanie leadów' },
    { ref: output4Ref, icon: IconSparkles, title: 'Prawdziwa synergia kanałów' },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <BlurFade delay={0.1} inView>
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[#722F37] uppercase tracking-wider mb-3">
              Transformacja
            </p>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-4">
              Od problemów do rezultatów
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Zobacz jak zamieniamy typowe problemy kampanii Meta Ads w konkretne wyniki.
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} inView>
          <div
            className="relative flex w-full items-center justify-center overflow-visible p-6 md:p-10"
            ref={containerRef}
          >
            <div className="flex flex-col md:flex-row w-full items-center md:items-stretch justify-between gap-6 md:gap-12">

              {/* TOP on mobile / LEFT on desktop - Problems Column - Grid Layout */}
              <div className="flex flex-col flex-1 max-w-full md:max-w-[320px] order-1 justify-center">
                <div className="relative grid grid-cols-2 gap-3 md:gap-4 justify-items-center md:justify-items-end">
                  {problems.map((item, i) => {
                    return (
                      <div
                        key={i}
                        ref={item.ref}
                        className="group relative z-10 rounded-2xl border border-slate-200 bg-slate-50/50 p-1.5 md:p-2 transition-all duration-300 hover:border-red-300/50 w-[115px] h-[115px] md:w-[145px] md:h-[145px]"
                      >
                        <div className="relative h-full flex flex-col items-center justify-center gap-2 rounded-xl bg-white p-3 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
                          <div className="w-11 h-11 md:w-12 md:h-12 rounded-lg border border-red-200/60 bg-red-50/80 flex items-center justify-center transition-colors group-hover:border-red-300 group-hover:bg-red-100/60">
                            <item.icon className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                          </div>
                          <p className="text-[11px] md:text-xs font-medium text-slate-700 leading-tight text-center">{item.title}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CENTER - Horizontal on mobile / Vertical on desktop - Glowing Line with Sparkles */}
              <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-40 order-2 py-4 md:py-0">
                <div className="relative w-full md:w-full h-20 md:h-full md:min-h-[380px] flex flex-col items-center justify-center">

                  {/* Main line container - horizontal on mobile, vertical on desktop */}
                  <div className="relative w-full md:w-28 h-full">

                    {/* Mobile: Left line (red) - horizontal */}
                    <div className="md:hidden absolute top-1/2 left-0 -translate-y-1/2 h-[1px] w-1/2 bg-gradient-to-l from-[#722F37] via-red-500/80 to-transparent" />

                    {/* Mobile: Right line (green) - horizontal */}
                    <div className="md:hidden absolute top-1/2 right-0 -translate-y-1/2 h-[1px] w-1/2 bg-gradient-to-r from-[#722F37] via-emerald-500/80 to-transparent" />

                    {/* Desktop: Upper line - from center going up (red) */}
                    <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-1/2 bg-gradient-to-t from-[#722F37] via-red-500/80 to-transparent" />

                    {/* Desktop: Lower line - from center going down (green) */}
                    <div className="hidden md:block absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-1/2 bg-gradient-to-b from-[#722F37] via-emerald-500/80 to-transparent" />

                    {/* Sparkles - left side (colorful/chaotic) - hidden on mobile */}
                    <div
                      className="hidden md:block absolute right-[50%] top-[50%] w-[500%] h-1/2 overflow-hidden translate-y-[-50%]"
                      style={{ clipPath: 'polygon(15% 0, 85% 0, 100% 50%, 85% 100%, 15% 100%)' }}
                    >
                      <SparklesCore
                        background="transparent"
                        minSize={0.6}
                        maxSize={2.5}
                        particleDensity={600}
                        className="w-full h-full"
                        particleColor={["#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#9ca3af", "#6b7280"]}
                        speed={1.5}
                        direction="right"
                      />
                    </div>

                    {/* Center node with ref for AnimatedBeam */}
                    <div
                      ref={centerRef}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 rounded-full bg-gradient-to-br from-[#ef4444] to-[#1877f2] flex items-center justify-center border-2 border-white/30"
                      style={{ width: '45px', height: '120px', boxShadow: '-18px 0px 25px 0px rgba(255, 61, 61, 0.25), 18px 0px 25px 0px rgba(80, 104, 45, 0.25)' }}
                    >
                      <img src="/emblem-only.svg" alt="BA" className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM on mobile / RIGHT on desktop - Results Column */}
              <div className="flex flex-col flex-1 max-w-full md:max-w-[280px] order-3">
                <div className="flex flex-col gap-3">
                  {outputs.map((item, i) => (
                    <div
                      key={i}
                      ref={item.ref}
                      className={`group relative z-10 rounded-xl border bg-slate-50/50 p-1.5 md:p-2 transition-all duration-300 hover:border-emerald-300/50 ${
                        glowingCards[i]
                          ? 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className={`relative flex items-center gap-3 rounded-lg bg-white p-3 transition-shadow duration-300 ${
                        glowingCards[i]
                          ? 'shadow-[0_0_15px_rgba(16,185,129,0.3),0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04)]'
                          : 'shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]'
                      }`}>
                        <div className={`shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-lg border flex items-center justify-center transition-colors ${
                          glowingCards[i]
                            ? 'border-emerald-400 bg-emerald-100'
                            : 'border-emerald-200/60 bg-emerald-50/80 group-hover:border-emerald-300 group-hover:bg-emerald-100/60'
                        }`}>
                          <item.icon className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs md:text-sm font-medium text-slate-700">{item.title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Green sparkles along beams - 30% length, 50px height, starting from center - hidden on mobile */}
            <div
              className="hidden md:block absolute top-1/2 left-1/2 w-[15%] h-[50px] -translate-y-1/2 pointer-events-none"
            >
              <SparklesCore
                background="transparent"
                minSize={0.4}
                maxSize={1.5}
                particleDensity={1750}
                className="w-full h-full"
                particleColor={["#10b981", "#059669", "#34d399"]}
                speed={0.7}
              />
            </div>
            {/* Animated Beams - hidden on mobile */}
            <div className="hidden md:contents">
              {/* Animated Beams - Inputs to Center (tangled/chaotic) */}
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={input1Ref}
                toRef={centerRef}
                curvature={-120}
                gradientStartColor="#ef4444"
                gradientStopColor="#722F37"
                pathWidth={2}
                pathOpacity={0.2}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={input2Ref}
                toRef={centerRef}
                curvature={80}
                gradientStartColor="#ef4444"
                gradientStopColor="#722F37"
                pathWidth={2}
                pathOpacity={0.2}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={input3Ref}
                toRef={centerRef}
                curvature={-90}
                gradientStartColor="#ef4444"
                gradientStopColor="#D4A574"
                pathWidth={2}
                pathOpacity={0.2}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={input4Ref}
                toRef={centerRef}
                curvature={150}
                gradientStartColor="#ef4444"
                gradientStopColor="#D4A574"
                pathWidth={2}
                pathOpacity={0.2}
              />
              {/* Extra chaotic lines crossing between inputs */}
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={input1Ref}
                toRef={input3Ref}
                curvature={-80}
                gradientStartColor="#dc2626"
                gradientStopColor="#ea580c"
                pathWidth={1.5}
                pathOpacity={0.5}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={input2Ref}
                toRef={input4Ref}
                curvature={90}
                gradientStartColor="#b91c1c"
                gradientStopColor="#c2410c"
                pathWidth={1.5}
                pathOpacity={0.5}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={input1Ref}
                toRef={input4Ref}
                curvature={-150}
                gradientStartColor="#991b1b"
                gradientStopColor="#9a3412"
                pathWidth={1.5}
                pathOpacity={0.45}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={input2Ref}
                toRef={input3Ref}
                curvature={120}
                gradientStartColor="#7f1d1d"
                gradientStopColor="#7c2d12"
                pathWidth={1.5}
                pathOpacity={0.45}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={input1Ref}
                toRef={input2Ref}
                curvature={-200}
                gradientStartColor="#ef4444"
                gradientStopColor="#f97316"
                pathWidth={1}
                pathOpacity={0.4}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={input3Ref}
                toRef={input4Ref}
                curvature={180}
                gradientStartColor="#dc2626"
                gradientStopColor="#ea580c"
                pathWidth={1}
                pathOpacity={0.4}
              />

              {/* Animated Beams - Center to Outputs (slow, green) */}
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={output1Ref}
                curvature={-40}
                gradientStartColor="#10b981"
                gradientStopColor="#059669"
                pathColor="#a7f3d0"
                pathWidth={2}
                pathOpacity={0.5}
                duration={24}
                onPulse={() => triggerGlow(0)}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={output2Ref}
                curvature={-15}
                gradientStartColor="#10b981"
                gradientStopColor="#059669"
                pathColor="#a7f3d0"
                pathWidth={2}
                pathOpacity={0.5}
                duration={28}
                onPulse={() => triggerGlow(1)}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={output3Ref}
                curvature={15}
                gradientStartColor="#10b981"
                gradientStopColor="#059669"
                pathColor="#a7f3d0"
                pathWidth={2}
                pathOpacity={0.5}
                duration={22}
                onPulse={() => triggerGlow(2)}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={output4Ref}
                curvature={40}
                gradientStartColor="#10b981"
                gradientStopColor="#059669"
                pathColor="#a7f3d0"
                pathWidth={2}
                pathOpacity={0.5}
                duration={26}
                onPulse={() => triggerGlow(3)}
              />
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
};

// ========================================
// MAIN COMPONENT
// ========================================

const MetaAdsPage: React.FC<MetaAdsPageProps> = ({ onOpenPaywall }) => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return (
    <div className="overflow-x-hidden">

      {/* Contact Form Modal */}
      <AnimatePresence>
        {isContactModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            onClick={() => setIsContactModalOpen(false)}
          >
            <div className="fixed inset-0 bg-black/50 z-[9998]" />
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotateX: 40, y: 40 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateX: 10 }}
              transition={{ type: "spring", stiffness: 260, damping: 15 }}
              className="relative z-[9999] bg-white rounded-2xl max-w-[800px] w-full mx-4 max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="absolute top-4 right-4 z-10 group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 h-5 w-5 group-hover:scale-125 transition duration-200">
                  <path d="M18 6l-12 12" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-serif font-bold text-slate-900">Formularz kontaktowy</h3>
                <p className="text-sm text-slate-500 mt-1">Wypełnij formularz, a odezwiemy się w ciągu 24h</p>
              </div>
              <div className="flex justify-center p-4 overflow-y-auto">
                <iframe
                  src="https://crm.kolabogroup.pl/forms/f/ca901e7c-e589-4ffb-b1f9-40822abe2e68?e=true"
                  frameBorder="0"
                  width="700"
                  height="500"
                  sandbox="allow-top-navigation allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                  className="max-w-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== HERO ===================== */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        {/* Dot Pattern Background */}
        <DotPattern
          className="absolute inset-0 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)] opacity-50"
          width={20}
          height={20}
          cr={1.5}
        />
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#D4A574]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#722F37]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center">
            <BlurFade delay={0.1} inView>
              <div className="relative inline-block mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1877F2]/10 to-[#E1306C]/10 rounded-full border border-[#1877F2]/20">
                  <IconBrandFacebook size={18} className="text-[#1877F2]" />
                  <IconBrandInstagram size={18} className="text-[#E1306C]" />
                  <AnimatedShinyText className="text-sm font-medium">
                    Meta Ads dla salonów beauty
                  </AnimatedShinyText>
                </div>
                <span className="absolute -top-2 -right-8 p-1.5 bg-gradient-to-r from-[#1877F2] to-[#1877F2] text-white rounded-full shadow-lg">
                  <IconThumbUp className="w-4 h-4" fill="currentColor" />
                </span>
              </div>
            </BlurFade>

            <BlurFade delay={0.2} inView>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 mb-6 leading-tight">
                Więcej klientów z{' '}
                <AuroraText colors={["#1877F2", "#E1306C", "#833AB4", "#D4A574"]}>
                  Facebooka i Instagrama
                </AuroraText>
              </h1>
            </BlurFade>

            <BlurFade delay={0.3} inView>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-8">
                Prowadzimy kampanie reklamowe Meta Ads dla salonów beauty.{' '}
                <mark className="bg-[#D4A574]/20 text-slate-800 px-1 rounded">Obniżamy koszt leada</mark>,{' '}
                poprawiamy jakość zapytań i skalujemy Twój biznes bez przepalania budżetu.
              </p>
            </BlurFade>

            <BlurFade delay={0.4} inView>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <RainbowButton
                  onClick={() => setIsContactModalOpen(true)}
                  variant="white"
                >
                  Umów bezpłatną konsultację
                  <IconArrowRight size={18} />
                </RainbowButton>
                <a
                  href="#proces"
                  className="px-6 py-4 text-slate-600 font-medium hover:text-[#722F37] transition-colors"
                >
                  Zobacz jak działamy
                </a>
              </div>
            </BlurFade>

            {/* Social icons */}
            <BlurFade delay={0.5} inView>
              <div className="flex items-center justify-center mt-10">
                <div className="rotate-[-5deg] hover:rotate-0 transition-transform duration-300">
                  <img src="/facebook.svg" alt="Facebook" className="w-28 h-28 md:w-36 md:h-36" />
                </div>
                <div className="rotate-[5deg] -ml-6 hover:rotate-0 transition-transform duration-300">
                  <img src="/instagram.svg" alt="Instagram" className="w-28 h-28 md:w-36 md:h-36" />
                </div>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ===================== PAIN POINTS ===================== */}
      <PainPointsSection />

      {/* ===================== BENTO GRID - CAMPAIGN MANAGEMENT ===================== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#D4A574] uppercase tracking-wider mb-3">
                Fundament skutecznej kampanii
              </p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                Skuteczna kampania zaczyna się w organizacji
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Pokażemy Ci na co zwracać uwagę, a całą robotę wykonamy profesjonalnie za Ciebie.
              </p>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 border-y border-slate-200 divide-slate-200">
            {/* Activity Trail Card */}
            <div className="md:border-r border-b border-slate-200">
              <div className="p-4 md:p-8">
                <h3 className="text-lg font-bold text-slate-800">Historia aktywności</h3>
                <p className="text-slate-600 mt-2 max-w-md">Kluczowa część organizacji. Musisz widzieć kto dzwonił, kiedy i z jakim efektem. Bez tego tracisz leady - pomożemy to ogarnąć.</p>
              </div>
              <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden [mask-image:linear-gradient(to_right,white_60%,transparent_100%)]">
                <div className="flex-1 rounded-t-3xl gap-2 flex flex-col bg-slate-100 border border-slate-200 mx-auto w-full h-full absolute inset-x-10 inset-y-2 pt-2 px-2">
                  <div className="shadow-black/10 gap-4 border bg-white border-transparent ring-1 rounded-tl-2xl ring-black/10 flex flex-col items-start flex-1">
                    <div className="flex items-center gap-2 border-b w-full py-2 px-4">
                      <IconGraph size={16} className="text-slate-600" />
                      <p className="text-sm font-bold text-slate-800">Ostatnia aktywność</p>
                    </div>

                    {/* Activity Items */}
                    <div className="w-full flex-1 flex flex-col justify-around py-2">
                      {[
                        { icon: IconMail, color: 'bg-blue-500', label: 'Nowy lead', status: null, time: '15s', desc: 'Anna K. - Makijaż permanentny brwi' },
                        { icon: IconPhone, color: 'bg-red-500', label: 'Nieodebrane', status: 'NIEODEBRANE', statusColor: 'bg-red-100 border-red-200 text-red-500', desc: 'Próba kontaktu z Katarzyną N.' },
                        { icon: IconTarget, color: 'bg-orange-500', label: 'W trakcie', status: 'W TRAKCIE', statusColor: 'bg-orange-100 border-orange-200 text-orange-500', desc: 'Wysłano ofertę do Marty W.' },
                        { icon: IconUsers, color: 'bg-black', label: 'Akceptacja', status: 'W TRAKCIE', statusColor: 'bg-orange-100 border-orange-200 text-orange-500', desc: 'Oczekuje na potwierdzenie wizyty' },
                        { icon: IconChartBar, color: 'bg-indigo-500', label: 'Raport tygodniowy', status: null, time: '2m', desc: 'Wygenerowano raport kampanii' },
                        { icon: IconCheck, color: 'bg-green-500', label: 'Pozyskany', status: 'POZYSKANY', statusColor: 'bg-green-100 border-green-200 text-green-500', desc: 'Wizyta umówiona na 15.12' },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center w-full pl-4 relative overflow-hidden">
                          <div className="items-center gap-2 flex">
                            <div className={`size-5 rounded-sm text-white flex items-center justify-center ${item.color}`}>
                              <item.icon size={12} />
                            </div>
                            <p className="text-sm text-slate-600">{item.label}</p>
                            {item.status ? (
                              <div className={`flex gap-1 items-center px-1 py-0.5 rounded-md border ${item.statusColor}`}>
                                <p className="text-[10px] font-bold">{item.status}</p>
                              </div>
                            ) : item.time ? (
                              <div className="flex gap-1 items-center px-1 py-0.5 rounded-md border border-slate-200 bg-slate-50">
                                <IconClock size={12} className="text-slate-400" />
                                <p className="text-[10px] font-bold text-slate-600">{item.time}</p>
                              </div>
                            ) : null}
                          </div>
                          <p className="text-sm text-slate-500 flex-nowrap max-w-[10rem] w-full text-left whitespace-nowrap pr-4">
                            {item.desc.split('').map((char, j) => (
                              <span key={j} style={{ opacity: j < 20 ? 1 : Math.max(0, 1 - (j - 20) * 0.15) }}>{char}</span>
                            ))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Flow Card */}
            <div className="border-b border-slate-200">
              <div className="p-4 md:p-8">
                <h3 className="text-lg font-bold text-slate-800">Pipeline statusów</h3>
                <p className="text-slate-600 mt-2 max-w-md">Lead przychodzi jako nieznany i musi przejść przez etapy aż do wizyty. Jeśli nie wiesz gdzie "utykają" - nie wiesz co poprawić.</p>
              </div>
              <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden perspective-[4000px]">
                {/* 3D Ribbon Arrow SVG - Top */}
                <svg width="190" height="197" viewBox="0 0 190 197" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-1/2 top-20 z-30" style={{ transform: 'translateX(-48%) scaleX(1.2) scale(0.6) translateY(-70%) translateZ(450px)' }}>
                  <path d="M173.838 137.814L171.849 140.157L154.299 150.29L155.909 148.392C156.218 148.028 156.564 147.734 156.941 147.507L156.94 147.506L173.956 137.684C173.917 137.727 173.876 137.769 173.838 137.814Z" fill="url(#paint0_linear_ribbon)" stroke="url(#paint1_linear_ribbon)" strokeWidth="0.208864" />
                  <path d="M139.887 126.312C138.543 127.896 138.166 130.42 138.617 133.201C139.069 135.986 140.354 139.05 142.363 141.735L162.848 169.111C164.616 171.474 166.655 173.157 168.616 174.034C170.037 174.669 171.422 174.881 172.634 174.617L155.736 184.373L155.735 184.374C154.354 185.204 152.536 185.146 150.613 184.286C148.692 183.427 146.679 181.77 144.927 179.429L124.442 152.054C122.452 149.393 121.181 146.36 120.735 143.61C120.289 140.857 120.672 138.407 121.958 136.891C122.266 136.527 122.613 136.233 122.99 136.006L122.989 136.005L140.005 126.183C139.966 126.225 139.925 126.268 139.887 126.312Z" fill="url(#paint2_linear_ribbon)" stroke="url(#paint3_linear_ribbon)" strokeWidth="0.208864" />
                  <path d="M141.083 125.565C142.464 124.735 144.282 124.793 146.205 125.653C148.127 126.512 150.14 128.168 151.892 130.509L154.398 133.859L136.491 144.197L133.971 140.828C132.203 138.465 130.163 136.782 128.202 135.905C126.781 135.269 125.395 135.057 124.184 135.321L141.082 125.566L141.083 125.565Z" fill="url(#paint4_linear_ribbon)" stroke="url(#paint5_linear_ribbon)" strokeWidth="0.208864" />
                  <path d="M49.1787 48.6846C57.7559 43.9064 68.7829 43.1812 81.4541 47.4727C96.8958 52.7025 112.198 64.5162 125.115 79.9258C138.014 95.3135 148.528 114.281 154.427 133.842L136.524 144.178C130.615 124.605 120.093 105.63 107.188 90.2344C94.2544 74.8059 78.9218 62.9636 63.4326 57.7178C52.0516 53.8633 41.9725 54.0401 33.7861 57.5723L49.1797 48.6855L49.1787 48.6846Z" fill="url(#paint6_linear_ribbon)" stroke="url(#paint7_linear_ribbon)" strokeWidth="0.208864" />
                  <path d="M32.6836 29.9541C27.3257 33.9229 22.8915 39.3035 19.5361 45.9082C18.531 47.8867 18.5248 50.6511 19.3086 53.5117C20.0933 56.3754 21.6734 59.3523 23.8643 61.7646C25.6167 63.6942 27.4993 64.976 29.2607 65.5664C30.3908 65.9451 31.4741 66.0375 32.4404 65.833L15.7412 75.4746L15.7354 75.4785C14.5361 76.281 12.9587 76.3878 11.2393 75.8115C9.51957 75.2352 7.66557 73.9777 5.93066 72.0674C3.76244 69.6799 2.19809 66.7329 1.42188 63.9004C0.644919 61.0649 0.661842 58.3597 1.63379 56.4463C5.40332 49.0263 10.5358 43.1624 16.8076 39.1191L32.6836 29.9541Z" fill="url(#paint8_linear_ribbon)" stroke="url(#paint9_linear_ribbon)" strokeWidth="0.208864" />
                  <path d="M45.6504 50.7241C41.4464 53.8557 37.9631 58.0924 35.3213 63.2925C34.9344 64.0541 34.426 64.6321 33.8281 65.0337L16.6602 74.9448C16.9467 74.6259 17.2028 74.2559 17.4189 73.8306C20.7313 67.3105 25.3688 62.3186 31.0879 59.1323L31.0889 59.1313L45.6504 50.7241Z" fill="url(#paint10_linear_ribbon)" stroke="url(#paint11_linear_ribbon)" strokeWidth="0.208864" />
                  <path d="M34.8965 28.6772C46.0445 21.4906 60.8076 20.0429 77.9434 25.8462C98.1519 32.6904 118.169 48.4327 134.862 68.8999C151.537 89.3453 164.89 114.498 171.799 140.187L153.897 150.523C146.976 124.822 133.617 99.6638 116.937 79.2114C100.228 58.7249 80.1802 42.9521 59.9229 36.0913C45.4734 31.1977 32.685 31.4409 22.3135 35.9419L34.8926 28.6802L34.8965 28.6772Z" fill="url(#paint12_linear_ribbon)" stroke="url(#paint13_linear_ribbon)" strokeWidth="0.208864" />
                  <path d="M175.034 137.066C176.415 136.237 178.234 136.295 180.156 137.154C182.078 138.014 184.091 139.67 185.843 142.011C187.833 144.671 189.104 147.704 189.55 150.454C189.996 153.208 189.614 155.657 188.327 157.174L174.86 173.052C174.552 173.415 174.207 173.708 173.83 173.935L156.812 183.759C156.852 183.716 156.894 183.675 156.932 183.63L170.398 167.752C171.742 166.168 172.119 163.645 171.668 160.863C171.216 158.078 169.931 155.015 167.922 152.329C166.154 149.966 164.114 148.283 162.153 147.406C160.733 146.771 159.348 146.559 158.137 146.822L175.033 137.067L175.034 137.066Z" fill="url(#paint14_linear_ribbon)" stroke="url(#paint15_linear_ribbon)" strokeWidth="0.208864" />
                  <path d="M59.8719 36.0767C100.321 49.7761 139.97 99.0269 153.855 150.463L155.759 148.223C158.416 145.091 163.846 146.93 167.887 152.331C171.929 157.732 173.051 164.65 170.394 167.783L156.927 183.661C154.27 186.794 148.84 184.955 144.798 179.553L124.314 152.177C120.272 146.775 119.15 139.857 121.807 136.725C124.464 133.592 129.894 135.431 133.936 140.833L136.261 143.94C124.399 104.933 94.2027 68.3565 63.4171 57.9302C42.2921 50.7758 25.7004 57.5531 17.4104 73.8711C15.4125 77.8038 10.222 77.061 5.81716 72.2109C1.41258 67.3609 -0.538529 60.2408 1.45912 56.3081C11.9621 35.6337 33.0321 26.9868 59.8719 36.0767Z" fill="url(#paint16_linear_ribbon)" stroke="url(#paint17_linear_ribbon)" strokeWidth="0.208864" />
                  <defs>
                    <linearGradient id="paint0_linear_ribbon" x1="164.402" y1="136.975" x2="164.402" y2="150.681" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint1_linear_ribbon" x1="164.402" y1="136.975" x2="164.402" y2="150.681" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint2_linear_ribbon" x1="147.165" y1="125.474" x2="147.165" y2="185.069" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint3_linear_ribbon" x1="147.165" y1="125.474" x2="147.165" y2="185.069" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint4_linear_ribbon" x1="138.747" y1="124.87" x2="138.747" y2="144.334" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint5_linear_ribbon" x1="138.747" y1="124.87" x2="138.747" y2="144.334" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint6_linear_ribbon" x1="92.7955" y1="44.5352" x2="92.7955" y2="144.335" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint7_linear_ribbon" x1="92.7955" y1="44.5352" x2="92.7955" y2="144.335" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint8_linear_ribbon" x1="17.8023" y1="28.5889" x2="17.8023" y2="76.2796" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint9_linear_ribbon" x1="17.8023" y1="28.5889" x2="17.8023" y2="76.2796" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint10_linear_ribbon" x1="32.4584" y1="48.5981" x2="32.4584" y2="75.5674" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint11_linear_ribbon" x1="32.4584" y1="48.5981" x2="32.4584" y2="75.5674" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint12_linear_ribbon" x1="94.3364" y1="22.1548" x2="94.3364" y2="150.682" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint13_linear_ribbon" x1="94.3364" y1="22.1548" x2="94.3364" y2="150.682" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint14_linear_ribbon" x1="172.814" y1="136.371" x2="172.814" y2="184.469" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint15_linear_ribbon" x1="172.814" y1="136.371" x2="172.814" y2="184.469" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint16_linear_ribbon" x1="86.255" y1="49.4242" x2="43.8681" y2="122.841" gradientUnits="userSpaceOnUse"><stop stopColor="#CCCCCC" /><stop offset="1" stopColor="#F7F7F7" /></linearGradient>
                    <linearGradient id="paint17_linear_ribbon" x1="86.255" y1="49.4242" x2="43.8681" y2="122.841" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                  </defs>
                </svg>

                {/* 3D Ribbon Arrow SVG - Bottom (blurred shadow) */}
                <svg width="191" height="198" viewBox="0 0 191 198" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-1/2 top-24 z-0 blur-[3px] opacity-40" style={{ transform: 'translateX(-53%) scaleX(1.2) scale(0.6) translateY(0%) translateZ(450px)' }}>
                  <path d="M174.147 118.72C175.468 121.803 177.479 124.447 179.665 126.231C181.848 128.012 184.222 128.948 186.265 128.577C186.322 128.566 186.379 128.55 186.436 128.538L169.421 138.362C169.036 138.575 168.609 138.729 168.14 138.814C166.183 139.17 163.87 138.276 161.709 136.512C159.551 134.751 157.559 132.134 156.251 129.081L154.286 124.498L172.192 114.161L174.147 118.72Z" fill="url(#paint0_linear_bottom)" stroke="url(#paint1_linear_bottom)" strokeWidth="0.208864" />
                  <path d="M140.314 79.7827C139.481 80.6997 138.973 82.0056 138.813 83.5522C138.593 85.6888 139.03 88.2967 140.192 91.0093C141.513 94.092 143.525 96.7371 145.711 98.521C147.894 100.302 150.268 101.237 152.311 100.866L154.296 100.505L136.743 110.639L134.186 111.104C132.229 111.46 129.916 110.566 127.755 108.802C125.597 107.041 123.605 104.424 122.297 101.371C121.145 98.6828 120.716 96.1109 120.933 94.0171C121.149 91.9223 122.009 90.319 123.418 89.5376L123.42 89.5366L140.314 79.7827Z" fill="url(#paint2_linear_bottom)" stroke="url(#paint3_linear_bottom)" strokeWidth="0.208864" />
                  <path d="M154.632 100.554C151.343 107.547 146.655 112.729 140.941 116.033L125.927 124.701C130.414 121.364 134.133 116.721 136.862 110.812L154.632 100.554Z" fill="url(#paint4_linear_bottom)" stroke="url(#paint5_linear_bottom)" strokeWidth="0.208864" />
                  <path d="M20.6113 23.0103C19.9515 23.7448 19.4908 24.7294 19.2539 25.897C18.8845 27.7178 19.0537 29.9896 19.8486 32.4722C30.3457 65.2557 51.403 98.213 78.2305 120.105C104.591 141.616 130.64 147.647 149.445 139.397L133.717 148.477C114.872 158.355 87.7751 152.828 60.2744 130.386C33.4816 108.523 12.4461 75.6006 1.95996 42.8511C1.17316 40.3937 1.0106 38.1598 1.37109 36.3823C1.73159 34.6052 2.61204 33.2923 3.90625 32.6548H3.90723L3.91309 32.6509L20.6113 23.0103Z" fill="url(#paint6_linear_bottom)" stroke="url(#paint7_linear_bottom)" strokeWidth="0.208864" />
                  <path d="M24.2568 21.7852C26.4 21.9 28.7511 23.2382 30.8184 25.3291C32.8834 27.4179 34.6532 30.2467 35.6367 33.3184C43.9436 59.2618 60.5692 85.2513 81.7412 102.528C102.487 119.457 122.995 124.249 137.84 117.826L122.855 126.478C107.955 135.094 86.0412 130.971 63.7852 112.81C42.6479 95.5609 26.044 69.6066 17.748 43.6973C16.7543 40.5938 14.9665 37.7366 12.8789 35.625C10.7934 33.5156 8.39574 32.1383 6.17969 32.0195C5.7036 31.9941 5.25514 32.0296 4.83594 32.1182L22.002 22.207C22.6487 21.8899 23.4037 21.7395 24.2568 21.7852Z" fill="url(#paint8_linear_bottom)" stroke="url(#paint9_linear_bottom)" strokeWidth="0.208864" />
                  <path d="M172.027 114.252C167.608 125.449 160.603 133.423 151.808 138.035L151.804 138.037L138.812 145.537C145.385 140.705 150.667 133.675 154.232 124.526L172.027 114.252Z" fill="url(#paint10_linear_bottom)" stroke="url(#paint11_linear_bottom)" strokeWidth="0.208864" />
                  <path d="M163.273 74.9189C165.23 74.5634 167.544 75.457 169.705 77.2207C171.863 78.9819 173.854 81.5984 175.163 84.6523L188.63 116.081C189.782 118.769 190.21 121.34 189.993 123.434C189.777 125.529 188.917 127.132 187.508 127.913L187.507 127.914L170.61 137.668C171.444 136.751 171.953 135.446 172.113 133.898C172.334 131.762 171.896 129.154 170.733 126.441L157.267 95.0137C155.945 91.9308 153.935 89.2858 151.749 87.502C149.566 85.7207 147.192 84.7851 145.148 85.1562L124.664 88.8799C124.605 88.8906 124.548 88.9053 124.49 88.918L141.508 79.0938C141.893 78.8803 142.321 78.7269 142.79 78.6416L163.273 74.9189Z" fill="url(#paint12_linear_bottom)" stroke="url(#paint13_linear_bottom)" strokeWidth="0.208864" />
                  <path d="M145.117 85.1484C149.158 84.4138 154.588 88.8446 157.245 95.0454L170.712 126.474C173.369 132.675 172.247 138.297 168.206 139.032C164.164 139.766 158.734 135.335 156.077 129.135L154.173 124.695C140.288 160.098 100.64 163.569 60.1902 130.561C33.3505 108.659 12.2805 75.6821 1.77748 42.8799C-0.220302 36.6404 1.73092 31.7733 6.13552 32.0093C10.5402 32.2454 15.7307 37.4954 17.7288 43.7349C26.0187 69.6254 42.6105 95.5611 63.7355 112.8C94.5212 137.922 124.717 136.213 136.58 110.903L134.254 111.326C130.213 112.061 124.782 107.63 122.125 101.429C119.468 95.2284 120.591 89.6053 124.632 88.8706L145.117 85.1484Z" fill="url(#paint14_linear_bottom)" stroke="url(#paint15_linear_bottom)" strokeWidth="0.208864" />
                  <defs>
                    <linearGradient id="paint0_linear_bottom" x1="170.857" y1="114.011" x2="170.857" y2="138.995" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint1_linear_bottom" x1="170.857" y1="114.011" x2="170.857" y2="138.995" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint2_linear_bottom" x1="137.822" y1="79.0034" x2="137.822" y2="111.285" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint3_linear_bottom" x1="137.822" y1="79.0034" x2="137.822" y2="111.285" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint4_linear_bottom" x1="138.887" y1="100.297" x2="138.887" y2="126.567" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint5_linear_bottom" x1="138.887" y1="100.297" x2="138.887" y2="126.567" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint6_linear_bottom" x1="76.4712" y1="22.1177" x2="76.4712" y2="153.284" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint7_linear_bottom" x1="76.4712" y1="22.1177" x2="76.4712" y2="153.284" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint8_linear_bottom" x1="72.4292" y1="21.6729" x2="72.4292" y2="130.904" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint9_linear_bottom" x1="72.4292" y1="21.6729" x2="72.4292" y2="130.904" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint10_linear_bottom" x1="153.002" y1="114.011" x2="153.002" y2="148.57" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint11_linear_bottom" x1="153.002" y1="114.011" x2="153.002" y2="148.57" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint12_linear_bottom" x1="156.761" y1="74.7373" x2="156.761" y2="138.448" gradientUnits="userSpaceOnUse"><stop stopColor="#E6E6E6" /><stop offset="1" stopColor="#FAFAFA" /></linearGradient>
                    <linearGradient id="paint13_linear_bottom" x1="156.761" y1="74.7373" x2="156.761" y2="138.448" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                    <linearGradient id="paint14_linear_bottom" x1="86.5734" y1="49.789" x2="44.1865" y2="123.205" gradientUnits="userSpaceOnUse"><stop stopColor="#CCCCCC" /><stop offset="1" stopColor="#F7F7F7" /></linearGradient>
                    <linearGradient id="paint15_linear_bottom" x1="86.5734" y1="49.789" x2="44.1865" y2="123.205" gradientUnits="userSpaceOnUse"><stop /><stop offset="1" stopOpacity="0.5" /></linearGradient>
                  </defs>
                </svg>

                <div className="flex items-center justify-center gap-20 h-[200%] absolute -inset-x-[150%] -inset-y-40 bg-[length:40px_40px] bg-[image:linear-gradient(to_right,rgb(226,232,240)_1px,transparent_1px),linear-gradient(to_bottom,rgb(226,232,240)_1px,transparent_1px)]"
                  style={{
                    transform: 'rotateY(20deg) rotateX(50deg) rotateZ(40deg)',
                    maskImage: 'radial-gradient(ellipse 50% 50% at center, black, transparent)'
                  }}
                >
                  <div className="px-4 py-2 rounded-full bg-blue-100 border border-blue-300 text-blue-600 font-medium flex items-center gap-2 shadow-lg">
                    <span className="text-lg">?</span>
                    <span>Nieznany</span>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-green-100 border border-green-300 text-green-600 font-medium flex items-center gap-2 shadow-lg">
                    <IconCheck size={16} />
                    <span>Pozyskany</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audience Grid Card */}
            <div className="md:border-r border-slate-200">
              <div className="p-4 md:p-8">
                <h3 className="text-lg font-bold text-slate-800">Grupy odbiorców</h3>
                <p className="text-slate-600 mt-2 max-w-md">Targetowanie to podstawa skutecznej kampanii. Budujemy lookalike, remarketing i grupy zainteresowań - żebyś docierał do właściwych osób.</p>
              </div>
              <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden [mask-image:radial-gradient(ellipse_50%_50%_at_center,black,transparent)]">
                <div className="flex-1 rounded-t-3xl gap-2 flex items-center justify-center w-full h-full absolute inset-x-0 p-2" style={{ transform: 'rotateY(20deg) rotateX(20deg) rotateZ(-20deg)' }}>
                  {/* Central circle with logo */}
                  <div className="size-40 bg-white absolute inset-0 shrink-0 border z-[10] rounded-full m-auto flex items-center justify-center border-slate-200 shadow-sm">
                    <IconTarget size={40} className="text-slate-400" />

                    {/* Orbiting icons */}
                    <div className="size-10 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm animate-orbit [--translate-position:120px] [--orbit-duration:10s] bg-white">
                      <img src="/facebook.svg" alt="Facebook" className="w-6 h-6" />
                    </div>
                    <div className="size-10 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm animate-orbit [--initial-position:80deg] [--translate-position:160px] [--orbit-duration:20s] bg-white">
                      <img src="/instagram.svg" alt="Instagram" className="w-6 h-6" />
                    </div>
                    <div className="size-10 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm animate-orbit [--initial-position:140deg] [--translate-position:180px] [--orbit-duration:15s] bg-white">
                      <IconUsers size={24} className="text-[#D4A574]" />
                    </div>
                    <div className="size-10 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm animate-orbit [--initial-position:240deg] [--translate-position:220px] [--orbit-duration:25s] bg-white">
                      <IconChartBar size={24} className="text-[#722F37]" />
                    </div>

                    {/* Orbiting info card */}
                    <div className="flex absolute inset-0 m-auto items-center justify-center border border-transparent rounded-sm animate-orbit [--initial-position:20deg] [--translate-position:250px] [--orbit-duration:30s] size-auto ring-0 shadow-none bg-transparent w-60">
                      <div className="h-fit my-auto mx-auto w-full p-3 rounded-2xl border border-slate-200 shadow-2xl absolute bottom-0 left-12 max-w-[90%] z-30 bg-white">
                        <div className="flex gap-3 items-center">
                          <IconCheck size={16} className="text-green-500" />
                          <p className="text-xs font-normal text-slate-800">Lookalike Audience</p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-normal mt-2">Podobni do Twoich najlepszych klientek</p>
                      </div>
                    </div>
                    <div className="flex absolute inset-0 m-auto items-center justify-center border border-transparent rounded-sm animate-orbit [--initial-position:180deg] [--translate-position:210px] [--orbit-duration:22s] size-auto ring-0 shadow-none bg-transparent w-60">
                      <div className="h-fit my-auto mx-auto w-full p-3 rounded-2xl border border-slate-200 shadow-2xl absolute bottom-0 left-12 max-w-[90%] z-30 bg-white">
                        <div className="flex gap-3 items-center">
                          <IconCheck size={16} className="text-green-500" />
                          <p className="text-xs font-normal text-slate-800">Remarketing</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Concentric background circles */}
                  <div className="inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-60 bg-slate-100/80 z-[9] relative" />
                  <div className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-80 bg-slate-100/60 z-[8]" />
                  <div className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-[400px] bg-slate-100/40 z-[7]" />
                  <div className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-[480px] bg-slate-100/20 z-[6]" />
                </div>
              </div>
            </div>

            {/* Guardrails Card */}
            <div>
              <div className="p-4 md:p-8">
                <h3 className="text-lg font-bold text-slate-800">Optymalizacja kampanii</h3>
                <p className="text-slate-600 mt-2 max-w-md">Kampania to żywy organizm - wymaga codziennej uwagi. Analizujemy dane, wyciągamy wnioski i pokazujemy Ci co działa, a co nie.</p>
              </div>
              <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden [mask-image:linear-gradient(to_bottom,white_60%,transparent_100%)]">
                <div className="relative h-full overflow-hidden" style={{ perspective: '1000px' }}>
                  <motion.div
                    initial={{ opacity: 0, rotateY: 40, rotateX: 30, rotateZ: -30 }}
                    whileInView={{ opacity: 1, rotateY: 20, rotateX: 20, rotateZ: -20 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className="mx-auto my-auto flex h-full w-full max-w-[85%] flex-col rounded-2xl border border-slate-300 bg-slate-100 p-3 shadow-2xl translate-x-6"
                    style={{
                      maskImage: 'linear-gradient(to bottom, white 50%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, white 50%, transparent 100%)',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <IconChartBar className="size-4 text-[#722F37]" />
                      <p className="text-sm font-medium text-slate-800">Raport kampanii</p>
                    </div>

                    {/* Content card */}
                    <div className="relative mt-3 flex-1 overflow-visible rounded-2xl border border-slate-200 bg-slate-200">
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(315deg, #64748b 0, #64748b 1px, transparent 0, transparent 50%)',
                          backgroundSize: '10px 10px',
                        }}
                      />

                      <div
                        className="absolute inset-0 h-full w-full rounded-2xl bg-white shadow-lg"
                        style={{ transform: 'translateX(12px) translateY(-12px)' }}
                      >
                        {[
                          { name: 'CTR (Click-Through Rate)', value: '2.4%', status: 'good' },
                          { name: 'CPC (Koszt kliknięcia)', value: '0.85 zł', status: 'good' },
                          { name: 'CPL (Koszt leada)', value: '24 zł', status: 'good' },
                          { name: 'Częstotliwość', value: '1.8', status: 'good' },
                          { name: 'ROAS', value: '...', status: 'loading' },
                        ].map((metric, idx) => (
                          <div key={metric.name}>
                            <div className="flex items-center justify-between px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "flex size-4 items-center justify-center rounded-full",
                                  metric.status === 'loading' ? "bg-[#D4A574]" : "bg-green-500"
                                )}>
                                  {metric.status === 'loading' ? (
                                    <svg className="size-3 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M12 3a9 9 0 1 0 9 9" />
                                    </svg>
                                  ) : (
                                    <IconCheck className="size-3 text-white" />
                                  )}
                                </div>
                                <p className="text-[11px] font-medium text-slate-500">{metric.name}</p>
                              </div>
                              <div className="flex items-center gap-1 text-slate-600">
                                <p className="text-[10px] font-bold">{metric.value}</p>
                              </div>
                            </div>
                            {idx < 4 && (
                              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== RESULTS ===================== */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#D4A574] uppercase tracking-wider mb-3">
                Wyniki
              </p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                Co osiągamy dla naszych klientów
              </h2>
            </div>
          </BlurFade>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((result, index) => (
              <BlurFade key={result.label} delay={0.1 + index * 0.1} inView>
                <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <div className="text-4xl md:text-5xl font-bold text-[#722F37] mb-2">
                    <NumberTicker value={result.value} decimalPlaces={result.value % 1 !== 0 ? 1 : 0} />
                    <span>{result.suffix}</span>
                  </div>
                  <p className="font-semibold text-slate-800 mb-1">{result.label}</p>
                  <p className="text-xs text-slate-500">{result.description}</p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PROCESS ===================== */}
      <section id="proces" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#D4A574] uppercase tracking-wider mb-3">
                Jak działamy
              </p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                Nasz proces w 4 krokach
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Sprawdzona metodologia, która działa dla salonów beauty każdej wielkości.
              </p>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 border-y border-slate-200">
            {/* Step 1: Audyt konta */}
            <div className="md:border-r border-b border-slate-200">
              <div className="p-4 md:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 bg-[#D4A574] rounded-full flex items-center justify-center text-white font-bold text-xs">1</div>
                  <h3 className="text-lg font-bold text-slate-800">Audyt konta</h3>
                </div>
                <p className="text-slate-600 mt-2 max-w-md">Sprawdzamy Twoje obecne kampanie, strukturę konta, piksel Facebooka i wydarzenia konwersji.</p>
              </div>
              <BlurFade delay={0.1} inView>
                <div className="relative h-80 overflow-hidden [mask-image:linear-gradient(to_bottom,white_70%,transparent_100%)]">
                  <div className="relative h-full" style={{ perspective: '1000px' }}>
                    <div
                      className="mx-auto flex h-full w-full max-w-[85%] flex-col rounded-2xl border border-slate-300 bg-slate-100 p-3 shadow-2xl"
                      style={{ transform: 'rotateY(20deg) rotateX(20deg) rotateZ(1deg) translate(-4%, 10px)', maskImage: 'linear-gradient(to bottom, white 60%, transparent 100%)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <IconChartBar size={14} className="text-[#722F37]" />
                          <span className="text-xs font-medium text-slate-700">Audyt konta</span>
                        </div>
                        <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">87/100</span>
                      </div>
                      <div className="relative flex-1 rounded-xl border border-slate-200 bg-slate-200">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #64748b 0, #64748b 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }} />
                        <div className="absolute inset-0 h-full w-full rounded-xl bg-white shadow-lg p-2.5" style={{ transform: 'translateX(9px) translateY(-10px)' }}>
                          {/* Circular score */}
                          <div className="flex gap-3 mb-2">
                            <div className="relative size-12 shrink-0">
                              <svg className="size-12 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="87 100" strokeLinecap="round" />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700">87%</span>
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center">
                                <span className="text-[8px] text-slate-500 w-14">Piksel FB</span>
                                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full w-[95%] bg-green-500 rounded-full" /></div>
                                <span className="text-[7px] text-green-600 ml-1">95%</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-[8px] text-slate-500 w-14">Struktura</span>
                                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full w-[80%] bg-green-500 rounded-full" /></div>
                                <span className="text-[7px] text-green-600 ml-1">80%</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-[8px] text-slate-500 w-14">Konwersje</span>
                                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full w-[70%] bg-[#D4A574] rounded-full" /></div>
                                <span className="text-[7px] text-[#D4A574] ml-1">70%</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-[8px] text-slate-500 w-14">Kreacje</span>
                                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full w-[90%] bg-green-500 rounded-full" /></div>
                                <span className="text-[7px] text-green-600 ml-1">90%</span>
                              </div>
                            </div>
                          </div>
                          {/* Stats row */}
                          <div className="flex gap-1.5 mb-2">
                            <div className="flex-1 bg-slate-50 rounded p-1 border border-slate-100 text-center">
                              <p className="text-[7px] text-slate-400">Kampanie</p>
                              <p className="text-[9px] font-bold text-slate-700">4</p>
                            </div>
                            <div className="flex-1 bg-slate-50 rounded p-1 border border-slate-100 text-center">
                              <p className="text-[7px] text-slate-400">Zestawy</p>
                              <p className="text-[9px] font-bold text-slate-700">12</p>
                            </div>
                            <div className="flex-1 bg-slate-50 rounded p-1 border border-slate-100 text-center">
                              <p className="text-[7px] text-slate-400">Reklamy</p>
                              <p className="text-[9px] font-bold text-slate-700">28</p>
                            </div>
                          </div>
                          {/* Issues list */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 px-1.5 py-1 bg-red-50 rounded border border-red-100">
                              <div className="size-1.5 rounded-full bg-red-500 shrink-0" />
                              <span className="text-[7px] text-red-600 flex-1">Brak API Conversions</span>
                              <span className="text-[7px] text-red-400">Krytyczne</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-1.5 py-1 bg-amber-50 rounded border border-amber-100">
                              <div className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                              <span className="text-[7px] text-amber-600 flex-1">Za dużo zestawów (12)</span>
                              <span className="text-[7px] text-amber-400">Średnie</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-1.5 py-1 bg-blue-50 rounded border border-blue-100">
                              <div className="size-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span className="text-[7px] text-blue-600 flex-1">Dodaj więcej kreacji video</span>
                              <span className="text-[7px] text-blue-400">Sugestia</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </BlurFade>
            </div>

            {/* Step 2: Strategia targetowania */}
            <div className="border-b border-slate-200">
              <div className="p-4 md:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 bg-[#D4A574] rounded-full flex items-center justify-center text-white font-bold text-xs">2</div>
                  <h3 className="text-lg font-bold text-slate-800">Strategia targetowania</h3>
                </div>
                <p className="text-slate-600 mt-2 max-w-md">Definiujemy grupy odbiorców: lookalike, remarketing, zainteresowania. Testujemy i optymalizujemy.</p>
              </div>
              <BlurFade delay={0.2} inView>
                <div className="relative h-80 overflow-hidden [mask-image:linear-gradient(to_bottom,white_70%,transparent_100%)]">
                  <div className="relative h-full" style={{ perspective: '1000px' }}>
                    <div
                      className="mx-auto flex h-full w-full max-w-[85%] flex-col rounded-2xl border border-slate-300 bg-slate-100 p-3 shadow-2xl"
                      style={{ transform: 'rotateY(-20deg) rotateX(20deg) rotateZ(0deg) translate(0%, 0%)', maskImage: 'linear-gradient(to bottom, white 60%, transparent 100%)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <IconTarget size={14} className="text-[#722F37]" />
                          <span className="text-xs font-medium text-slate-700">Grupy odbiorców</span>
                        </div>
                        <span className="text-[10px] text-slate-500">4 aktywne</span>
                      </div>
                      <div className="relative flex-1 rounded-xl border border-slate-200 bg-slate-200" style={{ transform: 'translate(-30px, 10px)' }}>
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #64748b 0, #64748b 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px', transform: 'translate(30px, 10px)' }} />
                        <div className="absolute inset-0 h-full w-full rounded-xl bg-white shadow-lg p-2" style={{ transform: 'translateX(19px) translateY(-10px)' }}>
                          {/* Summary stats */}
                          <div className="flex gap-1.5 mb-2">
                            <div className="flex-1 bg-slate-50 rounded p-1 border border-slate-100 text-center">
                              <p className="text-[7px] text-slate-400">Zasięg</p>
                              <p className="text-[9px] font-bold text-slate-700">1.7M</p>
                            </div>
                            <div className="flex-1 bg-green-50 rounded p-1 border border-green-100 text-center">
                              <p className="text-[7px] text-slate-400">Śr. CPL</p>
                              <p className="text-[9px] font-bold text-green-600">22 zł</p>
                            </div>
                            <div className="flex-1 bg-blue-50 rounded p-1 border border-blue-100 text-center">
                              <p className="text-[7px] text-slate-400">Leady/tydz</p>
                              <p className="text-[9px] font-bold text-blue-600">47</p>
                            </div>
                          </div>
                          {/* Audience segments */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 p-1 rounded-lg bg-blue-50 border border-blue-100">
                              <div className="size-5 rounded bg-blue-500 flex items-center justify-center shrink-0">
                                <IconUsers size={10} className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[8px] font-medium text-slate-700 truncate">Lookalike 1%</p>
                                <p className="text-[7px] text-slate-400">458K • najlepszy CPL</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[8px] font-bold text-blue-600">23 zł</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-1 rounded-lg bg-green-50 border border-green-100">
                              <div className="size-5 rounded bg-green-500 flex items-center justify-center shrink-0">
                                <IconRefresh size={10} className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[8px] font-medium text-slate-700 truncate">Remarketing 7d</p>
                                <p className="text-[7px] text-slate-400">12K • hot leads</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[8px] font-bold text-green-600">15 zł</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-1 rounded-lg bg-purple-50 border border-purple-100">
                              <div className="size-5 rounded bg-purple-500 flex items-center justify-center shrink-0">
                                <IconSparkles size={10} className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[8px] font-medium text-slate-700 truncate">Beauty enthusiasts</p>
                                <p className="text-[7px] text-slate-400">1.2M • zasięg</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[8px] font-bold text-purple-600">31 zł</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-1 rounded-lg bg-orange-50 border border-orange-100">
                              <div className="size-5 rounded bg-orange-500 flex items-center justify-center shrink-0">
                                <IconTarget size={10} className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[8px] font-medium text-slate-700 truncate">Konkurencja</p>
                                <p className="text-[7px] text-slate-400">89K • testujemy</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[8px] font-bold text-orange-600">28 zł</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </BlurFade>
            </div>

            {/* Step 3: Kreacje reklamowe */}
            <div className="md:border-r border-b md:border-b-0 border-slate-200">
              <div className="p-4 md:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 bg-[#D4A574] rounded-full flex items-center justify-center text-white font-bold text-xs">3</div>
                  <h3 className="text-lg font-bold text-slate-800">Kreacje reklamowe</h3>
                </div>
                <p className="text-slate-600 mt-2 max-w-md">Projektujemy grafiki i copy, które zatrzymują scroll. Video, karuzele, stories - co działa dla beauty.</p>
              </div>
              <BlurFade delay={0.3} inView>
                <div className="relative h-80 overflow-hidden [mask-image:linear-gradient(to_bottom,white_70%,transparent_100%)]">
                  <div className="relative h-full" style={{ perspective: '1000px' }}>
                    <div
                      className="mx-auto flex h-full w-full max-w-[85%] flex-col rounded-2xl border border-slate-300 bg-slate-100 p-3 shadow-2xl"
                      style={{ transform: 'rotateY(-13deg) rotateX(25deg) rotateZ(3deg) translate(-10%, -5%)', maskImage: 'linear-gradient(to bottom, white 60%, transparent 100%)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <IconSparkles size={14} className="text-[#722F37]" />
                          <span className="text-xs font-medium text-slate-700">Kreacje</span>
                        </div>
                        <div className="flex gap-1">
                          <IconBrandInstagram size={12} className="text-[#E1306C]" />
                          <IconBrandFacebook size={12} className="text-[#1877F2]" />
                        </div>
                      </div>
                      <div className="relative flex-1 rounded-xl border border-slate-200 bg-slate-200">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #64748b 0, #64748b 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }} />
                        <div className="absolute inset-0 h-full w-full rounded-xl bg-white shadow-lg p-2 flex gap-2" style={{ transform: 'translateX(-10px) translateY(-10px)' }}>
                          {/* Ad preview cards */}
                          <div className="flex-1 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                            <div className="h-[60%] relative overflow-hidden">
                              <img
                                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=400&fit=crop"
                                alt="Salon beauty"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#D4A574]/60 to-transparent" />
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[7px] text-white font-medium">VIDEO</div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                  <div className="w-0 h-0 border-l-[6px] border-l-[#722F37] border-y-[4px] border-y-transparent ml-0.5" />
                                </div>
                              </div>
                            </div>
                            <div className="p-1.5 flex-1">
                              <div className="h-1.5 w-full bg-slate-200 rounded mb-1" />
                              <div className="h-1.5 w-3/4 bg-slate-100 rounded" />
                            </div>
                          </div>
                          <div className="flex-1 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                            <div className="h-[60%] relative overflow-hidden">
                              <img
                                src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=400&fit=crop"
                                alt="Makeup beauty"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#E1306C]/50 to-transparent" />
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-gradient-to-r from-[#E1306C] to-[#833AB4] rounded text-[7px] text-white font-medium">STORY</div>
                            </div>
                            <div className="p-1.5 flex-1">
                              <div className="h-1.5 w-full bg-slate-200 rounded mb-1" />
                              <div className="h-1.5 w-2/3 bg-slate-100 rounded" />
                            </div>
                          </div>
                          <div
                            className="flex-1 rounded-lg border border-slate-200 bg-white overflow-hidden flex flex-col"
                            style={{ transform: 'translate(-20px, -10px)', boxShadow: '20px 20px 50px 0px rgb(0 0 0 / 12%)' }}
                          >
                            <div className="h-[60%] relative overflow-hidden">
                              <img
                                src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300&h=400&fit=crop"
                                alt="Nails beauty"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#1877F2]/50 to-transparent" />
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#1877F2] rounded text-[7px] text-white font-medium">FEED</div>
                            </div>
                            <div className="p-1.5 flex-1">
                              <div className="h-1.5 w-full bg-slate-200 rounded mb-1" />
                              <div className="h-1.5 w-1/2 bg-slate-100 rounded" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </BlurFade>
            </div>

            {/* Step 4: Optymalizacja i skalowanie */}
            <div>
              <BlurFade delay={0.4} inView>
                <div className="p-4 md:p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 bg-[#D4A574] rounded-full flex items-center justify-center text-white font-bold text-xs">4</div>
                    <h3 className="text-lg font-bold text-slate-800">Optymalizacja i skalowanie</h3>
                  </div>
                  <p className="text-slate-600 mt-2 max-w-md">Codziennie monitorujemy wyniki. Wyłączamy słabe zestawy, skalujemy zwycięzców.</p>
                </div>
                <div className="relative h-80 overflow-hidden [mask-image:linear-gradient(to_bottom,white_70%,transparent_100%)]">
                  <div className="relative h-full" style={{ perspective: '1000px' }}>
                    <div
                      className="mx-auto flex h-full w-full max-w-[85%] flex-col rounded-2xl border border-slate-300 bg-slate-100 p-3 shadow-2xl"
                      style={{ transform: 'rotateY(15deg) rotateX(29deg) rotateZ(-4deg) translate(7%, -10%)', maskImage: 'linear-gradient(to bottom, white 60%, transparent 100%)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <IconRocket size={14} className="text-[#722F37]" />
                          <span className="text-xs font-medium text-slate-700">Skalowanie</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconTrendingUp size={12} className="text-green-500" />
                          <span className="text-[10px] font-bold text-green-600">+47%</span>
                        </div>
                      </div>
                      <div className="relative flex-1 rounded-xl border border-slate-200 bg-slate-200">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #64748b 0, #64748b 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }} />
                        <div className="absolute inset-0 h-full w-full rounded-xl bg-white shadow-lg p-2" style={{ transform: 'translateX(10px) translateY(-10px)' }}>
                          {/* Mini metrics row */}
                          <div className="flex gap-2 mb-2">
                            <div className="flex-1 bg-slate-50 rounded p-1.5 border border-slate-100">
                              <p className="text-[7px] text-slate-400 uppercase">Budżet</p>
                              <p className="text-[10px] font-bold text-slate-700">5,000 zł</p>
                            </div>
                            <div className="flex-1 bg-green-50 rounded p-1.5 border border-green-100">
                              <p className="text-[7px] text-slate-400 uppercase">Leady</p>
                              <p className="text-[10px] font-bold text-green-600">214</p>
                            </div>
                            <div
                              className="flex-1 bg-blue-50 rounded p-1.5"
                              style={{ transform: 'translate(6px, -10px)', boxShadow: '-20px 30px 40px rgb(0 0 0 / 14%)', border: '2px solid #FFF' }}
                            >
                              <p className="text-[7px] text-slate-400 uppercase">CPL</p>
                              <p className="text-[10px] font-bold text-blue-600">23 zł</p>
                            </div>
                          </div>
                          {/* Chart with trend line */}
                          <div className="relative flex items-end justify-around gap-1.5 h-[calc(100%-48px)] px-1">
                            {[30, 38, 45, 52, 60, 72, 85, 95].map((h, i) => (
                              <div key={i} className={cn("w-[9%] rounded-t transition-all", i < 3 ? "bg-slate-300" : i < 6 ? "bg-[#D4A574]" : "bg-green-500")} style={{ height: `${h}%` }} />
                            ))}
                            {/* Shadow line (blurred duplicate) */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100" style={{ filter: 'blur(3px)', transform: 'translateY(3px)' }}>
                              <path d="M5,75 C15,72 25,65 35,58 C45,51 55,44 65,35 C75,26 85,18 95,10" fill="none" stroke="#000" strokeWidth="2.5" strokeDasharray="4 6" strokeLinecap="round" opacity="0.15" />
                            </svg>
                            {/* Main line */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                              <path d="M5,75 C15,72 25,65 35,58 C45,51 55,44 65,35 C75,26 85,18 95,10" fill="none" stroke="#86efac" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </BlurFade>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#D4A574] uppercase tracking-wider mb-3">
                FAQ
              </p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                Najczęściej zadawane pytania
              </h2>
            </div>
          </BlurFade>

          <BlurFade delay={0.2} inView>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  faq={faq}
                  isOpen={openFaq === faq.question}
                  onClick={() => setOpenFaq(openFaq === faq.question ? null : faq.question)}
                />
              ))}
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ===================== CONTACT FORM ===================== */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="relative bg-white rounded-lg p-8 md:p-12 overflow-visible shadow-sm">
              <ShineBorder shineColor={["#D4A574", "#B8860B", "#D4A574"]} borderWidth={2} duration={10} />
              <DottedGlowBackground
                className="pointer-events-none opacity-20"
                opacity={1}
                gap={10}
                radius={1.6}
                color="rgba(115, 115, 115, 0.7)"
                glowColor="#D4A574"
                backgroundOpacity={0}
                speedMin={0.3}
                speedMax={1.6}
                speedScale={1}
              />
              {/* Gradient overlay to soften dots */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/40 to-transparent pointer-events-none" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
                {/* Left side - offer */}
                <div className="lg:col-span-3 flex flex-col justify-center">
                  <h2 className="text-2xl md:text-3xl font-serif text-slate-900 leading-snug">
                    Potrzebujesz profesjonalnej strony internetowej i kampanii reklamowej?{' '}
                    <AuroraText className="font-bold">Porozmawiajmy.</AuroraText>
                  </h2>
                  <p className="mt-6 text-slate-600 leading-relaxed">
                    Pomagamy <span className="text-[#D4A574] font-medium">salonom beauty i klinikom medycyny estetycznej</span> budować
                    profesjonalną obecność online od podstaw - od strony internetowej, przez kampanie reklamowe,
                    po kompleksową strategię marketingową.
                  </p>
                  <button
                    onClick={() => setIsContactModalOpen(true)}
                    className="mt-8 px-8 py-3 bg-[#171717] text-white text-sm font-semibold rounded-lg hover:bg-[#2a2a2a] transition-colors w-fit"
                  >
                    Napisz do nas
                  </button>
                </div>

                {/* Right side - image */}
                <div className="lg:col-span-2 flex items-end justify-end -mr-12 -mb-12 mt-auto relative">
                  <div className="absolute bottom-16 -left-4 flex flex-col items-end">
                    <span className="text-slate-500 text-sm">Do usłyszenia,</span>
                    <span className="text-slate-600 text-3xl" style={{ fontFamily: "'Birthstone', cursive" }}>Joanna Kuflewicz</span>
                  </div>
                  <img
                    src="/asia.png"
                    alt="Joanna Kuflewicz"
                    className="max-w-[280px] h-auto -mt-20"
                  />
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="py-10 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img src="/logo2.png" alt="BooksyAudit" className="h-6" />
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-[#171717]">Regulamin</a>
              <a href="#" className="hover:text-[#171717]">Prywatność</a>
              <a href="#" className="hover:text-[#171717]">Kontakt</a>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-400">© 2025 BooksyAudit.pl by</p>
              <a href="https://kolabo.pl" target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                <img src="/kolabo.svg" alt="Kolabo" className="h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default MetaAdsPage;
