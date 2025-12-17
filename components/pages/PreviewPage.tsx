"use client";
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { PricingData, ThemeConfig, DEFAULT_THEME } from '../../types';
import { getTemplate, DEFAULT_TEMPLATE_ID } from '../../lib/pricelist-templates';
import { Id } from '../../convex/_generated/dataModel';

const PreviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const pricelistId = searchParams.get('pricelist');
  const oldDraftId = searchParams.get('draft'); // For showing error on old draft URLs

  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const [templateId, setTemplateId] = useState<string>(DEFAULT_TEMPLATE_ID);
  const [error, setError] = useState<string | null>(null);

  // Fetch pricelist from Convex (public access)
  const pricelist = useQuery(
    api.pricelists.getPricelistPublic,
    pricelistId ? { pricelistId: pricelistId as Id<"pricelists"> } : "skip"
  );

  // Handle pricelist data
  useEffect(() => {
    if (pricelist) {
      try {
        const data = JSON.parse(pricelist.pricingDataJson);
        setPricingData(data);

        if (pricelist.themeConfigJson) {
          setThemeConfig(JSON.parse(pricelist.themeConfigJson));
        }
        if (pricelist.templateId) {
          setTemplateId(pricelist.templateId);
        }
      } catch (e) {
        console.error('Error parsing pricelist:', e);
        setError('Nie udało się załadować cennika.');
      }
    }
  }, [pricelist]);

  // Old draft URL - show error message
  if (oldDraftId) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Link wygasł
          </h2>
          <p className="text-slate-600 mb-4">
            Tymczasowe linki do cenników nie są już obsługiwane.
            Zaloguj się, aby utworzyć i udostępnić swój cennik.
          </p>
          <Link
            to="/sign-in"
            className="inline-flex items-center justify-center px-4 py-2 bg-[#D4A574] hover:bg-[#C9956C] text-white font-medium rounded-lg transition-colors"
          >
            Zaloguj się
          </Link>
        </div>
      </div>
    );
  }

  // No ID provided
  if (!pricelistId) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Brak ID cennika w URL.</p>
          <p className="text-sm text-slate-500 mt-2">Użyj linku z parametrem ?pricelist=...</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (pricelist === undefined) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin" size={24} />
          <span>Ładowanie cennika...</span>
        </div>
      </div>
    );
  }

  // Not found
  if (pricelist === null || error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Cennik nie został znaleziony.'}</p>
        </div>
      </div>
    );
  }

  // Still parsing data
  if (!pricingData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin" size={24} />
          <span>Przetwarzanie danych...</span>
        </div>
      </div>
    );
  }

  const template = getTemplate(templateId);
  if (!template) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-red-600">Szablon nie został znaleziony.</p>
      </div>
    );
  }

  const TemplateComponent = template.Component;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <TemplateComponent
            data={pricingData}
            theme={themeConfig}
            editMode={false}
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;
