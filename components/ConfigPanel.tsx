
import React, { useState } from 'react';
import { Settings, RefreshCw, Palette, Type, Save, Download, Cloud, CheckCircle2, Workflow, Zap } from 'lucide-react';
import { ThemeConfig, DEFAULT_THEME, FONT_OPTIONS, IntegrationMode } from '../types';
import { storageService } from '../services/storageService';

interface ConfigPanelProps {
  config: ThemeConfig;
  onChange: (newConfig: ThemeConfig) => void;
}

// Moved outside to prevent re-mounting and losing focus/state (Color Picker fix)
const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div>
    <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-8 rounded cursor-pointer border-0 p-0 shadow-sm shrink-0"
      />
      <span className="text-xs text-slate-600 font-mono flex-1 uppercase truncate">{value}</span>
    </div>
  </div>
);

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
  const [email, setEmail] = useState('');
  const [lastSyncedEmail, setLastSyncedEmail] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const updateConfig = (key: keyof ThemeConfig, value: string | IntegrationMode) => {
    onChange({ ...config, [key]: value });
  };

  const resetTheme = () => {
    if(confirm("Czy na pewno chcesz przywrócić ustawienia domyślne?")) {
      onChange(DEFAULT_THEME);
    }
  };

  const handleSave = async () => {
    if (!email.includes('@')) {
      setSyncMessage({ type: 'error', text: 'Wpisz poprawny email' });
      return;
    }
    setIsSyncing(true);
    const success = await storageService.saveConfig(email, config);
    setIsSyncing(false);
    if (success) {
      setLastSyncedEmail(email);
      setSyncMessage({ type: 'success', text: 'Zapisano w chmurze!' });
      setTimeout(() => setSyncMessage(null), 3000);
    } else {
      setSyncMessage({ type: 'error', text: 'Błąd zapisu' });
    }
  };

  const handleLoad = async () => {
    if (!email.includes('@')) {
      setSyncMessage({ type: 'error', text: 'Wpisz poprawny email' });
      return;
    }
    setIsSyncing(true);
    const loadedConfig = await storageService.loadConfig(email);
    setIsSyncing(false);
    if (loadedConfig) {
      onChange(loadedConfig);
      setLastSyncedEmail(email);
      setSyncMessage({ type: 'success', text: 'Wczytano konfigurację!' });
      setTimeout(() => setSyncMessage(null), 3000);
    } else {
      setSyncMessage({ type: 'error', text: 'Nie znaleziono konfiguracji dla tego adresu.' });
    }
  };

  const isSynced = lastSyncedEmail === email && email.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 mb-6 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Settings size={20} className="text-slate-400" />
          Konfiguracja
        </h2>
        <button 
          onClick={resetTheme}
          className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
          title="Przywróć domyślne"
        >
          <RefreshCw size={12} /> Reset
        </button>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Sync Section */}
        <div className={`p-4 rounded-xl border transition-colors ${isSynced ? 'bg-green-50 border-green-200' : 'bg-indigo-50/50 border-indigo-100'}`}>
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 ${isSynced ? 'text-green-700' : 'text-indigo-900'}`}>
            <Cloud size={14} className={isSynced ? 'text-green-600' : 'text-indigo-500'} /> 
            {isSynced ? 'Konto aktywne' : 'Zapis w chmurze'}
          </h3>
          <div className="flex flex-col gap-3">
             <div className="relative">
               <input 
                type="email" 
                placeholder="Twój adres email (identyfikator)" 
                className={`w-full text-sm p-2 pr-8 rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 placeholder:text-slate-400 ${isSynced ? 'border-green-300 focus:ring-green-200' : 'border-indigo-200 focus:ring-indigo-200'}`}
                value={email}
                onChange={e => setEmail(e.target.value)}
               />
               {isSynced && <CheckCircle2 size={16} className="absolute right-3 top-2.5 text-green-500" />}
             </div>
             
             <div className="flex gap-2">
               <button 
                 onClick={handleSave}
                 disabled={isSyncing}
                 className={`flex-1 flex items-center justify-center gap-2 text-white text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-50 ${isSynced ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
               >
                 {isSyncing ? '...' : <><Save size={14} /> Zapisz</>}
               </button>
               <button 
                 onClick={handleLoad}
                 disabled={isSyncing}
                 className="flex-1 flex items-center justify-center gap-2 bg-white text-indigo-700 border border-indigo-200 text-xs font-medium py-2 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
               >
                 {isSyncing ? '...' : <><Download size={14} /> Wczytaj</>}
               </button>
             </div>
             {syncMessage && (
               <div className={`text-xs text-center font-medium ${syncMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                 {syncMessage.text}
               </div>
             )}
          </div>
        </div>

        {/* Integration Mode */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap size={14} /> Integracje (Audyt)
          </h3>
          <div className="bg-slate-50 p-1 rounded-lg border border-slate-200 flex">
             <button 
               onClick={() => updateConfig('integrationMode', 'N8N')}
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${config.integrationMode === 'N8N' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Workflow size={14} /> n8n Workflow
             </button>
             <button 
               onClick={() => updateConfig('integrationMode', 'NATIVE')}
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${config.integrationMode === 'NATIVE' ? 'bg-white text-rose-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Zap size={14} /> Native (Mock)
             </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 px-1">
             {config.integrationMode === 'N8N' ? 'Używa zewnętrznego silnika n8n do scrapowania i analizy.' : 'Symuluje działanie lokalne na podstawie przykładowych danych (Firecrawl + Gemini).'}
          </p>
        </div>

        {/* Colors */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Palette size={14} /> Kolorystyka
          </h3>
          
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-800 block mb-2">Główne</span>
              <div className="grid grid-cols-2 gap-3">
                <ColorInput label="Akcent Główny" value={config.primaryColor} onChange={(v) => updateConfig("primaryColor", v)} />
                <ColorInput label="Tło (Nagłówki)" value={config.secondaryColor} onChange={(v) => updateConfig("secondaryColor", v)} />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-800 block mb-2">Usługi i Tekst</span>
              <div className="grid grid-cols-2 gap-3">
                <ColorInput label="Tło Boksu" value={config.boxBgColor} onChange={(v) => updateConfig("boxBgColor", v)} />
                <ColorInput label="Obramowanie" value={config.boxBorderColor} onChange={(v) => updateConfig("boxBorderColor", v)} />
                <ColorInput label="Tekst Główny" value={config.textColor} onChange={(v) => updateConfig("textColor", v)} />
                <ColorInput label="Tekst Opisu" value={config.mutedColor} onChange={(v) => updateConfig("mutedColor", v)} />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-amber-600 block mb-2">Promocje</span>
              <div className="grid grid-cols-2 gap-3">
                <ColorInput label="Akcent Promocji" value={config.promoColor} onChange={(v) => updateConfig("promoColor", v)} />
                <ColorInput label="Tło Promocji" value={config.promoBgColor} onChange={(v) => updateConfig("promoBgColor", v)} />
              </div>
            </div>
          </div>
        </div>

        {/* Fonts */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Type size={14} /> Typografia
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nagłówki</label>
              <select
                value={config.fontHeading}
                onChange={(e) => updateConfig('fontHeading', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-100 outline-none text-slate-800"
              >
                {FONT_OPTIONS.headings.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Treść</label>
              <select
                value={config.fontBody}
                onChange={(e) => updateConfig('fontBody', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-100 outline-none text-slate-800"
              >
                {FONT_OPTIONS.body.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
