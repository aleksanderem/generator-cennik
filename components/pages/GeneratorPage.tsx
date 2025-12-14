"use client";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import {
  IconSparkles,
  IconChevronRight,
  IconCheck,
  IconArrowRight,
  IconAlertCircle,
} from '@tabler/icons-react';

// Magic UI Components
import { AnimatedShinyText } from '../ui/animated-shiny-text';
import { BlurFade } from '../ui/blur-fade';
import { RainbowButton } from '../ui/rainbow-button';
import { AuroraText } from '../ui/aurora-text';
import { WordRotate } from '../ui/word-rotate';
import { HeroDemo } from '../ui/hero-demo';

interface GeneratorPageProps {
  onOpenPaywall: () => void;
}

// ========================================
// CARD COMPONENTS
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

// Skeleton 1: Before/After Transformation
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
        <motion.div
          initial={{ opacity: 0, y: 60, x: -30 }}
          whileInView={{ opacity: 1, y: 0, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          viewport={{ once: true }}
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
        </motion.div>

        {/* Card 2: Analiza AI - środek */}
        <motion.div
          initial={{ opacity: 0, y: 40, x: -20 }}
          whileInView={{ opacity: 1, y: 0, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
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
        </motion.div>

        {/* Card 3: Surowe dane - w tle */}
        <motion.div
          initial={{ opacity: 0, y: 20, x: -10 }}
          whileInView={{ opacity: 0.6, y: 0, x: 0 }}
          transition={{ duration: 0.6, delay: 0, ease: "easeOut" }}
          viewport={{ once: true }}
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
        </motion.div>
      </div>
    </div>
  );
};

// Icons for SourcesSkeleton
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

const ExcelOrbitIcon = () => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#217346"/>
    <path d="M14 2v6h6" fill="#185C37"/>
    <path d="M8 13l2 4 2-4M8 17l4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NotesOrbitIcon = () => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none">
    <rect x="4" y="2" width="16" height="20" rx="2" fill="#FFCC02"/>
    <rect x="4" y="2" width="16" height="5" fill="#FFE066"/>
    <line x1="7" y1="10" x2="17" y2="10" stroke="#666" strokeWidth="1" strokeLinecap="round"/>
    <line x1="7" y1="13" x2="15" y2="13" stroke="#666" strokeWidth="1" strokeLinecap="round"/>
    <line x1="7" y1="16" x2="13" y2="16" stroke="#666" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

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
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="size-28 bg-white shrink-0 border z-[10] rounded-full m-auto flex items-center justify-center border-slate-200 shadow-sm absolute inset-0"
        >
          <IconSparkles className="size-8 text-[#D4A574]" />

          {/* Orbiting Excel */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
            viewport={{ once: true }}
            className="size-9 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm bg-white animate-orbit [--translate-position:90px] [--orbit-duration:12s] [--initial-position:0deg]"
          >
            <ExcelOrbitIcon />
          </motion.div>

          {/* Orbiting Google Sheets */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
            viewport={{ once: true }}
            className="size-9 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm bg-white animate-orbit [--translate-position:110px] [--orbit-duration:18s] [--initial-position:90deg]"
          >
            <GoogleSheetsIcon />
          </motion.div>

          {/* Orbiting Apple Notes */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
            className="size-9 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm bg-white animate-orbit [--translate-position:130px] [--orbit-duration:15s] [--initial-position:180deg]"
          >
            <NotesOrbitIcon />
          </motion.div>

          {/* Orbiting Booksy */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7, ease: "easeOut" }}
            viewport={{ once: true }}
            className="size-9 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm bg-white animate-orbit [--translate-position:150px] [--orbit-duration:22s] [--initial-position:270deg]"
          >
            <BooksyOrbitIcon />
          </motion.div>
        </motion.div>

        {/* Concentric circles */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0, ease: "easeOut" }}
          viewport={{ once: true }}
          className="inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-44 bg-slate-100/80 z-[9] relative"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-60 bg-slate-100/60 z-[8]"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          viewport={{ once: true }}
          className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-80 bg-slate-100/40 z-[7]"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-96 bg-slate-100/20 z-[6]"
        />
      </div>
    </div>
  );
};

// Skeleton 3: Speed Timer
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
      <motion.div
        initial={{ opacity: 0, rotateY: 40, rotateX: 30, rotateZ: -30 }}
        whileInView={{ opacity: 1, rotateY: 20, rotateX: 20, rotateZ: -20 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true }}
        className="group/bento-skeleton mx-auto my-auto flex h-full w-full max-w-[85%] flex-col rounded-2xl border border-slate-300 bg-slate-100 p-3 shadow-2xl translate-x-6"
        style={{
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
              <motion.div
                key={step.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + idx * 0.1, ease: "easeOut" }}
                viewport={{ once: true }}
              >
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
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ========================================
// MAIN COMPONENT
// ========================================

const GeneratorPage: React.FC<GeneratorPageProps> = ({ onOpenPaywall }) => {
  const navigate = useNavigate();

  const handleStartGenerator = () => {
    navigate('/start-generator');
  };

  return (
    <div className="w-full">
      {/* ===================== HERO: DARMOWY GENERATOR CENNIKA ===================== */}
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
                {/* Main CTA - Darmowy generator */}
                <RainbowButton
                  onClick={handleStartGenerator}
                  className="w-full sm:w-auto mb-6"
                >
                  Stwórz cennik za darmo
                  <IconChevronRight size={18} />
                </RainbowButton>

                {/* Secondary option - Audyt Booksy - plain text */}
                <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                  <p className="text-sm text-slate-500">
                    <span className="text-slate-700 font-medium">Twój profil Booksy mógłby przynosić więcej klientów.</span>{' '}
                    Sprawdzimy 47 punktów i pokażemy co poprawić.
                  </p>
                </div>
              </BlurFade>
            </div>

            {/* Right: HeroDemo */}
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

      {/* ===================== JAK DZIAŁA GENERATOR ===================== */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#D4A574] uppercase tracking-wider mb-3">
                Darmowe narzędzie
              </p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                Jak działa generator cennika?
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Wklej cennik z dowolnego źródła. AI uporządkuje, skategoryzuje i wygeneruje profesjonalny kod HTML.
              </p>
            </div>
          </BlurFade>

          {/* Bento Grid - Card/Skeleton pattern */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

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
          </div>

          {/* CTA */}
          <BlurFade delay={0.5} inView>
            <div className="text-center mt-10">
              <button
                onClick={handleStartGenerator}
                className="inline-flex items-center gap-2 text-[#171717] font-semibold hover:gap-3 transition-all"
              >
                Wypróbuj generator za darmo <IconArrowRight size={18} />
              </button>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ===================== OPTYMALIZACJA AI ===================== */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Visual */}
            <BlurFade delay={0.2} inView>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-6 pt-12 pb-0">
                  <div className="relative w-full h-64">
                    {/* Bottom card - Raw data (red) */}
                    <motion.div
                      initial={{ opacity: 0, y: 20, x: -10 }}
                      whileInView={{ opacity: 0.6, y: 0, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                      viewport={{ once: true }}
                      className="absolute bottom-20 left-0 z-10 w-[75%] rounded-2xl border border-red-200 bg-white p-3 shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <IconAlertCircle size={14} className="text-red-400" />
                        <p className="text-xs font-medium text-slate-500">Surowy cennik</p>
                      </div>
                      <p className="mt-2 text-[10px] text-slate-400 italic">"strzyżenie dam 80zl, kolor 150-250..."</p>
                    </motion.div>

                    {/* Middle card - Processing (gold) */}
                    <motion.div
                      initial={{ opacity: 0, y: 40, x: -20 }}
                      whileInView={{ opacity: 0.8, y: 0, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                      viewport={{ once: true }}
                      className="absolute bottom-10 left-5 z-20 w-[80%] rounded-2xl border border-[#D4A574]/50 bg-white p-3 shadow-xl"
                    >
                      <div className="flex items-center gap-3">
                        <IconSparkles size={14} className="text-[#D4A574]" />
                        <p className="text-xs font-medium text-slate-600">Analiza AI w toku...</p>
                        <div className="ml-auto flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full border-2 border-[#D4A574] border-t-transparent animate-spin" />
                          <p className="text-[10px] text-[#D4A574]">3s</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Top card - Optimized (green) */}
                    <motion.div
                      initial={{ opacity: 0, y: 60, x: -30 }}
                      whileInView={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                      viewport={{ once: true }}
                      className="absolute bottom-0 left-10 z-30 w-[85%] rounded-2xl border border-green-300 bg-white p-4 shadow-2xl"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <IconCheck size={16} className="text-green-600" />
                        <p className="text-sm font-medium text-slate-800">Zoptymalizowany cennik</p>
                        <div className="ml-auto flex items-center gap-1 rounded-full border border-green-300 bg-green-300/10 px-2 py-0.5">
                          <IconCheck size={10} className="text-green-600" />
                          <p className="text-[10px] font-bold text-green-600">Gotowe</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
                          <div>
                            <p className="text-xs font-medium text-slate-700">Strzyżenie damskie z modelowaniem</p>
                            <p className="text-[10px] text-slate-400">Precyzyjne cięcie dopasowane do kształtu twarzy</p>
                          </div>
                          <span className="text-xs font-bold text-slate-800">80 zł</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
                          <div>
                            <p className="text-xs font-medium text-slate-700">Koloryzacja - włosy krótkie</p>
                            <p className="text-[10px] text-slate-400">Pełne pokrycie z pielęgnacją</p>
                          </div>
                          <span className="text-xs font-bold text-slate-800">150 zł</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-sm bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">Kategorie</span>
                        <span className="rounded-sm bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">Opisy</span>
                        <span className="rounded-sm bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">Formatowanie</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
                <div className="p-5 text-center border-t border-slate-100">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#171717] rounded-full text-white text-xs font-semibold">
                    <IconSparkles size={12} className="text-[#D4A574]" />
                    Optymalizacja AI
                  </div>
                </div>
              </div>
            </BlurFade>

            {/* Right: Copy */}
            <BlurFade delay={0.3} inView>
              <div>
                <p className="text-sm font-semibold text-[#D4A574] uppercase tracking-wider mb-3">
                  Funkcja w generatorze
                </p>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-6">
                  Optymalizacja Twojego cennika
                </h2>
                <p className="text-lg text-slate-600 mb-6">
                  Po wygenerowaniu cennika, włącz tryb AI. Sztuczna inteligencja przepisze opisy,
                  doda język korzyści i uporządkuje strukturę tak, by klientki rozumiały wartość usług.
                </p>

                <div className="space-y-3 mb-8">
                  {[
                    'Przepisanie opisów językiem korzyści',
                    'Logiczne grupowanie usług w kategorie',
                    'Spójne nazewnictwo i formatowanie cen',
                    'Usunięcie duplikatów i niespójności',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#D4A574]/20 flex items-center justify-center">
                        <IconCheck size={12} className="text-[#D4A574]" />
                      </div>
                      <span className="text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleStartGenerator}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#171717] text-white font-semibold rounded-xl hover:bg-[#2a2a2a] transition-colors"
                >
                  <IconSparkles size={18} className="text-[#D4A574]" />
                  Wypróbuj optymalizację
                </button>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GeneratorPage;
