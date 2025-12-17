"use client";
import React from 'react';
import { Loader2 } from 'lucide-react';
import { getTemplate } from '../../lib/pricelist-templates';
import type { FullPricelistDisplayProps } from './types';

/**
 * FullPricelistDisplay - Renders a pricelist using the user's selected template
 *
 * Features:
 * - Supports original and optimized variants with different styling
 * - Loading state overlay
 * - Uses dynamic template system
 */
const FullPricelistDisplay: React.FC<FullPricelistDisplayProps> = ({
  data,
  theme,
  templateId,
  label,
  variant,
  isLoading,
  showLabel = true,
}) => {
  const isOriginal = variant === 'original';
  const template = getTemplate(templateId);
  const TemplateComponent = template?.Component;

  return (
    <div className="relative">
      {showLabel && label && (
        <div className="mb-3 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isOriginal ? 'bg-slate-400' : 'bg-[#D4A574]'}`}
          />
          <span className={`text-sm font-semibold ${isOriginal ? 'text-slate-500' : 'text-[#D4A574]'}`}>
            {label}
          </span>
        </div>
      )}

      <div className={`relative rounded-2xl border overflow-hidden ${isOriginal ? 'bg-slate-50/50 border-slate-200' : 'bg-white border-[#D4A574]/30 shadow-lg shadow-[#D4A574]/5'}`}>
        {isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-[#D4A574] animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">AI optymalizuje cennik...</p>
              <p className="text-xs text-slate-500 mt-1">To może potrwać chwilę</p>
            </div>
          </div>
        ) : null}

        <div className={isLoading ? 'opacity-20' : ''}>
          {TemplateComponent ? (
            <TemplateComponent
              data={data}
              theme={theme}
              editMode={false}
            />
          ) : (
            <div className="p-8 text-center text-slate-500">
              Nie można załadować szablonu
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullPricelistDisplay;
