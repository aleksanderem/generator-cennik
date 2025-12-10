
import React from 'react';
import { RefreshCw, Palette, Type, Workflow, Zap, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { ThemeConfig, DEFAULT_THEME, FONT_OPTIONS, IntegrationMode } from '../types';

interface ConfigPanelProps {
  config: ThemeConfig;
  onChange: (newConfig: ThemeConfig) => void;
}

// Clean Color Input Component
const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div>
    <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
    <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-8 rounded cursor-pointer border-0 p-0"
      />
      <span className="text-xs text-slate-500 font-mono uppercase">{value}</span>
    </div>
  </div>
);

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
  const { isSignedIn, isLoaded } = useUser();

  const updateConfig = (key: keyof ThemeConfig, value: string | IntegrationMode) => {
    onChange({ ...config, [key]: value });
  };

  const resetTheme = () => {
    if(confirm("Czy na pewno chcesz przywrócić ustawienia domyślne?")) {
      onChange(DEFAULT_THEME);
    }
  };

  return (
    <div className="space-y-5">

      {/* Save Settings Info */}
      {isLoaded && (
        <div className={`p-3 rounded-lg border ${isSignedIn ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          {isSignedIn ? (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 size={14} />
              <span>Ustawienia zapisują się automatycznie</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <Info size={14} />
              <span>Zaloguj się aby zapisać ustawienia</span>
            </div>
          )}
        </div>
      )}

      {/* Integration Mode */}
      <div>
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2.5 flex items-center gap-2">
          <Zap size={14} className="text-slate-400" /> Tryb integracji
        </h3>
        <div className="bg-slate-100 p-1 rounded-lg flex">
           <button
             onClick={() => updateConfig('integrationMode', 'N8N')}
             className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${config.integrationMode === 'N8N' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Workflow size={14} /> n8n
           </button>
           <button
             onClick={() => updateConfig('integrationMode', 'NATIVE')}
             className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${config.integrationMode === 'NATIVE' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Sparkles size={14} /> Native
           </button>
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
            <Palette size={14} className="text-slate-400" /> Kolorystyka
          </h3>
          <button
            onClick={resetTheme}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            <RefreshCw size={10} /> Reset
          </button>
        </div>

        {/* Main Colors */}
        <div className="grid grid-cols-2 gap-3">
          <ColorInput label="Kolor główny" value={config.primaryColor} onChange={(v) => updateConfig("primaryColor", v)} />
          <ColorInput label="Kolor dodatkowy" value={config.secondaryColor} onChange={(v) => updateConfig("secondaryColor", v)} />
        </div>

        {/* Box Colors */}
        <div className="grid grid-cols-2 gap-3">
          <ColorInput label="Tło boksu" value={config.boxBgColor} onChange={(v) => updateConfig("boxBgColor", v)} />
          <ColorInput label="Obramowanie" value={config.boxBorderColor} onChange={(v) => updateConfig("boxBorderColor", v)} />
        </div>

        {/* Text Colors */}
        <div className="grid grid-cols-2 gap-3">
          <ColorInput label="Tekst główny" value={config.textColor} onChange={(v) => updateConfig("textColor", v)} />
          <ColorInput label="Tekst opisowy" value={config.mutedColor} onChange={(v) => updateConfig("mutedColor", v)} />
        </div>

        {/* Promo Colors */}
        <div className="grid grid-cols-2 gap-3">
          <ColorInput label="Akcent promocji" value={config.promoColor} onChange={(v) => updateConfig("promoColor", v)} />
          <ColorInput label="Tło promocji" value={config.promoBgColor} onChange={(v) => updateConfig("promoBgColor", v)} />
        </div>
      </div>

      {/* Fonts */}
      <div>
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Type size={14} className="text-slate-400" /> Typografia
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Nagłówki</label>
            <select
              value={config.fontHeading}
              onChange={(e) => updateConfig('fontHeading', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-300 outline-none text-slate-700 transition-all cursor-pointer"
              style={{ fontFamily: config.fontHeading }}
            >
              {FONT_OPTIONS.headings.map(f => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Treść</label>
            <select
              value={config.fontBody}
              onChange={(e) => updateConfig('fontBody', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-200 focus:border-slate-300 outline-none text-slate-700 transition-all cursor-pointer"
              style={{ fontFamily: config.fontBody }}
            >
              {FONT_OPTIONS.body.map(f => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
