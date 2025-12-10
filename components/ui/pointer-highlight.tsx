"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

interface PointerHighlightProps {
  children: React.ReactNode;
  className?: string;
  rectangleClassName?: string;
  pointerClassName?: string;
  containerClassName?: string;
  highlightColor?: string;
  pointerColor?: string;
  animationDuration?: number;
  showPointer?: boolean;
  active?: boolean;
}

export const PointerHighlight = ({
  children,
  className,
  rectangleClassName,
  pointerClassName,
  containerClassName,
  highlightColor = "rgba(212, 175, 55, 0.25)",
  pointerColor = "#722F37",
  animationDuration = 0.4,
  showPointer = true,
  active = true,
}: PointerHighlightProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, [children]);

  // Auto-activate if active prop is true
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => setIsHovered(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsHovered(false);
    }
  }, [active]);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block", containerClassName)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !active && setIsHovered(false)}
    >
      {/* Highlight rectangle */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: animationDuration, ease: "easeOut" }}
            className={cn(
              "absolute inset-0 rounded-md pointer-events-none z-0",
              rectangleClassName
            )}
            style={{
              backgroundColor: highlightColor,
              boxShadow: `0 0 0 2px ${pointerColor}`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Pointer cursor */}
      <AnimatePresence>
        {isHovered && showPointer && (
          <motion.div
            initial={{ opacity: 0, x: -20, y: -20, scale: 0.5 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              duration: animationDuration * 0.8,
              ease: "easeOut",
              delay: animationDuration * 0.3
            }}
            className={cn(
              "absolute -top-2 -right-2 z-10 pointer-events-none",
              pointerClassName
            )}
          >
            {/* Cursor SVG */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-md"
            >
              <path
                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.53.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
                fill={pointerColor}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <span className={cn("relative z-[1]", className)}>{children}</span>
    </div>
  );
};

// Variant for highlighting larger areas (like tables)
interface PointerHighlightAreaProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  highlightColor?: string;
  borderColor?: string;
  showPointer?: boolean;
  pointerPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  animationDelay?: number;
}

export const PointerHighlightArea = ({
  children,
  className,
  active = false,
  highlightColor = "rgba(212, 175, 55, 0.15)",
  borderColor = "#722F37",
  showPointer = true,
  pointerPosition = "top-right",
  animationDelay = 0,
}: PointerHighlightAreaProps) => {
  const pointerPositions = {
    "top-right": "-top-1 -right-1",
    "top-left": "-top-1 -left-1 rotate-[-90deg]",
    "bottom-right": "-bottom-1 -right-1 rotate-90",
    "bottom-left": "-bottom-1 -left-1 rotate-180",
  };

  return (
    <div className={cn("relative", className)}>
      {/* Highlight overlay */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: animationDelay }}
            className="absolute inset-0 rounded-lg pointer-events-none z-10"
            style={{
              backgroundColor: highlightColor,
              boxShadow: `inset 0 0 0 2px ${borderColor}`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Pointer */}
      <AnimatePresence>
        {active && showPointer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3, delay: animationDelay + 0.2 }}
            className={cn(
              "absolute z-20 pointer-events-none",
              pointerPositions[pointerPosition]
            )}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-lg"
            >
              <path
                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.53.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
                fill={borderColor}
                stroke="white"
                strokeWidth="2"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
};
