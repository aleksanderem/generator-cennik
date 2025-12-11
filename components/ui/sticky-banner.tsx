"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface StickyBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
  closable?: boolean;
}

export function StickyBanner({
  children,
  className,
  onClose,
  closable = true,
  ...props
}: StickyBannerProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "sticky top-0 z-50 flex items-center justify-center gap-3 px-4 py-3 text-sm",
        "bg-gradient-to-r from-[#171717] via-[#2a2a2a] to-[#171717]",
        "border-b border-[#D4A574]/30",
        className
      )}
      {...props}
    >
      {/* Golden glow effect - radiates upward from bottom */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[150px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center bottom, rgba(212,165,116,0.35) 0%, rgba(212,165,116,0.15) 30%, transparent 70%)',
        }}
      />

      {/* Subtle horizontal shine */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4A574]/5 to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-center gap-2 text-center">
        {children}
      </div>

      {closable && (
        <button
          onClick={handleClose}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Zamknij baner"
        >
          <X className="w-4 h-4 text-white/70 hover:text-white" />
        </button>
      )}
    </div>
  );
}
