"use client"

import React from "react"
import { cn } from "../../lib/utils"

interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "default" | "white"
}

const RainbowButton = React.forwardRef<HTMLButtonElement, RainbowButtonProps>(
  ({ className, children, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group relative cursor-pointer animate-rainbow",
          "inline-flex items-center justify-center gap-2 shrink-0",
          "rounded-xl outline-none focus-visible:ring-[3px]",
          "text-base font-semibold whitespace-nowrap",
          "disabled:pointer-events-none disabled:opacity-50",
          "[&_svg]:pointer-events-none [&_svg]:shrink-0",
          // Size
          "h-12 px-8 py-3",
          // Common rainbow border setup
          "border-0 bg-[length:200%]",
          "[background-clip:padding-box,border-box,border-box]",
          "[background-origin:border-box]",
          "[border:calc(0.125rem)_solid_transparent]",
          // Variant-specific styles
          variant === "white"
            ? [
                // White background with aurora-colored border
                "bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(#ffffff_50%,rgba(255,255,255,0.6)_80%,rgba(255,255,255,0)),linear-gradient(90deg,#D4A574,#E8C4A0,#C9956C,#B8860B,#D4A574)]",
                "text-slate-900",
                // Aurora-colored glow for white variant
                "before:bg-[linear-gradient(90deg,#D4A574,#E8C4A0,#C9956C,#B8860B,#D4A574)]",
              ]
            : [
                // Golden background version (default)
                "bg-[linear-gradient(#cf8335,#96653f),linear-gradient(#cb751b_50%,rgba(212,165,116,0.6)_80%,rgba(201,149,108,0)),linear-gradient(90deg,hsl(var(--color-1)),hsl(45deg_61.69%_11.48%),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]",
                "text-white",
                // Default rainbow glow
                "before:bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]",
              ],
          // Glow effect base styles
          "before:absolute before:bottom-[-20%] before:left-1/2 before:z-0",
          "before:h-1/5 before:w-3/5 before:-translate-x-1/2",
          "before:animate-rainbow before:bg-[length:200%]",
          "before:[filter:blur(calc(0.8*1rem))]",
          // Hover/Active states
          "transition-transform duration-300 ease-in-out",
          "hover:scale-105 active:scale-95",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

RainbowButton.displayName = "RainbowButton"

export { RainbowButton, type RainbowButtonProps }
