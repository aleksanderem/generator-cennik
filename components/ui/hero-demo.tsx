"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import { AnimatedList } from "./animated-list";

// ========================================
// DATA
// ========================================

const excelRows = [
  { service: "Strzyżenie damskie", price: "80", note: "" },
  { service: "Koloryzacja", price: "150-250", note: "" },
  { service: "Baleyage", price: "350", note: "długie +50" },
  { service: "Modelowanie", price: "50", note: "" },
  { service: "Upięcie okolicznościowe", price: "120-200", note: "" },
  { service: "Regeneracja keratynowa", price: "180", note: "" },
];

// Chaotic, unformatted pasted text - like real copy from Excel
const pastedText = `strzyżenie dam.   80
koloryz  150 do 250 zł
BALEYAGE	350 zl długie +50!!
model. 50
upięcie okol  120/200
regenracja kerat - 180,-`;

const generatedServices = [
  {
    id: 1,
    icon: "✂️",
    name: "Strzyżenie damskie",
    description: "Precyzyjne cięcie dopasowane do kształtu twarzy",
    time: "45 min",
    price: "80 zł",
  },
  {
    id: 2,
    icon: "🎨",
    name: "Koloryzacja profesjonalna",
    description: "Intensywny, trwały kolor z pielęgnacją włosa",
    time: "90 min",
    price: "od 150 zł",
  },
  {
    id: 3,
    icon: "✨",
    name: "Baleyage / Sombre",
    description: "Naturalny efekt sun-kissed, delikatne przejścia",
    time: "180 min",
    price: "od 350 zł",
  },
  {
    id: 4,
    icon: "💫",
    name: "Modelowanie",
    description: "Stylizacja i wykończenie fryzury",
    time: "30 min",
    price: "50 zł",
  },
  {
    id: 5,
    icon: "👑",
    name: "Upięcie okolicznościowe",
    description: "Elegancka fryzura na specjalne okazje",
    time: "60 min",
    price: "od 120 zł",
  },
];

type Slide = 'excel' | 'paste' | 'generate';

// ========================================
// COMPONENTS
// ========================================

// Keyboard Key Component
const KeyboardKey = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md",
      "bg-slate-700 border border-slate-600 shadow-sm",
      "text-xs font-semibold text-white",
      "font-mono",
      className
    )}
  >
    {children}
  </span>
);

