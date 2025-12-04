
import React, { useState, useEffect, useRef } from 'react';
import { Check, Loader2, TerminalSquare } from 'lucide-react';

interface TerminalLoaderProps {
  isDataReady: boolean;
  onComplete: () => void;
}

const STEPS = [
  "Inicjalizacja połączenia z Gemini 2.5 AI...",
  "Analiza surowych danych z arkusza...",
  "Wykrywanie struktury kategorii...",
  "Identyfikacja cen i promocji...",
  "Formatowanie opisów i tagów...",
  "Generowanie kodu HTML/CSS...",
  "Finalizowanie cennika..."
];

const TerminalLoader: React.FC<TerminalLoaderProps> = ({ isDataReady, onComplete }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [stepStatus, setStepStatus] = useState<'typing' | 'processing' | 'done'>('typing');
  const [finalCountdown, setFinalCountdown] = useState<number | null>(null);

  const TYPING_SPEED = 25; // ms per char

  // Auto-scroll
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [typedText, activeStepIndex, stepStatus]);

  // Typing Effect Logic
  useEffect(() => {
    if (activeStepIndex >= STEPS.length) return;

    const currentFullText = STEPS[activeStepIndex];

    if (stepStatus === 'typing') {
      if (typedText.length < currentFullText.length) {
        const timeout = setTimeout(() => {
          setTypedText(currentFullText.slice(0, typedText.length + 1));
        }, TYPING_SPEED);
        return () => clearTimeout(timeout);
      } else {
        // Typing done, switch to processing
        setStepStatus('processing');
      }
    }
  }, [typedText, stepStatus, activeStepIndex]);

  // Processing & Step Transition Logic
  useEffect(() => {
    if (stepStatus !== 'processing') return;

    const isLastStep = activeStepIndex === STEPS.length - 1;

    // Logic for transition
    const processStep = async () => {
      // Minimum processing time for effect
      await new Promise(r => setTimeout(r, 800)); 

      if (isLastStep) {
        // FINAL STEP LOGIC
        if (isDataReady) {
          // If data is ready, start the 3s countdown (updated from 10s)
          if (finalCountdown === null) {
             setFinalCountdown(3);
          }
        }
        // If data not ready, we just stay in 'processing' state (spinner spinning)
      } else {
        // STANDARD STEP LOGIC
        setStepStatus('done');
        await new Promise(r => setTimeout(r, 400)); // Pause before next line
        setActiveStepIndex(prev => prev + 1);
        setTypedText(""); // Reset for next line
        setStepStatus('typing');
      }
    };

    processStep();
  }, [stepStatus, activeStepIndex, isDataReady, finalCountdown]);

  // Countdown Logic
  useEffect(() => {
    if (finalCountdown === null) return;

    if (finalCountdown > 0) {
      const timer = setTimeout(() => setFinalCountdown(prev => (prev !== null ? prev - 1 : 0)), 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished
      onComplete();
    }
  }, [finalCountdown, onComplete]);


  return (
    <div className="relative group rounded-xl max-w-lg w-full mx-auto shadow-2xl animate-in fade-in zoom-in-95 duration-500">
      
      {/* SHINE BORDER EFFECT */}
      <style>{`
        @keyframes shine {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .shine-border {
          background: conic-gradient(from 0deg, transparent 0deg 300deg, #f43f5e 360deg);
          animation: shine 4s linear infinite;
        }
      `}</style>
      <div className="absolute -inset-[2px] rounded-xl overflow-hidden z-0">
        <div className="absolute inset-[-100%] shine-border opacity-60"></div>
      </div>
      
      {/* Main Container */}
      <div className="relative z-10 bg-white rounded-[10px] overflow-hidden border border-slate-100 flex flex-col h-[340px]">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500/20" />
            <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/20" />
            <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500/20" />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <TerminalSquare size={12} />
            <span>gemini-worker — zsh</span>
          </div>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>

        {/* Terminal Body */}
        <div 
          ref={containerRef}
          className="flex-1 p-6 overflow-y-auto font-mono text-sm space-y-4 scroll-smooth"
        >
          {/* Render Completed Steps */}
          {STEPS.slice(0, activeStepIndex).map((step, idx) => (
            <div key={idx} className="flex items-start gap-3 text-slate-700">
              <span className="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span>
              <span className="opacity-60">{step}</span>
            </div>
          ))}

          {/* Render Active Step */}
          {activeStepIndex < STEPS.length && (
            <div className="flex items-start gap-3 text-slate-900 font-medium">
               <span className="text-rose-500 font-bold mt-0.5 shrink-0">➜</span>
               <div className="flex flex-col gap-1 w-full">
                 <span>
                   {typedText}
                   {stepStatus === 'typing' && (
                     <span className="inline-block w-2 h-4 bg-slate-400 ml-1 animate-pulse align-middle" />
                   )}
                 </span>
                 
                 {/* Spinner or Countdown when text is fully typed */}
                 {stepStatus === 'processing' && (
                   <div className="flex items-center gap-2 mt-1 text-xs text-rose-600 animate-in fade-in duration-300">
                      {finalCountdown !== null ? (
                        <span className="font-bold">Oczekiwanie: {finalCountdown}s</span>
                      ) : (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Przetwarzanie...</span>
                        </>
                      )}
                   </div>
                 )}
               </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
           <span>CPU: Gemini 2.5 Flash</span>
           <span>RAM: Optimized</span>
        </div>
      </div>
    </div>
  );
};

export default TerminalLoader;
