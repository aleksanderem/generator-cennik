import React, { useState, useCallback } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  FloatingPortal,
} from '@floating-ui/react';
import { ColorZone as ColorZoneType } from '../types';
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
 * - Hover highlight in edit mode (only when directly hovered, not children)
 * - Click handler to open color picker
 * - Tooltip showing the color name (using Floating UI for reliable positioning)
 *
 * Inner ColorZones have priority - clicking/hovering them won't trigger parent ColorZone
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

  // Floating UI setup - simple positioning only
  const { refs, floatingStyles } = useFloating({
    open: isHovered,
    placement: 'top',
    middleware: [
      offset(10),
      flip({ fallbackPlacements: ['bottom', 'left', 'right'] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const handleMouseOver = useCallback((e: React.MouseEvent) => {
    // Check if we're hovering over a nested ColorZone
    const target = e.target as HTMLElement;
    const closestZone = target.closest('[data-color-zone]');

    // Only show if this is the innermost zone being hovered
    if (closestZone && closestZone.getAttribute('data-color-zone') === zone.id) {
      setIsHovered(true);
    } else if (!closestZone) {
      setIsHovered(true);
    } else {
      setIsHovered(false);
    }
  }, [zone.id]);

  const handleMouseOut = useCallback((e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;

    // Check if mouse is leaving to outside our zone entirely
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setIsHovered(false);
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const closestZone = target.closest('[data-color-zone]');

    // Only handle if this is the clicked zone
    if (closestZone && closestZone.getAttribute('data-color-zone') === zone.id) {
      e.stopPropagation();
      onClick?.(zone);
    }
  }, [onClick, zone]);

  if (!editMode) {
    return <>{children}</>;
  }

  const currentColor = theme[zone.themeKey] as string;
  const showHighlight = isHovered || isActive;

  return (
    <>
      <div
        ref={refs.setReference}
        data-color-zone={zone.id}
        className={`relative ${className}`}
        style={{ ...style, cursor: 'pointer' }}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onClick={handleClick}
      >
        {children}

        {/* Hover overlay */}
        {showHighlight && (
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-150"
            style={{
              outline: `2px dashed ${isActive ? '#2563EB' : '#94A3B8'}`,
              outlineOffset: '2px',
              backgroundColor: isActive ? 'rgba(37, 99, 235, 0.05)' : 'rgba(148, 163, 184, 0.05)',
              borderRadius: '4px',
              zIndex: 1,
            }}
          />
        )}
      </div>

      {/* Tooltip - rendered via Portal to escape overflow containers */}
      <FloatingPortal>
        {isHovered && (
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, zIndex: 9999 }}
            className="pointer-events-none"
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
          </div>
        )}
      </FloatingPortal>
    </>
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

  const { refs, floatingStyles } = useFloating({
    open: isHovered,
    placement: 'top',
    middleware: [
      offset(8),
      flip({ fallbackPlacements: ['bottom', 'left', 'right'] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const currentColor = theme[zone.themeKey] as string;

  const handleMouseOver = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const closestZone = target.closest('[data-color-zone]');

    if (closestZone && closestZone.getAttribute('data-color-zone') === zone.id) {
      setIsHovered(true);
    } else if (!closestZone) {
      setIsHovered(true);
    } else {
      setIsHovered(false);
    }
  }, [zone.id]);

  const handleMouseOut = useCallback((e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;

    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setIsHovered(false);
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const closestZone = target.closest('[data-color-zone]');

    if (closestZone && closestZone.getAttribute('data-color-zone') === zone.id) {
      e.stopPropagation();
      onClick?.(zone);
    }
  }, [onClick, zone]);

  const showHighlight = isHovered || isActive;

  const editStyles: React.CSSProperties = editMode ? {
    cursor: 'pointer',
    position: 'relative',
    outline: showHighlight ? `2px dashed ${isActive ? '#2563EB' : '#94A3B8'}` : 'none',
    outlineOffset: '2px',
    borderRadius: '2px',
  } : {};

  return (
    <>
      <Component
        ref={refs.setReference}
        data-color-zone={zone.id}
        className={className}
        style={{ ...style, ...editStyles }}
        onMouseOver={editMode ? handleMouseOver : undefined}
        onMouseOut={editMode ? handleMouseOut : undefined}
        onClick={editMode ? handleClick : undefined}
      >
        {children}
      </Component>

      {/* Tooltip via Portal */}
      <FloatingPortal>
        {editMode && isHovered && (
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, zIndex: 9999 }}
            className="pointer-events-none"
          >
            <div className="bg-slate-900 text-white text-xs px-2 py-1.5 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded border border-white/20"
                style={{ backgroundColor: currentColor }}
              />
              <span>{zone.label}</span>
            </div>
          </div>
        )}
      </FloatingPortal>
    </>
  );
};

export default ColorZone;
