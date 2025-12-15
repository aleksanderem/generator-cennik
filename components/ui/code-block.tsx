"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../../lib/utils";

interface CodeBlockProps {
  code: string;
  className?: string;
}

export function CodeBlock({ code, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe syntax highlighting using React elements
  const renderHighlightedCode = (code: string) => {
    const lines = code.split('\n');
    return lines.map((line, lineIndex) => {
      const parts: React.ReactNode[] = [];
      let remaining = line;
      let keyIndex = 0;

      // Match patterns and build React elements safely
      const patterns = [
        { regex: /(<\/?script>?)/g, className: 'text-blue-600' },
        { regex: /(src|data-pricelist)(?==)/g, className: 'text-purple-600' },
        { regex: /("https?:\/\/[^"]+"|"[a-z0-9]+")(?!:)/gi, className: 'text-emerald-600' },
      ];

      // Simple approach: render the whole line with basic highlighting
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
    <div className={cn("", className)}>
      {/* Copy button */}
      <div className="flex justify-end mb-3">
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

      {/* Code content */}
      <div className="rounded-lg bg-rose-50/50 border-l-4 border-rose-300 p-4 overflow-hidden">
        <pre className="text-sm leading-relaxed">
          <code className="font-mono text-slate-700 whitespace-pre">
            {renderHighlightedCode(code)}
          </code>
        </pre>
      </div>
    </div>
  );
}
