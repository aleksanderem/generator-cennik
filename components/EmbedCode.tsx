
import React, { useState } from 'react';
import { Check, Copy, Code, ChevronDown, AlertCircle } from 'lucide-react';
import { Id } from '../convex/_generated/dataModel';

interface EmbedCodeProps {
  pricelistId?: Id<"pricelists"> | string | null;
}

const EmbedCode: React.FC<EmbedCodeProps> = ({ pricelistId }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const embedBaseUrl = 'https://app.beautyaudit.pl';

  const generateSnippet = () => {
    if (!pricelistId) return '';
    return `<script src="${embedBaseUrl}/embed.js" data-pricelist="${pricelistId}"></script>`;
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const code = generateSnippet();
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // If no pricelistId, show save prompt
  if (!pricelistId) {
    return (
      <div className="mt-8 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <AlertCircle size={18} className="text-slate-400" />
          <span className="text-sm text-slate-500">Zapisz cennik aby otrzymac kod do osadzenia</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 hover:bg-slate-750 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-300">
          <Code size={18} />
          <span className="text-xs md:text-sm font-medium">Kod do osadzenia</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
        <div
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors z-10"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Skopiowano!' : 'Kopiuj kod'}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-950 rounded-lg p-3 overflow-x-auto">
            <pre className="text-sm text-emerald-400 font-mono">
              <code>{generateSnippet()}</code>
            </pre>
          </div>
          <p className="text-xs text-slate-400">
            Wklej ten kod na swojej stronie internetowej, w miejscu gdzie chcesz wyswietlic cennik.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmbedCode;
