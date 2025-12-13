"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { cn } from "../../lib/utils";

interface HeroHighlightProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  containerClassName?: string;
  dotColor?: string;
  dotColorHighlight?: string;
}

export function HeroHighlight({
  children,
  className,
  containerClassName,
  dotColor = "rgba(212, 165, 116, 0.15)",
  dotColorHighlight = "rgba(212, 165, 116, 0.5)",
}: HeroHighlightProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative overflow-hidden group",
        containerClassName
      )}
    >
      {/* Base dot pattern - dimmer */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
          backgroundSize: "16px 16px",
          backgroundPosition: "center center",
        }}
      />

      {/* Highlighted dot pattern - follows mouse with mask */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          backgroundImage: `radial-gradient(${dotColorHighlight} 1px, transparent 1px)`,
          backgroundSize: "16px 16px",
          backgroundPosition: "center center",
          maskImage: useMotionTemplate`
            radial-gradient(
              350px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              350px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
        }}
      />

      {/* Content */}
      <div className={cn("relative z-20 w-full", className)}>{children}</div>
    </div>
  );
}

// Highlight component for text
interface HighlightProps {
  children: React.ReactNode;
  className?: string;
}

export function Highlight({ children, className }: HighlightProps) {
  return (
    <motion.span
      initial={{ backgroundSize: "0% 100%" }}
      whileInView={{ backgroundSize: "100% 100%" }}
      transition={{
        duration: 1.5,
        ease: "easeOut",
        delay: 0.3,
      }}
      viewport={{ once: true }}
      style={{
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        display: "inline",
      }}
      className={cn(
        "relative inline-block pb-1 px-1 rounded-lg bg-gradient-to-r from-[#D4A574]/30 to-[#B8860B]/30",
        className
      )}
    >
      {children}
    </motion.span>
  );
}

export default HeroHighlight;
