"use client";
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Loader2 } from 'lucide-react';
import { PricingData, ThemeConfig, DEFAULT_THEME } from '../../types';
import { getTemplate, DEFAULT_TEMPLATE_ID } from '../../lib/pricelist-templates';
import { Id } from '../../convex/_generated/dataModel';

const PreviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft');
  const pricelistId = searchParams.get('pricelist');

  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const [templateId, setTemplateId] = useState<string>(DEFAULT_TEMPLATE_ID);
  const [error, setError] = useState<string | null>(null);

  // Fetch draft from Convex (for ?draft=...)
  const draft = useQuery(
    api.pricelistDrafts.getDraft,
    draftId ? { draftId } : "skip"
  );

  // Fetch pricelist from Convex (for ?pricelist=...)
  const pricelist = useQuery(
    api.pricelists.getPricelistPublic,
    pricelistId ? { pricelistId: pricelistId as Id<"pricelists"> } : "skip"
  );

  // Handle draft data
  useEffect(() => {
    if (draft) {
      try {
        const data = JSON.parse(draft.pricingDataJson);
        setPricingData(data);

        if (draft.themeConfigJson) {
          setThemeConfig(JSON.parse(draft.themeConfigJson));
        }
        if (draft.templateId) {
          setTemplateId(draft.templateId);
        }
      } catch (e) {
        console.error('Error parsing draft:', e);
        setError('Nie udało się załadować cennika.');
      }
    }
  }, [draft]);

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

  // No ID provided
  if (!draftId && !pricelistId) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Brak ID cennika w URL.</p>
          <p className="text-sm text-slate-500 mt-2">Użyj linku z parametrem ?draft=... lub ?pricelist=...</p>
        </div>
      </div>
    );
  }

  // Loading state
  const isLoading = (draftId && draft === undefined) || (pricelistId && pricelist === undefined);
  if (isLoading) {
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
  const notFound = (draftId && draft === null) || (pricelistId && pricelist === null);
  if (notFound || error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Cennik nie został znaleziony lub wygasł.'}</p>
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
