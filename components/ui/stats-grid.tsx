"use client";
import { cn } from "../../lib/utils";
import { IconSearch, IconPhoto, IconSparkles, IconClock, IconEye, IconMoodSad } from "@tabler/icons-react";
import React, { useState, useRef } from "react";

interface StatsGridProps {
  className?: string;
}

export function StatsGrid({ className }: StatsGridProps) {
  const items = [
    {
      area: "md:[grid-area:1/1/2/5]",
      icon: IconSearch,
      title: "73%",
      description: "Klientów rezygnuje, kiedy cennik jest niejasny lub nieczytelny.",
    },
    {
      area: "md:[grid-area:1/5/2/9]",
      icon: IconPhoto,
      title: "255%",
      description: "Rekordowy wzrost rezerwacji po wdrożeniu zmian z audytu. Średnio salony notują około 50% więcej.",
    },
    {
      area: "md:[grid-area:1/9/2/13]",
      icon: IconSparkles,
      title: "90%",
      description: "Tylko 1 salon na 10, który audytowaliśmy miał prawidłowo prowadzony profil!",
    },
    {
      area: "md:[grid-area:2/1/3/5]",
      icon: IconClock,
      title: "8s",
      description: "Tyle sekund klientka poświęca na ocenę Twojego profilu przed decyzją o rezerwacji.",
    },
    {
      area: "md:[grid-area:2/5/3/9]",
      icon: IconEye,
      title: "3 na 4",
      description: "Audytowane salony mają źle sformatowany cennik, który odstrasza potencjalne klientki.",
    },
    {
      area: "md:[grid-area:2/9/3/13]",
      icon: IconMoodSad,
      title: "1 na 3",
      description: "Audytowane salony nie mają żadnych opisów przy usługach - klientki nie wiedzą, co kupują.",
    },
  ];

  return (
    <div className={cn("py-16", className)}>
      <ul className="mx-auto max-w-7xl grid grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-2 px-4">
        {items.map((item, index) => (
          <GridItem
            key={index}
            area={item.area}
            icon={<item.icon className="h-5 w-5 text-[#D4A574]" />}
            title={item.title}
            description={item.description}
          />
        ))}
      </ul>
    </div>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <li className={cn("min-h-[12rem] list-none", area)}>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative h-full rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden"
      >
        {/* Glow effect - pod contentem */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity,
            background: `radial-gradient(360px circle at ${position.x}px ${position.y}px, rgba(212, 165, 116, 0.4), transparent 40%)`,
          }}
        />
        <div
          className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity,
            background: `radial-gradient(540px circle at ${position.x}px ${position.y}px, rgba(212, 165, 116, 0.15), transparent 40%)`,
          }}
        />
        {/* Content - nad glowem */}
        <div className="relative z-10 flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-slate-200 bg-slate-50 p-2.5 transition-colors group-hover:border-[#D4A574]/30 group-hover:bg-[#D4A574]/5">
              {icon}
            </div>
            <div className="space-y-2">
              <h3 className="font-sans text-3xl font-bold tracking-tight text-slate-800">
                {title}
              </h3>
              <p className="font-sans text-sm text-slate-600 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
