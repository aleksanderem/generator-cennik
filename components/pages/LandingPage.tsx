"use client";
import React, { useRef, useState, useEffect, useId } from 'react';
import { cn } from '../../lib/utils';
import { motion, useInView, AnimatePresence } from 'motion/react';
import {
  IconChevronRight,
  IconSparkles,
  IconArrowRight,
  IconWand,
  IconPlus,
  IconMinus,
  IconCheck,
} from '@tabler/icons-react';
import { BsStarFill } from 'react-icons/bs';

// Magic UI Components
import { NumberTicker } from '../ui/number-ticker';
import { ShimmerButton } from '../ui/shimmer-button';
import { RainbowButton } from '../ui/rainbow-button';
import { BorderBeam } from '../ui/border-beam';
import { Marquee } from '../ui/marquee';
import { AnimatedShinyText } from '../ui/animated-shiny-text';
import { MagicCard } from '../ui/magic-card';
import { BlurFade } from '../ui/blur-fade';
import { AnimatedCircularProgressBar } from '../ui/animated-circular-progress-bar';

// HeroDemo - przywrócony
import { HeroDemo } from '../ui/hero-demo';
import { AuroraText } from '../ui/aurora-text';
import { WordRotate } from '../ui/word-rotate';

// ========================================
// TYPES
// ========================================

interface LandingPageProps {
  onNavigate: (page: 'generator' | 'audit') => void;
  onOpenPaywall: () => void;
}

// ========================================
// DATA
// ========================================

const testimonials = [
  {
    name: 'Anna Kowalska',
    quote: 'Audyt pokazał mi, że moje opisy to tylko lista zabiegów. Po zmianach klientki same pytają o konkretne usługi!',
    result: '+34% rezerwacji',
    salon: 'Studio Urody Anna',
    city: 'Warszawa',
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Magdalena Nowak',
    quote: 'Nie wiedziałam, że mam 12 zduplikowanych usług pod różnymi nazwami. Teraz cennik jest czytelny.',
    result: '-50% pytań',
    salon: 'Beauty Room',
    city: 'Kraków',
    src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Katarzyna Wiśniewska',
    quote: 'Generator oszczędził mi 3 godziny pracy. Wcześniej ręcznie formatowałam w HTML.',
    result: '3h oszczędności',
    salon: 'Salon Piękności',
    city: 'Gdańsk',
    src: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Ewa Mazurek',
    quote: 'Klientki mówią, że mój cennik wygląda profesjonalnie. To pierwszy raz gdy ktoś tak mi powiedział!',
    result: '+28% rezerwacji',
    salon: 'Ewa Hair Studio',
    city: 'Poznań',
    src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  },
];

const faqs = [
  {
    question: 'Skąd mogę zaimportować cennik?',
    answer: 'Z dowolnego źródła! Excel, Google Sheets, Word, PDF, strona WWW, profil Booksy - wystarczy skopiować i wkleić. AI rozpozna strukturę automatycznie.',
  },
  {
    question: 'Co dokładnie sprawdza Audyt AI?',
    answer: 'Audyt sprawdza 60 punktów w 5 kategoriach: strukturę i nawigację, jakość copywritingu, strategię cenową, UX/UI oraz potencjał konwersji.',
  },
  {
    question: 'Czy generator jest naprawdę darmowy?',
    answer: 'Tak, generator cennika jest 100% darmowy i bez limitu użyć. Nie wymagamy rejestracji. Płatne są tylko usługi premium.',
  },
  {
    question: 'Jak długo trwa generowanie cennika?',
    answer: 'Generator tworzy cennik w 5-10 sekund. Pełny audyt AI zajmuje około minuty.',
  },
];

// ========================================
// CARD COMPONENTS (Bento Grid Structure)
// ========================================

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    whileHover="animate"
    className={cn(
      "group isolate flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]",
      className
    )}>
    {children}
  </motion.div>
);

const CardSkeletonBody = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("relative h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,white_60%,transparent_100%)]", className)}>
    {children}
  </div>
);

const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("p-5", className)}>{children}</div>
);

const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h3 className={cn("font-sans text-base font-semibold tracking-tight text-slate-800", className)}>
    {children}
  </h3>
);

const CardDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn("mt-2 text-sm text-slate-500 leading-relaxed", className)}>
    {children}
  </p>
);

// ========================================
// SKELETON VISUALIZATIONS
// ========================================

