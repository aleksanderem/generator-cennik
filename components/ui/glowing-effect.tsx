"use client";

import { useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface GlowingEffectProps {
  spread?: number;
  glow?: boolean;
  disabled?: boolean;
  proximity?: number;
  inactiveZone?: number;
  className?: string;
}

export function GlowingEffect({
  spread = 40,
  glow = true,
  disabled = false,
  proximity = 64,
  inactiveZone = 0.01,
  className,
}: GlowingEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosition({ x, y });
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  if (disabled) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "pointer-events-auto absolute inset-0 rounded-[inherit] overflow-hidden",
        className
      )}
    >
      {/* Border glow */}
      <div
        className="absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(${spread * 2}px circle at ${position.x}px ${position.y}px, rgba(212, 165, 116, 0.4), transparent 40%)`,
        }}
      />
      {/* Inner glow */}
      {glow && (
        <div
          className="absolute inset-[1px] rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity,
            background: `radial-gradient(${spread * 3}px circle at ${position.x}px ${position.y}px, rgba(212, 165, 116, 0.15), transparent 40%)`,
          }}
        />
      )}
    </div>
  );
}
