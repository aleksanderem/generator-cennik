"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import {
  ClipboardList,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle,
  FileSpreadsheet,
  Image,
  Tag,
  Wand2,
  Save,
  Copy,
  Check,
  Code2,
  Palette,
  RotateCcw,
  Link2,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ShineBorder } from '../ui/shine-border';
import { RainbowButton } from '../ui/rainbow-button';
import { HeroHighlight } from '../ui/hero-highlight';
import { BlurFade } from '../ui/blur-fade';
import { AuroraText } from '../ui/aurora-text';
import { parsePricingData } from '../../services/geminiService';
import { PricingData, ThemeConfig, DEFAULT_THEME } from '../../types';
import { TemplateEditor } from '../../lib/pricelist-templates';

type AppState = 'INPUT' | 'PROCESSING' | 'PREVIEW';

// Generate unique draft ID
const generateDraftId = (): string => {
  return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const StartGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSignedIn, isLoaded: isClerkLoaded } = useUser();

  const [inputText, setInputText] = useState('');
  const [appState, setAppState] = useState<AppState>('INPUT');
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('modern');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPricelistId, setSavedPricelistId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [pricelistName, setPricelistName] = useState(`Cennik ${new Date().toLocaleDateString('pl-PL')}`);
  const [isEditingName, setIsEditingName] = useState(false);
  const [sourcePricelistId, setSourcePricelistId] = useState<string | null>(null);

  // Convex
  const user = useQuery(api.users.getCurrentUser);
  const savePricelist = useMutation(api.pricelists.savePricelist);
  const saveDraft = useMutation(api.pricelistDrafts.saveDraft);
  const updateDraft = useMutation(api.pricelistDrafts.updateDraft);
  const convertDraftToPricelist = useMutation(api.pricelistDrafts.convertDraftToPricelist);

  // Get draft from URL param
  const urlDraftId = searchParams.get('draft');

  // Load draft from URL on mount
  const existingDraft = useQuery(
    api.pricelistDrafts.getDraft,
    urlDraftId ? { draftId: urlDraftId } : "skip"
  );

  // Load draft when it's fetched
  useEffect(() => {
    if (existingDraft && !isLoadingDraft) {
      setIsLoadingDraft(true);
      try {
        const data = JSON.parse(existingDraft.pricingDataJson);
        setPricingData(data);
        setDraftId(existingDraft.draftId);

        if (existingDraft.themeConfigJson) {
          setThemeConfig(JSON.parse(existingDraft.themeConfigJson));
        }
        if (existingDraft.templateId) {
          setSelectedTemplateId(existingDraft.templateId);
        }
        if (existingDraft.rawInputData) {
          setInputText(existingDraft.rawInputData);
        }
        if (existingDraft.sourcePricelistId) {
          setSourcePricelistId(existingDraft.sourcePricelistId);
        }

        setAppState('PREVIEW');
      } catch (e) {
        console.error('Error loading draft:', e);
        setError('Nie udało się załadować zapisanego cennika.');
      }
      setIsLoadingDraft(false);
    }
  }, [existingDraft]);

  // Load theme from localStorage
  const LOCAL_STORAGE_KEY = 'beauty_pricer_local_last';
  const LOCAL_STORAGE_TEMPLATE_KEY = 'beauty_pricer_template_id';

  useEffect(() => {
    if (!urlDraftId) {
      const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedTheme) {
        try {
          setThemeConfig(JSON.parse(savedTheme));
        } catch (e) {
          console.error('Error loading theme config:', e);
        }
      }
      const savedTemplateId = localStorage.getItem(LOCAL_STORAGE_TEMPLATE_KEY);
      if (savedTemplateId) {
        setSelectedTemplateId(savedTemplateId);
      }
    }
  }, [urlDraftId]);

  const handleLoadExample = () => {
    const example = `Manicure Hybrydowy	120 zł	Zdjęcie poprzedniej stylizacji, opracowanie skórek, malowanie.	60 min	Bestseller
Pedicure SPA	180 zł	Peeling, maska, masaż, malowanie. PROMOCJA!	90 min
Strzyżenie damskie	150 zł	Mycie, strzyżenie, modelowanie.	60 min	Nowość
Koloryzacja globalna	od 300 zł	Jeden kolor, bez rozjaśniania.	120 min
Masaż Relaksacyjny	200 zł	Pełny masaż ciała olejkami eterycznymi.	60 min	Hit Sezonu
Makijaż okolicznościowy	180 zł	Make-up na specjalną okazję z konsultacją kolorystyczną.	45 min
Henna brwi i rzęs	65 zł	Farbowanie brwi i rzęs henną.	30 min	Promocja
Depilacja całych nóg	150 zł	Woskiem miękkim lub twardym.	45 min`;
    setInputText(example);
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;

    setAppState('PROCESSING');
    setError(null);

    try {
      const data = await parsePricingData(inputText, false);
      setPricingData(data);

      // Generate new draft ID and save
      const newDraftId = generateDraftId();
      setDraftId(newDraftId);

      // Save draft to DB
      await saveDraft({
        draftId: newDraftId,
        pricingDataJson: JSON.stringify(data),
        themeConfigJson: JSON.stringify(themeConfig),
        templateId: selectedTemplateId,
        rawInputData: inputText,
      });

      // Update URL with draft ID
      setSearchParams({ draft: newDraftId });

      setAppState('PREVIEW');

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Wystąpił błąd podczas generowania cennika. Spróbuj ponownie.');
      setAppState('INPUT');
    }
  };

  // Auto-save draft when theme or template changes
  const handleThemeChange = useCallback(async (newTheme: ThemeConfig) => {
    setThemeConfig(newTheme);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTheme));

    if (draftId) {
      try {
        await updateDraft({
          draftId,
          themeConfigJson: JSON.stringify(newTheme),
        });
      } catch (e) {
        console.error('Error updating draft:', e);
      }
    }
  }, [draftId, updateDraft]);

  const handleTemplateChange = useCallback(async (templateId: string) => {
    setSelectedTemplateId(templateId);
    localStorage.setItem(LOCAL_STORAGE_TEMPLATE_KEY, templateId);

    if (draftId) {
      try {
        await updateDraft({
          draftId,
          templateId,
        });
      } catch (e) {
        console.error('Error updating draft:', e);
      }
    }
  }, [draftId, updateDraft]);

  const handleDataChange = useCallback(async (newData: PricingData) => {
    setPricingData(newData);

    if (draftId) {
      try {
        await updateDraft({
          draftId,
          pricingDataJson: JSON.stringify(newData),
        });
      } catch (e) {
        console.error('Error updating draft:', e);
      }
    }
  }, [draftId, updateDraft]);

  const handleSaveToProfile = async () => {
    if (!pricingData || !isSignedIn || !user || !draftId) return;

    setIsSaving(true);
    try {
      const pricelistId = await convertDraftToPricelist({
        draftId,
        name: pricelistName,
      });
      setSavedPricelistId(pricelistId);

      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 }
      });
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Wystąpił błąd podczas zapisywania cennika.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    // Jeśli edytujemy istniejący cennik, użyj jego ID dla stabilnego linka
    // W przeciwnym razie użyj drafta
    let url: string;
    if (sourcePricelistId) {
      url = `${window.location.origin}/preview?pricelist=${sourcePricelistId}`;
    } else if (draftId) {
      url = `${window.location.origin}/preview?draft=${draftId}`;
    } else {
      return;
    }
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleStartOver = () => {
    setAppState('INPUT');
    setPricingData(null);
    setSavedPricelistId(null);
    setSourcePricelistId(null);
    setError(null);
    setDraftId(null);
    setSearchParams({});
  };

  // Processing state
  if (appState === 'PROCESSING') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4A574] to-[#B8860B] rounded-2xl animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">
            AI analizuje Twój cennik...
          </h2>
          <p className="text-slate-600 mb-6">
            Rozpoznajemy strukturę, kategoryzujemy usługi i formatujemy dane.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>To zajmie tylko kilka sekund</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Preview state with sub-navigation
  if (appState === 'PREVIEW' && pricingData) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Sub-navigation bar - full width, dark background */}
        <div className="bg-slate-900 border-b border-slate-700">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleStartOver}
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Nowy cennik
                </button>
                <div className="h-5 w-px bg-slate-700" />
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#D4A574]" />
                  <span className="text-sm text-slate-400">
                    Edytor cennika
                  </span>
                </div>
                <div className="h-5 w-px bg-slate-700" />
                {/* Edytowalna nazwa cennika */}
                {isEditingName ? (
                  <input
                    type="text"
                    value={pricelistName}
                    onChange={(e) => setPricelistName(e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingName(false);
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    autoFocus
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent min-w-[200px]"
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-white hover:bg-slate-800 rounded transition-colors group"
                  >
                    <span>{pricelistName}</span>
                    <Pencil className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#D4A574] transition-colors" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Copy link button */}
                {draftId && (
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Skopiowano!</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        <span>Kopiuj link</span>
                      </>
                    )}
                  </button>
                )}

                {/* Save button - only for logged-in users */}
                {isSignedIn && user && !savedPricelistId && (
                  <button
                    onClick={handleSaveToProfile}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-[#D4A574] text-white text-sm font-medium rounded-lg hover:bg-[#C9956C] transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Zapisz w profilu
                  </button>
                )}

                {/* Saved confirmation */}
                {savedPricelistId && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-900/50 text-emerald-400 text-sm font-medium rounded-lg border border-emerald-700">
                    <CheckCircle className="w-4 h-4" />
                    Zapisano!
                    <button
                      onClick={() => navigate('/profile')}
                      className="ml-2 underline hover:no-underline"
                    >
                      Zobacz w profilu
                    </button>
                  </div>
                )}

                {/* Login prompt for non-logged-in users */}
                {!isSignedIn && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>Zaloguj się, aby zapisać cennik</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Template Editor - full width */}
        <div className="px-6 py-6">
          <TemplateEditor
            initialTemplateId={selectedTemplateId}
            initialTheme={themeConfig}
            data={pricingData}
            onThemeChange={handleThemeChange}
            onTemplateChange={handleTemplateChange}
            onDataChange={handleDataChange}
            enableDataEditing={true}
            draftId={draftId}
          />
        </div>
      </div>
    );
  }

  // Input state (default)
  return (
    <div className="overflow-x-hidden">
      <HeroHighlight
        containerClassName="relative py-12 md:py-16 min-h-[80vh] flex items-center bg-gradient-to-b from-slate-50 to-white"
        dotColor="rgba(212, 165, 116, 0.12)"
        dotColorHighlight="rgba(212, 165, 116, 0.8)"
      >
        <div className="relative max-w-7xl mx-auto w-full px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <BlurFade delay={0.1} inView>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A574]/10 rounded-full border border-[#D4A574]/30 mb-6">
                  <Sparkles size={16} className="text-[#D4A574]" />
                  <span className="text-sm font-medium text-[#D4A574]">
                    Darmowy generator cennika
                  </span>
                </div>
              </BlurFade>

              <BlurFade delay={0.2} inView>
                <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-serif font-bold text-slate-900 mb-6 leading-[1.1]">
                  Stwórz{' '}
                  <br className="hidden sm:block" />
                  <AuroraText colors={["#D4A574", "#C9956C", "#E8C4A0", "#B8860B"]}>
                    profesjonalny cennik
                  </AuroraText>
                  {' '}<span className="inline-block">✨</span>
                </h1>
              </BlurFade>

              <BlurFade delay={0.3} inView>
                <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0">
                  Wklej cennik z Excela, Booksy czy notatnika. AI uporządkuje, skategoryzuje
                  i przygotuje gotowy cennik na Twoją stronę.
                </p>
              </BlurFade>

              {/* What happens next */}
              <BlurFade delay={0.4} inView>
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Jak to działa?</p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-8 h-8 rounded-full bg-[#D4A574]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#D4A574]">1</span>
                      </div>
                      <p className="text-slate-600">Wklej dane z dowolnego źródła</p>
                    </div>

                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-8 h-8 rounded-full bg-[#D4A574]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#D4A574]">2</span>
                      </div>
                      <p className="text-slate-600">AI kategoryzuje i formatuje cennik</p>
                    </div>

                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-8 h-8 rounded-full bg-[#D4A574]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-[#D4A574]">3</span>
                      </div>
                      <p className="text-slate-600">Dostosuj wygląd i skopiuj kod HTML</p>
                    </div>
                  </div>
                </div>
              </BlurFade>
            </div>

            {/* Right: Form */}
            <BlurFade delay={0.3} inView>
              <div className="relative mt-8 lg:mt-0">
                <div className="relative rounded-3xl">
                  {/* Animated Shine Border */}
                  <ShineBorder
                    borderWidth={3}
                    duration={8}
                    shineColor={["#D4A574", "#B8860B", "#E8C4A0"]}
                    className="rounded-3xl"
                  />

                  <div className="bg-white/90 backdrop-blur-sm p-8 md:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4A574]/10 to-[#B8860B]/10 text-[#D4A574] mb-4">
                        <ClipboardList size={24} />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-slate-900 mb-2">
                        Wklej swój cennik
                      </h3>
                      <p className="text-sm text-slate-500">
                        Z Excela, Google Sheets, Booksy lub notatek
                      </p>
                    </div>

                    {/* Feature hints */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-500 border border-slate-100">
                        <FileSpreadsheet size={12} className="text-[#D4A574]" />
                        Excel / Sheets
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-500 border border-slate-100">
                        <Image size={12} className="text-[#C9956C]" />
                        URL zdjęć
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-500 border border-slate-100">
                        <Tag size={12} className="text-[#B8860B]" />
                        Tagi (Bestseller)
                      </div>
                    </div>

                    <textarea
                      className="w-full h-48 p-4 rounded-xl border-2 border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#D4A574] focus:ring-4 focus:ring-[#D4A574]/10 transition-all outline-none resize-none text-sm placeholder:text-slate-400"
                      placeholder="Wklej tutaj dane...

Przykład:
Manicure Hybrydowy	120 zł	60 min
Pedicure SPA	180 zł	90 min
Strzyżenie damskie	150 zł	60 min"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />

                    {error && (
                      <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={handleLoadExample}
                        className="text-sm text-slate-400 hover:text-[#D4A574] transition-colors flex items-center gap-1.5 group"
                      >
                        <Sparkles size={14} className="group-hover:text-[#B8860B] transition-colors" />
                        Załaduj przykład
                      </button>
                    </div>

                    <RainbowButton
                      onClick={handleGenerate}
                      disabled={!inputText.trim()}
                      className="w-full mt-4 text-lg"
                    >
                      <Wand2 className="w-5 h-5" />
                      Generuj cennik
                      <ArrowRight className="w-5 h-5" />
                    </RainbowButton>

                    {/* Trust badges */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Sparkles size={12} className="text-[#D4A574]" />
                        100% darmowe
                      </div>
                      <div className="flex items-center gap-1">
                        <Code2 size={12} className="text-[#D4A574]" />
                        Gotowy HTML/CSS
                      </div>
                      <div className="flex items-center gap-1">
                        <Palette size={12} className="text-[#D4A574]" />
                        6 szablonów
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </BlurFade>
          </div>
        </div>
      </HeroHighlight>
    </div>
  );
};

export default StartGeneratorPage;