// Animated Cursor Component - larger and more visible
const AnimatedCursor = ({
  x,
  y,
  clicking,
  dragging,
  visible = true,
  smooth = false // Use slower, smoother animation for drag selection
}: {
  x: number;
  y: number;
  clicking?: boolean;
  dragging?: boolean;
  visible?: boolean;
  smooth?: boolean;
}) => (
  <motion.div
    className="absolute z-50 pointer-events-none"
    initial={{ x: -50, y: -50, opacity: 0 }}
    animate={{ x, y, opacity: visible ? 1 : 0 }}
    transition={smooth
      ? { duration: 2.5, ease: "easeOut" }  // Match selection box animation
      : { type: "spring", stiffness: 120, damping: 18 }
    }
    style={{ left: 0, top: 0 }}
  >
    <motion.svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      className="drop-shadow-2xl"
      animate={{ scale: clicking ? 0.8 : 1 }}
      transition={{ duration: 0.1 }}
      style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}
    >
      <path
        d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.53.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
        fill="#722F37"
        stroke="white"
        strokeWidth="2.5"
      />
    </motion.svg>
    {/* Click ripple effect */}
    {clicking && (
      <motion.div
        initial={{ scale: 0.5, opacity: 1 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-1 left-1 w-6 h-6 rounded-full bg-[#722F37]/40"
      />
    )}
    {/* Dragging indicator */}
    {dragging && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute -top-7 left-6 px-2 py-1 bg-slate-800 rounded text-[10px] text-white whitespace-nowrap shadow-lg"
      >
        Zaznaczanie...
      </motion.div>
    )}
  </motion.div>
);

// Selection Box Component - smooth animated selection
const SelectionBox = ({
  progress, // 0 to 1 - how much of table is selected
  visible
}: {
  progress: number;
  visible: boolean;
}) => {
  if (!visible) return null;

  // Start after row numbers column (40px), cover data area
  // Header is ~32px tall, we want to select rows below header
  const headerHeight = 32;

  return (
    <motion.div
      className="absolute pointer-events-none z-20 overflow-hidden rounded-sm"
      style={{
        left: 40, // After row number column
        top: headerHeight, // Below header row
        right: 0,
        bottom: 0
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Inner selection that grows smoothly */}
      <motion.div
        className="absolute top-0 left-0 rounded-sm"
        style={{
          backgroundColor: "rgba(212, 175, 55, 0.25)",
          border: "2px solid #722F37",
          boxShadow: "0 0 0 1px rgba(114, 47, 55, 0.3)"
        }}
        initial={{ width: 0, height: 0 }}
        animate={{
          width: `${progress * 100}%`,
          height: `${progress * 100}%`
        }}
        transition={{
          duration: 2.5,
          ease: "easeOut"
        }}
      />
    </motion.div>
  );
};

// Service Item for AnimatedList
const ServiceItem = ({ service }: { service: typeof generatedServices[0] }) => (
  <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#722F37]/10 to-[#D4AF37]/10 flex items-center justify-center text-lg flex-shrink-0">
      {service.icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold text-slate-800 text-sm truncate">{service.name}</h4>
        <span className="text-[#722F37] font-bold text-sm whitespace-nowrap">{service.price}</span>
      </div>
      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{service.description}</p>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[10px] text-slate-400">⏱ {service.time}</span>
      </div>
    </div>
  </div>
);

// ========================================
// MAIN COMPONENT
// ========================================

export const HeroDemo = ({ className }: { className?: string }) => {
  const [slide, setSlide] = useState<Slide>('excel');

  // Slide 1 states - cursor selecting cells
  const [cursorPos1, setCursorPos1] = useState({ x: -50, y: -50 });
  const [selectionProgress, setSelectionProgress] = useState(0); // 0 to 1
  const [selectionVisible, setSelectionVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCopyKeys, setShowCopyKeys] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Slide 2 states
  const [showPasteKeys, setShowPasteKeys] = useState(false);
  const [showPastedText, setShowPastedText] = useState(false);
  const [cursorPos2, setCursorPos2] = useState({ x: -50, y: -50 });
  const [showCursor2, setShowCursor2] = useState(false);
  const [isCursorClicking, setIsCursorClicking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [showTextCursor, setShowTextCursor] = useState(false);
  const pasteContainerRef = useRef<HTMLDivElement>(null);

  // Slide timings
  const slideTimings: Record<Slide, number> = {
    excel: 8000,
    paste: 8000,
    generate: 10000,
  };

  // Main slide transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setSlide((prev) => {
        const slides: Slide[] = ['excel', 'paste', 'generate'];
        const currentIndex = slides.indexOf(prev);
        return slides[(currentIndex + 1) % slides.length];
      });
    }, slideTimings[slide]);

    return () => clearTimeout(timer);
  }, [slide]);

  // ========================================
  // SLIDE 1: Excel - Cursor drag selection (smooth)
  // ========================================
  useEffect(() => {
    if (slide !== 'excel') {
      setCursorPos1({ x: -50, y: -50 });
      setSelectionProgress(0);
      setSelectionVisible(false);
      setIsDragging(false);
      setShowCopyKeys(false);
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    // Get table dimensions for cursor positioning
    const getTableSize = () => {
      if (tableRef.current) {
        return {
          width: tableRef.current.offsetWidth,
          height: tableRef.current.offsetHeight
        };
      }
      return { width: 400, height: 260 }; // fallback
    };

    // Step 1: Cursor appears at top-left corner (0.5s)
    timers.push(setTimeout(() => {
      setCursorPos1({ x: 50, y: 40 });
    }, 500));

    // Step 2: Start dragging and begin smooth selection (1.2s)
    timers.push(setTimeout(() => {
      setIsDragging(true);
      setSelectionVisible(true);
      // Start selection and immediately set to 100% - CSS transition handles smooth animation
      setSelectionProgress(1);

      // Start cursor movement to bottom-right (smooth via spring animation)
      const size = getTableSize();
      setCursorPos1({ x: size.width - 15, y: size.height - 15 });
    }, 1200));

    // Step 3: Stop dragging indicator (4.5s)
    timers.push(setTimeout(() => {
      setIsDragging(false);
    }, 4500));

    // Step 4: Show CMD+C (5s)
    timers.push(setTimeout(() => {
      setShowCopyKeys(true);
    }, 5000));

    return () => timers.forEach(t => clearTimeout(t));
  }, [slide]);

  // ========================================
  // SLIDE 2: Paste + Cursor to button (smooth sequence)
  // ========================================
  useEffect(() => {
    if (slide !== 'paste') {
      setShowPasteKeys(false);
      setShowPastedText(false);
      setShowCursor2(false);
      setCursorPos2({ x: -50, y: -50 });
      setIsCursorClicking(false);
      setIsProcessing(false);
      setButtonHovered(false);
      setTextareaFocused(false);
      setShowTextCursor(false);
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    // Get container dimensions for cursor positioning
    const getContainerSize = () => {
      if (pasteContainerRef.current) {
        return {
          width: pasteContainerRef.current.offsetWidth,
          height: pasteContainerRef.current.offsetHeight
        };
      }
      return { width: 400, height: 350 };
    };

    // Step 1: Show cursor moving toward textarea (0.3s)
    timers.push(setTimeout(() => {
      setShowCursor2(true);
      setCursorPos2({ x: 50, y: 80 });
    }, 300));

    // Step 2: Cursor clicks in textarea (1s)
    timers.push(setTimeout(() => {
      setCursorPos2({ x: 80, y: 100 });
      setIsCursorClicking(true);
    }, 1000));

    // Step 3: Release click, textarea gets focus (1.2s)
    timers.push(setTimeout(() => {
      setIsCursorClicking(false);
      setTextareaFocused(true);
      setShowTextCursor(true);
    }, 1200));

    // Step 4: Show CMD+V (1.8s)
    timers.push(setTimeout(() => {
      setShowPasteKeys(true);
    }, 1800));

    // Step 5: Text appears, hide CMD+V (2.5s)
    timers.push(setTimeout(() => {
      setShowPasteKeys(false);
      setShowPastedText(true);
      setShowTextCursor(false);
    }, 2500));

    // Step 6: Cursor starts moving toward button (3.5s) - smooth animation
    timers.push(setTimeout(() => {
      const size = getContainerSize();
      setCursorPos2({ x: size.width / 2, y: size.height - 40 }); // Move to button
    }, 3500));

    // Step 7: Cursor on button, hover effect (5s)
    timers.push(setTimeout(() => {
      setButtonHovered(true);
    }, 5000));

    // Step 8: Click button (5.8s)
    timers.push(setTimeout(() => {
      setIsCursorClicking(true);
    }, 5800));

    // Step 9: Release click, start processing (6s)
    timers.push(setTimeout(() => {
      setIsCursorClicking(false);
      setIsProcessing(true);
      setShowCursor2(false);
    }, 6000));

    return () => timers.forEach(t => clearTimeout(t));
  }, [slide]);

  return (
    <div className={cn("relative", className)}>
      {/* Slide indicators */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {(['excel', 'paste', 'generate'] as Slide[]).map((s, idx) => (
          <React.Fragment key={s}>
            <motion.div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer",
                slide === s
                  ? "bg-[#722F37] text-white shadow-lg shadow-[#722F37]/20"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
              animate={{ scale: slide === s ? 1.05 : 1 }}
              onClick={() => setSlide(s)}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                slide === s ? "bg-white/20" : "bg-slate-200"
              )}>
                {idx + 1}
              </span>
              {s === 'excel' && 'Zaznacz'}
              {s === 'paste' && 'Wklej'}
              {s === 'generate' && 'Generuj'}
            </motion.div>
            {idx < 2 && (
              <div className={cn(
                "w-8 h-0.5 rounded-full transition-colors",
                (slide === 'paste' && idx === 0) || slide === 'generate' ? "bg-[#722F37]" : "bg-slate-200"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Demo container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-200/50">
        {/* Browser mockup header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 bg-white rounded-md text-xs text-slate-500 border border-slate-200">
              {slide === 'excel' ? 'cennik.xlsx - Excel' : 'beautyaudit.pl/generator'}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="p-4 min-h-[380px] relative bg-gradient-to-b from-white to-slate-50/50 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ========================================
                SLIDE 1: Excel with cursor drag selection
                ======================================== */}
            {slide === 'excel' && (
              <motion.div
                key="excel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                {/* Excel header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">X</span>
                  </div>
                  <span className="text-sm font-medium text-slate-600">Twój cennik w Excelu</span>
                </div>

                {/* Excel grid - relative container for selection and cursor */}
                <div className="relative" ref={tableRef}>
                  <div className="bg-white rounded-lg border border-slate-200 overflow-visible">
                    {/* Column headers */}
                    <div className="grid grid-cols-[40px_1fr_80px_100px] bg-slate-100 border-b border-slate-200 text-xs font-medium text-slate-500">
                      <div className="p-2 border-r border-slate-200"></div>
                      <div className="p-2 border-r border-slate-200 text-center">A</div>
                      <div className="p-2 border-r border-slate-200 text-center">B</div>
                      <div className="p-2 text-center">C</div>
                    </div>

                    {/* Data rows */}
                    {excelRows.map((row, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[40px_1fr_80px_100px] border-b border-slate-100 last:border-b-0"
                      >
                        <div className="p-2 bg-slate-50 border-r border-slate-200 text-xs text-slate-400 text-center">
                          {idx + 1}
                        </div>
                        <div className="p-2 border-r border-slate-100 text-sm truncate">
                          {row.service}
                        </div>
                        <div className="p-2 border-r border-slate-100 text-sm text-right font-mono">
                          {row.price} zł
                        </div>
                        <div className="p-2 text-xs text-slate-400 italic truncate">
                          {row.note}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selection box overlay */}
                  <SelectionBox
                    progress={selectionProgress}
                    visible={selectionVisible}
                  />

                  {/* Animated cursor for selection - inside relative container */}
                  <AnimatedCursor
                    x={cursorPos1.x}
                    y={cursorPos1.y}
                    dragging={isDragging}
                    visible={slide === 'excel'}
                    smooth={isDragging} // Smooth animation during drag
                  />
                </div>

                {/* CMD+C Animation */}
                <AnimatePresence>
                  {showCopyKeys && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 bg-slate-800 rounded-xl shadow-xl z-30"
                    >
                      <KeyboardKey>⌘</KeyboardKey>
                      <span className="text-slate-400">+</span>
                      <KeyboardKey>C</KeyboardKey>
                      <span className="text-white text-sm ml-2">Skopiowano!</span>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ========================================
                SLIDE 2: Paste + Cursor to button
                ======================================== */}
            {slide === 'paste' && (
              <motion.div
                key="paste"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="relative"
                ref={pasteContainerRef}
              >
                {/* App header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-[#722F37] rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">✨</span>
                  </div>
                  <span className="text-sm font-medium text-slate-600">Beauty Audit - Generator</span>
                </div>

                {/* Textarea - looks like real textarea */}
                <motion.div
                  className={cn(
                    "rounded-xl p-4 min-h-[180px] relative transition-all duration-200",
                    "bg-white border-2",
                    textareaFocused
                      ? "border-[#722F37] ring-2 ring-[#722F37]/20"
                      : "border-slate-200"
                  )}
                  animate={{
                    borderColor: textareaFocused ? "#722F37" : "#e2e8f0"
                  }}
                >
                  {showPastedText ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-mono text-slate-600 whitespace-pre-wrap leading-relaxed"
                    >
                      {pastedText}
                    </motion.div>
                  ) : (
                    <div className="flex items-start">
                      <span className="text-slate-400 text-sm">Wklej tutaj swój cennik...</span>
                      {/* Blinking text cursor */}
                      {showTextCursor && (
                        <motion.span
                          className="inline-block w-0.5 h-5 bg-[#722F37] ml-0.5"
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                        />
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Generate button */}
                <motion.button
                  animate={{
                    scale: isCursorClicking && buttonHovered ? 0.95 : buttonHovered ? 1.02 : 1,
                    backgroundColor: isProcessing ? "#5a252c" : buttonHovered ? "#8B3A42" : "#722F37",
                    boxShadow: buttonHovered ? "0 10px 40px rgba(114, 47, 55, 0.4)" : "0 10px 30px rgba(114, 47, 55, 0.2)"
                  }}
                  transition={{ duration: 0.15 }}
                  className="mt-4 w-full py-3 bg-[#722F37] text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>Przetwarzanie...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">✨</span>
                      Generuj cennik AI
                    </>
                  )}
                </motion.button>

                {/* Animated cursor - smooth movement */}
                {showCursor2 && (
                  <AnimatedCursor
                    x={cursorPos2.x}
                    y={cursorPos2.y}
                    clicking={isCursorClicking}
                    smooth={true}
                  />
                )}

                {/* CMD+V Animation */}
                <AnimatePresence>
                  {showPasteKeys && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, y: -10 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-3 bg-slate-800 rounded-xl shadow-xl z-30"
                    >
                      <KeyboardKey>⌘</KeyboardKey>
                      <span className="text-slate-400">+</span>
                      <KeyboardKey>V</KeyboardKey>
                      <span className="text-white text-sm ml-2">Wklejanie...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ========================================
                SLIDE 3: AnimatedList generation
                ======================================== */}
            {slide === 'generate' && (
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 bg-gradient-to-r from-[#722F37] to-[#D4AF37] rounded-lg flex items-center justify-center"
                    >
                      <span className="text-white text-sm">⚡</span>
                    </motion.div>
                    <span className="text-sm font-medium text-slate-600">AI generuje cennik...</span>
                  </div>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 6 }}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                  >
                    Gotowe!
                  </motion.span>
                </div>

                {/* AnimatedList of services */}
                <div className="overflow-hidden max-h-[300px]">
                  <AnimatedList delay={1500} className="gap-3">
                    {generatedServices.map((service) => (
                      <ServiceItem key={service.id} service={service} />
                    ))}
                  </AnimatedList>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
