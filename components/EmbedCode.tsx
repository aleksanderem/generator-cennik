
import React, { useState } from 'react';
import { AlertCircle, Code2, Copy, Check } from 'lucide-react';
import { Id } from '../convex/_generated/dataModel';

interface EmbedCodeProps {
  pricelistId?: Id<"pricelists"> | string | null;
}

const EmbedCode: React.FC<EmbedCodeProps> = ({ pricelistId }) => {
  const [copied, setCopied] = useState(false);
  const embedBaseUrl = 'https://app.beautyaudit.pl';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateSnippet = () => {
    if (!pricelistId) return '';
    return `<script
  src="${embedBaseUrl}/embed.js"
  data-pricelist="${pricelistId}">
</script>`;
  };

  // If no pricelistId, show save prompt
  if (!pricelistId) {
    return (
      <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
        <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
        <div className="relative z-10 overflow-hidden rounded-xl bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-slate-400" />
            <span className="text-sm text-slate-500">Zapisz cennik aby otrzymac kod do osadzenia</span>
          </div>
        </div>
      </div>
    );
  }

  const renderHighlightedCode = (code: string) => {
    const lines = code.split('\n');
    return lines.map((line, lineIndex) => {
      const parts: React.ReactNode[] = [];
      let keyIndex = 0;

      if (line.includes('<script') || line.includes('</script>')) {
        parts.push(<span key={keyIndex++} className="text-blue-600">{line}</span>);
      } else if (line.includes('src=')) {
        const srcMatch = line.match(/(.*)(src=)("[^"]+")(.*)/);
        if (srcMatch) {
          parts.push(<span key={keyIndex++}>{srcMatch[1]}</span>);
          parts.push(<span key={keyIndex++} className="text-purple-600">{srcMatch[2]}</span>);
          parts.push(<span key={keyIndex++} className="text-emerald-600">{srcMatch[3]}</span>);
          parts.push(<span key={keyIndex++}>{srcMatch[4]}</span>);
        } else {
          parts.push(<span key={keyIndex++}>{line}</span>);
        }
      } else if (line.includes('data-pricelist=')) {
        const dataMatch = line.match(/(.*)(data-pricelist=)("[^"]+")(.*)/);
        if (dataMatch) {
          parts.push(<span key={keyIndex++}>{dataMatch[1]}</span>);
          parts.push(<span key={keyIndex++} className="text-purple-600">{dataMatch[2]}</span>);
          parts.push(<span key={keyIndex++} className="text-emerald-600">{dataMatch[3]}</span>);
          parts.push(<span key={keyIndex++}>{dataMatch[4]}</span>);
        } else {
          parts.push(<span key={keyIndex++}>{line}</span>);
        }
      } else {
        parts.push(<span key={keyIndex++}>{line}</span>);
      }

      return (
        <React.Fragment key={lineIndex}>
          {parts}
          {lineIndex < lines.length - 1 && '\n'}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
      <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
      <div className="relative z-10 overflow-hidden rounded-xl bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#D4A574]" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">Kod do osadzenia</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-600">Skopiowano</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Kopiuj</span>
              </>
            )}
          </button>
        </div>
        <div className="rounded-lg bg-rose-50/50 border-l-4 border-rose-300 p-4 overflow-hidden">
          <pre className="text-xs leading-relaxed">
            <code className="font-mono text-slate-700 whitespace-pre">
              {renderHighlightedCode(generateSnippet())}
            </code>
          </pre>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Wklej ten kod na swojej stronie internetowej, w miejscu gdzie chcesz wyswietlic cennik.
        </p>
      </div>
    </div>
  );
};

export default EmbedCode;
