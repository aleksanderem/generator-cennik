"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { ThemeConfig, DEFAULT_THEME, PricingData } from '../../types';
import { TemplateEditor, SAMPLE_PRICING_DATA, getTemplate, generateEmbedHTML } from '../../lib/pricelist-templates';
import type { Id } from '../../convex/_generated/dataModel';
import { IconChevronDown, IconDotsVertical, IconHelp } from '@tabler/icons-react';
import { InfoTooltip } from '../ui/tooltip-card';
import {
  IconSettings,
  IconLogout,
  IconLoader2,
  IconFileText,
  IconClock,
  IconCircleCheck,
  IconAlertCircle,
  IconPlayerPlay,
  IconDownload,
  IconChevronRight,
  IconCreditCard,
  IconReceipt,
  IconBuilding,
  IconCheck,
  IconExternalLink,
  IconPalette,
  IconMapPin,
  IconPhone,
  IconLink,
  IconPhoto,
  IconEdit,
  IconColorSwatch,
  IconList,
  IconTrash,
  IconCode,
  IconEye,
  IconPlus,
  IconX,
  IconSparkles,
} from '@tabler/icons-react';

type Tab = 'pricelists' | 'audits' | 'payments' | 'invoices' | 'company' | 'salon';

// Type for pricelist from Convex
type Pricelist = {
  _id: Id<"pricelists">;
  _creationTime: number;
  userId: Id<"users">;
  name: string;
  source: "manual" | "booksy" | "audit";
  pricingDataJson: string;
  themeConfigJson?: string;
  templateId?: string;
  servicesCount?: number;
  categoriesCount?: number;
  isOptimized?: boolean;
  optimizedFromPricelistId?: Id<"pricelists">;
  optimizedVersionId?: Id<"pricelists">;
  purchaseId?: Id<"purchases">; // Powiązanie z zakupem (dla faktur)
  auditId?: Id<"audits">; // Powiązanie z audytem Booksy
  createdAt: number;
  updatedAt?: number;
};

// Props for the DataTable component
interface PricelistsDataTableProps {
  pricelists: Pricelist[];
  formatDate: (timestamp: number) => string;
  onPreview: (id: Id<"pricelists">) => void;
  onEdit: (id: Id<"pricelists">) => void;
  onCopyCode: (pricelist: { _id: Id<"pricelists">; pricingDataJson: string; themeConfigJson?: string }) => void;
  onOptimize: (id: Id<"pricelists">) => void;
  onDelete: (id: Id<"pricelists">) => Promise<void>;
  onViewResults: (id: Id<"pricelists">) => void;
  onGoToInvoices: () => void;
  onGoToAudits: () => void;
  onOpenStripePortal: () => void;
  editingPricelist: Id<"pricelists"> | null;
  copyingCode: Id<"pricelists"> | null;
  optimizingPricelist: Id<"pricelists"> | null;
}

