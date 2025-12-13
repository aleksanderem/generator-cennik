import React, { useState, useCallback } from 'react';
import { Check, RotateCcw, Palette, Type, Eye, EyeOff, ChevronDown, Sparkles } from 'lucide-react';
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

  const template = getTemplate(templateId);
  const allTemplates = getAllTemplates();
  const recommendedPresets = getPresetsForTemplate(templateId);

  const handleThemeChange = useCallback((key: keyof ThemeConfig, value: string) => {
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

            {/* Color picker */}
            {activeZoneData.themeKey !== 'fontHeading' && activeZoneData.themeKey !== 'fontBody' ? (
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
            ) : (
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

        {/* Edit Mode Toggle */}
        <button
          onClick={() => setEditMode(!editMode)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
            editMode
              ? 'bg-[#722F37] text-white border-[#722F37]'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {editMode ? <Eye size={16} /> : <EyeOff size={16} />}
          {editMode ? 'Tryb edycji włączony' : 'Włącz tryb edycji'}
        </button>

        {/* Save Button */}
        {onSave && (
          <button
            onClick={() => onSave(templateId, theme)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#722F37] text-white rounded-xl hover:bg-[#5a252c] transition-colors"
          >
            <Check size={16} />
            Zapisz zmiany
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="flex-1 bg-slate-100 rounded-xl p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          {editMode && (
            <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              💡 Kliknij na element aby zmienić jego kolor
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <TemplateComponent
              data={data}
              theme={theme}
              editMode={editMode}
              onColorZoneClick={handleZoneClick}
              activeZone={activeZone}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
