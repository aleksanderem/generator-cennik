"use client";
import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { ThemeConfig, DEFAULT_THEME, PricingData } from '../../types';
import { TemplateEditor, SAMPLE_PRICING_DATA } from '../../lib/pricelist-templates';
import type { Id } from '../../convex/_generated/dataModel';
import {
  IconSettings,
  IconLogout,
  IconLoader2,
  IconFileText,
  IconClock,
  IconCircleCheck,
  IconAlertCircle,
  IconPlayerPlay,
  IconDownload,
  IconChevronRight,
  IconCreditCard,
  IconReceipt,
  IconBuilding,
  IconCheck,
  IconExternalLink,
  IconPalette,
  IconMapPin,
  IconPhone,
  IconLink,
  IconPhoto,
  IconEdit,
  IconColorSwatch,
  IconList,
  IconTrash,
  IconCode,
  IconEye,
  IconPlus,
} from '@tabler/icons-react';

type Tab = 'pricelists' | 'audits' | 'payments' | 'invoices' | 'company' | 'salon';

const ProfilePage: React.FC = () => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [activeTab, setActiveTab] = useState<Tab>('pricelists');
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companySaving, setCompanySaving] = useState(false);

  // Form state for company data
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    companyNip: '',
    companyAddress: '',
    companyCity: '',
    companyPostalCode: '',
  });

  const convexUser = useQuery(api.users.getCurrentUser);
  const audits = useQuery(api.audits.getUserAudits);
  const activeAudit = useQuery(api.audits.getActiveAudit);
  const purchases = useQuery(api.purchases.getUserPurchases);
  const pricelists = useQuery(api.pricelists.getUserPricelists);
  const updateCompanyData = useMutation(api.users.updateCompanyData);
  const deletePricelist = useMutation(api.pricelists.deletePricelist);
  const createPortalSession = useAction(api.stripe.createCustomerPortalSession);
  const syncStripeCustomer = useAction(api.stripe.syncStripeCustomer);
  const getInvoices = useAction(api.stripe.getInvoices);

  const [openingPortal, setOpeningPortal] = useState(false);
  const [syncingStripe, setSyncingStripe] = useState(false);
  const [stripeSyncError, setStripeSyncError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Array<{
    id: string;
    number: string | null;
    status: string;
    amount: number;
    currency: string;
    created: number;
    pdfUrl: string | null;
    hostedUrl: string | null;
    description: string | null;
  }>>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Salon settings state
  const [salonSubTab, setSalonSubTab] = useState<'data' | 'identity'>('data');
  const [isEditingSalon, setIsEditingSalon] = useState(false);
  const [salonSaving, setSalonSaving] = useState(false);
  const [salonForm, setSalonForm] = useState({
    salonName: '',
    salonLogoUrl: '',
    salonAddress: '',
    salonCity: '',
    salonPhone: '',
    booksyProfileUrl: '',
  });

  const updateSalonData = useMutation(api.users.updateSalonData);
  const updatePricelistTheme = useMutation(api.pricelists.updatePricelistTheme);

  // Theme/colors state (for price list customization)
  const LOCAL_STORAGE_KEY = 'beauty_pricer_local_last';
  const LOCAL_STORAGE_TEMPLATE_KEY = 'beauty_pricer_template_id';
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('modern');

  // Selected pricelist for editing in Identity tab
  const [selectedPricelistId, setSelectedPricelistId] = useState<Id<"pricelists"> | null>(null);
  const [selectedPricelistData, setSelectedPricelistData] = useState<PricingData | null>(null);

  // Load theme from selected pricelist or localStorage fallback
  useEffect(() => {
    if (selectedPricelistId && pricelists) {
      const pricelist = pricelists.find(p => p._id === selectedPricelistId);
      if (pricelist) {
        // Load pricing data
        try {
          const pricingData = JSON.parse(pricelist.pricingDataJson) as PricingData;
          setSelectedPricelistData(pricingData);
        } catch (e) {
          console.error('Error parsing pricelist data:', e);
          setSelectedPricelistData(null);
        }

        // Load theme config if exists
        if (pricelist.themeConfigJson) {
          try {
            const savedTheme = JSON.parse(pricelist.themeConfigJson) as ThemeConfig;
            setThemeConfig(savedTheme);
          } catch (e) {
            console.error('Error parsing theme config:', e);
          }
        }

        // Load template ID if exists
        if (pricelist.templateId) {
          setSelectedTemplateId(pricelist.templateId);
        }
        return;
      }
    }

    // Fallback to localStorage when no pricelist selected
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
  }, [selectedPricelistId, pricelists]);

  // Auto-select first pricelist when list loads
  useEffect(() => {
    if (pricelists && pricelists.length > 0 && !selectedPricelistId) {
      setSelectedPricelistId(pricelists[0]._id);
    }
  }, [pricelists, selectedPricelistId]);

  const handleFullThemeChange = async (newTheme: ThemeConfig) => {
    setThemeConfig(newTheme);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTheme));

    // Also save to database if a pricelist is selected
    if (selectedPricelistId) {
      try {
        await updatePricelistTheme({
          pricelistId: selectedPricelistId,
          themeConfigJson: JSON.stringify(newTheme),
          templateId: selectedTemplateId,
        });
      } catch (e) {
        console.error('Error saving theme to database:', e);
      }
    }
  };

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    localStorage.setItem(LOCAL_STORAGE_TEMPLATE_KEY, templateId);

    // Also save to database if a pricelist is selected
    if (selectedPricelistId) {
      try {
        await updatePricelistTheme({
          pricelistId: selectedPricelistId,
          themeConfigJson: JSON.stringify(themeConfig),
          templateId: templateId,
        });
      } catch (e) {
        console.error('Error saving template to database:', e);
      }
    }
  };

  // Initialize salon form when user data loads
  useEffect(() => {
    if (convexUser) {
      setSalonForm({
        salonName: convexUser.salonName || '',
        salonLogoUrl: convexUser.salonLogoUrl || '',
        salonAddress: convexUser.salonAddress || '',
        salonCity: convexUser.salonCity || '',
        salonPhone: convexUser.salonPhone || '',
        booksyProfileUrl: convexUser.booksyProfileUrl || '',
      });
    }
  }, [convexUser]);

  const handleSaveSalon = async () => {
    setSalonSaving(true);
    try {
      await updateSalonData(salonForm);
      setIsEditingSalon(false);
    } catch (error) {
      console.error('Error saving salon data:', error);
    } finally {
      setSalonSaving(false);
    }
  };

  // Initialize company form when user data loads
  React.useEffect(() => {
    if (convexUser) {
      setCompanyForm({
        companyName: convexUser.companyName || '',
        companyNip: convexUser.companyNip || '',
        companyAddress: convexUser.companyAddress || '',
        companyCity: convexUser.companyCity || '',
        companyPostalCode: convexUser.companyPostalCode || '',
      });
    }
  }, [convexUser]);

  // Load invoices when tab is invoices and user has stripeCustomerId
  React.useEffect(() => {
    if (activeTab === 'invoices' && convexUser?.stripeCustomerId && invoices.length === 0 && !loadingInvoices) {
      setLoadingInvoices(true);
      getInvoices({})
        .then((data) => setInvoices(data))
        .catch((err) => console.error('Error loading invoices:', err))
        .finally(() => setLoadingInvoices(false));
    }
  }, [activeTab, convexUser?.stripeCustomerId]);

  if (!isClerkLoaded || convexUser === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <IconLoader2 className="w-6 h-6 text-[#D4A574] animate-spin" />
      </div>
    );
  }

  if (!clerkUser || !convexUser) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Musisz być zalogowany, aby zobaczyć profil.</p>
          <Link to="/" className="text-[#722F37] font-medium hover:underline">
            Wróć na stronę główną
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveCompany = async () => {
    setCompanySaving(true);
    try {
      await updateCompanyData(companyForm);
      setIsEditingCompany(false);
    } catch (error) {
      console.error('Error saving company data:', error);
    } finally {
      setCompanySaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: typeof IconClock }> = {
      pending: { label: 'Oczekuje', className: 'bg-amber-100 text-amber-700', icon: IconClock },
      processing: { label: 'W trakcie', className: 'bg-blue-100 text-blue-700', icon: IconLoader2 },
      completed: { label: 'Zakończony', className: 'bg-emerald-100 text-emerald-700', icon: IconCircleCheck },
      failed: { label: 'Błąd', className: 'bg-red-100 text-red-700', icon: IconAlertCircle },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", config.className)}>
        <Icon size={12} className={status === 'processing' ? 'animate-spin' : ''} />
        {config.label}
      </span>
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = (amount: number) => {
    return (amount / 100).toFixed(2).replace('.', ',') + ' zł';
  };

  const getProductName = (product: string) => {
    const names: Record<string, string> = {
      audit: 'Audyt AI',
      audit_consultation: 'Audyt + Konsultacja',
    };
    return names[product] || product;
  };

  const completedAudits = audits?.filter(a => a.status === 'completed' || a.status === 'failed') || [];
  const completedPurchases = purchases?.filter(p => p.status === 'completed') || [];

  const handleOpenStripePortal = async () => {
    setOpeningPortal(true);
    try {
      const result = await createPortalSession({
        returnUrl: window.location.href,
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Error opening Stripe portal:', error);
    } finally {
      setOpeningPortal(false);
    }
  };

  // Tab titles for header display
  const tabTitles: Record<Tab, string> = {
    pricelists: 'Moje cenniki',
    audits: 'Historia audytów',
    payments: 'Historia płatności',
    invoices: 'Faktury',
    company: 'Dane firmy',
    salon: 'Ustawienia salonu',
  };

  return (
    <div className="py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Mój profil</h1>
        <p className="text-slate-500 text-sm mt-1">Zarządzaj kontem i przeglądaj historię</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {/* User info */}
            <div className="p-4">
              <div className="flex items-center gap-3">
                {clerkUser.imageUrl ? (
                  <img src={clerkUser.imageUrl} alt="" className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#722F37] flex items-center justify-center text-white font-medium">
                    {clerkUser.firstName?.[0] || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{clerkUser.fullName || 'Użytkownik'}</p>
                  <p className="text-sm text-slate-500 truncate">{clerkUser.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Dostępne audyty</span>
                <span className="text-lg font-bold text-[#722F37]">{convexUser.credits}</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="p-2">
              {/* Main sections */}
              <button
                onClick={() => setActiveTab('pricelists')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                  activeTab === 'pricelists'
                    ? "bg-[#722F37]/10 text-[#722F37]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <IconList size={18} className={activeTab === 'pricelists' ? "text-[#722F37]" : "text-slate-400"} />
                Cenniki
                {pricelists && pricelists.length > 0 && (
                  <span className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded",
                    activeTab === 'pricelists' ? "bg-[#722F37]/20" : "bg-slate-100"
                  )}>
                    {pricelists.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('audits')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                  activeTab === 'audits'
                    ? "bg-[#722F37]/10 text-[#722F37]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <IconFileText size={18} className={activeTab === 'audits' ? "text-[#722F37]" : "text-slate-400"} />
                Audyty
                {audits && audits.length > 0 && (
                  <span className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded",
                    activeTab === 'audits' ? "bg-[#722F37]/20" : "bg-slate-100"
                  )}>
                    {audits.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                  activeTab === 'payments'
                    ? "bg-[#722F37]/10 text-[#722F37]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <IconCreditCard size={18} className={activeTab === 'payments' ? "text-[#722F37]" : "text-slate-400"} />
                Płatności
                {completedPurchases.length > 0 && (
                  <span className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded",
                    activeTab === 'payments' ? "bg-[#722F37]/20" : "bg-slate-100"
                  )}>
                    {completedPurchases.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                  activeTab === 'invoices'
                    ? "bg-[#722F37]/10 text-[#722F37]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <IconReceipt size={18} className={activeTab === 'invoices' ? "text-[#722F37]" : "text-slate-400"} />
                Faktury
              </button>
              <button
                onClick={() => setActiveTab('company')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                  activeTab === 'company'
                    ? "bg-[#722F37]/10 text-[#722F37]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <IconBuilding size={18} className={activeTab === 'company' ? "text-[#722F37]" : "text-slate-400"} />
                Dane firmy
              </button>

              {/* Divider */}
              <div className="my-2 border-t border-slate-100"></div>

              {/* Settings sections */}
              <button
                onClick={() => setActiveTab('salon')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                  activeTab === 'salon'
                    ? "bg-[#722F37]/10 text-[#722F37]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <IconPalette size={18} className={activeTab === 'salon' ? "text-[#722F37]" : "text-slate-400"} />
                Ustawienia salonu
              </button>
              <button
                onClick={() => openUserProfile()}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <IconSettings size={18} className="text-slate-400" />
                Ustawienia konta
              </button>

              {/* Divider */}
              <div className="my-2 border-t border-slate-100"></div>

              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <IconLogout size={18} />
                Wyloguj się
              </button>
            </div>
          </div>

          {/* Quick action */}
          {(activeAudit?.status === 'pending' || (convexUser.credits > 0 && !activeAudit)) && (
            <Link
              to="/start-audit"
              className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#722F37] text-white rounded-xl text-sm font-medium hover:bg-[#5a252c] transition-colors"
            >
              <IconPlayerPlay size={16} />
              {activeAudit?.status === 'pending' ? 'Dokończ rozpoczęcie audytu' : 'Rozpocznij nowy audyt'}
            </Link>
          )}
        </div>

        {/* Main content */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-xl border border-slate-200">
            {/* Content Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">{tabTitles[activeTab]}</h2>
              {activeTab === 'pricelists' && (
                <Link
                  to="/"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#722F37] bg-[#722F37]/5 rounded-lg hover:bg-[#722F37]/10 transition-colors"
                >
                  <IconPlus size={14} />
                  Nowy cennik
                </Link>
              )}
            </div>

            {/* Tab: Pricelists */}
            {activeTab === 'pricelists' && (
              <div className="divide-y divide-slate-100">
                {pricelists && pricelists.length > 0 ? (
                  pricelists.map((pricelist) => {
                    const sourceLabels: Record<string, { label: string; className: string }> = {
                      manual: { label: 'Generator', className: 'bg-slate-100 text-slate-600' },
                      booksy: { label: 'Booksy', className: 'bg-purple-100 text-purple-700' },
                      audit: { label: 'Audyt', className: 'bg-amber-100 text-amber-700' },
                    };
                    const sourceInfo = sourceLabels[pricelist.source] || sourceLabels.manual;

                    return (
                      <div key={pricelist._id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-slate-900 truncate">
                                {pricelist.name}
                              </span>
                              <span className={cn("text-xs px-1.5 py-0.5 rounded", sourceInfo.className)}>
                                {sourceInfo.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{formatDate(pricelist.createdAt)}</span>
                              {pricelist.categoriesCount !== undefined && pricelist.categoriesCount > 0 && (
                                <span>{pricelist.categoriesCount} kategorii</span>
                              )}
                              {pricelist.servicesCount !== undefined && pricelist.servicesCount > 0 && (
                                <span>{pricelist.servicesCount} usług</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                // TODO: Otwórz podgląd cennika
                                alert('Podgląd cennika - do zaimplementowania');
                              }}
                              className="p-2 text-slate-400 hover:text-[#722F37] hover:bg-slate-100 rounded-lg transition-colors"
                              title="Podgląd"
                            >
                              <IconEye size={16} />
                            </button>
                            <button
                              onClick={() => {
                                // TODO: Kopiuj kod embed
                                alert('Kopiowanie kodu - do zaimplementowania');
                              }}
                              className="p-2 text-slate-400 hover:text-[#722F37] hover:bg-slate-100 rounded-lg transition-colors"
                              title="Kopiuj kod"
                            >
                              <IconCode size={16} />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Czy na pewno chcesz usunąć ten cennik?')) {
                                  await deletePricelist({ pricelistId: pricelist._id });
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Usuń"
                            >
                              <IconTrash size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-5 py-12 text-center">
                    <IconList className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-1">Brak zapisanych cenników</p>
                    <p className="text-xs text-slate-400 mb-4">
                      Stwórz cennik za darmo używając generatora lub kup audyt Booksy
                    </p>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#722F37] rounded-lg hover:bg-[#5a252c] transition-colors"
                    >
                      <IconPlus size={16} />
                      Stwórz pierwszy cennik
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Audits */}
            {activeTab === 'audits' && (
              <div>
                {/* Active audit */}
                {activeAudit && (
                  <div className="px-5 py-4 bg-amber-50/50 border-b border-amber-100">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {activeAudit.status === 'processing' && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                          )}
                          <span className="text-sm font-medium text-slate-900">
                            {activeAudit.status === 'pending' ? 'Oczekujący audyt' : 'Audyt w trakcie'}
                          </span>
                          {getStatusBadge(activeAudit.status)}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {activeAudit.sourceUrl || 'Brak URL - kliknij aby dodać'}
                        </p>
                      </div>
                      {activeAudit.status === 'pending' && (
                        <Link
                          to="/success"
                          className="flex-shrink-0 px-3 py-1.5 bg-[#722F37] text-white text-xs font-medium rounded-lg hover:bg-[#5a252c] transition-colors"
                        >
                          Rozpocznij
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* Audits list */}
                <div className="divide-y divide-slate-100">
                  {completedAudits.length > 0 ? (
                    completedAudits.map((audit) => (
                      <div key={audit._id} className="px-5 py-3 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium text-slate-900 truncate">
                                {audit.sourceUrl ? audit.sourceUrl.replace(/^https?:\/\//, '').slice(0, 40) : 'Audyt profilu'}
                              </span>
                              {getStatusBadge(audit.status)}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{formatDate(audit.completedAt || audit.createdAt)}</span>
                              {audit.overallScore !== undefined && (
                                <span className={cn(
                                  "font-medium",
                                  audit.overallScore >= 80 ? 'text-emerald-600' :
                                  audit.overallScore >= 60 ? 'text-amber-600' : 'text-red-600'
                                )}>
                                  Wynik: {audit.overallScore}/100
                                </span>
                              )}
                            </div>
                          </div>
                          {audit.status === 'completed' && audit.reportPdfUrl && (
                            <a
                              href={audit.reportPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#722F37] hover:bg-[#722F37]/5 rounded-lg transition-colors"
                            >
                              <IconDownload size={14} />
                              PDF
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : !activeAudit ? (
                    <div className="px-5 py-12 text-center">
                      <IconFileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 mb-1">Brak audytów</p>
                      <p className="text-xs text-slate-400">Twoje audyty pojawią się tutaj</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Tab: Payments */}
            {activeTab === 'payments' && (
              <div className="divide-y divide-slate-100">
                {completedPurchases.length > 0 ? (
                  completedPurchases.map((purchase) => (
                    <div key={purchase._id} className="px-5 py-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{getProductName(purchase.product)}</p>
                          <p className="text-xs text-slate-500">{formatDate(purchase.completedAt || purchase.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{formatPrice(purchase.amount)}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                            <IconCircleCheck size={12} />
                            Opłacone
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-12 text-center">
                    <IconCreditCard className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-1">Brak płatności</p>
                    <p className="text-xs text-slate-400">Twoje płatności pojawią się tutaj</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Invoices */}
            {activeTab === 'invoices' && (
              <div className="divide-y divide-slate-100">
                {/* Header z przyciskiem sync jeśli brak stripeCustomerId */}
                {!convexUser.stripeCustomerId && purchases && purchases.length > 0 && (
                  <div className="px-5 py-4 bg-amber-50 border-b border-amber-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-amber-800">
                        Zsynchronizuj konto aby zobaczyć faktury
                      </p>
                      <button
                        onClick={async () => {
                          setSyncingStripe(true);
                          setStripeSyncError(null);
                          try {
                            const result = await syncStripeCustomer({});
                            if (!result.success) {
                              setStripeSyncError(result.message || 'Nie udało się zsynchronizować');
                            }
                          } catch (err) {
                            setStripeSyncError('Wystąpił błąd podczas synchronizacji');
                          } finally {
                            setSyncingStripe(false);
                          }
                        }}
                        disabled={syncingStripe}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#722F37] text-white text-xs font-medium rounded-lg hover:bg-[#5a252c] transition-colors disabled:opacity-50"
                      >
                        {syncingStripe ? (
                          <IconLoader2 size={14} className="animate-spin" />
                        ) : (
                          <IconReceipt size={14} />
                        )}
                        Synchronizuj
                      </button>
                    </div>
                    {stripeSyncError && (
                      <p className="text-xs text-red-600 mt-2">{stripeSyncError}</p>
                    )}
                  </div>
                )}

                {/* Loading state */}
                {loadingInvoices && (
                  <div className="px-5 py-12 text-center">
                    <IconLoader2 className="w-8 h-8 text-[#D4A574] animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Ładowanie faktur...</p>
                  </div>
                )}

                {/* Invoices table */}
                {!loadingInvoices && convexUser.stripeCustomerId && invoices.length > 0 && (
                  <>
                    {/* Table header */}
                    <div className="px-5 py-3 bg-slate-50 grid grid-cols-12 gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <div className="col-span-3">Numer</div>
                      <div className="col-span-3">Data</div>
                      <div className="col-span-2">Kwota</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2 text-right">Pobierz</div>
                    </div>

                    {/* Table rows */}
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="px-5 py-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50 transition-colors">
                        <div className="col-span-3">
                          <span className="text-sm font-medium text-slate-900">
                            {invoice.number || '—'}
                          </span>
                        </div>
                        <div className="col-span-3">
                          <span className="text-sm text-slate-600">
                            {new Date(invoice.created * 1000).toLocaleDateString('pl-PL', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm font-medium text-slate-900">
                            {(invoice.amount / 100).toFixed(2).replace('.', ',')} {invoice.currency.toUpperCase()}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            invoice.status === 'paid' && "bg-emerald-50 text-emerald-700",
                            invoice.status === 'open' && "bg-amber-50 text-amber-700",
                            invoice.status === 'draft' && "bg-slate-100 text-slate-600",
                            invoice.status === 'void' && "bg-red-50 text-red-700",
                            !['paid', 'open', 'draft', 'void'].includes(invoice.status) && "bg-slate-100 text-slate-600"
                          )}>
                            {invoice.status === 'paid' && <IconCircleCheck size={12} />}
                            {invoice.status === 'paid' ? 'Opłacona' :
                             invoice.status === 'open' ? 'Otwarta' :
                             invoice.status === 'draft' ? 'Szkic' :
                             invoice.status === 'void' ? 'Anulowana' : invoice.status}
                          </span>
                        </div>
                        <div className="col-span-2 text-right">
                          {invoice.pdfUrl ? (
                            <a
                              href={invoice.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#722F37] bg-[#722F37]/5 rounded-lg hover:bg-[#722F37]/10 transition-colors"
                            >
                              <IconDownload size={14} />
                              PDF
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Portal link */}
                    <div className="px-5 py-4 bg-slate-50 text-center">
                      <button
                        onClick={handleOpenStripePortal}
                        disabled={openingPortal}
                        className="inline-flex items-center gap-2 text-sm text-[#722F37] font-medium hover:underline disabled:opacity-50"
                      >
                        {openingPortal ? (
                          <IconLoader2 size={14} className="animate-spin" />
                        ) : (
                          <IconExternalLink size={14} />
                        )}
                        Otwórz pełny portal płatności
                      </button>
                    </div>
                  </>
                )}

                {/* Empty state - no stripeCustomerId and no purchases */}
                {!loadingInvoices && !convexUser.stripeCustomerId && (!purchases || purchases.length === 0) && (
                  <div className="px-5 py-12 text-center">
                    <IconReceipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-1">Brak faktur</p>
                    <p className="text-xs text-slate-400">Faktury pojawią się po dokonaniu płatności</p>
                  </div>
                )}

                {/* Empty state - has stripeCustomerId but no invoices */}
                {!loadingInvoices && convexUser.stripeCustomerId && invoices.length === 0 && (
                  <div className="px-5 py-12 text-center">
                    <IconReceipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-1">Brak faktur</p>
                    <p className="text-xs text-slate-400">Nie znaleziono faktur w Stripe</p>
                    <button
                      onClick={handleOpenStripePortal}
                      disabled={openingPortal}
                      className="mt-4 inline-flex items-center gap-2 text-sm text-[#722F37] font-medium hover:underline disabled:opacity-50"
                    >
                      {openingPortal ? (
                        <IconLoader2 size={14} className="animate-spin" />
                      ) : (
                        <IconExternalLink size={14} />
                      )}
                      Sprawdź w portalu Stripe
                    </button>
                  </div>
                )}

                {/* Tip about company data */}
                {!convexUser.companyNip && (
                  <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                    <div className="flex items-start gap-3">
                      <IconBuilding size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-amber-800">
                          Aby faktury zawierały dane Twojej firmy, uzupełnij je przed zakupem.
                        </p>
                        <button
                          onClick={() => setActiveTab('company')}
                          className="mt-1 text-sm text-[#722F37] font-medium hover:underline"
                        >
                          Uzupełnij dane firmy →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Company */}
            {activeTab === 'company' && (
              <div className="p-5">
                <div className="max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-900">Dane do faktury</h3>
                    {!isEditingCompany && convexUser.companyNip && (
                      <button
                        onClick={() => setIsEditingCompany(true)}
                        className="text-sm text-[#722F37] font-medium hover:underline"
                      >
                        Edytuj
                      </button>
                    )}
                  </div>

                  {isEditingCompany || !convexUser.companyNip ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">Nazwa firmy</label>
                        <input
                          type="text"
                          value={companyForm.companyName}
                          onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                          placeholder="np. Salon Beauty Sp. z o.o."
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">NIP</label>
                        <input
                          type="text"
                          value={companyForm.companyNip}
                          onChange={(e) => setCompanyForm({ ...companyForm, companyNip: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-600 mb-1">Adres</label>
                        <input
                          type="text"
                          value={companyForm.companyAddress}
                          onChange={(e) => setCompanyForm({ ...companyForm, companyAddress: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                          placeholder="ul. Przykładowa 1/2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Kod pocztowy</label>
                          <input
                            type="text"
                            value={companyForm.companyPostalCode}
                            onChange={(e) => setCompanyForm({ ...companyForm, companyPostalCode: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                            placeholder="00-000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Miasto</label>
                          <input
                            type="text"
                            value={companyForm.companyCity}
                            onChange={(e) => setCompanyForm({ ...companyForm, companyCity: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                            placeholder="Warszawa"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleSaveCompany}
                          disabled={companySaving}
                          className="flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white text-sm font-medium rounded-lg hover:bg-[#5a252c] transition-colors disabled:opacity-50"
                        >
                          {companySaving ? (
                            <IconLoader2 size={16} className="animate-spin" />
                          ) : (
                            <IconCheck size={16} />
                          )}
                          Zapisz
                        </button>
                        {isEditingCompany && (
                          <button
                            onClick={() => {
                              setIsEditingCompany(false);
                              setCompanyForm({
                                companyName: convexUser.companyName || '',
                                companyNip: convexUser.companyNip || '',
                                companyAddress: convexUser.companyAddress || '',
                                companyCity: convexUser.companyCity || '',
                                companyPostalCode: convexUser.companyPostalCode || '',
                              });
                            }}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            Anuluj
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-slate-500">Firma:</span>
                        <p className="font-medium text-slate-900">{convexUser.companyName}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">NIP:</span>
                        <p className="font-medium text-slate-900">{convexUser.companyNip}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Adres:</span>
                        <p className="font-medium text-slate-900">
                          {convexUser.companyAddress}<br />
                          {convexUser.companyPostalCode} {convexUser.companyCity}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Salon Settings */}
            {activeTab === 'salon' && (
              <div>
                {/* Sub-tabs navigation */}
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setSalonSubTab('data')}
                    className={cn(
                      "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                      salonSubTab === 'data'
                        ? "border-[#722F37] text-[#722F37]"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    )}
                  >
                    <IconBuilding size={16} />
                    Dane
                  </button>
                  <button
                    onClick={() => setSalonSubTab('identity')}
                    className={cn(
                      "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                      salonSubTab === 'identity'
                        ? "border-[#722F37] text-[#722F37]"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    )}
                  >
                    <IconColorSwatch size={16} />
                    Identyfikacja
                  </button>
                </div>

                <div className={cn("p-5", salonSubTab === 'identity' && "p-0")}>
                  <div className={cn(salonSubTab === 'data' && "max-w-lg")}>
                    {/* Sub-tab: Dane (Salon Data) */}
                    {salonSubTab === 'data' && (
                      <>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium text-slate-900">Dane salonu</h3>
                          {!isEditingSalon && convexUser?.salonName && (
                            <button
                              onClick={() => setIsEditingSalon(true)}
                              className="flex items-center gap-1.5 text-sm text-[#722F37] font-medium hover:underline"
                            >
                              <IconEdit size={14} />
                              Edytuj
                            </button>
                          )}
                        </div>

                        {/* Info about auto-sync */}
                        {!convexUser?.salonName && (
                          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <div className="flex items-start gap-3">
                              <IconPalette size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-amber-800">Dane zostaną pobrane automatycznie</p>
                                <p className="text-xs text-amber-600 mt-1">
                                  Po wykonaniu pierwszego audytu, dane Twojego salonu (nazwa, logo, adres) zostaną automatycznie pobrane z profilu Booksy.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {isEditingSalon || !convexUser?.salonName ? (
                          <div className="space-y-4">
                            {/* Salon Name */}
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Nazwa salonu</label>
                              <input
                                type="text"
                                value={salonForm.salonName}
                                onChange={(e) => setSalonForm({ ...salonForm, salonName: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                                placeholder="np. Studio Urody Anna"
                              />
                            </div>

                            {/* Logo URL */}
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">
                                <span className="flex items-center gap-1.5">
                                  <IconPhoto size={14} className="text-slate-400" />
                                  URL logo
                                </span>
                              </label>
                              <input
                                type="url"
                                value={salonForm.salonLogoUrl}
                                onChange={(e) => setSalonForm({ ...salonForm, salonLogoUrl: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                                placeholder="https://..."
                              />
                              {salonForm.salonLogoUrl && (
                                <div className="mt-2 p-2 bg-slate-50 rounded-lg inline-block">
                                  <img
                                    src={salonForm.salonLogoUrl}
                                    alt="Logo podgląd"
                                    className="h-12 w-12 object-cover rounded"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Address */}
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">
                                <span className="flex items-center gap-1.5">
                                  <IconMapPin size={14} className="text-slate-400" />
                                  Adres
                                </span>
                              </label>
                              <input
                                type="text"
                                value={salonForm.salonAddress}
                                onChange={(e) => setSalonForm({ ...salonForm, salonAddress: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                                placeholder="ul. Przykładowa 1"
                              />
                            </div>

                            {/* City */}
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Miasto</label>
                              <input
                                type="text"
                                value={salonForm.salonCity}
                                onChange={(e) => setSalonForm({ ...salonForm, salonCity: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                                placeholder="Warszawa"
                              />
                            </div>

                            {/* Phone */}
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">
                                <span className="flex items-center gap-1.5">
                                  <IconPhone size={14} className="text-slate-400" />
                                  Telefon
                                </span>
                              </label>
                              <input
                                type="tel"
                                value={salonForm.salonPhone}
                                onChange={(e) => setSalonForm({ ...salonForm, salonPhone: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                                placeholder="+48 123 456 789"
                              />
                            </div>

                            {/* Booksy Profile URL */}
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">
                                <span className="flex items-center gap-1.5">
                                  <IconLink size={14} className="text-slate-400" />
                                  Profil Booksy
                                </span>
                              </label>
                              <input
                                type="url"
                                value={salonForm.booksyProfileUrl}
                                onChange={(e) => setSalonForm({ ...salonForm, booksyProfileUrl: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                                placeholder="https://booksy.com/pl-pl/..."
                              />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                              <button
                                onClick={handleSaveSalon}
                                disabled={salonSaving}
                                className="flex items-center gap-2 px-4 py-2 bg-[#722F37] text-white text-sm font-medium rounded-lg hover:bg-[#5a252c] transition-colors disabled:opacity-50"
                              >
                                {salonSaving ? (
                                  <IconLoader2 size={16} className="animate-spin" />
                                ) : (
                                  <IconCheck size={16} />
                                )}
                                Zapisz
                              </button>
                              {isEditingSalon && (
                                <button
                                  onClick={() => {
                                    setIsEditingSalon(false);
                                    setSalonForm({
                                      salonName: convexUser?.salonName || '',
                                      salonLogoUrl: convexUser?.salonLogoUrl || '',
                                      salonAddress: convexUser?.salonAddress || '',
                                      salonCity: convexUser?.salonCity || '',
                                      salonPhone: convexUser?.salonPhone || '',
                                      booksyProfileUrl: convexUser?.booksyProfileUrl || '',
                                    });
                                  }}
                                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                  Anuluj
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          // Display mode
                          <div className="space-y-4">
                            {/* Logo and Name */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                              {convexUser.salonLogoUrl ? (
                                <img
                                  src={convexUser.salonLogoUrl}
                                  alt={convexUser.salonName}
                                  className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-xl bg-[#722F37]/10 flex items-center justify-center">
                                  <IconPalette size={24} className="text-[#722F37]" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-semibold text-slate-900 text-lg">{convexUser.salonName}</h4>
                                {convexUser.salonCity && (
                                  <p className="text-sm text-slate-500">{convexUser.salonCity}</p>
                                )}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-3">
                              {convexUser.salonAddress && (
                                <div className="flex items-start gap-3">
                                  <IconMapPin size={18} className="text-slate-400 mt-0.5" />
                                  <div>
                                    <span className="text-xs text-slate-500">Adres</span>
                                    <p className="text-sm font-medium text-slate-900">
                                      {convexUser.salonAddress}
                                      {convexUser.salonCity && `, ${convexUser.salonCity}`}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {convexUser.salonPhone && (
                                <div className="flex items-start gap-3">
                                  <IconPhone size={18} className="text-slate-400 mt-0.5" />
                                  <div>
                                    <span className="text-xs text-slate-500">Telefon</span>
                                    <p className="text-sm font-medium text-slate-900">{convexUser.salonPhone}</p>
                                  </div>
                                </div>
                              )}

                              {convexUser.booksyProfileUrl && (
                                <div className="flex items-start gap-3">
                                  <IconLink size={18} className="text-slate-400 mt-0.5" />
                                  <div>
                                    <span className="text-xs text-slate-500">Profil Booksy</span>
                                    <a
                                      href={convexUser.booksyProfileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-sm font-medium text-[#722F37] hover:underline truncate max-w-xs"
                                    >
                                      {convexUser.booksyProfileUrl.replace(/^https?:\/\//, '').slice(0, 40)}...
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Sub-tab: Identyfikacja (Visual Identity) */}
                    {salonSubTab === 'identity' && (
                      <div className="p-4 min-h-[600px]">
                        {/* Template Editor */}
                        <TemplateEditor
                          initialTemplateId={selectedTemplateId}
                          initialTheme={themeConfig}
                          data={selectedPricelistData || SAMPLE_PRICING_DATA}
                          onThemeChange={handleFullThemeChange}
                          onTemplateChange={handleTemplateChange}
                          onSave={async (templateId, theme) => {
                            // Save to localStorage (always works)
                            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(theme));
                            localStorage.setItem(LOCAL_STORAGE_TEMPLATE_KEY, templateId);

                            // Also save to database if pricelist selected
                            if (selectedPricelistId) {
                              try {
                                await updatePricelistTheme({
                                  pricelistId: selectedPricelistId,
                                  themeConfigJson: JSON.stringify(theme),
                                  templateId: templateId,
                                });
                              } catch (e) {
                                console.error('Error saving theme to database:', e);
                              }
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
