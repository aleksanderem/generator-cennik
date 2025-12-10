"use client";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { cn } from "../../lib/utils";

interface BackgroundRippleEffectProps {
  rows?: number;
  cols?: number;
  cellSize?: number;
  className?: string;
}

export const BackgroundRippleEffect = ({
  rows = 12,
  cols = 30,
  cellSize = 48,
  className,
}: BackgroundRippleEffectProps) => {
  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const handleCellClick = useCallback((row: number, col: number) => {
    setClickedCell({ row, col });
    setRippleKey((k) => k + 1);
  }, []);

  const handleCellHover = useCallback((row: number, col: number) => {
    setHoveredCell({ row, col });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  // Auto-trigger ripple effect periodically for visual interest
  useEffect(() => {
    const interval = setInterval(() => {
      const randomRow = Math.floor(Math.random() * rows);
      const randomCol = Math.floor(Math.random() * cols);
      setClickedCell({ row: randomRow, col: randomCol });
      setRippleKey((k) => k + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [rows, cols]);

  return (
    <div
      className={cn(
        "absolute inset-0 h-full w-full overflow-hidden",
        className
      )}
      onMouseLeave={handleMouseLeave}
    >
      {/* Gradient overlay for fade effect */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-white/90" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-transparent via-transparent to-white/60" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-white to-transparent" />

      <DivGrid
        key={`grid-${rippleKey}`}
        rows={rows}
        cols={cols}
        cellSize={cellSize}
        clickedCell={clickedCell}
        hoveredCell={hoveredCell}
        onCellClick={handleCellClick}
        onCellHover={handleCellHover}
      />
    </div>
  );
};

interface DivGridProps {
  rows: number;
  cols: number;
  cellSize: number;
  clickedCell: { row: number; col: number } | null;
  hoveredCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
  onCellHover: (row: number, col: number) => void;
}

const DivGrid = ({
  rows,
  cols,
  cellSize,
  clickedCell,
  hoveredCell,
  onCellClick,
  onCellHover,
}: DivGridProps) => {
  const cells = useMemo(
    () => Array.from({ length: rows * cols }, (_, idx) => idx),
    [rows, cols]
  );

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    width: cols * cellSize,
    height: rows * cellSize,
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
  };

  return (
    <div style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;

        // Distance from clicked cell for ripple
        const clickDistance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : null;

        // Distance from hovered cell for glow
        const hoverDistance = hoveredCell
          ? Math.hypot(hoveredCell.row - rowIdx, hoveredCell.col - colIdx)
          : null;

        const delay = clickDistance !== null ? Math.max(0, clickDistance * 40) : 0;
        const duration = 300 + (clickDistance ?? 0) * 60;

        // Hover glow intensity (closer = brighter)
        const hoverIntensity = hoverDistance !== null && hoverDistance < 4
          ? 1 - (hoverDistance / 4)
          : 0;

        const style: React.CSSProperties & { [key: string]: string } = {
          "--delay": `${delay}ms`,
          "--duration": `${duration}ms`,
          "--hover-intensity": `${hoverIntensity}`,
        };

        return (
          <div
            key={idx}
            className={cn(
              "relative border border-[#722F37]/10 transition-all duration-200 cursor-pointer",
              "hover:border-[#722F37]/30",
              clickedCell && "animate-cell-ripple"
            )}
            style={{
              backgroundColor: hoverIntensity > 0
                ? `rgba(114, 47, 55, ${0.03 + hoverIntensity * 0.08})`
                : "rgba(114, 47, 55, 0.02)",
              boxShadow: hoverIntensity > 0.3
                ? `inset 0 0 ${20 * hoverIntensity}px rgba(212, 175, 55, ${hoverIntensity * 0.15})`
                : "none",
              ...style,
            }}
            onClick={() => onCellClick(rowIdx, colIdx)}
            onMouseEnter={() => onCellHover(rowIdx, colIdx)}
          />
        );
      })}
    </div>
  );
};
