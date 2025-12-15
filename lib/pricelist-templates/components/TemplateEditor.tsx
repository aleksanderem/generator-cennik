import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Check, RotateCcw, Palette, Type, Eye, EyeOff, ChevronDown, Sparkles, Code, Copy, Edit3, X, Tag, Clock, DollarSign, FileText, Layers, ExternalLink, Loader2, Zap, Download } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';
import { SketchPicker, ColorResult } from 'react-color';
import { ThemeConfig, DEFAULT_THEME, FONT_OPTIONS } from '../../../types';
import {
  TemplateDefinition,
  ColorZone as ColorZoneType,
  ColorPreset,
  PricingData,
  ServiceItem,
  SAMPLE_PRICING_DATA,
} from '../types';
import { getAllTemplates, getTemplate, DEFAULT_TEMPLATE_ID } from '../registry';
import { COLOR_PRESETS, applyPreset, getPresetsForTemplate } from '../presets';
import { ShineBorder } from '../../../components/ui/shine-border';
import { LampDivider } from '../../../components/ui/lamp';
import { RainbowButton } from '../../../components/ui/rainbow-button';

// ============================================================================
// HTML/CSS CODE GENERATOR
// Generates embeddable HTML with inline CSS for copy-paste
// ============================================================================

export const generateEmbedHTML = (data: PricingData, theme: ThemeConfig): string => {
  const fontHeadingUrl = theme.fontHeading.replace(/ /g, '+');
  const fontBodyUrl = theme.fontBody.replace(/ /g, '+');

  const categoriesHTML = data.categories.map((cat, catIndex) => {
    const servicesHTML = cat.services.map(svc => {
      const imageHTML = svc.imageUrl ?
        `<div class="service-image"><img src="${svc.imageUrl}" alt="${svc.name}" /></div>` : '';

      let tagsHTML = '';
      if (svc.isPromo) tagsHTML += `<span class="tag promo">Promocja</span>`;
      if (svc.tags) {
        svc.tags.forEach(t => {
          tagsHTML += `<span class="tag standard">${t}</span>`;
        });
      }

      return `
        <div class="service-item ${svc.isPromo ? 'is-promo-row' : ''}">
          <div class="service-main">
            ${imageHTML}
            <div class="service-content">
              <div class="service-header">
                <span class="service-name">${svc.name}</span>
                ${tagsHTML ? `<div class="tags-wrapper">${tagsHTML}</div>` : ''}
              </div>
              ${svc.description ? `<p class="service-desc">${svc.description}</p>` : ''}
              ${svc.duration ? `<p class="service-duration">⏱ ${svc.duration}</p>` : ''}
            </div>
          </div>
          <div class="service-price">${svc.price}</div>
        </div>
      `}).join('');

    return `
        <details class="category-group" ${catIndex === 0 ? 'open' : ''}>
          <summary class="category-summary">
            <span class="category-title">${cat.categoryName} <small>(${cat.services.length})</small></span>
            <span class="icon">▼</span>
          </summary>
          <div class="services-list">
            ${servicesHTML}
          </div>
        </details>
      `;
  }).join('');

  return `
<!-- Cennik Salonu - Wygenerowano przez BeautyPricer AI -->
<!-- Font Import -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${fontHeadingUrl}:wght@400;600;700&family=${fontBodyUrl}:wght@300;400;500;700&display=swap" rel="stylesheet">

<style>
  :root {
    /* Brand */
    --bp-primary: ${theme.primaryColor};
    --bp-secondary: ${theme.secondaryColor};

    /* Typography */
    --bp-font-heading: '${theme.fontHeading}', serif;
    --bp-font-body: '${theme.fontBody}', sans-serif;
    --bp-text: ${theme.textColor};
    --bp-text-muted: ${theme.mutedColor};

    /* Boxes */
    --bp-box-bg: ${theme.boxBgColor};
    --bp-box-border: ${theme.boxBorderColor};

    /* Promo */
    --bp-promo-text: ${theme.promoColor};
    --bp-promo-bg: ${theme.promoBgColor};
  }

  .salon-pricing { font-family: var(--bp-font-body); max-width: 800px; margin: 0 auto; color: var(--bp-text); box-sizing: border-box; }
  .salon-pricing * { box-sizing: border-box; }

  /* Details & Summary - Accordion */
  .salon-pricing details { margin-bottom: 1rem; border: 1px solid var(--bp-box-border); border-radius: 0.75rem; overflow: hidden; background: var(--bp-box-bg); transition: all 0.2s; }
  .salon-pricing summary { padding: 1.25rem; background: var(--bp-box-bg); cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 1.125rem; color: var(--bp-text); transition: background 0.2s; font-family: var(--bp-font-heading); }
  .salon-pricing summary:hover { background-color: var(--bp-secondary); opacity: 0.9; }
  .salon-pricing details[open] summary { background-color: var(--bp-secondary); border-bottom: 1px solid var(--bp-box-border); }
  .salon-pricing summary::-webkit-details-marker { display: none; }
  .salon-pricing summary .icon { transition: transform 0.2s; color: var(--bp-primary); }
  .salon-pricing details[open] summary .icon { transform: rotate(180deg); }

  /* List Layout */
  .salon-pricing .services-list { padding: 1.25rem; background: var(--bp-box-bg); }

  .salon-pricing .service-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 1.25rem 1rem;
    border-bottom: 1px solid var(--bp-box-border);
  }
  .salon-pricing .service-item:last-child { border-bottom: none; }

  .salon-pricing .service-main {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    width: 100%;
  }

  /* Promo Box Styles */
  .salon-pricing .service-item.is-promo-row { background: var(--bp-promo-bg); border-radius: 0.5rem; border: 1px solid var(--bp-promo-text); border-color: color-mix(in srgb, var(--bp-promo-text), transparent 70%); margin-bottom: 0.5rem; }

  /* Image */
  .salon-pricing .service-image img { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--bp-box-border); display: block; }

  /* Service Content */
  .salon-pricing .service-content { flex: 1; min-width: 0; }
  .salon-pricing .service-header { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
  .salon-pricing .service-name { font-weight: 600; font-size: 1.1rem; color: var(--bp-text); line-height: 1.3; }

  /* Tags */
  .salon-pricing .tags-wrapper { display: flex; gap: 4px; flex-wrap: wrap; }
  .salon-pricing .tag { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.15rem 0.6rem; border-radius: 99px; font-weight: 700; font-family: sans-serif; white-space: nowrap; }
  .salon-pricing .tag.promo { background: var(--bp-promo-text); color: var(--bp-box-bg); }
  .salon-pricing .tag.standard { background: var(--bp-secondary); color: var(--bp-primary); }

  .salon-pricing .service-desc { font-size: 0.9rem; color: var(--bp-text-muted); margin: 0.25rem 0 0 0; line-height: 1.5; }
  .salon-pricing .service-duration { font-size: 0.75rem; color: var(--bp-text-muted); opacity: 0.8; margin: 0.35rem 0 0 0; font-weight: 500; }

  /* Price */
  .salon-pricing .service-price {
    margin-top: 0.75rem;
    font-weight: 700;
    color: var(--bp-primary);
    font-size: 1.25rem;
    width: 100%;
    text-align: left;
  }
  .salon-pricing .service-item.is-promo-row .service-price { color: var(--bp-promo-text); }

</style>

<div class="salon-pricing">
  ${categoriesHTML}
</div>
    `.trim();
};

