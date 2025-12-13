import React, { useState, useCallback } from 'react';
import { Check, RotateCcw, Palette, Type, Eye, EyeOff, ChevronDown, Sparkles, Code, Copy } from 'lucide-react';
import { ThemeConfig, DEFAULT_THEME, FONT_OPTIONS } from '../../../types';
import {
  TemplateDefinition,
  ColorZone as ColorZoneType,
  ColorPreset,
  PricingData,
  SAMPLE_PRICING_DATA,
} from '../types';
import { getAllTemplates, getTemplate, DEFAULT_TEMPLATE_ID } from '../registry';
import { COLOR_PRESETS, applyPreset, getPresetsForTemplate } from '../presets';

// ============================================================================
// HTML/CSS CODE GENERATOR
// Generates embeddable HTML with inline CSS for copy-paste
// ============================================================================

const generateEmbedHTML = (data: PricingData, theme: ThemeConfig): string => {
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

interface TemplateEditorProps {
  initialTemplateId?: string;
  initialTheme?: ThemeConfig;
  data?: PricingData;
  onThemeChange?: (theme: ThemeConfig) => void;
  onTemplateChange?: (templateId: string) => void;
  onSave?: (templateId: string, theme: ThemeConfig) => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  initialTemplateId = DEFAULT_TEMPLATE_ID,
  initialTheme = DEFAULT_THEME,
  data = SAMPLE_PRICING_DATA,
  onThemeChange,
  onTemplateChange,
  onSave,
}) => {
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme);
  const [editMode, setEditMode] = useState(true);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

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
    const code = generateEmbedHTML(data, theme);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data, theme]);

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
              /* Color picker */
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme[activeZoneData.themeKey] as string}
                  onChange={(e) => handleThemeChange(activeZoneData.themeKey, e.target.value)}
                  className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={theme[activeZoneData.themeKey] as string}
                  onChange={(e) => handleThemeChange(activeZoneData.themeKey, e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                />
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

        {/* Edit Mode Toggle */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {editMode ? <Eye size={16} className="text-[#722F37]" /> : <EyeOff size={16} className="text-slate-400" />}
              <span className="text-sm font-medium text-slate-700">Tryb edycji</span>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                editMode ? 'bg-[#722F37]' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  editMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {editMode ? 'Kliknij elementy aby edytować' : 'Włącz aby edytować kolory i rozmiary'}
          </p>
        </div>

        {/* Save Button */}
        {onSave && (
          <button
            onClick={() => {
              onSave(templateId, theme);
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-[#722F37] text-white hover:bg-[#5a252c]'
            }`}
          >
            <Check size={16} />
            {saved ? 'Zapisano!' : 'Zapisz zmiany'}
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="flex-1 bg-slate-100 rounded-xl p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          {editMode && (
            <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              💡 Kliknij na element aby zmienić jego kolor lub rozmiar
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg">
            <TemplateComponent
              data={data}
              theme={theme}
              editMode={editMode}
              onColorZoneClick={handleZoneClick}
              activeZone={activeZone}
            />
          </div>

          {/* Embed Code Section */}
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
                  <code>{generateEmbedHTML(data, theme)}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
