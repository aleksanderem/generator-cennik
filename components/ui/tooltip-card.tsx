"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  containerClassName?: string;
  contentClassName?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  containerClassName,
  contentClassName,
  position = "top",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-t-[6px] border-x-[6px] border-x-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-b-[6px] border-x-[6px] border-x-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-l-[6px] border-y-[6px] border-y-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-r-[6px] border-y-[6px] border-y-transparent",
  };

  return (
    <span
      className={cn("relative inline-flex", containerClassName)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-[100] w-max max-w-xs",
              positionClasses[position]
            )}
          >
            <div
              className={cn(
                "rounded-lg bg-slate-800 px-3 py-2 text-sm text-white shadow-xl",
                contentClassName
              )}
            >
              {content}
            </div>
            <div className={cn("absolute w-0 h-0", arrowClasses[position])} />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

// Specialized info tooltip with question mark icon
interface InfoTooltipProps {
  content: React.ReactNode;
  className?: string;
  iconSize?: number;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  className,
  iconSize = 16,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span
        className="flex items-center justify-center rounded-full border border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-500 transition-colors cursor-help"
        style={{ width: iconSize + 4, height: iconSize + 4 }}
      >
        <svg
          width={iconSize - 4}
          height={iconSize - 4}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </span>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-[100] right-0 bottom-full mb-2 w-max max-w-[280px]"
          >
            <div className="rounded-xl bg-white border border-slate-200 shadow-xl p-3 text-sm text-slate-700">
              {content}
            </div>
            <div className="absolute right-2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};
