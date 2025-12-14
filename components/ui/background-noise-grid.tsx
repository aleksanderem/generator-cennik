"use client";
import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

const GOOGLE_COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335'];

export const BackgroundNoiseGrid = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="relative w-full overflow-hidden bg-white">
      <Background />
      {/* pointer-events-none on wrapper, pointer-events-auto on interactive children */}
      <div className="relative z-10 pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto [&_[role='button']]:pointer-events-auto">
        {children}
      </div>
    </div>
  );
};

const Background = () => {
  const [strips, setStrips] = useState<number[]>([]);
  const stripWidth = 80;

  useEffect(() => {
    const calculateStrips = () => {
      const viewportWidth = window.innerWidth;
      const numberOfStrips = Math.ceil(viewportWidth / stripWidth);
      setStrips(Array.from({ length: numberOfStrips }, (_, i) => i));
    };
    calculateStrips();
    window.addEventListener("resize", calculateStrips);
    return () => window.removeEventListener("resize", calculateStrips);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 z-0 [mask-image:radial-gradient(circle_at_center,white_0%,white_30%,transparent_70%)]"
    >
      <Noise />
      {/* Strips container with individual hover effects */}
      <div className="absolute inset-0 flex">
        {strips.map((index) => (
          <Strip key={index} index={index} />
        ))}
      </div>
    </motion.div>
  );
};

const Strip = ({ index }: { index: number }) => {
  const color = GOOGLE_COLORS[index % 4];

  return (
    <div
      className="group relative h-full w-20 shrink-0 bg-gradient-to-r from-neutral-100 to-white shadow-[2px_0px_0px_0px_rgba(163,163,163,0.4)]"
    >
      {/* Hover glow - full height, hidden in center, visible on edges */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-500 group-hover:delay-0 [mask-image:radial-gradient(circle_at_center,transparent_0%,transparent_50%,white_80%)]"
        style={{
          background: `linear-gradient(to bottom, ${color}20 0%, ${color}40 50%, ${color}20 100%)`,
        }}
      />
    </div>
  );
};

const Noise = () => {
  return (
    <div
      className="absolute inset-0 h-full w-full scale-[1.2] transform opacity-[0.05] [mask-image:radial-gradient(#fff,transparent,75%)]"
      style={{
        backgroundImage: "url(/noise.webp)",
        backgroundSize: "20%",
      }}
    />
  );
};