// Skeleton 1: Before/After Transformation - duże karty częściowo ucięte, statyczne
const BeforeAfterSkeleton = () => {
  return (
    <div
      className="relative h-60 overflow-hidden md:h-72"
      style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
    >
      <div
        className="h-full w-full -translate-y-10 scale-[1.2]"
        style={{
          transform: 'rotateX(30deg) rotateY(-20deg) rotateZ(15deg)',
          maskImage: 'linear-gradient(to right, transparent 0%, white 15%, white 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, white 15%, white 85%, transparent 100%)',
        }}
      >
        {/* Card 1: Profesjonalny cennik - na wierzchu */}
        <div
          className="absolute bottom-0 left-12 z-30 mx-auto h-fit w-full max-w-[90%] rounded-2xl border border-green-300 bg-white p-3 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <IconCheck className="size-4 text-green-600" />
            <p className="text-sm font-medium text-slate-800">Profesjonalny cennik</p>
            <div className="ml-auto flex w-fit items-center gap-1 rounded-full border border-green-300 bg-green-300/10 px-1.5 py-0.5 text-green-600">
              <IconCheck className="size-3" />
              <p className="text-[10px] font-bold">Gotowe</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Uporządkowane kategorie, spójne formatowanie i przejrzyste ceny.</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <div className="rounded-sm bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">Kategorie</div>
            <div className="rounded-sm bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">Spójność</div>
            <div className="rounded-sm bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">UX</div>
          </div>
        </div>

        {/* Card 2: Analiza AI - środek */}
        <div
          className="absolute bottom-8 left-6 z-20 mx-auto h-fit w-full max-w-[85%] rounded-2xl border border-[#D4A574]/50 bg-white p-3 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <IconSparkles className="size-4 text-[#D4A574]" />
            <p className="text-sm font-medium text-slate-800">Analiza AI</p>
            <div className="ml-auto flex w-fit items-center gap-1 rounded-full border border-[#D4A574] bg-[#D4A574]/10 px-1.5 py-0.5 text-[#D4A574]">
              <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              <svg className="size-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a9 9 0 1 0 9 9" />
              </svg>
              <p className="text-[10px] font-bold">3s</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Automatyczne grupowanie usług i standaryzacja nazewnictwa.</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <div className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">AI</div>
            <div className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">GPT-4</div>
          </div>
        </div>

        {/* Card 3: Surowe dane - w tle */}
        <div
          className="absolute bottom-16 left-2 z-10 mx-auto h-fit w-full max-w-[80%] rounded-2xl border border-red-200 bg-white p-3 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <svg className="size-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p className="text-sm font-medium text-slate-800">Surowe dane</p>
            <div className="ml-auto flex w-fit items-center gap-1 rounded-full border border-red-300 bg-red-300/10 px-1.5 py-0.5 text-red-500">
              <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              <p className="text-[10px] font-bold">—</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Chaotyczny cennik z różnymi formatami i niespójnymi cenami.</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <div className="rounded-sm bg-red-100 px-1.5 py-0.5 text-[10px] text-red-600">Excel</div>
            <div className="rounded-sm bg-red-100 px-1.5 py-0.5 text-[10px] text-red-600">Import</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton 2: Sources with orbiting icons
// Google Sheets icon for orbit
const GoogleSheetsIcon = () => (
  <svg width="9" height="10" viewBox="0 0 9 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-6">
    <mask id="mask0_sheets" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="9" height="10">
      <path d="M5.3832 0.148682H1.63009C1.26581 0.148682 0.967773 0.446723 0.967773 0.810995V9.2003C0.967773 9.56457 1.26581 9.86261 1.63009 9.86261H7.37014C7.73441 9.86261 8.03245 9.56457 8.03245 9.2003V2.79794L5.3832 0.148682Z" fill="white" />
    </mask>
    <g mask="url(#mask0_sheets)">
      <path d="M5.38222 0.147949H1.62911C1.26484 0.147949 0.966797 0.44599 0.966797 0.810263V9.19957C0.966797 9.56384 1.26484 9.86188 1.62911 9.86188H7.36916C7.73343 9.86188 8.03147 9.56384 8.03147 9.19957V2.7972L6.48608 1.69335L5.38222 0.147949Z" fill="#0F9D58" />
      <path d="M2.7334 4.89478V8.09596H6.26574V4.89478H2.7334ZM4.2788 7.65441H3.17494V7.10249H4.2788V7.65441ZM4.2788 6.77133H3.17494V6.2194H4.2788V6.77133ZM4.2788 5.88825H3.17494V5.33632H4.2788V5.88825ZM5.82419 7.65441H4.72034V7.10249H5.82419V7.65441ZM5.82419 6.77133H4.72034V6.2194H5.82419V6.77133ZM5.82419 5.88825H4.72034V5.33632H5.82419V5.88825Z" fill="#F1F1F1" />
      <path d="M5.38281 0.14917V2.13611C5.38281 2.50204 5.6792 2.79842 6.04513 2.79842H8.03207L5.38281 0.14917Z" fill="#87CEAC" />
    </g>
  </svg>
);

// Excel icon for orbit
const ExcelOrbitIcon = () => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#217346"/>
    <path d="M14 2v6h6" fill="#185C37"/>
    <path d="M8 13l2 4 2-4M8 17l4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Apple Notes icon for orbit
const NotesOrbitIcon = () => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none">
    <rect x="4" y="2" width="16" height="20" rx="2" fill="#FFCC02"/>
    <rect x="4" y="2" width="16" height="5" fill="#FFE066"/>
    <line x1="7" y1="10" x2="17" y2="10" stroke="#666" strokeWidth="1" strokeLinecap="round"/>
    <line x1="7" y1="13" x2="15" y2="13" stroke="#666" strokeWidth="1" strokeLinecap="round"/>
    <line x1="7" y1="16" x2="13" y2="16" stroke="#666" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

// Booksy icon for orbit
const BooksyOrbitIcon = () => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none">
    <circle cx="12" cy="12" r="10" fill="#7B68EE"/>
    <path d="M8 8h8M8 12h6M8 16h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SourcesSkeleton = () => {
  return (
    <div
      className="relative h-60 flex flex-col md:h-72 overflow-hidden"
      style={{
        perspective: '800px',
        maskImage: 'radial-gradient(circle, white 50%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(circle, white 50%, transparent 100%)',
      }}
    >
      <div
        className="flex-1 rounded-t-3xl gap-2 flex items-center justify-center w-full h-full absolute inset-x-0 p-2"
        style={{ transform: 'rotateY(20deg) rotateX(20deg) rotateZ(-20deg)' }}
      >
        {/* Center circle with AI icon */}
        <div className="size-28 bg-white shrink-0 border z-[10] rounded-full m-auto flex items-center justify-center border-slate-200 shadow-sm absolute inset-0">
          <IconSparkles className="size-8 text-[#D4A574]" />

          {/* Orbiting Excel */}
          <div
            className="size-9 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm bg-white animate-orbit [--translate-position:90px] [--orbit-duration:12s] [--initial-position:0deg]"
          >
            <ExcelOrbitIcon />
          </div>

          {/* Orbiting Google Sheets */}
          <div
            className="size-9 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm bg-white animate-orbit [--translate-position:110px] [--orbit-duration:18s] [--initial-position:90deg]"
          >
            <GoogleSheetsIcon />
          </div>

          {/* Orbiting Apple Notes */}
          <div
            className="size-9 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm bg-white animate-orbit [--translate-position:130px] [--orbit-duration:15s] [--initial-position:180deg]"
          >
            <NotesOrbitIcon />
          </div>

          {/* Orbiting Booksy */}
          <div
            className="size-9 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm bg-white animate-orbit [--translate-position:150px] [--orbit-duration:22s] [--initial-position:270deg]"
          >
            <BooksyOrbitIcon />
          </div>
        </div>

        {/* Concentric circles */}
        <div className="inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-44 bg-slate-100/80 z-[9] relative" />
        <div className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-60 bg-slate-100/60 z-[8]" />
        <div className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-80 bg-slate-100/40 z-[7]" />
        <div className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-96 bg-slate-100/20 z-[6]" />
      </div>
    </div>
  );
};

// Skeleton 3: Speed Timer - izometryczna karta z krokami procesu
const SpeedSkeleton = () => {
  const steps = [
    { name: 'Wklejanie danych', time: '1s', done: true },
    { name: 'Analiza AI', time: '3s', done: true },
    { name: 'Kategoryzacja', time: '5s', done: true },
    { name: 'Formatowanie', time: '8s', done: true },
    { name: 'Generowanie HTML', time: '10s', loading: true },
  ];

  return (
    <div className="relative h-full overflow-hidden" style={{ perspective: '1000px' }}>
      <div
        className="group/bento-skeleton mx-auto my-auto flex h-full w-full max-w-[85%] flex-col rounded-2xl border border-slate-300 bg-slate-100 p-3 shadow-2xl translate-x-6"
        style={{
          transform: 'rotateY(20deg) rotateX(20deg) rotateZ(-20deg)',
          maskImage: 'linear-gradient(to bottom, white 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, white 50%, transparent 100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <IconCheck className="size-4 text-[#171717]" />
          <p className="text-sm font-medium text-slate-800">Generator cennika</p>
        </div>

        {/* Content card */}
        <div className="relative mt-3 flex-1 overflow-visible rounded-2xl border border-slate-200 bg-slate-200">
          {/* Pattern background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(315deg, #64748b 0, #64748b 1px, transparent 0, transparent 50%)',
              backgroundSize: '10px 10px',
            }}
          />

          {/* Floating card */}
          <div
            className="absolute inset-0 h-full w-full rounded-2xl bg-white shadow-lg"
            style={{ transform: 'translateX(12px) translateY(-12px)' }}
          >
            {steps.map((step, idx) => (
              <div key={step.name}>
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex size-4 items-center justify-center rounded-full",
                      step.loading ? "bg-[#D4A574]" : "bg-green-500"
                    )}>
                      {step.loading ? (
                        <svg className="size-3 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 3a9 9 0 1 0 9 9" />
                        </svg>
                      ) : (
                        <IconCheck className="size-3 text-white" />
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-slate-500">{step.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7c3-2 6-2 9 0s6 2 9 0M3 17c3-2 6-2 9 0s6 2 9 0M3 12c3-2 6-2 9 0s6 2 9 0" />
                    </svg>
                    <p className="text-[9px] font-bold">{step.time}</p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton 4: Audit Checklist (izometryczny styl jak SpeedSkeleton)
const AuditSkeleton = () => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  const categories = [
    { name: 'Struktura', points: 12 },
    { name: 'Copywriting', points: 15 },
    { name: 'Strategia cenowa', points: 10 },
    { name: 'UX/UI', points: 13 },
    { name: 'Konwersja', points: 10 },
  ];

  useEffect(() => {
    if (!isInView) {
      setVisibleItems([]);
      return;
    }
    categories.forEach((_, idx) => {
      setTimeout(() => {
        setVisibleItems((prev) => [...prev, idx]);
      }, idx * 600 + 400);
    });
  }, [isInView]);

  return (
    <div ref={ref} className="relative h-full overflow-hidden" style={{ perspective: '1000px' }}>
      <div
        className="group/bento-skeleton mx-auto my-auto flex h-full w-full max-w-[70%] flex-col rounded-2xl border border-slate-300 bg-slate-100 p-3 shadow-2xl -translate-x-4"
        style={{
          transform: 'rotateY(-20deg) rotateX(20deg) rotateZ(20deg)',
          maskImage: 'linear-gradient(to bottom, white 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, white 50%, transparent 100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <IconCheck className="size-3 text-[#171717]" />
          <p className="text-xs font-medium text-slate-800">Audyt cennika</p>
        </div>

        {/* Content card */}
        <div className="relative mt-2 flex-1 overflow-visible rounded-xl border border-slate-200 bg-slate-200">
          {/* Pattern background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(315deg, #64748b 0, #64748b 1px, transparent 0, transparent 50%)',
              backgroundSize: '10px 10px',
            }}
          />

          {/* Floating card */}
          <div
            className="absolute inset-0 h-full w-full rounded-xl bg-white shadow-lg overflow-hidden"
            style={{ transform: 'translateX(-10px) translateY(-10px)' }}
          >
            {categories.map((cat, idx) => {
              const isVisible = visibleItems.includes(idx);
              const isLoading = isVisible && idx === visibleItems.length - 1 && visibleItems.length < categories.length;
              const isDone = isVisible && !isLoading;

              return (
                <div key={cat.name}>
                  <motion.div
                    className="flex items-center justify-between px-2 py-1.5"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: isVisible ? 1 : 0.3,
                      x: isVisible ? 0 : -10
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <motion.div
                        className={cn(
                          "flex size-3.5 items-center justify-center rounded-full transition-colors",
                          isLoading ? "bg-[#D4A574]" : isDone ? "bg-green-500" : "bg-slate-200"
                        )}
                        animate={{ scale: isVisible ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {isLoading ? (
                          <svg className="size-2.5 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 3a9 9 0 1 0 9 9" />
                          </svg>
                        ) : isDone ? (
                          <IconCheck className="size-2.5 text-white" />
                        ) : null}
                      </motion.div>
                      <p className="text-[10px] font-medium text-slate-500">{cat.name}</p>
                    </div>
                    <motion.p
                      className="text-[8px] font-bold text-[#171717]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isDone ? 1 : 0 }}
                    >
                      {cat.points} pkt
                    </motion.p>
                  </motion.div>
                  {idx < categories.length - 1 && (
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Testimonial Card
const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-lg min-w-[300px] max-w-[340px] mx-3">
    <div className="flex gap-0.5 mb-3">
      {[...Array(5)].map((_, i) => (
        <BsStarFill key={i} className="h-3.5 w-3.5 text-[#D4A574]" />
      ))}
    </div>
    <p className="text-slate-700 mb-4 text-sm leading-relaxed">"{testimonial.quote}"</p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src={testimonial.src}
          alt={testimonial.name}
          className="w-9 h-9 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-slate-900 text-sm">{testimonial.name}</p>
          <p className="text-xs text-slate-500">{testimonial.salon}</p>
        </div>
      </div>
      <div className="text-[#171717] font-bold text-sm">{testimonial.result}</div>
    </div>
  </div>
);

// FAQ Item
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
// MAIN COMPONENT
// ========================================

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenPaywall }) => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div className="overflow-x-hidden">

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative py-12 md:py-16 min-h-[90vh] flex items-center overflow-hidden bg-white">
        {/* Dotted background with vertical mask */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-0 h-full w-full",
            "bg-[radial-gradient(circle_at_0.5px_0.5px,rgba(0,0,0,0.15)_0.5px,transparent_0)]",
            "[mask-image:linear-gradient(to_bottom,white,transparent)]",
            "bg-repeat",
            "[background-size:12px_12px]"
          )}
        />

        <div className="relative max-w-7xl mx-auto w-full px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <BlurFade delay={0.1} inView>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#171717]/5 rounded-full border border-[#171717]/20 mb-6">
                  <IconSparkles size={16} className="text-[#D4A574]" />
                  <AnimatedShinyText className="text-sm font-medium text-[#171717]">
                    Darmowy generator cennika
                  </AnimatedShinyText>
                </div>
              </BlurFade>

              <BlurFade delay={0.2} inView>
                <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-serif font-bold text-slate-900 mb-6 leading-[1.15]">
                  Z{' '}
                  <WordRotate
                    words={["Excela", "Notatek", "Maila", "Worda", "Booksy"]}
                    duration={2000}
                    inline
                    className="text-[#D4A574]"
                  />
                  {' '}do{' '}
                  <AuroraText colors={["#D4A574", "#C9956C", "#E8C4A0", "#B8860B"]}>
                    cennika
                  </AuroraText>
                  <br />
                  <span className="text-slate-900">w 10 sekund</span>
                </h1>
              </BlurFade>

              <BlurFade delay={0.3} inView>
                <p className="text-lg text-slate-600 mb-8 max-w-lg mx-auto lg:mx-0">
                  Wklej cennik z Excela, Booksy czy notatnika. AI uporządkuje, skategoryzuje
                  i przygotuje gotowy cennik na Twoją stronę.
                </p>
              </BlurFade>

              <BlurFade delay={0.4} inView>
                <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
                  <RainbowButton
                    onClick={() => onNavigate('generator')}
                    className="w-full sm:w-auto"
                  >
                    Sprawdź teraz za darmo
                    <IconChevronRight size={18} />
                  </RainbowButton>

                  <button
                    onClick={onOpenPaywall}
                    className="group flex items-center gap-3 px-6 py-3.5 text-[#171717] font-semibold rounded-xl transition-all border-2 border-[#171717]/30 hover:border-[#171717] hover:bg-[#171717]/5 w-full sm:w-auto justify-center"
                  >
                    Audyt Booksy · 49 zł
                  </button>
                </div>
              </BlurFade>
            </div>

            {/* Right: HeroDemo - przywrócony */}
            <BlurFade delay={0.3} inView>
              <div className="hidden lg:block relative">
                <HeroDemo />

                {/* Handwritten annotation with arrow */}
                <div className="absolute -left-[164px] -top-[18px] flex flex-col items-start pointer-events-none">
                  <span
                    className="text-[#D4A574] text-xl whitespace-nowrap -rotate-6"
                    style={{ fontFamily: "'Shadows Into Light Two', cursive" }}
                  >
                    Napędzane magią
                  </span>
                  {/* Hand-drawn arrow SVG */}
                  <svg
                    width="120"
                    height="60"
                    viewBox="0 -76.5 193 193"
                    fill="none"
                    className="ml-8 rotate-[35deg]"
                  >
                    <path
                      d="M173.928 21.1292C115.811 44.9386 58.751 45.774 0 26.1417C4.22669 21.7558 7.81938 23.4266 10.5667 24.262C31.7002 29.9011 53.4676 30.5277 75.0238 31.3631C106.09 32.6162 135.465 25.5151 164.207 14.0282C165.475 13.6104 166.532 12.775 169.068 11.1042C154.486 8.18025 139.903 13.1928 127.223 7.34485C127.435 6.50944 127.435 5.46513 127.646 4.62971C137.156 4.00315 146.877 3.37658 156.388 2.54117C165.898 1.70575 175.196 0.661517 184.706 0.0349538C191.68 -0.382755 194.639 2.9589 192.103 9.22453C188.933 17.3698 184.495 24.8886 180.48 32.6162C180.057 33.4516 179.423 34.4959 178.578 34.9136C176.253 35.749 173.928 35.9579 171.392 36.5845C170.97 34.4959 169.913 32.1985 170.124 30.3188C170.547 27.8126 172.026 25.724 173.928 21.1292Z"
                      fill="#D4A574"
                    />
                  </svg>
                </div>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ===================== BENTO GRID FEATURES ===================== */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                Jak to działa?
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Wklej cennik z dowolnego źródła. AI uporządkuje, skategoryzuje i wygeneruje profesjonalny kod HTML.
              </p>
            </div>
          </BlurFade>

          {/* Bento Grid - Card/Skeleton pattern */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Card 1: Before/After Transformation */}
            <BlurFade delay={0.2} inView>
              <Card>
                <CardSkeletonBody>
                  <BeforeAfterSkeleton />
                </CardSkeletonBody>
                <CardContent>
                  <CardTitle>Transformacja cennika</CardTitle>
                  <CardDescription>
                    Z chaotycznych notatek do uporządkowanej struktury z kategoriami, opisami i cenami.
                  </CardDescription>
                </CardContent>
              </Card>
            </BlurFade>

            {/* Card 2: Speed */}
            <BlurFade delay={0.3} inView>
              <Card>
                <CardSkeletonBody>
                  <SpeedSkeleton />
                </CardSkeletonBody>
                <CardContent>
                  <CardTitle>Gotowe w 10 sekund</CardTitle>
                  <CardDescription>
                    AI analizuje, kategoryzuje i formatuje Twój cennik błyskawicznie.
                  </CardDescription>
                </CardContent>
              </Card>
            </BlurFade>

            {/* Card 3: Sources */}
            <BlurFade delay={0.4} inView>
              <Card>
                <CardSkeletonBody>
                  <SourcesSkeleton />
                </CardSkeletonBody>
                <CardContent>
                  <CardTitle>Z dowolnego źródła</CardTitle>
                  <CardDescription>
                    Excel, Booksy, Google Sheets, notatki - wklej skąd chcesz, AI rozpozna strukturę.
                  </CardDescription>
                </CardContent>
              </Card>
            </BlurFade>

            {/* Card 4: Audit */}
            <BlurFade delay={0.5} inView>
              <Card>
                <CardSkeletonBody>
                  <AuditSkeleton />
                </CardSkeletonBody>
                <CardContent>
                  <CardTitle>Audyt AI - 60 punktów</CardTitle>
                  <CardDescription>
                    Pełna analiza struktury, copywritingu, cen, UX i potencjału konwersji Twojego cennika.
                  </CardDescription>
                </CardContent>
              </Card>
            </BlurFade>
          </div>

          {/* CTA */}
          <BlurFade delay={0.6} inView>
            <div className="text-center mt-10">
              <button
                onClick={() => onNavigate('generator')}
                className="inline-flex items-center gap-2 text-[#171717] font-semibold hover:gap-3 transition-all"
              >
                Wypróbuj generator za darmo <IconArrowRight size={18} />
              </button>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ===================== AUDIT SECTION ===================== */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Audit Visual */}
            <BlurFade delay={0.2} inView>
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white overflow-hidden">
                <BorderBeam
                  size={150}
                  duration={8}
                  colorFrom="#D4A574"
                  colorTo="#171717"
                  borderWidth={2}
                />

                <div className="text-center mb-8">
                  <div className="text-sm uppercase tracking-wider text-slate-400 mb-2">Twój wynik</div>
                  <div className="flex items-baseline justify-center gap-1">
                    <NumberTicker value={87} className="text-6xl font-bold text-[#D4A574]" />
                    <span className="text-3xl text-slate-400">/100</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { name: 'Struktura', score: 12, max: 12 },
                    { name: 'Copy', score: 13, max: 15 },
                    { name: 'Ceny', score: 8, max: 10 },
                    { name: 'UX', score: 11, max: 13 },
                    { name: 'SEO', score: 7, max: 10 },
                  ].map((cat, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-2">
                      <div className="text-[#D4A574] font-bold">{cat.score}</div>
                      <div className="text-[10px] text-slate-400">/{cat.max}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{cat.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </BlurFade>

            {/* Right: Copy */}
            <BlurFade delay={0.3} inView>
              <div>
                <p className="text-sm font-semibold text-[#D4A574] uppercase tracking-wider mb-3">
                  Dla tych, którzy chcą więcej
                </p>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-6">
                  Audyt AI Twojego cennika Booksy
                </h2>
                <p className="text-lg text-slate-600 mb-6">
                  Wklej link do profilu Booksy. AI przeanalizuje 60 punktów w 5 kategoriach
                  i powie Ci dokładnie, co poprawić.
                </p>

                <div className="flex items-center gap-4 mb-8">
                  <ShimmerButton
                    onClick={onOpenPaywall}
                    shimmerColor="#D4A574"
                    background="linear-gradient(135deg, #171717 0%, #0a0a0a 100%)"
                  >
                    <span className="text-white font-semibold px-2">
                      Zamów audyt
                    </span>
                  </ShimmerButton>
                  <div className="text-slate-500">
                    <span className="text-2xl font-bold text-[#171717]">49 zł</span>
                    <span className="text-sm ml-1">jednorazowo</span>
                  </div>
                </div>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ===================== SOCIAL PROOF ===================== */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <BlurFade delay={0.1} inView>
            <div className="text-center space-y-4 pb-6">
              <p className="text-sm text-[#171717] font-medium tracking-wider uppercase">Opinie</p>
              <h2 className="mx-auto mt-4 max-w-xs text-3xl font-serif font-semibold sm:max-w-none sm:text-4xl md:text-5xl text-slate-900">
                Co mówią właścicielki salonów
              </h2>
            </div>
          </BlurFade>

          {/* Vertical Marquee Columns */}
          <div className="relative mt-6 max-h-[600px] overflow-hidden">
            <div className="gap-4 md:columns-2 xl:columns-3 2xl:columns-4">
              {/* Column 1 */}
              <div className="group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)] flex-col">
                <Marquee pauseOnHover vertical className="[--duration:40s]">
                  {[...testimonials, ...testimonials].map((t, idx) => (
                    <div key={idx} className="mb-4 flex w-full cursor-pointer break-inside-avoid flex-col items-center justify-between gap-6 rounded-xl p-4 border border-slate-200 bg-white">
                      <div className="select-none text-sm font-normal text-slate-700">
                        <p>
                          {t.quote.split('.')[0]}.
                          <span className="bg-[#171717]/10 p-1 py-0.5 font-bold text-[#171717]">
                            {t.result}
                          </span>
                        </p>
                        <div className="flex flex-row py-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <BsStarFill key={i} className="size-4 text-yellow-500" />
                          ))}
                        </div>
                      </div>
                      <div className="flex w-full select-none items-center justify-start gap-5">
                        <img
                          alt={t.name}
                          loading="lazy"
                          width="40"
                          height="40"
                          className="h-10 w-10 rounded-full ring-1 ring-slate-200 ring-offset-4"
                          src={t.src}
                        />
                        <div>
                          <p className="font-medium text-slate-500">{t.name}</p>
                          <p className="text-xs font-normal text-slate-400">{t.salon}, {t.city}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </Marquee>
              </div>

              {/* Column 2 */}
              <div className="group flex overflow-hidden p-2 [--duration:60s] [--gap:1rem] [gap:var(--gap)] flex-col">
                <Marquee reverse pauseOnHover vertical className="[--duration:50s]">
                  {[...testimonials, ...testimonials].reverse().map((t, idx) => (
                    <div key={idx} className="mb-4 flex w-full cursor-pointer break-inside-avoid flex-col items-center justify-between gap-6 rounded-xl p-4 border border-slate-200 bg-white">
                      <div className="select-none text-sm font-normal text-slate-700">
                        <p>
                          {t.quote.split('.')[0]}.
                          <span className="bg-[#171717]/10 p-1 py-0.5 font-bold text-[#171717]">
                            {t.result}
                          </span>
                        </p>
                        <div className="flex flex-row py-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <BsStarFill key={i} className="size-4 text-yellow-500" />
                          ))}
                        </div>
                      </div>
                      <div className="flex w-full select-none items-center justify-start gap-5">
                        <img
                          alt={t.name}
                          loading="lazy"
                          width="40"
                          height="40"
                          className="h-10 w-10 rounded-full ring-1 ring-slate-200 ring-offset-4"
                          src={t.src}
                        />
                        <div>
                          <p className="font-medium text-slate-500">{t.name}</p>
                          <p className="text-xs font-normal text-slate-400">{t.salon}, {t.city}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </Marquee>
              </div>

              {/* Column 3 */}
              <div className="group flex overflow-hidden p-2 [--duration:30s] [--gap:1rem] [gap:var(--gap)] flex-col hidden xl:flex">
                <Marquee pauseOnHover vertical className="[--duration:45s]">
                  {[...testimonials, ...testimonials].map((t, idx) => (
                    <div key={idx} className="mb-4 flex w-full cursor-pointer break-inside-avoid flex-col items-center justify-between gap-6 rounded-xl p-4 border border-slate-200 bg-white">
                      <div className="select-none text-sm font-normal text-slate-700">
                        <p>
                          {t.quote.split('.')[0]}.
                          <span className="bg-[#171717]/10 p-1 py-0.5 font-bold text-[#171717]">
                            {t.result}
                          </span>
                        </p>
                        <div className="flex flex-row py-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <BsStarFill key={i} className="size-4 text-yellow-500" />
                          ))}
                        </div>
                      </div>
                      <div className="flex w-full select-none items-center justify-start gap-5">
                        <img
                          alt={t.name}
                          loading="lazy"
                          width="40"
                          height="40"
                          className="h-10 w-10 rounded-full ring-1 ring-slate-200 ring-offset-4"
                          src={t.src}
                        />
                        <div>
                          <p className="font-medium text-slate-500">{t.name}</p>
                          <p className="text-xs font-normal text-slate-400">{t.salon}, {t.city}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </Marquee>
              </div>

              {/* Column 4 */}
              <div className="group flex overflow-hidden p-2 [--duration:70s] [--gap:1rem] [gap:var(--gap)] flex-col hidden 2xl:flex">
                <Marquee reverse pauseOnHover vertical className="[--duration:55s]">
                  {[...testimonials, ...testimonials].reverse().map((t, idx) => (
                    <div key={idx} className="mb-4 flex w-full cursor-pointer break-inside-avoid flex-col items-center justify-between gap-6 rounded-xl p-4 border border-slate-200 bg-white">
                      <div className="select-none text-sm font-normal text-slate-700">
                        <p>
                          {t.quote.split('.')[0]}.
                          <span className="bg-[#171717]/10 p-1 py-0.5 font-bold text-[#171717]">
                            {t.result}
                          </span>
                        </p>
                        <div className="flex flex-row py-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <BsStarFill key={i} className="size-4 text-yellow-500" />
                          ))}
                        </div>
                      </div>
                      <div className="flex w-full select-none items-center justify-start gap-5">
                        <img
                          alt={t.name}
                          loading="lazy"
                          width="40"
                          height="40"
                          className="h-10 w-10 rounded-full ring-1 ring-slate-200 ring-offset-4"
                          src={t.src}
                        />
                        <div>
                          <p className="font-medium text-slate-500">{t.name}</p>
                          <p className="text-xs font-normal text-slate-400">{t.salon}, {t.city}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </Marquee>
              </div>
            </div>

            {/* Gradient overlays */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 w-full bg-gradient-to-t from-white from-20%" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 w-full bg-gradient-to-b from-white from-20%" />
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
                Pytania i odpowiedzi
              </h2>
            </div>
          </BlurFade>

          <BlurFade delay={0.2} inView>
            <MagicCard
              className="bg-white rounded-2xl border border-slate-200 p-6"
              gradientColor="#171717"
              gradientOpacity={0.05}
            >
              {faqs.map((faq, idx) => (
                <FAQItem
                  key={idx}
                  faq={faq}
                  isOpen={openFaq === faq.question}
                  onClick={() => setOpenFaq(openFaq === faq.question ? null : faq.question)}
                />
              ))}
            </MagicCard>
          </BlurFade>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="py-20 bg-gradient-to-br from-[#171717] to-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(212,175,55,0.15),transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <BlurFade delay={0.1} inView>
            <IconSparkles size={48} className="text-[#D4A574] mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              Gotowa na profesjonalny cennik?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Zacznij od darmowego generatora lub zamów audyt AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('generator')}
                className="px-8 py-4 bg-white text-[#171717] font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-lg w-full sm:w-auto"
              >
                Generuj za darmo
              </button>
              <ShimmerButton
                onClick={onOpenPaywall}
                shimmerColor="#D4A574"
                background="transparent"
                className="border-2 border-white w-full sm:w-auto"
              >
                <span className="text-white font-bold px-4">Audyt - 49 zł</span>
              </ShimmerButton>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="py-10 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="font-serif text-xl font-bold text-[#171717]">Beauty Audit</span>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-[#171717]">Regulamin</a>
              <a href="#" className="hover:text-[#171717]">Prywatność</a>
              <a href="#" className="hover:text-[#171717]">Kontakt</a>
            </div>
            <p className="text-sm text-slate-400">© 2024 Beauty Audit</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