// Accordion-style pricelist component
const PricelistsDataTable: React.FC<PricelistsDataTableProps> = ({
  pricelists,
  formatDate,
  onPreview,
  onEdit,
  onCopyCode,
  onOptimize,
  onDelete,
  onViewResults,
  onGoToInvoices,
  onGoToAudits,
  onOpenStripePortal,
  editingPricelist,
  copyingCode,
  optimizingPricelist,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group pricelists: OPTIMIZED versions on top, originals as expandable sub-rows
  const { mainPricelists, linkedMap } = useMemo(() => {
    const linked = new Map<string, Pricelist>();
    const main: Pricelist[] = [];
    const originalIds = new Set<string>();

    // First pass: identify originals that have optimized versions
    for (const p of pricelists) {
      if (p.isOptimized && p.optimizedFromPricelistId) {
        const original = pricelists.find(orig => orig._id === p.optimizedFromPricelistId);
        if (original) {
          originalIds.add(original._id);
          linked.set(p._id, original);
        }
      }
    }

    // Second pass: build main list (optimized first, then orphan originals)
    for (const p of pricelists) {
      if (p.isOptimized && linked.has(p._id)) {
        main.push(p);
      }
    }
    for (const p of pricelists) {
      if (!originalIds.has(p._id) && !p.isOptimized) {
        main.push(p);
      }
      if (p.isOptimized && !linked.has(p._id)) {
        main.push(p);
      }
    }

    return { mainPricelists: main, linkedMap: linked };
  }, [pricelists]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Source badge renderer
  const SourceBadge = ({ source, isOptimized, hasPendingOptimization }: { source: string; isOptimized?: boolean; hasPendingOptimization?: boolean }) => {
    if (isOptimized) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#D4A574]/20 text-[#996B3D]">
          <IconSparkles size={12} />
          AuditorAI®
        </span>
      );
    }
    // Paid for optimization but not yet optimized
    if (hasPendingOptimization) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <IconLoader2 size={12} className="animate-spin" />
          Oczekuje na optymalizację
        </span>
      );
    }
    const configs: Record<string, { label: string; className: string }> = {
      manual: { label: 'Wygenerowany', className: 'bg-slate-100 text-slate-600' },
      booksy: { label: 'Booksy', className: 'bg-[#722F37]/10 text-[#722F37]' },
      audit: { label: 'Audyt', className: 'bg-[#722F37]/10 text-[#722F37]' },
    };
    const config = configs[source] || configs.manual;
    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", config.className)}>
        {config.label}
      </span>
    );
  };


  // Action dropdown menu for a pricelist row
  const ActionDropdown = ({ pricelist, isNested = false }: { pricelist: Pricelist; isNested?: boolean }) => {
    const isOpen = openDropdownId === pricelist._id;

    const handleAction = (action: () => void) => {
      action();
      setOpenDropdownId(null);
    };

    return (
      <div className="relative" ref={isOpen ? dropdownRef : undefined}>
        <button
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            isOpen ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdownId(isOpen ? null : pricelist._id);
          }}
        >
          <IconDotsVertical size={18} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Preview */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={(e) => { e.stopPropagation(); handleAction(() => onPreview(pricelist._id)); }}
            >
              <IconEye size={16} className="text-slate-400" />
              Podgląd
            </button>

            {/* Edit */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              disabled={editingPricelist === pricelist._id}
              onClick={(e) => { e.stopPropagation(); handleAction(() => onEdit(pricelist._id)); }}
            >
              {editingPricelist === pricelist._id ? (
                <IconLoader2 size={16} className="text-slate-400 animate-spin" />
              ) : (
                <IconEdit size={16} className="text-slate-400" />
              )}
              Edytuj
            </button>

            {/* Copy code */}
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                copyingCode === pricelist._id
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-slate-700 hover:bg-slate-50"
              )}
              disabled={copyingCode === pricelist._id}
              onClick={(e) => { e.stopPropagation(); handleAction(() => onCopyCode(pricelist)); }}
            >
              {copyingCode === pricelist._id ? (
                <>
                  <IconCheck size={16} className="text-emerald-500" />
                  Skopiowano!
                </>
              ) : (
                <>
                  <IconCode size={16} className="text-slate-400" />
                  Kopiuj kod HTML
                </>
              )}
            </button>

            {/* Divider */}
            <div className="my-1 border-t border-slate-100" />

            {/* AI Optimize or View Results */}
            {pricelist.isOptimized ? (
              <button
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-[#996B3D] hover:bg-[#D4A574]/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); handleAction(() => onViewResults(pricelist._id)); }}
              >
                <IconSparkles size={16} className="text-[#D4A574] flex-shrink-0" />
                Zobacz wyniki AuditorAI®
              </button>
            ) : pricelist.purchaseId ? (
              // Paid but not yet optimized - continue optimization
              <button
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-amber-700 hover:bg-amber-50 transition-colors"
                onClick={(e) => { e.stopPropagation(); handleAction(() => onViewResults(pricelist._id)); }}
              >
                <IconSparkles size={16} className="text-amber-600 flex-shrink-0" />
                Kontynuuj optymalizację
              </button>
            ) : !pricelist.optimizedVersionId && !isNested && (
              <button
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-[#996B3D] hover:bg-[#D4A574]/10 transition-colors disabled:opacity-50"
                disabled={optimizingPricelist === pricelist._id}
                onClick={(e) => { e.stopPropagation(); handleAction(() => onOptimize(pricelist._id)); }}
              >
                {optimizingPricelist === pricelist._id ? (
                  <IconLoader2 size={16} className="text-[#D4A574] animate-spin flex-shrink-0" />
                ) : (
                  <IconSparkles size={16} className="text-[#D4A574] flex-shrink-0" />
                )}
                Optymalizuj AuditorAI®
              </button>
            )}

            {/* Divider */}
            <div className="my-1 border-t border-slate-100" />

            {/* Delete */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              onClick={(e) => { e.stopPropagation(); handleAction(() => onDelete(pricelist._id)); }}
            >
              <IconTrash size={16} />
              Usuń cennik
            </button>
          </div>
        )}
      </div>
    );
  };

  // Single pricelist row
  const PricelistRow = ({ pricelist, isNested = false }: { pricelist: Pricelist; isNested?: boolean }) => {
    const hasChild = linkedMap.has(pricelist._id);
    const hasLinks = !!(pricelist.purchaseId || pricelist.auditId);
    const isExpandable = hasChild || hasLinks;
    const isExpanded = expandedIds.has(pricelist._id);
    const linkedPricelist = linkedMap.get(pricelist._id);

    return (
      <div>
        <div
          className={cn(
            "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
            isExpandable && "cursor-pointer",
            isNested ? "bg-slate-50/50 hover:bg-slate-100/50" :
              isExpanded ? "bg-slate-50" : "hover:bg-slate-50"
          )}
          onClick={() => isExpandable && toggleExpand(pricelist._id)}
        >
          {/* Expand toggle */}
          <div className="w-5 flex-shrink-0">
            {isExpandable ? (
              <IconChevronDown
                size={16}
                className={cn(
                  "text-[#722F37] transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              />
            ) : (
              <div className="relative group/tooltip">
                <IconChevronDown
                  size={16}
                  className="text-slate-300 cursor-default"
                />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2 py-1 text-xs text-white bg-slate-800 rounded whitespace-nowrap opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-opacity duration-150 pointer-events-none z-50">
                  Brak powiązanych elementów
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800" />
                </div>
              </div>
            )}
          </div>

          {/* Icon */}
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            pricelist.isOptimized ? "bg-[#D4A574]/10" : "bg-slate-100"
          )}>
            {pricelist.isOptimized ? (
              <IconSparkles size={16} className="text-[#D4A574]" />
            ) : (
              <IconFileText size={16} className="text-slate-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "truncate text-sm",
                isNested ? "text-slate-600" : "font-medium text-slate-900"
              )}>
                {pricelist.name}
              </span>
              <SourceBadge
                source={pricelist.source}
                isOptimized={pricelist.isOptimized}
                hasPendingOptimization={!!pricelist.purchaseId && !pricelist.isOptimized}
              />
              {isNested && (
                <span className="text-xs text-slate-400">podstawowy</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span>{pricelist.categoriesCount || 0} kat. / {pricelist.servicesCount || 0} usł.</span>
              <span className="text-slate-300">•</span>
              <span>{formatDate(pricelist.createdAt)}</span>
            </div>
          </div>

          {/* Info tooltip */}
          <InfoTooltip
            content={
              pricelist.isOptimized ? (
                <div className="space-y-1.5">
                  <p className="font-medium text-slate-900">Lepszy cennik. Gotowy do sprzedaży.</p>
                  <p className="text-slate-600 text-xs">
                    Ten cennik został przeprojektowany przez AuditorAI®, aby był jaśniejszy, atrakcyjniejszy i skuteczniejszy.
                  </p>
                  <p className="text-[#996B3D] text-xs mt-2 font-medium">
                    Zobacz, co się zmieniło →
                  </p>
                </div>
              ) : isNested ? (
                <div className="space-y-1.5">
                  <p className="font-medium text-slate-900">Cennik bazowy</p>
                  <p className="text-slate-600 text-xs">
                    Uporządkowany. Czytelny. Gotowy na stronę.
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    Ta wersja została przygotowana przez aplikację i stanowi punkt wyjścia do dalszej optymalizacji AuditorAI®.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="font-medium text-slate-900">Cennik bazowy</p>
                  <p className="text-slate-600 text-xs">
                    Uporządkowany. Czytelny. Gotowy na stronę.
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    Ta wersja została przygotowana przez aplikację i stanowi punkt wyjścia do dalszej optymalizacji AuditorAI®.
                  </p>
                </div>
              )
            }
          />

          {/* Actions dropdown */}
          <ActionDropdown pricelist={pricelist} isNested={isNested} />
        </div>

        {/* Expanded content: original pricelist and linked items */}
        {isExpandable && isExpanded && (() => {
          // Collect all items to render
          const items: Array<{ type: 'pricelist' | 'invoice' | 'audit'; key: string }> = [];
          if (linkedPricelist) items.push({ type: 'pricelist', key: 'pricelist' });
          if (pricelist.purchaseId) items.push({ type: 'invoice', key: 'invoice' });
          if (pricelist.auditId) items.push({ type: 'audit', key: 'audit' });

          return (
            <div className="ml-12 mb-2">
              {/* Header */}
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-2 pl-8 pt-3">
                Powiązane elementy
              </div>

              {/* Tree structure */}
              <div className="relative pl-4">
                {/* Continuous vertical line - starts from near parent, ends at last branch */}
                <div className="absolute left-0 -top-9 bottom-[25px] w-px bg-slate-200" />

                {/* Items */}
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.key} className="relative">
                      {/* Horizontal branch from vertical line */}
                      <div className="absolute -left-4 top-[30px] w-4 h-px bg-slate-200" />

                      {/* Item content */}
                      {item.type === 'pricelist' && linkedPricelist && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50/80">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <IconFileText size={16} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-600 text-sm">{linkedPricelist.name}</span>
                              <SourceBadge source={linkedPricelist.source} />
                              <span className="text-xs text-slate-400">podstawowy</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              <span>{linkedPricelist.categoriesCount || 0} kat. / {linkedPricelist.servicesCount || 0} usł.</span>
                              <span className="text-slate-300">•</span>
                              <span>{formatDate(linkedPricelist.createdAt)}</span>
                            </div>
                          </div>
                          <InfoTooltip
                            content={
                              <div className="space-y-1.5">
                                <p className="font-medium text-slate-900">Cennik bazowy</p>
                                <p className="text-slate-600 text-xs">
                                  Uporządkowany. Czytelny. Gotowy na stronę.
                                </p>
                                <p className="text-slate-500 text-xs mt-2">
                                  Ta wersja została przygotowana przez aplikację i stanowi punkt wyjścia do dalszej optymalizacji AuditorAI®.
                                </p>
                              </div>
                            }
                          />
                          <ActionDropdown pricelist={linkedPricelist} isNested={true} />
                        </div>
                      )}

                      {item.type === 'invoice' && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50/80">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <IconReceipt size={16} className="text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-900 text-sm">Faktura VAT</span>
                              <span className="text-xs text-slate-500">NR FV/...</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                opłacona
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              <span>Płatność kartą</span>
                              <span className="text-slate-300">•</span>
                              <span>{formatDate(pricelist.createdAt)}</span>
                            </div>
                          </div>
                          <InfoTooltip
                            content={
                              <div className="space-y-1.5">
                                <p className="font-medium text-slate-900">Faktura VAT</p>
                                <p className="text-slate-600 text-xs">
                                  Dokument rozliczeniowy za usługę AuditorAI®.
                                </p>
                                <p className="text-slate-500 text-xs mt-2">
                                  Zobacz w „Faktury".
                                </p>
                              </div>
                            }
                          />
                          {/* Invoice actions dropdown */}
                          <div className="relative" ref={openDropdownId === `invoice-${pricelist._id}` ? dropdownRef : undefined}>
                            <button
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                openDropdownId === `invoice-${pricelist._id}` ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === `invoice-${pricelist._id}` ? null : `invoice-${pricelist._id}`);
                              }}
                            >
                              <IconDotsVertical size={18} />
                            </button>
                            {openDropdownId === `invoice-${pricelist._id}` && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                <button
                                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onGoToInvoices();
                                    setOpenDropdownId(null);
                                  }}
                                >
                                  <IconReceipt size={16} className="text-slate-400" />
                                  Zobacz faktury
                                </button>
                                <button
                                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenStripePortal();
                                    setOpenDropdownId(null);
                                  }}
                                >
                                  <IconExternalLink size={16} className="text-slate-400" />
                                  Otwórz portal płatności
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {item.type === 'audit' && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50/80">
                          <div className="w-8 h-8 rounded-lg bg-[#722F37]/10 flex items-center justify-center flex-shrink-0">
                            <IconFileText size={16} className="text-[#722F37]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-900 text-sm">Audyt Booksy</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                <IconCircleCheck size={10} />
                                zakończony
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              <span>Profil Booksy</span>
                              <span className="text-slate-300">•</span>
                              <span>{formatDate(pricelist.createdAt)}</span>
                            </div>
                          </div>
                          <InfoTooltip
                            content={
                              <div className="space-y-1.5">
                                <p className="font-medium text-slate-900">Audyt profilu Booksy</p>
                                <p className="text-slate-600 text-xs">
                                  Analiza AuditorAI® Twojego profilu Booksy, z którego pobrano dane do tego cennika.
                                </p>
                                <p className="text-slate-500 text-xs mt-2">
                                  Szczegóły audytu i raport PDF znajdziesz w zakładce „Audyty".
                                </p>
                              </div>
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  if (mainPricelists.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        Brak cenników
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: '11px' }}>
      {mainPricelists.map((pricelist) => (
        <PricelistRow key={pricelist._id} pricelist={pricelist} />
      ))}
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('pricelists');
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companySaving, setCompanySaving] = useState(false);

  // Modal podglądu cennika
  const [previewPricelist, setPreviewPricelist] = useState<{
    _id: Id<"pricelists">;
    name: string;
    pricingDataJson: string;
    themeConfigJson?: string;
    templateId?: string;
  } | null>(null);

  // Stan akcji
  const [copyingCode, setCopyingCode] = useState<Id<"pricelists"> | null>(null);
  const [editingPricelist, setEditingPricelist] = useState<Id<"pricelists"> | null>(null);

  // Audit expand/collapse state
  const [expandedAuditIds, setExpandedAuditIds] = useState<Set<string>>(new Set());
  const [openAuditDropdownId, setOpenAuditDropdownId] = useState<string | null>(null);
  const [openLinkedItemDropdownId, setOpenLinkedItemDropdownId] = useState<string | null>(null);
  const auditDropdownRef = useRef<HTMLDivElement>(null);
  const linkedItemDropdownRef = useRef<HTMLDivElement>(null);

  const toggleAuditExpand = (id: string) => {
    setExpandedAuditIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Close audit dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (auditDropdownRef.current && !auditDropdownRef.current.contains(event.target as Node)) {
        setOpenAuditDropdownId(null);
      }
    };
    if (openAuditDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openAuditDropdownId]);

  // Close linked item dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (linkedItemDropdownRef.current && !linkedItemDropdownRef.current.contains(event.target as Node)) {
        setOpenLinkedItemDropdownId(null);
      }
    };
    if (openLinkedItemDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openLinkedItemDropdownId]);
  const [optimizingPricelist, setOptimizingPricelist] = useState<Id<"pricelists"> | null>(null);

  // Form state for company data
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    companyNip: '',
    companyAddress: '',
    companyCity: '',
    companyPostalCode: '',
  });

  const convexUser = useQuery(api.users.getCurrentUser);
  const audits = useQuery(api.audits.getUserAudits);
  const activeAudit = useQuery(api.audits.getActiveAudit);
  const purchases = useQuery(api.purchases.getUserPurchases);
  const pricelists = useQuery(api.pricelists.getUserPricelists);
  const updateCompanyData = useMutation(api.users.updateCompanyData);
  const deletePricelist = useMutation(api.pricelists.deletePricelist);
  const deleteAudit = useMutation(api.dev.deleteAudit);
  const createPortalSession = useAction(api.stripe.createCustomerPortalSession);
  const syncStripeCustomer = useAction(api.stripe.syncStripeCustomer);
  const getInvoices = useAction(api.stripe.getInvoices);
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);

  const [openingPortal, setOpeningPortal] = useState(false);
  const [syncingStripe, setSyncingStripe] = useState(false);
  const [pendingAuditDismissed, setPendingAuditDismissed] = useState(false);
  const [stripeSyncError, setStripeSyncError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Array<{
    id: string;
    number: string | null;
    status: string;
    amount: number;
    currency: string;
    created: number;
    pdfUrl: string | null;
    hostedUrl: string | null;
    description: string | null;
  }>>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Salon settings state
  const [salonSubTab, setSalonSubTab] = useState<'data' | 'identity'>('data');
  const [isEditingSalon, setIsEditingSalon] = useState(false);
  const [salonSaving, setSalonSaving] = useState(false);
  const [salonForm, setSalonForm] = useState({
    salonName: '',
    salonLogoUrl: '',
    salonAddress: '',
    salonCity: '',
    salonPhone: '',
    booksyProfileUrl: '',
  });

  const updateSalonData = useMutation(api.users.updateSalonData);
  const updatePricelistTheme = useMutation(api.pricelists.updatePricelistTheme);

  // Theme/colors state (for price list customization)
  const LOCAL_STORAGE_KEY = 'beauty_pricer_local_last';
  const LOCAL_STORAGE_TEMPLATE_KEY = 'beauty_pricer_template_id';
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('modern');

  // Selected pricelist for editing in Identity tab
  const [selectedPricelistId, setSelectedPricelistId] = useState<Id<"pricelists"> | null>(null);
  const [selectedPricelistData, setSelectedPricelistData] = useState<PricingData | null>(null);

  // Load theme from selected pricelist or localStorage fallback
  useEffect(() => {
    if (selectedPricelistId && pricelists) {
      const pricelist = pricelists.find(p => p._id === selectedPricelistId);
      if (pricelist) {
        // Load pricing data
        try {
          const pricingData = JSON.parse(pricelist.pricingDataJson) as PricingData;
          setSelectedPricelistData(pricingData);
        } catch (e) {
          console.error('Error parsing pricelist data:', e);
          setSelectedPricelistData(null);
        }

        // Load theme config if exists
        if (pricelist.themeConfigJson) {
          try {
            const savedTheme = JSON.parse(pricelist.themeConfigJson) as ThemeConfig;
            setThemeConfig(savedTheme);
          } catch (e) {
            console.error('Error parsing theme config:', e);
          }
        }

        // Load template ID if exists
        if (pricelist.templateId) {
          setSelectedTemplateId(pricelist.templateId);
        }
        return;
      }
    }

    // Fallback to localStorage when no pricelist selected
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedTheme) {
      try {
        setThemeConfig(JSON.parse(savedTheme));
      } catch (e) {
        console.error('Error loading theme config:', e);
      }
    }
    const savedTemplateId = localStorage.getItem(LOCAL_STORAGE_TEMPLATE_KEY);
    if (savedTemplateId) {
      setSelectedTemplateId(savedTemplateId);
    }
  }, [selectedPricelistId, pricelists]);

  // Auto-select first pricelist when list loads
  useEffect(() => {
    if (pricelists && pricelists.length > 0 && !selectedPricelistId) {
      setSelectedPricelistId(pricelists[0]._id);
    }
  }, [pricelists, selectedPricelistId]);

  const handleFullThemeChange = async (newTheme: ThemeConfig) => {
    setThemeConfig(newTheme);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTheme));

    // Also save to database if a pricelist is selected
    if (selectedPricelistId) {
      try {
        await updatePricelistTheme({
          pricelistId: selectedPricelistId,
          themeConfigJson: JSON.stringify(newTheme),
          templateId: selectedTemplateId,
        });
      } catch (e) {
        console.error('Error saving theme to database:', e);
      }
    }
  };

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    localStorage.setItem(LOCAL_STORAGE_TEMPLATE_KEY, templateId);

    // Also save to database if a pricelist is selected
    if (selectedPricelistId) {
      try {
        await updatePricelistTheme({
          pricelistId: selectedPricelistId,
          themeConfigJson: JSON.stringify(themeConfig),
          templateId: templateId,
        });
      } catch (e) {
        console.error('Error saving template to database:', e);
      }
    }
  };

  // Initialize salon form when user data loads
  useEffect(() => {
    if (convexUser) {
      setSalonForm({
        salonName: convexUser.salonName || '',
        salonLogoUrl: convexUser.salonLogoUrl || '',
        salonAddress: convexUser.salonAddress || '',
        salonCity: convexUser.salonCity || '',
        salonPhone: convexUser.salonPhone || '',
        booksyProfileUrl: convexUser.booksyProfileUrl || '',
      });
    }
  }, [convexUser]);

  const handleSaveSalon = async () => {
    setSalonSaving(true);
    try {
      await updateSalonData(salonForm);
      setIsEditingSalon(false);
    } catch (error) {
      console.error('Error saving salon data:', error);
    } finally {
      setSalonSaving(false);
    }
  };

  // Funkcja kopiowania kodu HTML cennika
  const handleCopyCode = useCallback(async (pricelist: {
    _id: Id<"pricelists">;
    pricingDataJson: string;
    themeConfigJson?: string;
  }) => {
    setCopyingCode(pricelist._id);
    try {
      const pricingData = JSON.parse(pricelist.pricingDataJson) as PricingData;
      const themeConfig = pricelist.themeConfigJson
        ? JSON.parse(pricelist.themeConfigJson) as ThemeConfig
        : DEFAULT_THEME;
      const code = generateEmbedHTML(pricingData, themeConfig);
      await navigator.clipboard.writeText(code);
      // Krótki feedback - kod skopiowany
      setTimeout(() => setCopyingCode(null), 1500);
    } catch (error) {
      console.error('Error copying code:', error);
      setCopyingCode(null);
    }
  }, []);

  // Funkcja edycji cennika - przekierowuje bezpośrednio do edytora
  const handleEditPricelist = useCallback((pricelistId: Id<"pricelists">) => {
    setEditingPricelist(pricelistId);
    navigate(`/start-generator?pricelist=${pricelistId}`);
  }, [navigate]);

  // Funkcja optymalizacji cennika AI - przekierowuje do Stripe checkout
  const handleOptimizePricelist = useCallback(async (pricelistId: Id<"pricelists">) => {
    console.log('[ProfilePage] Starting optimization for pricelist:', pricelistId);
    setOptimizingPricelist(pricelistId);
    try {
      // Przekieruj do Stripe checkout z pricelistId
      console.log('[ProfilePage] Creating checkout session...');
      const result = await createCheckoutSession({
        product: 'pricelist_optimization',
        successUrl: `${window.location.origin}/optimization-results?pricelist=${pricelistId}`,
        cancelUrl: `${window.location.origin}/profil`,
        pricelistId: pricelistId,
      });
      console.log('[ProfilePage] Checkout session created:', result.url ? 'success' : 'no URL');

      if (result.url) {
        console.log('[ProfilePage] Redirecting to Stripe...');
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('[ProfilePage] Error starting optimization:', error);
      setOptimizingPricelist(null);
    }
  }, [createCheckoutSession]);

  // Initialize company form when user data loads
  React.useEffect(() => {
    if (convexUser) {
      setCompanyForm({
        companyName: convexUser.companyName || '',
        companyNip: convexUser.companyNip || '',
        companyAddress: convexUser.companyAddress || '',
        companyCity: convexUser.companyCity || '',
        companyPostalCode: convexUser.companyPostalCode || '',
      });
    }
  }, [convexUser]);

  // Load invoices when tab is invoices and user has stripeCustomerId
  React.useEffect(() => {
    if (activeTab === 'invoices' && convexUser?.stripeCustomerId && invoices.length === 0 && !loadingInvoices) {
      setLoadingInvoices(true);
      getInvoices({})
        .then((data) => setInvoices(data))
        .catch((err) => console.error('Error loading invoices:', err))
        .finally(() => setLoadingInvoices(false));
    }
  }, [activeTab, convexUser?.stripeCustomerId]);

  if (!isClerkLoaded || convexUser === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <IconLoader2 className="w-6 h-6 text-[#D4A574] animate-spin" />
      </div>
    );
  }

  if (!clerkUser || !convexUser) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Musisz być zalogowany, aby zobaczyć profil.</p>
          <Link to="/" className="text-[#722F37] font-medium hover:underline">
            Wróć na stronę główną
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveCompany = async () => {
    setCompanySaving(true);
    try {
      await updateCompanyData(companyForm);
      setIsEditingCompany(false);
    } catch (error) {
      console.error('Error saving company data:', error);
    } finally {
      setCompanySaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: typeof IconClock }> = {
      pending: { label: 'Oczekuje', className: 'bg-amber-100 text-amber-700', icon: IconClock },
      processing: { label: 'W trakcie', className: 'bg-blue-100 text-blue-700', icon: IconLoader2 },
      scraping: { label: 'Pobieranie', className: 'bg-blue-100 text-blue-700', icon: IconLoader2 },
      scraping_retry: { label: 'Ponowne pobieranie', className: 'bg-orange-100 text-orange-700', icon: IconLoader2 },
      analyzing: { label: 'Analiza AI', className: 'bg-purple-100 text-purple-700', icon: IconLoader2 },
      completed: { label: 'Zakończony', className: 'bg-emerald-100 text-emerald-700', icon: IconCircleCheck },
      failed: { label: 'Błąd', className: 'bg-red-100 text-red-700', icon: IconAlertCircle },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    const spinningStatuses = ['processing', 'scraping', 'scraping_retry', 'analyzing'];
    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", config.className)}>
        <Icon size={12} className={spinningStatuses.includes(status) ? 'animate-spin' : ''} />
        {config.label}
      </span>
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr}, ${timeStr}`;
  };

  const formatPrice = (amount: number) => {
    return (amount / 100).toFixed(2).replace('.', ',') + ' zł';
  };

  const getProductName = (product: string) => {
    const names: Record<string, string> = {
      audit: 'Audyt AuditorAI®',
      audit_consultation: 'Audyt + Konsultacja',
    };
    return names[product] || product;
  };

  const completedAudits = audits?.filter(a => a.status === 'completed' || a.status === 'failed') || [];
  const completedPurchases = purchases?.filter(p => p.status === 'completed') || [];

  const handleOpenStripePortal = async () => {
    setOpeningPortal(true);
    try {
      const result = await createPortalSession({
        returnUrl: window.location.href,
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Error opening Stripe portal:', error);
    } finally {
      setOpeningPortal(false);
    }
  };

  // Tab titles for header display
  const tabTitles: Record<Tab, string> = {
    pricelists: 'Moje cenniki',
    audits: 'Historia audytów',
    payments: 'Historia płatności',
    invoices: 'Faktury',
    company: 'Dane firmy',
    salon: 'Ustawienia salonu',
  };

  return (
    <div className="py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Mój profil</h1>
        <p className="text-slate-500 text-sm mt-1">Zarządzaj kontem i przeglądaj historię</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {/* User info */}
            <div className="p-4">
              <div className="flex items-center gap-3">
                {clerkUser.imageUrl ? (
                  <img src={clerkUser.imageUrl} alt="" className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#722F37] flex items-center justify-center text-white font-medium">
                    {clerkUser.firstName?.[0] || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{clerkUser.fullName || 'Użytkownik'}</p>
                  <p className="text-sm text-slate-500 truncate">{clerkUser.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Dostępne audyty</span>
                <span className="text-lg font-bold text-[#722F37]">{convexUser.credits}</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="p-2">
              {/* Main sections */}
              <button
                onClick={() => setActiveTab('pricelists')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                  activeTab === 'pricelists'
                    ? "bg-[#722F37]/10 text-[#722F37]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <IconList size={18} className={activeTab === 'pricelists' ? "text-[#722F37]" : "text-slate-400"} />
                Cenniki
                {pricelists && pricelists.length > 0 && (
                  <span className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded",
                    activeTab === 'pricelists' ? "bg-[#722F37]/20" : "bg-slate-100"
                  )}>
                    {pricelists.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('audits')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                  activeTab === 'audits'
                    ? "bg-[#722F37]/10 text-[#722F37]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <IconFileText size={18} className={activeTab === 'audits' ? "text-[#722F37]" : "text-slate-400"} />
                Audyty
                {audits && audits.length > 0 && (
                  <span className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded",
                    activeTab === 'audits' ? "bg-[#722F37]/20" : "bg-slate-100"
                  )}>
                    {audits.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                  activeTab === 'payments'
                    ? "bg-[#722F37]/10 text-[#722F37]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <IconCreditCard size={18} className={activeTab === 'payments' ? "text-[#722F37]" : "text-slate-400"} />
                Płatności
                {completedPurchases.length > 0 && (
                  <span className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded",
                    activeTab === 'payments' ? "bg-[#722F37]/20" : "bg-slate-100"
                  )}>
                    {completedPurchases.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                  activeTab === 'invoices'
                    ? "bg-[#722F37]/10 text-[#722F37]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <IconReceipt size={18} className={activeTab === 'invoices' ? "text-[#722F37]" : "text-slate-400"} />
                Faktury
              </button>
              <button
                onClick={() => setActiveTab('company')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                  activeTab === 'company'
                    ? "bg-[#722F37]/10 text-[#722F37]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <IconBuilding size={18} className={activeTab === 'company' ? "text-[#722F37]" : "text-slate-400"} />
                Dane firmy
              </button>

              {/* Divider */}
              <div className="my-2 border-t border-slate-100"></div>

              {/* Settings sections */}
              <button
                onClick={() => setActiveTab('salon')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                  activeTab === 'salon'
                    ? "bg-[#722F37]/10 text-[#722F37]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <IconPalette size={18} className={activeTab === 'salon' ? "text-[#722F37]" : "text-slate-400"} />
                Ustawienia salonu
              </button>
              <button
                onClick={() => openUserProfile()}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <IconSettings size={18} className="text-slate-400" />
                Ustawienia logowania
              </button>
            </div>
          </div>

          {/* Logout button - outside menu */}
          <button
            onClick={() => signOut()}
            className="mt-3 w-full flex items-center gap-3 px-5 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            <IconLogout size={18} />
            Wyloguj się
          </button>
        </div>

        {/* Main content */}
        <div className="lg:col-span-9">
          {/* Pending audit banner */}
          {activeAudit?.status === 'pending' && !pendingAuditDismissed && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <IconPlayerPlay size={16} className="text-amber-600" />
                </div>
                <p className="text-sm text-amber-800">
                  Masz nierozpoczęty audyt profilu Booksy.{' '}
                  <Link to="/start-audit" className="font-medium text-[#722F37] hover:underline">
                    Kliknij tutaj aby rozpocząć
                  </Link>
                </p>
              </div>
              <button
                onClick={() => setPendingAuditDismissed(true)}
                className="p-1 text-amber-500 hover:text-amber-700 transition-colors flex-shrink-0"
              >
                <IconX size={18} />
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200">
            {/* Content Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">{tabTitles[activeTab]}</h2>
              {activeTab === 'pricelists' && (
                <Link
                  to="/"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#722F37] bg-[#722F37]/5 rounded-lg hover:bg-[#722F37]/10 transition-colors"
                >
                  <IconPlus size={14} />
                  Nowy cennik
                </Link>
              )}
            </div>

            {/* Tab: Pricelists */}
            {activeTab === 'pricelists' && (
              <div className="p-4">
                {pricelists && pricelists.length > 0 ? (
                  <PricelistsDataTable
                    pricelists={pricelists}
                    formatDate={formatDate}
                    onPreview={(id) => window.open(`/preview?pricelist=${id}`, '_blank')}
                    onEdit={handleEditPricelist}
                    onCopyCode={handleCopyCode}
                    onOptimize={handleOptimizePricelist}
                    onDelete={async (id) => {
                      if (confirm('Czy na pewno chcesz usunąć ten cennik?')) {
                        await deletePricelist({ pricelistId: id });
                      }
                    }}
                    onViewResults={(id) => navigate(`/optimization-results?pricelist=${id}`)}
                    onGoToInvoices={() => setActiveTab('invoices')}
                    onGoToAudits={() => setActiveTab('audits')}
                    onOpenStripePortal={handleOpenStripePortal}
                    editingPricelist={editingPricelist}
                    copyingCode={copyingCode}
                    optimizingPricelist={optimizingPricelist}
                  />
                ) : (
                  <div className="py-12 text-center">
                    <IconList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-1">Brak zapisanych cenników</p>
                    <p className="text-xs text-slate-400 mb-4">
                      Stwórz cennik za darmo używając generatora lub kup audyt Booksy
                    </p>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#722F37] rounded-lg hover:bg-[#5a252c] transition-colors"
                    >
                      <IconPlus size={16} />
                      Stwórz pierwszy cennik
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Audits */}
            {activeTab === 'audits' && (
              <div>
                {/* Active audit */}
                {activeAudit && (() => {
                  const activeStatuses = ['processing', 'scraping', 'scraping_retry', 'analyzing'];
                  const isInProgress = activeStatuses.includes(activeAudit.status);
                  const progress = activeAudit.progress ?? 0;

                  return (
                    <div className="px-5 py-4 bg-amber-50/50 border-b border-amber-100">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isInProgress && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                              </span>
                            )}
                            <span className="text-sm font-medium text-slate-900">
                              {activeAudit.salonName || (activeAudit.status === 'pending' ? 'Oczekujący audyt' : 'Audyt w trakcie')}
                            </span>
                            {getStatusBadge(activeAudit.status)}
                          </div>

                          {/* Progress bar for in-progress audits */}
                          {isInProgress && progress > 0 && (
                            <div className="mb-2">
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#D4A574] to-[#B8860B] transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-slate-500 truncate">
                            {activeAudit.progressMessage || activeAudit.sourceUrl || 'Brak URL - kliknij aby dodać'}
                          </p>
                        </div>
                        {activeAudit.status === 'pending' && (
                          <Link
                            to="/success"
                            className="flex-shrink-0 px-3 py-1.5 bg-[#722F37] text-white text-xs font-medium rounded-lg hover:bg-[#5a252c] transition-colors"
                          >
                            Rozpocznij
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Audits list */}
                <div className="divide-y divide-slate-100">
                  {completedAudits.length > 0 ? (
                    completedAudits.map((audit) => {
                      const hasLinkedItems = audit.status === 'completed' && (audit.basePricelistId || audit.proPricelistId || audit.purchaseId);
                      const isExpanded = expandedAuditIds.has(audit._id);

                      // Build list of linked items
                      const linkedItems: Array<{ type: 'invoice' | 'basePricelist' | 'proPricelist'; key: string }> = [];
                      if (audit.purchaseId) linkedItems.push({ type: 'invoice', key: 'invoice' });
                      if (audit.basePricelistId) linkedItems.push({ type: 'basePricelist', key: 'base' });
                      if (audit.proPricelistId) linkedItems.push({ type: 'proPricelist', key: 'pro' });

                      // Find linked pricelists
                      const basePricelist = audit.basePricelistId ? pricelists?.find(p => p._id === audit.basePricelistId) : null;
                      const proPricelist = audit.proPricelistId ? pricelists?.find(p => p._id === audit.proPricelistId) : null;
                      const linkedPurchase = audit.purchaseId ? purchases?.find(p => p._id === audit.purchaseId) : null;

                      return (
                        <div key={audit._id}>
                          <div
                            className={cn(
                              "px-3 py-2.5 transition-colors group flex items-center gap-3 rounded-lg mx-2 my-1",
                              hasLinkedItems && "cursor-pointer",
                              isExpanded ? "bg-slate-50" : "hover:bg-slate-50"
                            )}
                            onClick={() => hasLinkedItems && toggleAuditExpand(audit._id)}
                          >
                            {/* Expand/Collapse Arrow */}
                            <div className={cn(
                              "w-5 h-5 flex items-center justify-center flex-shrink-0 transition-transform",
                              isExpanded && "rotate-90"
                            )}>
                              {hasLinkedItems ? (
                                <IconChevronRight size={16} className="text-slate-400" />
                              ) : (
                                <div className="w-4" />
                              )}
                            </div>

                            {/* Salon Logo */}
                            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                              {audit.salonLogoUrl ? (
                                <img
                                  src={audit.salonLogoUrl}
                                  alt={audit.salonName || 'Salon'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <IconPhoto size={14} />
                                </div>
                              )}
                            </div>

                            {/* Audit Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-900 truncate">
                                  {audit.salonName || (audit.sourceUrl ? audit.sourceUrl.replace(/^https?:\/\//, '').split('/')[0] : 'Audyt profilu')}
                                </span>
                                {getStatusBadge(audit.status)}
                                {audit.overallScore !== undefined && (
                                  <span className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full",
                                    audit.overallScore >= 80 ? 'text-emerald-700 bg-emerald-50' :
                                    audit.overallScore >= 60 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'
                                  )}>
                                    {audit.overallScore}/100
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                <span>
                                  {(() => {
                                    // Use scraped counts if available, otherwise try to parse from JSON
                                    if (audit.scrapedCategoriesCount && audit.scrapedServicesCount) {
                                      return `${audit.scrapedCategoriesCount} kat. / ${audit.scrapedServicesCount} usł.`;
                                    }
                                    // Fallback: parse from scrapedDataJson (new system) or rawData (old system)
                                    const jsonData = audit.scrapedDataJson || audit.rawData;
                                    if (jsonData) {
                                      try {
                                        const data = JSON.parse(jsonData);
                                        const cats = data.categories?.length || 0;
                                        const services = data.totalServices || data.categories?.reduce((acc: number, c: { services?: unknown[] }) => acc + (c.services?.length || 0), 0) || 0;
                                        return `${cats} kat. / ${services} usł.`;
                                      } catch {
                                        return '- kat. / - usł.';
                                      }
                                    }
                                    return '- kat. / - usł.';
                                  })()}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>{formatDate(audit.completedAt || audit.createdAt)}</span>
                              </div>
                            </div>

                            {/* Info tooltip */}
                            <InfoTooltip
                              content={
                                <div className="space-y-1.5">
                                  <p className="font-medium text-slate-900">Audyt cennika</p>
                                  <p className="text-slate-600 text-xs">
                                    Analiza cennika Booksy z rekomendacjami optymalizacji.
                                  </p>
                                  {audit.overallScore !== undefined && (
                                    <p className="text-slate-500 text-xs mt-2">
                                      Wynik: {audit.overallScore}/100 punktów
                                    </p>
                                  )}
                                </div>
                              }
                            />

                            {/* Actions Menu */}
                            <div className="relative flex-shrink-0" ref={openAuditDropdownId === audit._id ? auditDropdownRef : undefined}>
                              <button
                                className={cn(
                                  "p-1.5 rounded-lg transition-colors",
                                  openAuditDropdownId === audit._id ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenAuditDropdownId(openAuditDropdownId === audit._id ? null : audit._id);
                                }}
                              >
                                <IconDotsVertical size={18} />
                              </button>
                              {openAuditDropdownId === audit._id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                  {audit.status === 'completed' && audit.reportJson && (
                                    <button
                                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                      onClick={() => {
                                        setOpenAuditDropdownId(null);
                                        navigate(`/audit-results?audit=${audit._id}`);
                                      }}
                                    >
                                      <IconFileText size={16} className="text-indigo-500" />
                                      Zobacz raport
                                    </button>
                                  )}
                                  {audit.status === 'completed' && audit.reportPdfUrl && (
                                    <a
                                      href={audit.reportPdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                      onClick={() => setOpenAuditDropdownId(null)}
                                    >
                                      <IconDownload size={16} className="text-[#722F37]" />
                                      Pobierz raport PDF
                                    </a>
                                  )}
                                  {audit.sourceUrl && (
                                    <a
                                      href={audit.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                      onClick={() => setOpenAuditDropdownId(null)}
                                    >
                                      <IconExternalLink size={16} className="text-slate-400" />
                                      Otwórz Booksy
                                    </a>
                                  )}
                                  <button
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    onClick={async () => {
                                      if (confirm('Czy na pewno chcesz usunąć ten audyt? Ta operacja jest nieodwracalna.')) {
                                        setOpenAuditDropdownId(null);
                                        await deleteAudit({ auditId: audit._id });
                                      }
                                    }}
                                  >
                                    <IconTrash size={16} />
                                    Usuń audyt
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expanded content: linked items */}
                          {hasLinkedItems && isExpanded && (
                            <div className="ml-12 mb-2">
                              {/* Header */}
                              <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-2 pl-8 pt-3">
                                Powiązane elementy
                              </div>

                              {/* Tree structure */}
                              <div className="relative pl-4">
                                {/* Continuous vertical line */}
                                <div className="absolute left-0 -top-9 bottom-[25px] w-px bg-slate-200" />

                                {/* Items */}
                                <div className="space-y-3">
                                  {linkedItems.map((item) => (
                                    <div key={item.key} className="relative">
                                      {/* Horizontal branch from vertical line */}
                                      <div className="absolute -left-4 top-[30px] w-4 h-px bg-slate-200" />

                                      {/* Invoice */}
                                      {item.type === 'invoice' && linkedPurchase && (
                                        <div
                                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50/80 cursor-pointer hover:bg-slate-100/80 transition-colors"
                                          onClick={() => setActiveTab('payments')}
                                        >
                                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <IconReceipt size={16} className="text-emerald-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-slate-900 text-sm">Faktura VAT</span>
                                              <span className="text-xs text-slate-500">NR FV/...</span>
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                opłacona
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                              <span>Płatność kartą</span>
                                              <span className="text-slate-300">•</span>
                                              <span>{formatDate(linkedPurchase.completedAt || linkedPurchase.createdAt)}</span>
                                            </div>
                                          </div>
                                          <InfoTooltip
                                            content={
                                              <div className="space-y-1.5">
                                                <p className="font-medium text-slate-900">Faktura VAT</p>
                                                <p className="text-slate-600 text-xs">
                                                  Dokument rozliczeniowy za audyt cennika.
                                                </p>
                                              </div>
                                            }
                                          />
                                          {/* Menu */}
                                          <div className="relative flex-shrink-0" ref={openLinkedItemDropdownId === `invoice-${linkedPurchase._id}` ? linkedItemDropdownRef : undefined}>
                                            <button
                                              className={cn(
                                                "p-1.5 rounded-lg transition-colors",
                                                openLinkedItemDropdownId === `invoice-${linkedPurchase._id}` ? "bg-slate-200 text-slate-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                                              )}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenLinkedItemDropdownId(openLinkedItemDropdownId === `invoice-${linkedPurchase._id}` ? null : `invoice-${linkedPurchase._id}`);
                                              }}
                                            >
                                              <IconDotsVertical size={16} />
                                            </button>
                                            {openLinkedItemDropdownId === `invoice-${linkedPurchase._id}` && (
                                              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                                <button
                                                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenLinkedItemDropdownId(null);
                                                    setActiveTab('payments');
                                                  }}
                                                >
                                                  <IconExternalLink size={16} className="text-slate-400" />
                                                  Zobacz szczegóły
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Base Pricelist */}
                                      {item.type === 'basePricelist' && basePricelist && (
                                        <div
                                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50/80 cursor-pointer hover:bg-slate-100/80 transition-colors"
                                          onClick={() => {
                                            setSelectedPricelistId(basePricelist._id);
                                            setActiveTab('pricelists');
                                          }}
                                        >
                                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <IconList size={16} className="text-blue-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-slate-600 text-sm">{basePricelist.name}</span>
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                Booksy
                                              </span>
                                              <span className="text-xs text-slate-400">bazowy</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                              <span>{basePricelist.categoriesCount || 0} kat. / {basePricelist.servicesCount || 0} usł.</span>
                                              <span className="text-slate-300">•</span>
                                              <span>{formatDate(basePricelist.createdAt)}</span>
                                            </div>
                                          </div>
                                          <InfoTooltip
                                            content={
                                              <div className="space-y-1.5">
                                                <p className="font-medium text-slate-900">Cennik bazowy</p>
                                                <p className="text-slate-600 text-xs">
                                                  Oryginalna struktura cennika z Booksy.
                                                </p>
                                              </div>
                                            }
                                          />
                                          {/* Menu */}
                                          <div className="relative flex-shrink-0" ref={openLinkedItemDropdownId === `base-${basePricelist._id}` ? linkedItemDropdownRef : undefined}>
                                            <button
                                              className={cn(
                                                "p-1.5 rounded-lg transition-colors",
                                                openLinkedItemDropdownId === `base-${basePricelist._id}` ? "bg-slate-200 text-slate-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                                              )}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenLinkedItemDropdownId(openLinkedItemDropdownId === `base-${basePricelist._id}` ? null : `base-${basePricelist._id}`);
                                              }}
                                            >
                                              <IconDotsVertical size={16} />
                                            </button>
                                            {openLinkedItemDropdownId === `base-${basePricelist._id}` && (
                                              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                                <button
                                                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenLinkedItemDropdownId(null);
                                                    setSelectedPricelistId(basePricelist._id);
                                                    setActiveTab('pricelists');
                                                  }}
                                                >
                                                  <IconEdit size={16} className="text-slate-400" />
                                                  Edytuj cennik
                                                </button>
                                                <button
                                                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                  onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Czy na pewno chcesz usunąć ten cennik?')) {
                                                      setOpenLinkedItemDropdownId(null);
                                                      await deletePricelist({ pricelistId: basePricelist._id });
                                                    }
                                                  }}
                                                >
                                                  <IconTrash size={16} />
                                                  Usuń cennik
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* PRO Pricelist */}
                                      {item.type === 'proPricelist' && proPricelist && (
                                        <div
                                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50/80 cursor-pointer hover:bg-slate-100/80 transition-colors"
                                          onClick={() => {
                                            setSelectedPricelistId(proPricelist._id);
                                            setActiveTab('pricelists');
                                          }}
                                        >
                                          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                            <IconSparkles size={16} className="text-amber-600" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-slate-900 text-sm">{proPricelist.name}</span>
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#D4A574]/20 text-[#996B3D]">
                                                <IconSparkles size={12} />
                                                AuditorAI®
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                              <span>{proPricelist.categoriesCount || 0} kat. / {proPricelist.servicesCount || 0} usł.</span>
                                              <span className="text-slate-300">•</span>
                                              <span>{formatDate(proPricelist.createdAt)}</span>
                                            </div>
                                          </div>
                                          <InfoTooltip
                                            content={
                                              <div className="space-y-1.5">
                                                <p className="font-medium text-slate-900">Cennik PRO</p>
                                                <p className="text-slate-600 text-xs">
                                                  Zoptymalizowany przez AuditorAI® na podstawie rekomendacji z audytu.
                                                </p>
                                              </div>
                                            }
                                          />
                                          {/* Menu */}
                                          <div className="relative flex-shrink-0" ref={openLinkedItemDropdownId === `pro-${proPricelist._id}` ? linkedItemDropdownRef : undefined}>
                                            <button
                                              className={cn(
                                                "p-1.5 rounded-lg transition-colors",
                                                openLinkedItemDropdownId === `pro-${proPricelist._id}` ? "bg-slate-200 text-slate-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                                              )}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenLinkedItemDropdownId(openLinkedItemDropdownId === `pro-${proPricelist._id}` ? null : `pro-${proPricelist._id}`);
                                              }}
                                            >
                                              <IconDotsVertical size={16} />
                                            </button>
                                            {openLinkedItemDropdownId === `pro-${proPricelist._id}` && (
                                              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                                <button
                                                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenLinkedItemDropdownId(null);
                                                    setSelectedPricelistId(proPricelist._id);
                                                    setActiveTab('pricelists');
                                                  }}
                                                >
                                                  <IconEdit size={16} className="text-slate-400" />
                                                  Edytuj cennik
                                                </button>
                                                <button
                                                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                  onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Czy na pewno chcesz usunąć ten cennik?')) {
                                                      setOpenLinkedItemDropdownId(null);
                                                      await deletePricelist({ pricelistId: proPricelist._id });
                                                    }
                                                  }}
                                                >
                                                  <IconTrash size={16} />
                                                  Usuń cennik
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : !activeAudit ? (
                    <div className="px-5 py-12 text-center">
                      <IconFileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 mb-1">Brak audytów</p>
                      <p className="text-xs text-slate-400">Twoje audyty pojawią się tutaj</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Tab: Payments */}
            {activeTab === 'payments' && (
              <div className="divide-y divide-slate-100">
                {completedPurchases.length > 0 ? (
                  completedPurchases.map((purchase) => (
                    <div key={purchase._id} className="px-5 py-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{getProductName(purchase.product)}</p>
                          <p className="text-xs text-slate-500">{formatDate(purchase.completedAt || purchase.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{formatPrice(purchase.amount)}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                            <IconCircleCheck size={12} />
                            Opłacone
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-12 text-center">
                    <IconCreditCard className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-1">Brak płatności</p>
                    <p className="text-xs text-slate-400">Twoje płatności pojawią się tutaj</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Invoices */}
            {activeTab === 'invoices' && (
              <div className="divide-y divide-slate-100">
                {/* Header z przyciskiem sync jeśli brak stripeCustomerId */}
                {!convexUser.stripeCustomerId && purchases && purchases.length > 0 && (
                  <div className="px-5 py-4 bg-amber-50 border-b border-amber-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-amber-800">
                        Zsynchronizuj konto aby zobaczyć faktury
                      </p>
                      <button
                        onClick={async () => {
                          setSyncingStripe(true);
                          setStripeSyncError(null);
                          try {
                            const result = await syncStripeCustomer({});
                            if (!result.success) {
                              setStripeSyncError(result.message || 'Nie udało się zsynchronizować');
                            }
                          } catch (err) {
                            setStripeSyncError('Wystąpił błąd podczas synchronizacji');
                          } finally {
                            setSyncingStripe(false);
                          }
                        }}
                        disabled={syncingStripe}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#722F37] text-white text-xs font-medium rounded-lg hover:bg-[#5a252c] transition-colors disabled:opacity-50"
                      >
                        {syncingStripe ? (
                          <IconLoader2 size={14} className="animate-spin" />
                        ) : (
                          <IconReceipt size={14} />
                        )}
                        Synchronizuj
                      </button>
                    </div>
                    {stripeSyncError && (
                      <p className="text-xs text-red-600 mt-2">{stripeSyncError}</p>
                    )}
                  </div>
                )}

                {/* Loading state */}
                {loadingInvoices && (
                  <div className="px-5 py-12 text-center">
                    <IconLoader2 className="w-8 h-8 text-[#D4A574] animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Ładowanie faktur...</p>
                  </div>
                )}

                {/* Invoices table */}
                {!loadingInvoices && convexUser.stripeCustomerId && invoices.length > 0 && (
                  <>
                    {/* Table header */}
                    <div className="px-5 py-3 bg-slate-50 grid grid-cols-12 gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <div className="col-span-3">Numer</div>
                      <div className="col-span-3">Data</div>
                      <div className="col-span-2">Kwota</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2 text-right">Pobierz</div>
                    </div>

                    {/* Table rows */}
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="px-5 py-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50 transition-colors">
                        <div className="col-span-3">
                          <span className="text-sm font-medium text-slate-900">
                            {invoice.number || '—'}
                          </span>
                        </div>
                        <div className="col-span-3">
                          <span className="text-sm text-slate-600">
                            {new Date(invoice.created * 1000).toLocaleDateString('pl-PL', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm font-medium text-slate-900">
                            {(invoice.amount / 100).toFixed(2).replace('.', ',')} {invoice.currency.toUpperCase()}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            invoice.status === 'paid' && "bg-emerald-50 text-emerald-700",
                            invoice.status === 'open' && "bg-amber-50 text-amber-700",
                            invoice.status === 'draft' && "bg-slate-100 text-slate-600",
                            invoice.status === 'void' && "bg-red-50 text-red-700",
                            !['paid', 'open', 'draft', 'void'].includes(invoice.status) && "bg-slate-100 text-slate-600"
                          )}>
                            {invoice.status === 'paid' && <IconCircleCheck size={12} />}
                            {invoice.status === 'paid' ? 'Opłacona' :
                             invoice.status === 'open' ? 'Otwarta' :
                             invoice.status === 'draft' ? 'Szkic' :
                             invoice.status === 'void' ? 'Anulowana' : invoice.status}
                          </span>
                        </div>
                        <div className="col-span-2 text-right">
                          {invoice.pdfUrl ? (
                            <a
                              href={invoice.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#722F37] bg-[#722F37]/5 rounded-lg hover:bg-[#722F37]/10 transition-colors"
                            >
                              <IconDownload size={14} />
                              PDF
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Portal link */}
                    <div className="px-5 py-4 bg-slate-50 text-center">
                      <button
                        onClick={handleOpenStripePortal}
                        disabled={openingPortal}
                        className="inline-flex items-center gap-2 text-sm text-[#722F37] font-medium hover:underline disabled:opacity-50"
                      >
                        {openingPortal ? (
                          <IconLoader2 size={14} className="animate-spin" />
                        ) : (
                          <IconExternalLink size={14} />
                        )}
                        Otwórz pełny portal płatności
                      </button>
                    </div>
                  </>
                )}

                {/* Empty state - no stripeCustomerId and no purchases */}
                {!loadingInvoices && !convexUser.stripeCustomerId && (!purchases || purchases.length === 0) && (
                  <div className="px-5 py-12 text-center">
                    <IconReceipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-1">Brak faktur</p>
                    <p className="text-xs text-slate-400">Faktury pojawią się po dokonaniu płatności</p>
                  </div>
                )}

                {/* Empty state - has stripeCustomerId but no invoices */}
                {!loadingInvoices && convexUser.stripeCustomerId && invoices.length === 0 && (
                  <div className="px-5 py-12 text-center">
                    <IconReceipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-1">Brak faktur</p>
                    <p className="text-xs text-slate-400">Nie znaleziono faktur w Stripe</p>
                    <button
                      onClick={handleOpenStripePortal}
                      disabled={openingPortal}
                      className="mt-4 inline-flex items-center gap-2 text-sm text-[#722F37] font-medium hover:underline disabled:opacity-50"
                    >
                      {openingPortal ? (
                        <IconLoader2 size={14} className="animate-spin" />
                      ) : (
                        <IconExternalLink size={14} />
                      )}
                      Sprawdź w portalu Stripe
                    </button>
                  </div>
                )}

                {/* Tip about company data */}
                {!convexUser.companyNip && (
                  <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                    <div className="flex items-start gap-3">
                      <IconBuilding size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-amber-800">
                          Aby faktury zawierały dane Twojej firmy, uzupełnij je przed zakupem.
                        </p>
                        <button
                          onClick={() => setActiveTab('company')}
                          className="mt-1 text-sm text-[#722F37] font-medium hover:underline"
                        >
                          Uzupełnij dane firmy →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Company */}
            {activeTab === 'company' && (
              <div className="p-5">
                <div className="max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-900">Dane do faktury</h3>
                    {!isEditingCompany && convexUser.companyNip && (
                      <button
                        onClick={() => setIsEditingCompany(true)}
                        className="text-sm text-[#722F37] font-medium hover:underline"
                      >
                        Edytuj
                      </button>
                    )}
                  </div>

                  {isEditingCompany || !convexUser.companyNip ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">Nazwa firmy</label>
                        <input
                          type="text"
                          value={companyForm.companyName}
                          onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                          placeholder="np. Salon Beauty Sp. z o.o."
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">NIP</label>
                        <input
                          type="text"
                          value={companyForm.companyNip}
                          onChange={(e) => setCompanyForm({ ...companyForm, companyNip: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">Adres</label>
                        <input
                          type="text"
                          value={companyForm.companyAddress}
                          onChange={(e) => setCompanyForm({ ...companyForm, companyAddress: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                          placeholder="ul. Przykładowa 1/2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Kod pocztowy</label>
                          <input
                            type="text"
                            value={companyForm.companyPostalCode}
                            onChange={(e) => setCompanyForm({ ...companyForm, companyPostalCode: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                            placeholder="00-000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Miasto</label>
                          <input
                            type="text"
                            value={companyForm.companyCity}
                            onChange={(e) => setCompanyForm({ ...companyForm, companyCity: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                            placeholder="Warszawa"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleSaveCompany}
                          disabled={companySaving}
                          className="flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white text-sm font-medium rounded-lg hover:bg-[#5a252c] transition-colors disabled:opacity-50"
                        >
                          {companySaving ? (
                            <IconLoader2 size={16} className="animate-spin" />
                          ) : (
                            <IconCheck size={16} />
                          )}
                          Zapisz
                        </button>
                        {isEditingCompany && (
                          <button
                            onClick={() => {
                              setIsEditingCompany(false);
                              setCompanyForm({
                                companyName: convexUser.companyName || '',
                                companyNip: convexUser.companyNip || '',
                                companyAddress: convexUser.companyAddress || '',
                                companyCity: convexUser.companyCity || '',
                                companyPostalCode: convexUser.companyPostalCode || '',
                              });
                            }}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            Anuluj
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-slate-500">Firma:</span>
                        <p className="font-medium text-slate-900">{convexUser.companyName}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">NIP:</span>
                        <p className="font-medium text-slate-900">{convexUser.companyNip}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Adres:</span>
                        <p className="font-medium text-slate-900">
                          {convexUser.companyAddress}<br />
                          {convexUser.companyPostalCode} {convexUser.companyCity}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Salon Settings */}
            {activeTab === 'salon' && (
              <div>
                {/* Sub-tabs navigation */}
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setSalonSubTab('data')}
                    className={cn(
                      "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                      salonSubTab === 'data'
                        ? "border-[#722F37] text-[#722F37]"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    )}
                  >
                    <IconBuilding size={16} />
                    Dane
                  </button>
                  <button
                    onClick={() => setSalonSubTab('identity')}
                    className={cn(
                      "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                      salonSubTab === 'identity'
                        ? "border-[#722F37] text-[#722F37]"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    )}
                  >
                    <IconColorSwatch size={16} />
                    Identyfikacja
                  </button>
                </div>

                <div className={cn("p-5", salonSubTab === 'identity' && "p-0")}>
                  <div>
                    {/* Sub-tab: Dane (Salon Data) */}
                    {salonSubTab === 'data' && (
                      <>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium text-slate-900">Dane salonu</h3>
                          {!isEditingSalon && convexUser?.salonName && (
                            <button
                              onClick={() => setIsEditingSalon(true)}
                              className="flex items-center gap-1.5 text-sm text-[#722F37] font-medium hover:underline"
                            >
                              <IconEdit size={14} />
                              Edytuj
                            </button>
                          )}
                        </div>

                        {/* Info about auto-sync */}
                        {!convexUser?.salonName && (
                          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <div className="flex items-start gap-3">
                              <IconPalette size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-amber-800">Dane zostaną pobrane automatycznie</p>
                                <p className="text-xs text-amber-600 mt-1">
                                  Po wykonaniu pierwszego audytu, dane Twojego salonu (nazwa, logo, adres) zostaną automatycznie pobrane z profilu Booksy.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {isEditingSalon || !convexUser?.salonName ? (
                          <div className="space-y-4">
                            {/* Salon Name */}
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Nazwa salonu</label>
                              <input
                                type="text"
                                value={salonForm.salonName}
                                onChange={(e) => setSalonForm({ ...salonForm, salonName: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                                placeholder="np. Studio Urody Anna"
                              />
                            </div>

                            {/* Logo URL */}
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">
                                <span className="flex items-center gap-1.5">
                                  <IconPhoto size={14} className="text-slate-400" />
                                  URL logo
                                </span>
                              </label>
                              <input
                                type="url"
                                value={salonForm.salonLogoUrl}
                                onChange={(e) => setSalonForm({ ...salonForm, salonLogoUrl: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                                placeholder="https://..."
                              />
                              {salonForm.salonLogoUrl && (
                                <div className="mt-2 p-2 bg-slate-50 rounded-lg inline-block">
                                  <img
                                    src={salonForm.salonLogoUrl}
                                    alt="Logo podgląd"
                                    className="h-12 w-12 object-cover rounded"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Address */}
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">
                                <span className="flex items-center gap-1.5">
                                  <IconMapPin size={14} className="text-slate-400" />
                                  Adres
                                </span>
                              </label>
                              <input
                                type="text"
                                value={salonForm.salonAddress}
                                onChange={(e) => setSalonForm({ ...salonForm, salonAddress: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                                placeholder="ul. Przykładowa 1"
                              />
                            </div>

                            {/* City */}
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Miasto</label>
                              <input
                                type="text"
                                value={salonForm.salonCity}
                                onChange={(e) => setSalonForm({ ...salonForm, salonCity: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                                placeholder="Warszawa"
                              />
                            </div>

                            {/* Phone */}
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">
                                <span className="flex items-center gap-1.5">
                                  <IconPhone size={14} className="text-slate-400" />
                                  Telefon
                                </span>
                              </label>
                              <input
                                type="tel"
                                value={salonForm.salonPhone}
                                onChange={(e) => setSalonForm({ ...salonForm, salonPhone: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                                placeholder="+48 123 456 789"
                              />
                            </div>

                            {/* Booksy Profile URL */}
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">
                                <span className="flex items-center gap-1.5">
                                  <IconLink size={14} className="text-slate-400" />
                                  Profil Booksy
                                </span>
                              </label>
                              <input
                                type="url"
                                value={salonForm.booksyProfileUrl}
                                onChange={(e) => setSalonForm({ ...salonForm, booksyProfileUrl: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                                placeholder="https://booksy.com/pl-pl/..."
                              />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                              <button
                                onClick={handleSaveSalon}
                                disabled={salonSaving}
                                className="flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white text-sm font-medium rounded-lg hover:bg-[#5a252c] transition-colors disabled:opacity-50"
                              >
                                {salonSaving ? (
                                  <IconLoader2 size={16} className="animate-spin" />
                                ) : (
                                  <IconCheck size={16} />
                                )}
                                Zapisz
                              </button>
                              {isEditingSalon && (
                                <button
                                  onClick={() => {
                                    setIsEditingSalon(false);
                                    setSalonForm({
                                      salonName: convexUser?.salonName || '',
                                      salonLogoUrl: convexUser?.salonLogoUrl || '',
                                      salonAddress: convexUser?.salonAddress || '',
                                      salonCity: convexUser?.salonCity || '',
                                      salonPhone: convexUser?.salonPhone || '',
                                      booksyProfileUrl: convexUser?.booksyProfileUrl || '',
                                    });
                                  }}
                                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  Anuluj
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          // Display mode
                          <div className="space-y-4">
                            {/* Logo and Name */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                              {convexUser.salonLogoUrl ? (
                                <img
                                  src={convexUser.salonLogoUrl}
                                  alt={convexUser.salonName}
                                  className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-xl bg-[#722F37]/10 flex items-center justify-center">
                                  <IconPalette size={24} className="text-[#722F37]" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-semibold text-slate-900 text-lg">{convexUser.salonName}</h4>
                                {convexUser.salonCity && (
                                  <p className="text-sm text-slate-500">{convexUser.salonCity}</p>
                                )}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-3">
                              {convexUser.salonAddress && (
                                <div className="flex items-start gap-3">
                                  <IconMapPin size={18} className="text-slate-400 mt-0.5" />
                                  <div>
                                    <span className="text-xs text-slate-500">Adres</span>
                                    <p className="text-sm font-medium text-slate-900">
                                      {convexUser.salonAddress}
                                      {convexUser.salonCity && `, ${convexUser.salonCity}`}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {convexUser.salonPhone && (
                                <div className="flex items-start gap-3">
                                  <IconPhone size={18} className="text-slate-400 mt-0.5" />
                                  <div>
                                    <span className="text-xs text-slate-500">Telefon</span>
                                    <p className="text-sm font-medium text-slate-900">{convexUser.salonPhone}</p>
                                  </div>
                                </div>
                              )}

                              {convexUser.booksyProfileUrl && (
                                <div className="flex items-start gap-3">
                                  <IconLink size={18} className="text-slate-400 mt-0.5" />
                                  <div>
                                    <span className="text-xs text-slate-500">Profil Booksy</span>
                                    <a
                                      href={convexUser.booksyProfileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-sm font-medium text-[#722F37] hover:underline truncate max-w-xs"
                                    >
                                      {convexUser.booksyProfileUrl.replace(/^https?:\/\//, '').slice(0, 40)}...
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Sub-tab: Identyfikacja (Visual Identity) */}
                    {salonSubTab === 'identity' && (
                      <div className="p-4 min-h-[600px]">
                        {/* Template Editor */}
                        {(() => {
                          const selectedPricelist = pricelists?.find(p => p._id === selectedPricelistId);
                          const isOptimized = selectedPricelist?.isOptimized ?? false;
                          const hasOptimizedVersion = !!selectedPricelist?.optimizedVersionId;
                          // Show optimization card only for base pricelists that don't have optimized version yet
                          const shouldShowOptimizationCard = !isOptimized && !hasOptimizedVersion;
                          return (
                            <TemplateEditor
                              initialTemplateId={selectedTemplateId}
                              initialTheme={themeConfig}
                              data={selectedPricelistData || SAMPLE_PRICING_DATA}
                              onThemeChange={handleFullThemeChange}
                              onTemplateChange={handleTemplateChange}
                              pricelistId={selectedPricelistId}
                              showOptimizationCard={shouldShowOptimizationCard}
                              onOptimizeClick={selectedPricelistId ? () => handleOptimizePricelist(selectedPricelistId) : undefined}
                              optimizationPrice="29,90 zł"
                              isOptimizing={optimizingPricelist === selectedPricelistId}
                            />
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal podglądu cennika */}
      {previewPricelist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setPreviewPricelist(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold text-slate-900">{previewPricelist.name}</h3>
                <p className="text-sm text-slate-500">Podgląd cennika</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditPricelist(previewPricelist._id)}
                  disabled={editingPricelist === previewPricelist._id}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#722F37] bg-[#722F37]/5 rounded-lg hover:bg-[#722F37]/10 transition-colors disabled:opacity-50"
                >
                  {editingPricelist === previewPricelist._id ? (
                    <IconLoader2 size={14} className="animate-spin" />
                  ) : (
                    <IconEdit size={14} />
                  )}
                  Edytuj
                </button>
                <button
                  onClick={() => handleCopyCode(previewPricelist)}
                  disabled={copyingCode === previewPricelist._id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                    copyingCode === previewPricelist._id
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-slate-600 bg-slate-100 hover:bg-slate-200"
                  )}
                >
                  {copyingCode === previewPricelist._id ? (
                    <>
                      <IconCheck size={14} />
                      Skopiowano!
                    </>
                  ) : (
                    <>
                      <IconCode size={14} />
                      Kopiuj kod
                    </>
                  )}
                </button>
                <button
                  onClick={() => setPreviewPricelist(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <IconX size={18} />
                </button>
              </div>
            </div>

            {/* Modal content - preview */}
            <div className="flex-1 overflow-auto p-6 bg-slate-50">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl mx-auto">
                {(() => {
                  try {
                    const pricingData = JSON.parse(previewPricelist.pricingDataJson) as PricingData;
                    const themeConfig = previewPricelist.themeConfigJson
                      ? JSON.parse(previewPricelist.themeConfigJson) as ThemeConfig
                      : DEFAULT_THEME;
                    const templateId = previewPricelist.templateId || 'modern';
                    const template = getTemplate(templateId);

                    if (template) {
                      const TemplateComponent = template.Component;
                      return (
                        <TemplateComponent
                          data={pricingData}
                          theme={themeConfig}
                          editMode={false}
                        />
                      );
                    }
                    return <p className="p-4 text-slate-500">Nie można załadować szablonu</p>;
                  } catch (e) {
                    console.error('Error rendering preview:', e);
                    return <p className="p-4 text-red-500">Błąd podczas ładowania podglądu</p>;
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
