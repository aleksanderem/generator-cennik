
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Id } from '../convex/_generated/dataModel';
import { CodeBlock } from './ui/code-block';

interface EmbedCodeProps {
  pricelistId?: Id<"pricelists"> | string | null;
}

const EmbedCode: React.FC<EmbedCodeProps> = ({ pricelistId }) => {
  const embedBaseUrl = 'https://app.beautyaudit.pl';

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

  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-[#D4A574]/30 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.4), transparent 40%)' }} />
      <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(212, 165, 116, 0.15), transparent 40%)' }} />
      <div className="relative z-10 overflow-hidden rounded-xl bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05)]">
        <CodeBlock
          code={generateSnippet()}
          title="Kod do osadzenia"
        />
        <p className="text-xs text-slate-500 mt-3">
          Wklej ten kod na swojej stronie internetowej, w miejscu gdzie chcesz wyswietlic cennik.
        </p>
      </div>
    </div>
  );
};

export default EmbedCode;
