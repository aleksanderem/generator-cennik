
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
      <div className="mt-6 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <AlertCircle size={18} className="text-slate-400" />
          <span className="text-sm text-slate-500">Zapisz cennik aby otrzymac kod do osadzenia</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      <CodeBlock
        code={generateSnippet()}
        language="html"
        filename="embed-code.html"
      />
      <p className="text-xs text-slate-500 px-1">
        Wklej ten kod na swojej stronie internetowej, w miejscu gdzie chcesz wyswietlic cennik.
      </p>
    </div>
  );
};

export default EmbedCode;
