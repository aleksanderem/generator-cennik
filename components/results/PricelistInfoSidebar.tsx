"use client";
import React from 'react';
import { FileText, Download, Loader2, RefreshCw } from 'lucide-react';
import EmbedCode from '../EmbedCode';
import type { PricelistInfoSidebarProps } from './types';
import type { Id } from '../../convex/_generated/dataModel';

/**
 * PricelistInfoSidebar - Sidebar card showing pricelist metadata and actions
 *
 * Features:
 * - Pricelist type indicator (original/optimized)
 * - Name, date, ID, template info
 * - Theme colors preview
 * - PDF export button
 * - Optional embed code section
 * - Re-fetch from Booksy button for data recovery
 */
const PricelistInfoSidebar: React.FC<PricelistInfoSidebarProps> = ({
  pricingData,
  themeConfig,
  templateId,
  variant,
  pricelistId,
  onExportPDF,
  isExportingPDF,
  showEmbedCode = true,
  showRefetchButton = false,
  onRefetchFromBooksy,
  isRefetching = false,
}) => {
  const isOriginal = variant === 'original';

  return (
    <div className="sticky top-24 space-y-4">
      {/* Pricelist Info Card */}
      <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
        <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
        <div className="relative z-10 overflow-hidden rounded-xl bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">Informacje o cenniku</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Typ</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isOriginal ? 'bg-slate-400' : 'bg-[#D4A574]'}`} />
                <span className={`font-medium ${isOriginal ? 'text-slate-600' : 'text-[#D4A574]'}`}>
                  {isOriginal ? 'Oryginalny' : 'Zoptymalizowany'}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Nazwa</span>
              <span className="font-medium text-slate-800 truncate max-w-[150px]">{pricingData.salonName || 'Cennik'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Data</span>
              <span className="font-medium text-slate-800">{new Date().toLocaleDateString('pl-PL')}</span>
            </div>
            {pricelistId && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">ID</span>
                <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{pricelistId.slice(-8)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Szablon</span>
              <span className="font-medium text-slate-800 capitalize">{templateId}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Kolorystyka</span>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: themeConfig.primaryColor }} />
                <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: themeConfig.secondaryColor }} />
              </div>
            </div>
            {onExportPDF && (
              <div className="pt-2 border-t border-slate-100 mt-2">
                <button
                  onClick={onExportPDF}
                  disabled={isExportingPDF}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isOriginal
                      ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
                      : 'text-white bg-[#D4A574] hover:bg-[#C9956C] border-transparent'
                  }`}
                >
                  {isExportingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Eksportowanie...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Pobierz PDF</span>
                    </>
                  )}
                </button>
              </div>
            )}
            {showRefetchButton && onRefetchFromBooksy && (
              <div className="pt-2 border-t border-slate-100 mt-2">
                <button
                  onClick={onRefetchFromBooksy}
                  disabled={isRefetching}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200"
                >
                  {isRefetching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Pobieranie...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Odśwież z Booksy</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-400 mt-1.5 text-center">
                  Pobierz dane ponownie ze źródła
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEmbedCode && pricelistId && (
        <EmbedCode pricelistId={pricelistId as Id<"pricelists">} />
      )}
    </div>
  );
};

export default PricelistInfoSidebar;