// Typ do identyfikacji wybranego elementu do edycji
export type SelectedDataItem =
  | { type: 'category'; categoryIndex: number }
  | { type: 'service'; categoryIndex: number; serviceIndex: number }
  | null;

interface TemplateEditorProps {
  initialTemplateId?: string;
  initialTheme?: ThemeConfig;
  data?: PricingData;
  onThemeChange?: (theme: ThemeConfig) => void;
  onTemplateChange?: (templateId: string) => void;
  onDataChange?: (data: PricingData) => void;
  // Włącza panel edycji treści (druga kolumna po prawej)
  enableDataEditing?: boolean;
  // ID draftu do otwierania podglądu w nowej zakładce
  draftId?: string | null;
  // Optymalizacja AI
  showOptimizationCard?: boolean;
  onOptimizeClick?: () => void;
  isOptimizing?: boolean;
  optimizationPrice?: string;
}

// Typy trybu edycji
type EditMode = 'off' | 'visual' | 'text';

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  initialTemplateId = DEFAULT_TEMPLATE_ID,
  initialTheme = DEFAULT_THEME,
  data = SAMPLE_PRICING_DATA,
  onThemeChange,
  onTemplateChange,
  onDataChange,
  enableDataEditing = false,
  draftId = null,
  showOptimizationCard = false,
  onOptimizeClick,
  isOptimizing = false,
  optimizationPrice = '29,90 zł',
}) => {
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme);
  const [editMode, setEditMode] = useState<EditMode>('visual');
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Stan dla edycji treści
  const [selectedDataItem, setSelectedDataItem] = useState<SelectedDataItem>(null);
  const [hoveredDataItem, setHoveredDataItem] = useState<SelectedDataItem>(null);
  const [pricingData, setPricingData] = useState<PricingData>(data);

  // Aktualizuj pricingData gdy zmienia się prop data
  useEffect(() => {
    setPricingData(data);
  }, [data]);

  // Click outside handler for color picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  const template = getTemplate(templateId);
  const allTemplates = getAllTemplates();
  const recommendedPresets = getPresetsForTemplate(templateId);

  const handleThemeChange = useCallback((key: keyof ThemeConfig, value: string | number) => {
    const newTheme = { ...theme, [key]: value };
    setTheme(newTheme);
    onThemeChange?.(newTheme);
  }, [theme, onThemeChange]);

  const handlePresetApply = useCallback((preset: ColorPreset) => {
    const newTheme = applyPreset(theme, preset);
    setTheme(newTheme);
    onThemeChange?.(newTheme);
    setShowPresets(false);
  }, [theme, onThemeChange]);

  const handleTemplateSelect = useCallback((id: string) => {
    setTemplateId(id);
    onTemplateChange?.(id);
    setShowTemplates(false);

    // Optionally apply template's default theme
    const newTemplate = getTemplate(id);
    if (newTemplate?.defaultTheme) {
      const newTheme = { ...theme, ...newTemplate.defaultTheme };
      setTheme(newTheme);
      onThemeChange?.(newTheme);
    }
  }, [theme, onThemeChange, onTemplateChange]);

  const handleZoneClick = useCallback((zone: ColorZoneType) => {
    setActiveZone(zone.id);
  }, []);

  const handleResetTheme = useCallback(() => {
    if (confirm('Czy na pewno chcesz przywrócić domyślne kolory?')) {
      setTheme(DEFAULT_THEME);
      onThemeChange?.(DEFAULT_THEME);
    }
  }, [onThemeChange]);

  const handleCopyCode = useCallback(() => {
    const code = generateEmbedHTML(pricingData, theme);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pricingData, theme]);

  const handleExportPDF = useCallback(async () => {
    if (!previewRef.current || isExportingPDF) return;

    setIsExportingPDF(true);
    try {
      const salonName = pricingData.salonName || 'cennik';
      const filename = salonName.toLowerCase().replace(/\s+/g, '-');
      await exportToPDF(previewRef.current, { filename });
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExportingPDF(false);
    }
  }, [pricingData.salonName, isExportingPDF]);

  // Funkcja do aktualizacji nazwy kategorii
  const handleUpdateCategoryName = useCallback((categoryIndex: number, newName: string) => {
    const newData = { ...pricingData };
    newData.categories = [...newData.categories];
    newData.categories[categoryIndex] = {
      ...newData.categories[categoryIndex],
      categoryName: newName,
    };
    setPricingData(newData);
    onDataChange?.(newData);
  }, [pricingData, onDataChange]);

  // Funkcja do aktualizacji usługi
  const handleUpdateService = useCallback((
    categoryIndex: number,
    serviceIndex: number,
    updates: Partial<ServiceItem>
  ) => {
    const newData = { ...pricingData };
    newData.categories = [...newData.categories];
    newData.categories[categoryIndex] = {
      ...newData.categories[categoryIndex],
      services: [...newData.categories[categoryIndex].services],
    };
    newData.categories[categoryIndex].services[serviceIndex] = {
      ...newData.categories[categoryIndex].services[serviceIndex],
      ...updates,
    };
    setPricingData(newData);
    onDataChange?.(newData);
  }, [pricingData, onDataChange]);

  // Pobierz aktualnie wybrany element
  const getSelectedItemData = useCallback(() => {
    if (!selectedDataItem) return null;
    if (selectedDataItem.type === 'category') {
      return {
        type: 'category' as const,
        data: pricingData.categories[selectedDataItem.categoryIndex],
        categoryIndex: selectedDataItem.categoryIndex,
      };
    } else {
      const category = pricingData.categories[selectedDataItem.categoryIndex];
      return {
        type: 'service' as const,
        data: category.services[selectedDataItem.serviceIndex],
        categoryIndex: selectedDataItem.categoryIndex,
        serviceIndex: selectedDataItem.serviceIndex,
      };
    }
  }, [selectedDataItem, pricingData]);

  if (!template) {
    return <div>Template not found</div>;
  }

  const TemplateComponent = template.Component;
  const activeZoneData = activeZone
    ? template.colorZones.find(z => z.id === activeZone)
    : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Sidebar - Controls */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
        {/* Template Selector */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Palette size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Szablon</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">{template.metadata.name}</span>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${showTemplates ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {showTemplates && (
            <div className="border-t border-slate-200 p-2 space-y-1">
              {allTemplates.map((t) => (
                <button
                  key={t.metadata.id}
                  onClick={() => handleTemplateSelect(t.metadata.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    templateId === t.metadata.id
                      ? 'bg-[#722F37]/10 text-[#722F37]'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{t.metadata.name}</div>
                    <div className="text-xs text-slate-500">{t.metadata.description}</div>
                  </div>
                  {templateId === t.metadata.id && <Check size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Presets */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Gotowe style</span>
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${showPresets ? 'rotate-180' : ''}`}
            />
          </button>

          {showPresets && (
            <div className="border-t border-slate-200 p-2 max-h-64 overflow-y-auto space-y-1">
              {recommendedPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetApply(preset)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-slate-50 transition-colors"
                >
                  {/* Color preview dots */}
                  <div className="flex -space-x-1">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: preset.colors.primaryColor }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: preset.colors.secondaryColor }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: preset.colors.textColor || '#333' }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700">{preset.name}</div>
                    {preset.description && (
                      <div className="text-xs text-slate-500">{preset.description}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active Zone Editor */}
        {activeZoneData && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-700">
                Edytujesz: {activeZoneData.label}
              </h4>
              <button
                onClick={() => setActiveZone(null)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Zamknij
              </button>
            </div>

            {/* Font Size slider */}
            {activeZoneData.type === 'fontSize' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Rozmiar fontu</span>
                  <span className="text-sm font-mono text-slate-700">
                    {theme[activeZoneData.themeKey] as number}px
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="32"
                  step="1"
                  value={theme[activeZoneData.themeKey] as number}
                  onChange={(e) => handleThemeChange(activeZoneData.themeKey, parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#722F37]"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>10px</span>
                  <span>32px</span>
                </div>
              </div>
            ) : activeZoneData.themeKey === 'fontHeading' || activeZoneData.themeKey === 'fontBody' ? (
              /* Font family selector */
              <select
                value={theme[activeZoneData.themeKey] as string}
                onChange={(e) => handleThemeChange(activeZoneData.themeKey, e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                style={{ fontFamily: theme[activeZoneData.themeKey] as string }}
              >
                {(activeZoneData.themeKey === 'fontHeading' ? FONT_OPTIONS.headings : FONT_OPTIONS.body).map((f) => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                    {f.label}
                  </option>
                ))}
              </select>
            ) : (
              /* Color picker with react-color */
              <div className="relative" ref={colorPickerRef}>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer shadow-sm hover:shadow transition-shadow"
                    style={{ backgroundColor: theme[activeZoneData.themeKey] as string }}
                    title="Kliknij aby otworzyć paletę kolorów"
                  />
                  <input
                    type="text"
                    value={theme[activeZoneData.themeKey] as string}
                    onChange={(e) => handleThemeChange(activeZoneData.themeKey, e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                  />
                </div>
                {showColorPicker && (
                  <div className="absolute z-50 mt-2 left-0">
                    <SketchPicker
                      color={theme[activeZoneData.themeKey] as string}
                      onChange={(color: ColorResult) => handleThemeChange(activeZoneData.themeKey, color.hex)}
                      disableAlpha={true}
                      presetColors={[
                        '#722F37', '#8B4513', '#2F4F4F', '#191970', '#800020',
                        '#D4AF37', '#228B22', '#4169E1', '#DC143C', '#FF8C00',
                        '#333333', '#666666', '#999999', '#CCCCCC', '#F5F5F5',
                        '#FFFFFF', '#000000', '#F8F4E8', '#FFF5E6', '#E8F4F8',
                      ]}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* All Colors Grid */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Palette size={14} />
              Wszystkie kolory
            </h4>
            <button
              onClick={handleResetTheme}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {template.colorZones
              .filter(z => !['fontHeading', 'fontBody'].includes(z.themeKey))
              .slice(0, 8)
              .map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setActiveZone(zone.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    activeZone === zone.id
                      ? 'border-[#722F37] bg-[#722F37]/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded border border-slate-200"
                    style={{ backgroundColor: theme[zone.themeKey] as string }}
                  />
                  <span className="text-xs text-slate-600 truncate">{zone.label}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-4">
            <Type size={14} />
            Typografia
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nagłówki</label>
              <select
                value={theme.fontHeading}
                onChange={(e) => handleThemeChange('fontHeading', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                style={{ fontFamily: theme.fontHeading }}
              >
                {FONT_OPTIONS.headings.map((f) => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Treść</label>
              <select
                value={theme.fontBody}
                onChange={(e) => handleThemeChange('fontBody', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                style={{ fontFamily: theme.fontBody }}
              >
                {FONT_OPTIONS.body.map((f) => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Font Sizes */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-4">
            <Type size={14} />
            Rozmiary fontów
          </h4>

          <div className="space-y-4">
            {[
              { key: 'fontSizeCategory', label: 'Kategoria' },
              { key: 'fontSizeServiceName', label: 'Nazwa usługi' },
              { key: 'fontSizeDescription', label: 'Opis' },
              { key: 'fontSizePrice', label: 'Cena' },
              { key: 'fontSizeDuration', label: 'Czas trwania' },
            ].map(({ key, label }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-500">{label}</label>
                  <span className="text-xs font-mono text-slate-600">
                    {theme[key as keyof ThemeConfig] as number}px
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="32"
                  step="1"
                  value={theme[key as keyof ThemeConfig] as number}
                  onChange={(e) => handleThemeChange(key as keyof ThemeConfig, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#722F37]"
                />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Preview */}
      <div
        className="flex-1 rounded-xl p-6 overflow-auto"
        style={{
          backgroundColor: '#f0f4f8',
          backgroundImage: 'radial-gradient(circle, #d0d9e4 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <div className="max-w-2xl mx-auto">
          {editMode === 'visual' && (
            <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              💡 Kliknij na element aby zmienić jego kolor lub rozmiar
            </div>
          )}
          {editMode === 'text' && (
            <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              ✏️ Najedź na element i kliknij aby edytować tekst
            </div>
          )}

          {/* PDF Download Button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generowanie PDF...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Pobierz PDF
                </>
              )}
            </button>
          </div>

          {/* Podgląd cennika z obsługą hover/click dla trybu text */}
          <div ref={previewRef} className="bg-white rounded-xl shadow-lg">
            {editMode === 'text' ? (
              <div className="p-6">
                {pricingData.categories.map((category, catIndex) => (
                  <div key={catIndex} className="mb-6 last:mb-0">
                    {/* Kategoria - klikalna w trybie text */}
                    <div
                      onClick={() => setSelectedDataItem({ type: 'category', categoryIndex: catIndex })}
                      onMouseEnter={() => setHoveredDataItem({ type: 'category', categoryIndex: catIndex })}
                      onMouseLeave={() => setHoveredDataItem(null)}
                      className={`cursor-pointer transition-all rounded-lg px-3 py-2 -mx-3 ${
                        selectedDataItem?.type === 'category' && selectedDataItem.categoryIndex === catIndex
                          ? 'ring-2 ring-[#722F37] bg-[#722F37]/5'
                          : hoveredDataItem?.type === 'category' && hoveredDataItem.categoryIndex === catIndex
                            ? 'bg-slate-100'
                            : ''
                      }`}
                    >
                      <h3
                        className="font-semibold text-lg"
                        style={{
                          fontFamily: theme.fontHeading,
                          color: theme.primaryColor,
                          fontSize: `${theme.fontSizeCategory}px`,
                        }}
                      >
                        {category.categoryName}
                      </h3>
                    </div>

                    {/* Usługi */}
                    <div className="mt-3 space-y-2">
                      {category.services.map((service, svcIndex) => (
                        <div
                          key={svcIndex}
                          onClick={() => setSelectedDataItem({ type: 'service', categoryIndex: catIndex, serviceIndex: svcIndex })}
                          onMouseEnter={() => setHoveredDataItem({ type: 'service', categoryIndex: catIndex, serviceIndex: svcIndex })}
                          onMouseLeave={() => setHoveredDataItem(null)}
                          className={`cursor-pointer transition-all rounded-lg p-3 ${
                            service.isPromo ? 'border-l-4' : ''
                          } ${
                            selectedDataItem?.type === 'service' &&
                            selectedDataItem.categoryIndex === catIndex &&
                            selectedDataItem.serviceIndex === svcIndex
                              ? 'ring-2 ring-[#722F37] bg-[#722F37]/5'
                              : hoveredDataItem?.type === 'service' &&
                                hoveredDataItem.categoryIndex === catIndex &&
                                hoveredDataItem.serviceIndex === svcIndex
                                ? 'bg-slate-50'
                                : ''
                          }`}
                          style={{
                            backgroundColor: service.isPromo ? theme.promoBgColor : undefined,
                            borderLeftColor: service.isPromo ? theme.promoColor : undefined,
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className="font-medium"
                                  style={{
                                    fontFamily: theme.fontBody,
                                    color: theme.textColor,
                                    fontSize: `${theme.fontSizeServiceName}px`,
                                  }}
                                >
                                  {service.name}
                                </span>
                                {service.isPromo && (
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                    style={{ backgroundColor: theme.promoColor, color: 'white' }}
                                  >
                                    Promocja
                                  </span>
                                )}
                                {service.tags?.map((tag, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: theme.secondaryColor, color: theme.primaryColor }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              {service.description && (
                                <p
                                  className="mt-1"
                                  style={{
                                    fontFamily: theme.fontBody,
                                    color: theme.mutedColor,
                                    fontSize: `${theme.fontSizeDescription}px`,
                                  }}
                                >
                                  {service.description}
                                </p>
                              )}
                              {service.duration && (
                                <p
                                  className="mt-1 opacity-70"
                                  style={{
                                    fontFamily: theme.fontBody,
                                    color: theme.mutedColor,
                                    fontSize: `${theme.fontSizeDuration}px`,
                                  }}
                                >
                                  ⏱ {service.duration}
                                </p>
                              )}
                            </div>
                            <span
                              className="font-bold flex-shrink-0"
                              style={{
                                fontFamily: theme.fontBody,
                                color: service.isPromo ? theme.promoColor : theme.primaryColor,
                                fontSize: `${theme.fontSizePrice}px`,
                              }}
                            >
                              {service.price}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <TemplateComponent
                data={pricingData}
                theme={theme}
                editMode={editMode === 'visual'}
                onColorZoneClick={handleZoneClick}
                activeZone={activeZone}
              />
            )}
          </div>

          {/* Embed Code Section - tylko gdy NIE ma enableDataEditing (bo wtedy jest po prawej) */}
          {!enableDataEditing && (
            <div className="mt-6 bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-700">
              <button
                onClick={() => setShowCode(!showCode)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 hover:bg-slate-750 transition-colors"
              >
                <div className="flex items-center gap-2 text-slate-300">
                  <Code size={18} />
                  <span className="text-sm font-medium">Kod do osadzenia (HTML/CSS)</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-300 ${showCode ? 'rotate-180' : ''}`}
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyCode();
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#722F37] text-white hover:bg-[#5a252c] transition-colors z-10"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Skopiowano!' : 'Kopiuj kod'}
                </button>
              </button>

              {showCode && (
                <div className="p-4 overflow-x-auto max-h-96">
                  <pre className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                    <code>{generateEmbedHTML(pricingData, theme)}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Mode Panel - tylko gdy enableDataEditing=true */}
      {enableDataEditing && (
        <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
          {/* 3-stanowy switch trybu edycji */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <label className="block text-xs font-medium text-slate-600 mb-3">Tryb edycji</label>
            <div className="flex rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => { setEditMode('off'); setSelectedDataItem(null); }}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  editMode === 'off'
                    ? 'bg-white shadow text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <EyeOff size={14} className="mx-auto mb-1" />
                Wył.
              </button>
              <button
                onClick={() => { setEditMode('visual'); setSelectedDataItem(null); }}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  editMode === 'visual'
                    ? 'bg-white shadow text-[#722F37]'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Palette size={14} className="mx-auto mb-1" />
                Wizualna
              </button>
              <button
                onClick={() => { setEditMode('text'); setSelectedDataItem(null); }}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  editMode === 'text'
                    ? 'bg-white shadow text-amber-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Edit3 size={14} className="mx-auto mb-1" />
                Tekst
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              {editMode === 'off' && 'Tryb podglądu - bez edycji'}
              {editMode === 'visual' && 'Kliknij element aby zmienić kolory'}
              {editMode === 'text' && 'Najedź i kliknij aby edytować tekst'}
            </p>

            {/* Przycisk otwierania podglądu w nowej zakładce */}
            {draftId && (
              <button
                onClick={() => window.open(`/preview?draft=${draftId}`, '_blank')}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                <ExternalLink size={16} />
                Otwórz podgląd
              </button>
            )}
          </div>

          {/* Panel edycji wybranego elementu - tylko w trybie text */}
          {editMode === 'text' && selectedDataItem && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {selectedDataItem.type === 'category' ? 'Edytuj kategorię' : 'Edytuj usługę'}
                </span>
                <button
                  onClick={() => setSelectedDataItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {selectedDataItem.type === 'category' ? (
                  /* Edycja kategorii */
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Nazwa kategorii
                    </label>
                    <input
                      type="text"
                      value={pricingData.categories[selectedDataItem.categoryIndex].categoryName}
                      onChange={(e) => handleUpdateCategoryName(selectedDataItem.categoryIndex, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                      autoFocus
                    />
                  </div>
                ) : (
                  /* Edycja usługi */
                  <>
                    {/* Nazwa */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1">
                        <FileText size={12} />
                        Nazwa
                      </label>
                      <input
                        type="text"
                        value={pricingData.categories[selectedDataItem.categoryIndex].services[selectedDataItem.serviceIndex].name}
                        onChange={(e) => handleUpdateService(selectedDataItem.categoryIndex, selectedDataItem.serviceIndex, { name: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                        autoFocus
                      />
                    </div>

                    {/* Cena */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1">
                        <DollarSign size={12} />
                        Cena
                      </label>
                      <input
                        type="text"
                        value={pricingData.categories[selectedDataItem.categoryIndex].services[selectedDataItem.serviceIndex].price}
                        onChange={(e) => handleUpdateService(selectedDataItem.categoryIndex, selectedDataItem.serviceIndex, { price: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                      />
                    </div>

                    {/* Opis */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1">
                        <FileText size={12} />
                        Opis
                      </label>
                      <textarea
                        value={pricingData.categories[selectedDataItem.categoryIndex].services[selectedDataItem.serviceIndex].description || ''}
                        onChange={(e) => handleUpdateService(selectedDataItem.categoryIndex, selectedDataItem.serviceIndex, { description: e.target.value || undefined })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37] resize-none"
                        rows={2}
                        placeholder="Krótki opis..."
                      />
                    </div>

                    {/* Czas trwania */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1">
                        <Clock size={12} />
                        Czas
                      </label>
                      <input
                        type="text"
                        value={pricingData.categories[selectedDataItem.categoryIndex].services[selectedDataItem.serviceIndex].duration || ''}
                        onChange={(e) => handleUpdateService(selectedDataItem.categoryIndex, selectedDataItem.serviceIndex, { duration: e.target.value || undefined })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                        placeholder="np. 60 min"
                      />
                    </div>

                    {/* Promocja i Tagi */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-slate-600">Promo</label>
                        <button
                          onClick={() => handleUpdateService(
                            selectedDataItem.categoryIndex,
                            selectedDataItem.serviceIndex,
                            { isPromo: !pricingData.categories[selectedDataItem.categoryIndex].services[selectedDataItem.serviceIndex].isPromo }
                          )}
                          className={`relative w-9 h-5 rounded-full transition-colors ${
                            pricingData.categories[selectedDataItem.categoryIndex].services[selectedDataItem.serviceIndex].isPromo
                              ? 'bg-[#722F37]'
                              : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              pricingData.categories[selectedDataItem.categoryIndex].services[selectedDataItem.serviceIndex].isPromo
                                ? 'translate-x-4'
                                : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          value={(pricingData.categories[selectedDataItem.categoryIndex].services[selectedDataItem.serviceIndex].tags || []).join(', ')}
                          onChange={(e) => {
                            const tagsString = e.target.value;
                            const tags = tagsString
                              .split(',')
                              .map(t => t.trim())
                              .filter(t => t.length > 0);
                            handleUpdateService(
                              selectedDataItem.categoryIndex,
                              selectedDataItem.serviceIndex,
                              { tags: tags.length > 0 ? tags : undefined }
                            );
                          }}
                          className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#722F37]/20"
                          placeholder="Tagi (przecinki)"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Podpowiedź gdy nie wybrano elementu w trybie text */}
          {editMode === 'text' && !selectedDataItem && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <p className="text-sm text-amber-700">
                Kliknij na kategorię lub usługę w podglądzie, aby edytować jej treść.
              </p>
            </div>
          )}

          {/* AI Optimization Card - karta zachęcająca do optymalizacji */}
          {showOptimizationCard && (
            <div className="relative rounded-2xl overflow-hidden">
              <ShineBorder
                borderWidth={2}
                duration={8}
                shineColor={["#D4A574", "#C9956C", "#E8C4A0"]}
                className="rounded-2xl"
              />
              {/* Ciemne tło */}
              <div className="relative p-5 rounded-2xl bg-[#0d0d0d]">
                {/* Header z emblemem */}
                <div className="relative flex items-center gap-3 mb-3">
                  <img
                    src="/emblem.png"
                    alt="Beauty Audit"
                    className="w-10 h-10 rounded-xl"
                  />
                  <div>
                    <h3 className="text-white font-bold text-sm">Optymalizacja AI</h3>
                    <p className="text-[#D4A574]/70 text-xs">Popraw cennik jednym kliknięciem</p>
                  </div>
                </div>

                {/* Lamp divider */}
                <LampDivider className="h-10 -my-1" />

                {/* Benefity */}
                <div className="relative space-y-2 mb-4">
                  {[
                    'Profesjonalne opisy usług',
                    'Poprawiony copywriting sprzedażowy',
                    'Wykrywanie duplikatów i błędów',
                    'Optymalna kolejność kategorii',
                  ].map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(212, 165, 116, 0.2)' }}
                      >
                        <Check size={10} style={{ color: '#D4A574' }} />
                      </div>
                      <span className="text-slate-300 text-xs">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Cena */}
                <div className="relative flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-white">{optimizationPrice}</span>
                    <span className="text-slate-600 text-xs ml-2 line-through">59,90 zł</span>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{
                      color: '#D4A574',
                      backgroundColor: 'rgba(212, 165, 116, 0.15)',
                      border: '1px solid rgba(212, 165, 116, 0.3)',
                    }}
                  >
                    -50%
                  </span>
                </div>

                {/* Rainbow Button */}
                <RainbowButton
                  onClick={onOptimizeClick}
                  disabled={isOptimizing}
                  className="w-full h-11 text-sm"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Optymalizuję...
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      Zoptymalizuj cennik
                    </>
                  )}
                </RainbowButton>

                {/* Trust badge */}
                <p className="relative text-center text-slate-500 text-[10px] mt-3">
                  Bezpieczna płatność Stripe • Faktura VAT
                </p>
              </div>
            </div>
          )}

          {/* Embed Code Section - w pełnym edytorze po prawej */}
          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-700">
            <button
              onClick={() => setShowCode(!showCode)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 hover:bg-slate-750 transition-colors"
            >
              <div className="flex items-center gap-2 text-slate-300">
                <Code size={18} />
                <span className="text-sm font-medium">Kod HTML/CSS</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${showCode ? 'rotate-180' : ''}`}
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyCode();
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#722F37] text-white hover:bg-[#5a252c] transition-colors z-10"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Skopiowano!' : 'Kopiuj'}
              </button>
            </button>

            {showCode && (
              <div className="p-3 overflow-x-auto max-h-64">
                <pre className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                  <code>{generateEmbedHTML(pricingData, theme)}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;
