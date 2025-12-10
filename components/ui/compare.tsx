"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import { IconArrowNarrowRight } from "@tabler/icons-react";

interface CompareProps {
  firstContent: React.ReactNode;
  secondContent: React.ReactNode;
  className?: string;
  firstContentClassName?: string;
  secondContentClassName?: string;
  initialSliderPercentage?: number;
  slideMode?: "hover" | "drag";
  showHandlebar?: boolean;
  autoplay?: boolean;
  autoplayDuration?: number;
}

export const Compare = ({
  firstContent,
  secondContent,
  className,
  firstContentClassName,
  secondContentClassName,
  initialSliderPercentage = 50,
  slideMode = "hover",
  showHandlebar = true,
  autoplay = false,
  autoplayDuration = 5000,
}: CompareProps) => {
  const [sliderXPercent, setSliderXPercent] = useState(initialSliderPercentage);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!sliderRef.current) return;
      if (slideMode === "hover" || isDragging) {
        const rect = sliderRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = (x / rect.width) * 100;
        setSliderXPercent(Math.max(0, Math.min(100, percent)));
      }
    },
    [slideMode, isDragging]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!sliderRef.current || !isDragging) return;
      const touch = e.touches[0];
      const rect = sliderRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const percent = (x / rect.width) * 100;
      setSliderXPercent(Math.max(0, Math.min(100, percent)));
    },
    [isDragging]
  );

  useEffect(() => {
    if (autoplay) {
      autoplayRef.current = setInterval(() => {
        setSliderXPercent((prev) => {
          if (prev >= 95) return 5;
          return prev + 0.5;
        });
      }, autoplayDuration / 200);
    }
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [autoplay, autoplayDuration]);

  return (
    <div
      ref={sliderRef}
      className={cn("w-full h-full overflow-hidden relative", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => slideMode === "hover" && setSliderXPercent(initialSliderPercentage)}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
    >
      {/* First content (underneath) */}
      <div className={cn("absolute inset-0", firstContentClassName)}>
        {firstContent}
      </div>

      {/* Second content (overlaid with clip) */}
      <motion.div
        className={cn("absolute inset-0", secondContentClassName)}
        style={{
          clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)`,
        }}
      >
        {secondContent}
      </motion.div>

      {/* Slider handle */}
      {showHandlebar && (
        <motion.div
          className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#722F37] to-transparent cursor-ew-resize z-30"
          style={{
            left: `${sliderXPercent}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-[#722F37] flex items-center justify-center">
            <IconArrowNarrowRight className="w-4 h-4 text-[#722F37] rotate-180" />
            <IconArrowNarrowRight className="w-4 h-4 text-[#722F37] -ml-1" />
          </div>
        </motion.div>
      )}
    </div>
  );
};
