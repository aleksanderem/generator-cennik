"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import {
  IconSearch,
  IconCheck,
  IconAlertTriangle,
  IconSparkles,
  IconChartBar,
  IconStar,
  IconPhoto,
  IconClock,
  IconCurrencyDollar,
  IconDots,
  IconBrandInstagram,
  IconWorld,
  IconPhone,
  IconMail,
  IconChevronDown,
  IconTargetArrow,
  IconUsers,
  IconLayoutGrid,
  IconTrendingUp,
  IconReportAnalytics,
} from "@tabler/icons-react";

// ========================================
// DATA - Struktura jak na prawdziwym Booksy
// ========================================

// Kategorie usług z Booksy
const booksyCategories = [
  {
    name: "Popularne usługi",
    expanded: true,
    services: [
      {
        name: "Laser CO2 - usuwanie zmian skórnych",
        description: "Laser CO2 - usuwanie zmian skórnych (kurzajek, włókniaków...)",
        price: "150,00 zł+",
        time: "30min",
        hasImage: true,
        status: "ok"
      },
      {
        name: "Konsultacja usuwanie zmian skórnych",
        description: "Zapraszamy na konsultację w sprawie usunięcia zmian skórnych...",
        price: "Darmowa",
        time: "15min",
        hasImage: false,
        status: "warning"
      },
      {
        name: "Drenaż Limfatyczny - 1 zabieg 60 min",
        description: "Drenaż limfatyczny zapewni uczucie lekkich, smukłych nóg...",
        price: "150,00 zł",
        time: "1g 15min",
        hasImage: true,
        status: "ok"
      },
    ]
  },
  {
    name: "✦ PROMOCJE GRUDZIEŃ✦",
    expanded: true,
    services: [
      {
        name: "-30% na Pierwszy zabieg Onda + konsultacja",
        description: "",
        price: "Darmowa",
        time: "1g",
        hasImage: false,
        status: "ok"
      },
      {
        name: "-50% na drugi zabieg oczyszczania wodorowego",
        description: "-50% na drugi zabieg oczyszczania wodorowego Inpure",
        price: "Darmowa",
        time: "1g",
        hasImage: false,
        status: "error"
      },
    ]
  }
];

// Flatten services for scanning
const allServices = booksyCategories.flatMap(cat => cat.services);

// Dane biznesowe
const businessInfo = {
  name: "TWÓJ SALON SP. Z O.O.",
  phone: "515 123 123",
  email: "Ukryte",
  availability: [
    { date: "22 Gru, 2025", hours: "9:00 - 20:00" },
    { date: "23 Gru, 2025", hours: "9:00 - 20:00" },
    { date: "24 Gru, 2025", hours: "Zamknięte" },
  ]
};

// Punkty audytu - zgodne z kartami "Kompleksowy Audyt Profilu Booksy"
const auditPoints = [
  { category: "SEO", desc: "Optymalizacja nazw i opisów", score: 6, max: 10, icon: IconSearch },
  { category: "Konwersja", desc: "Wzmocnienie promocji", score: 7, max: 10, icon: IconTargetArrow },
  { category: "Retencja", desc: "Programy lojalnościowe", score: 5, max: 10, icon: IconUsers },
  { category: "Wizerunek", desc: "Kategoryzacja i komunikacja", score: 8, max: 10, icon: IconLayoutGrid },
  { category: "Konkurencja", desc: "Pozycja na rynku lokalnym", score: 4, max: 10, icon: IconReportAnalytics },
  { category: "Prognoza", desc: "Potencjał sprzedażowy", score: 7, max: 10, icon: IconTrendingUp },
];

// Rekomendacje
const recommendations = [
  { text: "Dodaj zdjęcia portfolio do 3 usług", priority: "high" },
  { text: "Uzupełnij opisy koloryzacji", priority: "high" },
  { text: "Zwiększ dostępność w weekendy", priority: "medium" },
  { text: "Odpowiedz na 2 nieodczytane opinie", priority: "low" },
];

type Slide = "scan" | "analyze" | "result";

// ========================================
// COMPONENTS
// ========================================

