
import React, { useState } from 'react';
import { Check, Copy, Code, ChevronDown } from 'lucide-react';
import { PricingData, ThemeConfig } from '../types';

interface EmbedCodeProps {
  data: PricingData;
  theme: ThemeConfig;
}

const EmbedCode: React.FC<EmbedCodeProps> = ({ data, theme }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const generateHTML = () => {
    // Escape spaces for font URLs
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

  /* Details & Summary */
  .salon-pricing details { margin-bottom: 1rem; border: 1px solid var(--bp-box-border); border-radius: 0.75rem; overflow: hidden; background: var(--bp-box-bg); transition: all 0.2s; }
  .salon-pricing summary { padding: 1.25rem; background: var(--bp-box-bg); cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 1.125rem; color: var(--bp-text); transition: background 0.2s; font-family: var(--bp-font-heading); }
  .salon-pricing summary:hover { background-color: var(--bp-secondary); opacity: 0.9; }
  .salon-pricing details[open] summary { background-color: var(--bp-secondary); border-bottom: 1px solid var(--bp-box-border); }
  .salon-pricing summary::-webkit-details-marker { display: none; }
  .salon-pricing summary .icon { transition: transform 0.2s; color: var(--bp-primary); }
  .salon-pricing details[open] summary .icon { transform: rotate(180deg); }
  
  /* List Layout - Vertical Stack as requested */
  .salon-pricing .services-list { padding: 1.25rem; background: var(--bp-box-bg); }
  
  .salon-pricing .service-item { 
    display: flex; 
    flex-direction: column; /* Stack content and price vertically */
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
  
  /* Price - Now on its own row below content */
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

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const code = generateHTML();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 hover:bg-slate-750 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-300">
          <Code size={18} />
          <span className="text-xs md:text-sm font-medium">Kod do osadzenia (HTML/CSS)</span>
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
        <div className="p-4 overflow-x-auto animate-in slide-in-from-top-4 duration-300">
          <pre className="text-xs text-slate-300 font-mono leading-relaxed">
            <code>{generateHTML()}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default EmbedCode;
