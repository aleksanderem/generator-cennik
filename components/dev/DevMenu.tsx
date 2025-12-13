"use client";
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { ThemeConfig, DEFAULT_THEME, IntegrationMode } from '../../types';
import {
  Bug,
  X,
  Plus,
  Minus,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  CreditCard,
  Receipt,
  Ban,
  RotateCcw,
  Workflow,
  Sparkles
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'beauty_pricer_local_last';

const DevMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn } = useUser();

  // Integration mode state (from localStorage)
  const [integrationMode, setIntegrationMode] = useState<IntegrationMode>('N8N');

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const config: ThemeConfig = JSON.parse(saved);
        if (config.integrationMode) {
          setIntegrationMode(config.integrationMode);
        }
      } catch (e) {
        console.error('Error loading integration mode:', e);
      }
    }
  }, []);

  const handleIntegrationModeChange = (mode: IntegrationMode) => {
    setIntegrationMode(mode);
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    let config: ThemeConfig = DEFAULT_THEME;
    if (saved) {
      try {
        config = JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    config.integrationMode = mode;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  };

  // Queries
  const user = useQuery(api.users.getCurrentUser);
  const audits = useQuery(api.audits.getUserAudits);
  const activeAudit = useQuery(api.audits.getActiveAudit);
  const purchases = useQuery(api.purchases.getUserPurchases);

  // Mutations
  const addCredits = useMutation(api.dev.addCredits);
  const removeCredits = useMutation(api.dev.removeCredits);
  const createTestAudit = useMutation(api.dev.createTestAudit);
  const updateAuditStatus = useMutation(api.dev.updateAuditStatus);
  const deleteAudit = useMutation(api.dev.deleteAudit);
  const createTestPurchase = useMutation(api.dev.createTestPurchase);
  const deletePurchase = useMutation(api.dev.deletePurchase);
  const updatePurchaseStatus = useMutation(api.dev.updatePurchaseStatus);
  const simulatePaymentComplete = useMutation(api.dev.simulatePaymentComplete);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isSignedIn || !user) {
    return null;
  }

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-purple-100 text-purple-700',
  };

  const statusIcons = {
    pending: Clock,
    processing: RefreshCw,
    completed: CheckCircle,
    failed: AlertCircle,
    refunded: RotateCcw,
  };

  const formatPrice = (amount: number) => {
    return (amount / 100).toFixed(2).replace('.', ',') + ' zł';
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-[9999] p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all hover:scale-110"
        title="Dev Menu"
      >
        <Bug size={20} />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-16 left-4 z-[9999] w-80 bg-slate-900 text-white rounded-xl shadow-2xl overflow-hidden border border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-purple-600">
            <div className="flex items-center gap-2">
              <Bug size={18} />
              <span className="font-bold">Dev Menu</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-purple-700 p-1 rounded">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* User Info */}
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Użytkownik</div>
              <div className="text-sm font-medium truncate">{user.email}</div>
              <div className="text-xs text-slate-500 mt-1">ID: {user._id}</div>
            </div>

            {/* Integration Mode */}
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="text-xs text-slate-400 mb-2">Tryb integracji</div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleIntegrationModeChange('N8N')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    integrationMode === 'N8N'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  <Workflow size={14} />
                  n8n
                </button>
                <button
                  onClick={() => handleIntegrationModeChange('NATIVE')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    integrationMode === 'NATIVE'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  <Sparkles size={14} />
                  Native
                </button>
              </div>
            </div>

            {/* Credits */}
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="text-xs text-slate-400 mb-2">Kredyty</div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-amber-400">{user.credits}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => removeCredits({ amount: 1 })}
                    disabled={user.credits <= 0}
                    className="p-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    onClick={() => addCredits({ amount: 1 })}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Audit */}
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="text-xs text-slate-400 mb-2">Aktywny audyt</div>
              {activeAudit ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {React.createElement(statusIcons[activeAudit.status as keyof typeof statusIcons], { size: 14 })}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[activeAudit.status as keyof typeof statusColors]}`}>
                      {activeAudit.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {activeAudit.sourceUrl || 'Brak URL'}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => updateAuditStatus({ auditId: activeAudit._id, status: 'pending' })}
                      className="text-xs px-2 py-1 bg-amber-600 hover:bg-amber-700 rounded transition-colors"
                    >
                      → pending
                    </button>
                    <button
                      onClick={() => updateAuditStatus({ auditId: activeAudit._id, status: 'processing' })}
                      className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
                      → processing
                    </button>
                    <button
                      onClick={() => updateAuditStatus({ auditId: activeAudit._id, status: 'completed' })}
                      className="text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                    >
                      → completed
                    </button>
                    <button
                      onClick={() => updateAuditStatus({ auditId: activeAudit._id, status: 'failed' })}
                      className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
                    >
                      → failed
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">Brak aktywnego audytu</div>
              )}
            </div>

            {/* Create Test Audit */}
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="text-xs text-slate-400 mb-2">Stwórz testowy audyt</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => createTestAudit({ status: 'pending' })}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <Clock size={14} />
                  Pending
                </button>
                <button
                  onClick={() => createTestAudit({ status: 'processing' })}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <Play size={14} />
                  Processing
                </button>
                <button
                  onClick={() => createTestAudit({ status: 'completed' })}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <CheckCircle size={14} />
                  Completed
                </button>
                <button
                  onClick={() => createTestAudit({ status: 'failed' })}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <AlertCircle size={14} />
                  Failed
                </button>
              </div>
            </div>

            {/* Create Test Purchase */}
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="text-xs text-slate-400 mb-2">Stwórz testową płatność</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => createTestPurchase({ product: 'audit', status: 'completed' })}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <CreditCard size={14} />
                  Audyt 79,90zł
                </button>
                <button
                  onClick={() => createTestPurchase({ product: 'audit_consultation', status: 'completed' })}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <Receipt size={14} />
                  +Konsultacja
                </button>
                <button
                  onClick={() => createTestPurchase({ product: 'audit', status: 'pending' })}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <Clock size={14} />
                  Pending
                </button>
                <button
                  onClick={() => createTestPurchase({ product: 'audit', status: 'failed' })}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <Ban size={14} />
                  Failed
                </button>
              </div>
            </div>

            {/* Simulate Payment Complete */}
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="text-xs text-slate-400 mb-2">Symuluj zakończenie płatności</div>
              <button
                onClick={() => simulatePaymentComplete({})}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
              >
                <CreditCard size={16} />
                Utwórz pending audit (gdy webhook nie zadziałał)
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Użyj gdy płatność przeszła, ale audyt się nie utworzył
              </p>
            </div>

            {/* All Purchases */}
            {purchases && purchases.length > 0 && (
              <div className="p-3 bg-slate-800 rounded-lg">
                <div className="text-xs text-slate-400 mb-2">Płatności ({purchases.length})</div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {purchases.map((purchase) => (
                    <div key={purchase._id} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${statusColors[purchase.status as keyof typeof statusColors]}`}>
                          {purchase.status.slice(0, 4)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatPrice(purchase.amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {purchase.status !== 'completed' && (
                          <button
                            onClick={() => updatePurchaseStatus({ purchaseId: purchase._id, status: 'completed' })}
                            className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 rounded transition-colors"
                            title="Mark as completed"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deletePurchase({ purchaseId: purchase._id })}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Audits */}
            {audits && audits.length > 0 && (
              <div className="p-3 bg-slate-800 rounded-lg">
                <div className="text-xs text-slate-400 mb-2">Wszystkie audyty ({audits.length})</div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {audits.map((audit) => (
                    <div key={audit._id} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${statusColors[audit.status as keyof typeof statusColors]}`}>
                          {audit.status.slice(0, 4)}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          {audit.sourceUrl?.slice(0, 20) || 'no url'}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteAudit({ auditId: audit._id })}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DevMenu;