// Booksy-style service row
const BooksyServiceRow = ({
  service,
  isScanning,
  isScanned,
  isMobile = false,
}: {
  service: typeof allServices[0];
  isScanning: boolean;
  isScanned: boolean;
  isMobile?: boolean;
}) => (
  <motion.div
    className={cn(
      "relative flex items-start gap-2 py-2.5 px-2 transition-all duration-300 rounded-lg",
      isScanning && "bg-orange-500/10 ring-2 ring-orange-500/30",
      isScanned && !isMobile && "bg-white shadow-xl border border-orange-200/60 z-10",
      isScanned && isMobile && "bg-orange-50/50",
    )}
    animate={{
      opacity: isScanned || isScanning ? 1 : 0.6,
      y: isScanned && !isMobile ? -6 : 0,
      scale: isScanned && !isMobile ? 1.02 : 1,
    }}
    style={{
      transformStyle: "preserve-3d",
      boxShadow: isScanned && !isMobile ? "0 8px 20px -6px rgba(249, 115, 22, 0.25), 0 4px 8px -4px rgba(0,0,0,0.1)" : undefined,
    }}
    transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
  >
    {/* Scanning overlay - orange theme */}
    <AnimatePresence>
      {isScanning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-orange-500/5 rounded-lg z-10"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white text-[10px] font-medium rounded-full shadow-lg">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
            />
            Skanowanie...
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Image placeholder or dots button */}
    <div className="flex-shrink-0 mt-0.5">
      {service.hasImage ? (
        <div className="w-7 h-7 rounded bg-slate-200 flex items-center justify-center">
          <IconPhoto size={12} className="text-slate-400" />
        </div>
      ) : (
        <div className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center">
          <IconDots size={12} className="text-slate-400" />
        </div>
      )}
    </div>

    {/* Service info */}
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-medium text-slate-800 leading-tight truncate pr-2">
        {service.name}
      </p>
      {service.description && (
        <p className="text-[8px] text-slate-500 leading-tight mt-0.5 line-clamp-1">
          {service.description}
        </p>
      )}
    </div>

    {/* Price & Book button */}
    <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
      <div className="text-right">
        <p className="text-[9px] font-medium text-slate-700">{service.price}</p>
        <p className="text-[8px] text-slate-400">{service.time}</p>
      </div>
      <button className="px-2 py-0.5 bg-[#00B3B3] text-white text-[8px] font-medium rounded">
        Umów
      </button>
    </div>

    {/* Scanned status indicator - all orange with warning icon */}
    {isScanned && !isScanning && (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute -right-1 -top-1 w-4 h-4 rounded-full flex items-center justify-center shadow-md bg-orange-500"
      >
        <IconAlertTriangle size={9} className="text-white" />
      </motion.div>
    )}
  </motion.div>
);

