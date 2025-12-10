"use client";

import React, { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/utils";

interface RippleProps extends ComponentPropsWithoutRef<"div"> {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 5, // Reduced from 8 for better performance
  className,
  ...props
}: RippleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 select-none [mask-image:linear-gradient(to_bottom,white,transparent)]",
        className
      )}
      {...props}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 90; // Increased spacing to compensate for fewer circles
        const opacity = mainCircleOpacity - i * 0.04;
        const animationDelay = `${i * 0.08}s`;
        const borderStyle = i === numCircles - 1 ? "dashed" : "solid";
        const borderOpacity = 5 + i * 7;

        return (
          <div
            key={i}
            className={cn(
              "absolute animate-ripple rounded-full border bg-[#722F37]/5",
              `[--i:${i}]`
            )}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity,
              animationDelay,
              borderStyle,
              borderWidth: "1px",
              borderColor: `rgba(114, 47, 55, ${borderOpacity / 100})`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) scale(1)",
              willChange: "transform, opacity", // GPU acceleration
            }}
          />
        );
      })}
    </div>
  );
});

Ripple.displayName = "Ripple";
