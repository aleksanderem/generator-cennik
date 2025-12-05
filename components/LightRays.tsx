import React from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function LightRays({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute -top-40 left-1/2 -z-10 flex -translate-x-1/2 justify-center opacity-40",
        className
      )}
      {...props}
    >
      <div className="relative flex h-[800px] w-[800px] items-center justify-center">
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full bg-rose-500/10 blur-[100px]" />
        
        {/* Rotating Rays 1 */}
        <div className="absolute inset-0 animate-spin-slow">
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_60deg,#e11d48_90deg,transparent_120deg,transparent_180deg,transparent_240deg,#fda4af_270deg,transparent_300deg,transparent_360deg)] opacity-20 blur-[60px]" />
        </div>

        {/* Rotating Rays 2 (Reverse) */}
        <div className="absolute inset-0 animate-spin-reverse-slow">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg,transparent_0deg,transparent_60deg,#fff1f2_90deg,transparent_120deg,transparent_180deg,transparent_240deg,#fb7185_270deg,transparent_300deg,transparent_360deg)] opacity-20 blur-[60px]" />
        </div>
      </div>
    </div>
  );
}