// Right panel - Business info (Booksy style) - hidden on mobile
const RightPanel = ({ scanIndex }: { scanIndex: number }) => (
  <div className="hidden md:block w-[180px] flex-shrink-0 border-l border-slate-200 p-3 text-[9px] bg-slate-50/50">
    {/* Availability section */}
    <div className="mb-4">
      <div className="flex items-center gap-1 text-[#00B3B3] font-medium mb-2">
        <span>Pokaż cały tydzień</span>
        <IconChevronDown size={10} />
      </div>
      <div className="space-y-1.5">
        {businessInfo.availability.map((day, i) => (
          <div key={i} className="flex justify-between">
            <span className="text-slate-600">{day.date}</span>
            <span className={cn(
              "font-medium",
              day.hours === "Zamknięte" ? "text-slate-400" : "text-slate-700"
            )}>{day.hours}</span>
          </div>
        ))}
      </div>
      <button className="text-[#00B3B3] font-medium mt-2">Pokaż więcej</button>
    </div>

    {/* Business data */}
    <div className="mb-4">
      <p className="text-[8px] uppercase tracking-wide text-slate-400 mb-2">DANE BIZNESU</p>
      <p className="font-medium text-slate-700 mb-2">{businessInfo.name}</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <IconPhone size={10} className="text-slate-400" />
          <span className="text-slate-600">{businessInfo.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <IconMail size={10} className="text-slate-400" />
          <span className="text-slate-600">{businessInfo.email}</span>
          <span className="text-[#00B3B3] ml-auto">Pokaż</span>
        </div>
      </div>
    </div>

    {/* Social media */}
    <div className="mb-4">
      <p className="text-[8px] uppercase tracking-wide text-slate-400 mb-2">MEDIA SPOŁECZNOŚCIOWE</p>
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
            <IconBrandInstagram size={14} className="text-slate-500" />
          </div>
          <span className="text-[8px] text-slate-500">Instagram</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
            <IconWorld size={14} className="text-slate-500" />
          </div>
          <span className="text-[8px] text-slate-500">Strona</span>
        </div>
      </div>
    </div>

    {/* Scan progress - orange theme */}
    <div className="mt-auto pt-3 border-t border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full"
        />
        <span className="text-orange-500 font-medium">Skanowanie...</span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-orange-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((scanIndex + 1) / allServices.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  </div>
);

// Audit score bar
const ScoreBar = ({ point, delay }: { point: typeof auditPoints[0]; delay: number }) => {
  const Icon = point.icon;
  const percentage = (point.score / point.max) * 100;
  const color = percentage >= 70 ? "bg-green-500" : percentage >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-2"
    >
      <Icon size={14} className="text-slate-400 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between text-[10px] mb-0.5">
          <div>
            <span className="text-slate-700 font-medium">{point.category}</span>
            <span className="text-slate-400 ml-1">· {point.desc}</span>
          </div>
          <span className="font-medium text-slate-700">{point.score}/{point.max}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", color)}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: delay + 0.2, duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// ========================================
// MAIN DEMO COMPONENT
// ========================================

export function BooksyAuditDemo() {
  const [currentSlide, setCurrentSlide] = useState<Slide>("scan");
  const [scanIndex, setScanIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-advance slides - starts directly with scanning
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    if (currentSlide === "scan") {
      // Small delay before starting scan
      timers.push(setTimeout(() => setScanIndex(0), 500));

      // Scan each service one by one
      allServices.forEach((_, i) => {
        timers.push(setTimeout(() => setScanIndex(i), 500 + 700 * i));
      });
      // After last scan, wait a bit then move to analyze
      timers.push(setTimeout(() => {
        setScanIndex(allServices.length);
        setCurrentSlide("analyze");
      }, 500 + 700 * allServices.length + 500));
    }

    if (currentSlide === "analyze") {
      timers.push(setTimeout(() => setCurrentSlide("result"), 3000));
    }

    if (currentSlide === "result") {
      timers.push(setTimeout(() => {
        setCurrentSlide("scan");
        setScanIndex(-1);
      }, 5000));
    }

    return () => timers.forEach(clearTimeout);
  }, [currentSlide]);

  return (
    <div className="relative w-full max-w-4xl mx-auto" style={{ perspective: "1400px" }}>
      {/* Isometric container - mirrored rotation with better visibility */}
      <div
        className="relative rounded-2xl border border-slate-300 bg-slate-100 p-4 shadow-2xl"
        style={{
          maskImage: "linear-gradient(to bottom, white 85%, transparent 100%)",
          transform: "rotateX(12deg) rotateY(-15deg) rotateZ(8deg) scale(1.2)",
          transformOrigin: "center center",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <IconSearch size={16} className="text-[#171717]" />
          <p className="text-sm font-medium text-slate-800">Audyt profilu Booksy</p>
        </div>

        {/* Browser mockup container with subtle offset */}
        <div className="relative overflow-visible rounded-2xl border border-slate-200 bg-slate-200 min-h-[460px]">
          {/* Dotted pattern background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "repeating-linear-gradient(315deg, rgb(100, 116, 139) 0px, rgb(100, 116, 139) 1px, transparent 0px, transparent 50%)",
              backgroundSize: "10px 10px",
            }}
          />

          {/* Elevated browser window */}
          <div
            className="absolute inset-0 h-full w-full rounded-2xl bg-white shadow-xl"
            style={{ transform: "translateX(-8px) translateY(-8px)" }}
          >
            {/* Browser Header */}
            <div className="bg-slate-100 px-3 py-2 flex items-center gap-2 border-b border-slate-200 rounded-t-2xl">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 ml-2">
                <div className="bg-white rounded px-2 py-0.5 flex items-center gap-1.5 text-[8px] text-slate-400 border border-slate-200">
                  <IconSearch size={8} />
                  <span>booksy.com/pl-pl/twoj-salon</span>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
              {/* SLIDE 1: Scanning Booksy-style with two columns */}
              {currentSlide === "scan" && (
                <motion.div
                  key="scan"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[420px] overflow-hidden"
                >
                  {/* Left column - Services list */}
                  <div className="flex-1 p-3 overflow-hidden">
                    {/* Header like Booksy */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-slate-800">Usługi</h3>
                      <div className="px-1.5 py-0.5 bg-slate-100 rounded text-[8px] text-slate-500 flex items-center gap-1">
                        <IconSearch size={8} />
                        Szukaj
                      </div>
                    </div>

                    {/* Categories with services */}
                    <div className="space-y-2 max-h-[340px]">
                      {booksyCategories.map((category, catIndex) => {
                        const startIndex = booksyCategories
                          .slice(0, catIndex)
                          .reduce((acc, cat) => acc + cat.services.length, 0);

                        return (
                          <div key={category.name}>
                            {/* Category header */}
                            <div className="flex items-center justify-between py-1 border-b border-slate-100">
                              <div className="flex items-center gap-1">
                                <IconChevronDown size={10} className="text-slate-400" />
                                <span className="text-[9px] font-medium text-slate-600">
                                  {category.name}
                                </span>
                              </div>
                              <span className="text-[7px] text-slate-400">
                                {category.services.length} usług
                              </span>
                            </div>

                            {/* Services in this category */}
                            <div className="divide-y divide-slate-50">
                              {category.services.map((service, serviceIndex) => {
                                const globalIndex = startIndex + serviceIndex;
                                return (
                                  <BooksyServiceRow
                                    key={globalIndex}
                                    service={service}
                                    isScanning={scanIndex === globalIndex}
                                    isScanned={scanIndex > globalIndex}
                                    isMobile={isMobile}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right column - Business info panel */}
                  <RightPanel scanIndex={scanIndex} />
                </motion.div>
              )}

              {/* SLIDE 2: AI Analysis */}
              {currentSlide === "analyze" && (
                <motion.div
                  key="analyze"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 min-h-[420px]"
                >
                  {/* Potencjał Sprzedażowy Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 mb-3"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <IconTrendingUp size={14} className="text-emerald-500" />
                      <span className="text-xs font-semibold text-slate-800">Potencjał Sprzedażowy</span>
                    </div>

                    {/* Description */}
                    <p className="text-[9px] text-slate-500 mb-2 leading-tight">
                      Niski do Średniego. Po wdrożeniu zmian może wzrosnąć.
                    </p>

                    {/* Gradient progress bar */}
                    <div className="relative mb-1.5">
                      <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: "100%",
                            background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)",
                          }}
                        />
                      </div>
                      {/* Marker */}
                      <motion.div
                        initial={{ left: "0%" }}
                        animate={{ left: "35%" }}
                        transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-slate-400 rounded-full shadow"
                      />
                    </div>

                    {/* Labels */}
                    <div className="flex justify-between text-[7px] text-slate-400 mb-2">
                      <span>NISKI</span>
                      <span>ŚREDNI</span>
                      <span>WYSOKI</span>
                    </div>

                    {/* Bottom info */}
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-emerald-50 rounded-md">
                      <span className="text-emerald-500 text-[10px]">→</span>
                      <span className="text-[9px] text-emerald-700 font-medium">
                        Po optymalizacji: +47%
                      </span>
                    </div>
                  </motion.div>

                  <div className="space-y-2 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                    {auditPoints.map((point, i) => (
                      <ScoreBar key={point.category} point={point} delay={0.3 + i * 0.15} />
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="text-center mt-4"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4A574]/10 text-[#D4A574] text-xs font-medium">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border-2 border-[#D4A574] border-t-transparent rounded-full"
                      />
                      Generuję rekomendacje...
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* SLIDE 3: Results - Werdykt Audytora */}
              {currentSlide === "result" && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 min-h-[420px] overflow-hidden"
                  style={{
                    maskImage: "linear-gradient(to bottom, white 60%, transparent 95%)",
                    WebkitMaskImage: "linear-gradient(to bottom, white 60%, transparent 95%)",
                  }}
                >
                  {/* Werdykt Audytora Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 mb-3"
                  >
                    <div className="flex items-start gap-4">
                      {/* Circular Score with gradient ring */}
                      <div className="relative flex-shrink-0">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                          {/* Background circle */}
                          <circle
                            cx="40"
                            cy="40"
                            r="32"
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth="6"
                          />
                          {/* Gradient arc */}
                          <motion.circle
                            cx="40"
                            cy="40"
                            r="32"
                            fill="none"
                            stroke="url(#scoreGradient)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${38 * 2.01} ${100 * 2.01}`}
                            initial={{ strokeDasharray: "0 201" }}
                            animate={{ strokeDasharray: `${38 * 2.01} ${100 * 2.01}` }}
                            transition={{ duration: 1, delay: 0.3 }}
                          />
                          <defs>
                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#f97316" />
                              <stop offset="50%" stopColor="#eab308" />
                              <stop offset="100%" stopColor="#22c55e" />
                            </linearGradient>
                          </defs>
                        </svg>
                        {/* Score number */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <motion.span
                            className="text-2xl font-bold text-orange-500"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            38
                          </motion.span>
                          <span className="text-[8px] text-slate-400 uppercase tracking-wider">Score</span>
                        </div>
                      </div>

                      {/* Text content */}
                      <div className="flex-1 pt-1">
                        <h3 className="text-sm font-semibold text-slate-800 mb-1">Werdykt Audytora</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          "Cennik charakteryzuje się dużym chaosem i nadmierną redundancją, co utrudnia nawigację..."
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-2 mt-3">
                      <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-medium rounded-full">
                        Pilne
                      </span>
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-medium rounded-full">
                        Wymaga pracy
                      </span>
                    </div>
                  </motion.div>

                  {/* Sekcja Promocje Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 mb-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <IconSparkles size={12} className="text-slate-400" />
                        <span className="text-[11px] font-semibold text-slate-800">Sekcja Promocje</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-orange-500 font-medium">
                        <IconTrendingUp size={10} />
                        +40%
                      </div>
                    </div>

                    {/* Promo items */}
                    <div className="space-y-1">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-between py-1.5 border-b border-slate-50"
                      >
                        <span className="text-[10px] text-slate-700">Depilacja pełne nogi</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400 line-through">180 zł</span>
                          <span className="text-[10px] font-semibold text-orange-500">140 zł</span>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center justify-between py-1.5"
                      >
                        <span className="text-[10px] text-slate-700">Pakiet 5 zabiegów</span>
                        <span className="text-[9px] text-emerald-500 font-medium">-22%</span>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Struktura kategorii Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 mb-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <IconLayoutGrid size={12} className="text-violet-500" />
                        <span className="text-[11px] font-semibold text-slate-800">Struktura kategorii</span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-violet-100 text-violet-600 text-[8px] font-bold rounded">
                        PRO
                      </span>
                    </div>

                    {/* Category items */}
                    <div className="space-y-1.5">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-violet-500 rounded-full" />
                          <span className="text-[10px] text-slate-700">Depilacja Laserowa</span>
                        </div>
                        <span className="text-[9px] text-slate-400">12 usług</span>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-violet-400 rounded-full" />
                          <span className="text-[10px] text-slate-700">Zabiegi na Twarz</span>
                        </div>
                        <span className="text-[9px] text-slate-400">8 usług</span>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-violet-300 rounded-full" />
                          <span className="text-[10px] text-slate-700">Terapie IV</span>
                        </div>
                        <span className="text-[9px] text-slate-400">5 usług</span>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BooksyAuditDemo;
