import React, { useState } from 'react';
import { ColorZone as ColorZoneType, ThemeConfigKey } from '../types';
import { ThemeConfig } from '../../../types';

interface ColorZoneProps {
  zone: ColorZoneType;
  theme: ThemeConfig;
  editMode?: boolean;
  isActive?: boolean;
  onClick?: (zone: ColorZoneType) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ColorZone wraps any element and adds:
 * - Hover highlight in edit mode
 * - Click handler to open color picker
 * - Tooltip showing the color name
 */
export const ColorZone: React.FC<ColorZoneProps> = ({
  zone,
  theme,
  editMode = false,
  isActive = false,
  onClick,
  children,
  className = '',
  style = {},
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!editMode) {
    return <>{children}</>;
  }

  const currentColor = theme[zone.themeKey] as string;

  return (
    <div
      className={`relative ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(zone);
      }}
    >
      {/* The actual content */}
      {children}

      {/* Hover overlay */}
      {(isHovered || isActive) && (
        <div
          className="absolute inset-0 cursor-pointer transition-all duration-150"
          style={{
            outline: `2px dashed ${isActive ? '#2563EB' : '#94A3B8'}`,
            outlineOffset: '2px',
            backgroundColor: isActive ? 'rgba(37, 99, 235, 0.05)' : 'rgba(148, 163, 184, 0.05)',
            borderRadius: '4px',
          }}
        />
      )}

      {/* Tooltip */}
      {isHovered && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
          }}
        >
          <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-white/20"
              style={{ backgroundColor: currentColor }}
            />
            <span>{zone.label}</span>
            <span className="text-slate-400 font-mono text-[10px] uppercase">
              {currentColor}
            </span>
          </div>
          {/* Arrow */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: '100%',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #0F172A',
            }}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// INLINE COLOR ZONE
// For text elements where we can't wrap in a div
// ============================================================================

interface InlineColorZoneProps {
  zone: ColorZoneType;
  theme: ThemeConfig;
  editMode?: boolean;
  isActive?: boolean;
  onClick?: (zone: ColorZoneType) => void;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const InlineColorZone: React.FC<InlineColorZoneProps> = ({
  zone,
  theme,
  editMode = false,
  isActive = false,
  onClick,
  as: Component = 'span',
  children,
  className = '',
  style = {},
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const currentColor = theme[zone.themeKey] as string;

  const editStyles: React.CSSProperties = editMode ? {
    cursor: 'pointer',
    position: 'relative',
    outline: (isHovered || isActive) ? `2px dashed ${isActive ? '#2563EB' : '#94A3B8'}` : 'none',
    outlineOffset: '2px',
    borderRadius: '2px',
  } : {};

  return (
    <Component
      className={className}
      style={{ ...style, ...editStyles }}
      onMouseEnter={editMode ? () => setIsHovered(true) : undefined}
      onMouseLeave={editMode ? () => setIsHovered(false) : undefined}
      onClick={editMode ? (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick?.(zone);
      } : undefined}
    >
      {children}

      {/* Inline tooltip */}
      {editMode && isHovered && (
        <span
          className="absolute z-50 pointer-events-none"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
          }}
        >
          <span className="bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded border border-white/20 inline-block"
              style={{ backgroundColor: currentColor }}
            />
            <span>{zone.label}</span>
          </span>
        </span>
      )}
    </Component>
  );
};

export default ColorZone;
