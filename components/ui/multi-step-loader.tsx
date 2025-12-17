"use client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { TextGenerateEffect } from "./text-generate-effect";
import { EvervaultBackground } from "./evervault-card";

export interface LoadingState {
  text: string;
}

interface MultiStepLoaderProps {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
  value?: number;
}

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Check className="w-4 h-4 text-white" strokeWidth={3} />
    </div>
  );
};

const LoaderCore = ({
  loadingStates,
  value = 0,
}: {
  loadingStates: LoadingState[];
  value?: number;
}) => {
  return (
    <div className="flex flex-col items-start justify-start w-full">
      {loadingStates.map((loadingState, index) => {
        const isActive = index === value;
        const isCompleted = index < value;

        return (
          <motion.div
            key={index}
            className={cn(
              "flex items-center gap-4 py-2.5 w-full transition-all duration-300",
              isActive && "scale-[1.02]",
            )}
            initial={{ opacity: 0, x: -10 }}
            animate={{
              opacity: isCompleted || isActive ? 1 : 0.4,
              x: 0,
            }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {/* Step indicator */}
            <div className="flex-shrink-0">
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm"
                >
                  <CheckIcon />
                </motion.div>
              ) : isActive ? (
                <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
                  <motion.div
                    className="w-2.5 h-2.5 rounded-full bg-white"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                  <span className="text-xs font-medium text-slate-400">{index + 1}</span>
                </div>
              )}
            </div>

            {/* Text */}
            <span
              className={cn(
                "text-sm font-medium transition-colors duration-300",
                isActive && "text-amber-700",
                isCompleted && "text-emerald-700",
                !isActive && !isCompleted && "text-slate-400"
              )}
            >
              {loadingState.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export const MultiStepLoader = ({
  loadingStates,
  loading,
  duration = 2000,
  loop = false,
  value: controlledValue,
}: MultiStepLoaderProps) => {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setCurrentState(controlledValue);
      return;
    }

    if (!loading) {
      setCurrentState(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentState((prev) => {
        if (prev === loadingStates.length - 1) {
          return loop ? 0 : prev;
        }
        return prev + 1;
      });
    }, duration);

    return () => clearInterval(interval);
  }, [loading, duration, loop, loadingStates.length, controlledValue]);

  const currentText = loadingStates[currentState]?.text || "Przetwarzanie...";

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          {/* Evervault background effect */}
          <EvervaultBackground />

          {/* Card - matching project style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 max-w-md w-full mx-4 overflow-hidden"
          >
            {/* Header with emblem */}
            <div className="text-center mb-6">
              <motion.div
                className="w-16 h-16 mx-auto mb-4"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src="/emblem.png"
                  alt="Beauty Audit"
                  className="w-full h-full object-contain"
                />
              </motion.div>

              {/* Animated title */}
              <TextGenerateEffect
                words="Optymalizacja w toku"
                className="text-xl font-semibold text-slate-800"
                duration={0.3}
              />
              <p className="text-sm text-slate-500 mt-1">AI pracuje nad Twoim cennikiem</p>
            </div>

            {/* Steps */}
            <div className="bg-slate-50/50 rounded-2xl p-4 mb-6">
              <LoaderCore loadingStates={loadingStates} value={currentState} />
            </div>

            {/* Progress bar */}
            <div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${((currentState + 1) / loadingStates.length) * 100}%`
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-center text-xs text-slate-400 mt-2">
                Krok {currentState + 1} z {loadingStates.length}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
