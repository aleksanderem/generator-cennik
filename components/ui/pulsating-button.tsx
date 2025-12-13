import React from "react"
import { cn } from "../../lib/utils"

interface PulsatingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pulseColor?: string
  duration?: string
}

export const PulsatingButton = React.forwardRef<
  HTMLButtonElement,
  PulsatingButtonProps
>(
  (
    {
      className,
      children,
      pulseColor = "#D4A574",
      duration = "1.5s",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative flex cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-center font-medium",
          className
        )}
        style={
          {
            "--pulse-color": pulseColor,
            "--duration": duration,
          } as React.CSSProperties
        }
        {...props}
      >
        <div className="relative z-10">{children}</div>
        <div
          className="absolute top-1/2 left-1/2 size-full -translate-x-1/2 -translate-y-1/2 rounded-lg animate-pulse"
          style={{ backgroundColor: pulseColor, opacity: 0.3 }}
        />
      </button>
    )
  }
)

PulsatingButton.displayName = "PulsatingButton"
