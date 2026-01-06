"use client";
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  GripVertical,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Search,
  MoveRight,
  Undo2,
  Save,
  AlertCircle,
  ArrowRight,
  GitMerge,
  FolderEdit,
  ArrowUpDown,
  Scissors,
  ListChecks,
  FolderTree,
} from 'lucide-react';
import type { Category, ServiceItem } from '../../types';

export interface CategoryChange {
  type: 'move_service' | 'merge_categories' | 'split_category' | 'rename_category' | 'reorder_categories' | 'create_category';
  description: string;
  fromCategory?: string;
  toCategory?: string;
  services?: string[];
  reason: string;
}

export interface VerificationIssue {
  type: "duplicate" | "missing_description" | "transformation_not_applied" | "category_change_not_applied" | "semantic_issue";
  severity: "error" | "warning" | "info";
  message: string;
  affectedService?: string;
  affectedCategory?: string;
  suggestion?: string;
}

export interface VerificationReport {
  isValid: boolean;
  totalServices: number;
  totalCategories: number;
  stats: {
    servicesWithDescriptions: number;
    servicesWithoutDescriptions: number;
    duplicateNames: number;
    transformationsApplied: number;
    transformationsExpected: number;
    categoryChangesApplied: number;
    categoryChangesExpected: number;
  };
  issues: VerificationIssue[];
  summary: string;
}

export interface CategoryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalStructure: Category[];
  proposedStructure: Category[];
  proposedChanges?: CategoryChange[];
  transformedServices?: Set<string>; // Service names that have been transformed/improved
  verificationReport?: VerificationReport; // Verification results
  onSave: (modifiedStructure: Category[]) => Promise<void>;
}

interface EditableCategory extends Category {
  id: string;
  isExpanded: boolean;
  isEditing: boolean;
}

type TabType = 'changes' | 'editor' | 'verification';

/**
 * CategoryEditorModal - Untitled UI style modal with tabs
 */
const CategoryEditorModal: React.FC<CategoryEditorModalProps> = ({
  isOpen,
  onClose,
  originalStructure,
  proposedStructure,
  proposedChanges = [],
  transformedServices = new Set(),
  verificationReport,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('changes');

  // Initialize editable structure
  const initialStructure = useMemo(() => {
    if (proposedStructure.length > 0 && proposedStructure[0]?.services?.length > 0) {
      return proposedStructure.map((cat, idx) => ({
        ...cat,
        categoryName: cat.categoryName || `Kategoria ${idx + 1}`,
        id: `cat-${idx}-${Date.now()}`,
        isExpanded: idx < 5,
        isEditing: false,
      }));
    }

    const allServicesMap = new Map<string, ServiceItem>();
    originalStructure.forEach(cat => {
      cat.services?.forEach(service => {
        const key = service.name?.toLowerCase().trim() || '';
        if (key) {
          allServicesMap.set(key, service);
        }
      });
    });

    if (proposedStructure.length > 0) {
      return proposedStructure.map((proposedCat, idx) => {
        let services: ServiceItem[] = proposedCat.services || [];

        if (services.length === 0) {
          const matchingOriginalCat = originalStructure.find(origCat => {
            const origName = (origCat.categoryName || '').toLowerCase().trim();
            const propName = (proposedCat.categoryName || '').toLowerCase().trim();
            return origName === propName || origName.includes(propName) || propName.includes(origName);
          });
          if (matchingOriginalCat) {
            services = matchingOriginalCat.services || [];
          }
        }

        return {
          categoryName: proposedCat.categoryName || `Kategoria ${idx + 1}`,
          services,
          id: `cat-${idx}-${Date.now()}`,
          isExpanded: idx < 5,
          isEditing: false,
        };
      });
    }

    return originalStructure.map((cat, idx) => ({
      ...cat,
      categoryName: cat.categoryName || `Kategoria ${idx + 1}`,
      id: `cat-${idx}-${Date.now()}`,
      isExpanded: idx < 5,
      isEditing: false,
    }));
  }, [proposedStructure, originalStructure]);

  const [categories, setCategories] = useState<EditableCategory[]>(initialStructure);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [moveTargetCategory, setMoveTargetCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [history, setHistory] = useState<EditableCategory[][]>([]);
  const [hideEmptyCategories, setHideEmptyCategories] = useState(true);
  const [descriptionModal, setDescriptionModal] = useState<{ serviceName: string; description: string } | null>(null);

  // Reset when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCategories(initialStructure);
      setHistory([]);
      setSelectedServices(new Set());
      setSearchQuery('');
      setActiveTab(proposedChanges.length > 0 ? 'changes' : 'editor');
    }
  }, [isOpen, initialStructure, proposedChanges.length]);

  // Save to history
  const saveToHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-10), categories.map(c => ({ ...c, services: [...c.services] }))]);
  }, [categories]);

  // Undo
  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setCategories(previousState);
      setHistory(prev => prev.slice(0, -1));
    }
  }, [history]);

  // Filter
  const filteredCategories = useMemo(() => {
    let result = categories;

    // Filter out empty categories if option enabled
    if (hideEmptyCategories) {
      result = result.filter(cat => cat.services.length > 0);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result
        .map(cat => ({
          ...cat,
          services: cat.services.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.description?.toLowerCase().includes(query)
          ),
          matchesCategoryName: cat.categoryName.toLowerCase().includes(query),
        }))
        .filter(cat => cat.matchesCategoryName || cat.services.length > 0);
    }

    return result;
  }, [categories, searchQuery, hideEmptyCategories]);

  // Count empty categories
  const emptyCount = useMemo(() => categories.filter(c => c.services.length === 0).length, [categories]);

  // Category actions
  const toggleExpand = (categoryId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, isExpanded: !cat.isExpanded } : cat
    ));
  };

  const startEditingCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, isEditing: true } : { ...cat, isEditing: false }
    ));
  };

  const saveCategoryName = (categoryId: string, newName: string) => {
    if (!newName.trim()) return;
    saveToHistory();
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, categoryName: newName.trim(), isEditing: false } : cat
    ));
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    saveToHistory();
    const newCat: EditableCategory = {
      id: `cat-new-${Date.now()}`,
      categoryName: newCategoryName.trim(),
      services: [],
      isExpanded: true,
      isEditing: false,
    };
    setCategories(prev => [...prev, newCat]);
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const deleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    saveToHistory();

    if (category.services.length > 0) {
      const targetCat = categories.find(c => c.id !== categoryId);
      if (targetCat) {
        setCategories(prev => prev
          .map(cat => {
            if (cat.id === targetCat.id) {
              return { ...cat, services: [...cat.services, ...category.services] };
            }
            return cat;
          })
          .filter(cat => cat.id !== categoryId)
        );
      } else {
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      }
    } else {
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    }
  };

  const toggleServiceSelection = (categoryId: string, serviceIndex: number) => {
    const key = `${categoryId}-${serviceIndex}`;
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const moveSelectedServices = (targetCategoryId: string) => {
    if (selectedServices.size === 0) return;
    saveToHistory();

    const servicesToMove: { fromCatId: string; service: ServiceItem; originalIndex: number }[] = [];

    selectedServices.forEach(key => {
      const cat = categories.find(c => key.startsWith(c.id));
      if (cat) {
        const serviceIdx = parseInt(key.split('-').pop() || '0', 10);
        if (cat.services[serviceIdx]) {
          servicesToMove.push({
            fromCatId: cat.id,
            service: cat.services[serviceIdx],
            originalIndex: serviceIdx,
          });
        }
      }
    });

    const groupedBySource = servicesToMove.reduce((acc, item) => {
      if (!acc[item.fromCatId]) acc[item.fromCatId] = [];
      acc[item.fromCatId].push(item);
      return acc;
    }, {} as Record<string, typeof servicesToMove>);

    setCategories(prev => {
      let newCategories = [...prev];

      Object.entries(groupedBySource).forEach(([fromCatId, items]) => {
        const sortedItems = items.sort((a, b) => b.originalIndex - a.originalIndex);
        newCategories = newCategories.map(cat => {
          if (cat.id === fromCatId) {
            const newServices = [...cat.services];
            sortedItems.forEach(item => newServices.splice(item.originalIndex, 1));
            return { ...cat, services: newServices };
          }
          return cat;
        });
      });

      const allServices = servicesToMove.map(s => s.service);
      newCategories = newCategories.map(cat => {
        if (cat.id === targetCategoryId) {
          return { ...cat, services: [...cat.services, ...allServices] };
        }
        return cat;
      });

      return newCategories;
    });

    setSelectedServices(new Set());
    setMoveTargetCategory(null);
  };

  const handleCategoryReorder = (newOrder: EditableCategory[]) => {
    saveToHistory();
    setCategories(newOrder);
  };

  const handleServiceReorder = (categoryId: string, newServices: ServiceItem[]) => {
    saveToHistory();
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, services: newServices } : cat
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const modifiedStructure: Category[] = categories.map(cat => ({
        categoryName: cat.categoryName,
        services: cat.services,
      }));
      await onSave(modifiedStructure);
      onClose();
    } catch (error) {
      console.error('Failed to save category structure:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const totalServices = categories.reduce((sum, cat) => sum + cat.services.length, 0);

  // Count actual changes: service names, category names, structure changes
  const changesFromOriginal = useMemo(() => {
    let changes = 0;

    // Build map of original service names for comparison
    const originalServiceNames = new Set<string>();
    originalStructure.forEach(cat => {
      cat.services?.forEach(s => {
        if (s.name) originalServiceNames.add(s.name.toLowerCase().trim());
      });
    });

    // Count category structure changes
    if (categories.length !== originalStructure.length) changes++;
    categories.forEach((cat, idx) => {
      if (!originalStructure[idx] || cat.categoryName !== originalStructure[idx].categoryName) {
        changes++;
      }
    });

    // Count service name changes (services with names not in original)
    categories.forEach(cat => {
      cat.services?.forEach(s => {
        if (s.name && !originalServiceNames.has(s.name.toLowerCase().trim())) {
          changes++;
        }
      });
    });

    return changes;
  }, [categories, originalStructure]);

  if (!isOpen) return null;

  // Change type helpers
  const getChangeIcon = (type: CategoryChange['type']) => {
    switch (type) {
      case 'move_service': return <MoveRight className="w-4 h-4" />;
      case 'merge_categories': return <GitMerge className="w-4 h-4" />;
      case 'split_category': return <Scissors className="w-4 h-4" />;
      case 'rename_category': return <FolderEdit className="w-4 h-4" />;
      case 'reorder_categories': return <ArrowUpDown className="w-4 h-4" />;
      case 'create_category': return <FolderPlus className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getChangeColor = (type: CategoryChange['type']) => {
    switch (type) {
      case 'move_service': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'merge_categories': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'split_category': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'rename_category': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'reorder_categories': return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'create_category': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getChangeLabel = (type: CategoryChange['type']) => {
    switch (type) {
      case 'move_service': return 'Przeniesienie';
      case 'merge_categories': return 'Połączenie';
      case 'split_category': return 'Podział';
      case 'rename_category': return 'Zmiana nazwy';
      case 'reorder_categories': return 'Zmiana kolejności';
      case 'create_category': return 'Nowa kategoria';
      default: return 'Zmiana';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Untitled UI style */}
          <div className="px-6 py-5 border-b border-slate-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#D4A574]/10 flex items-center justify-center">
                  <Edit3 className="w-6 h-6 text-[#D4A574]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Edycja układu cennika</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {categories.length} kategorii · {totalServices} usług
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 -m-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Tabs - Untitled UI style */}
            <div className="flex gap-1 mt-5 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setActiveTab('changes')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'changes'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListChecks className="w-4 h-4" />
                Proponowane zmiany
                {proposedChanges.length > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                    activeTab === 'changes' ? 'bg-[#D4A574]/10 text-[#D4A574]' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {proposedChanges.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'editor'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderTree className="w-4 h-4" />
                Układ cennika
              </button>
              {verificationReport && (
                <button
                  onClick={() => setActiveTab('verification')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'verification'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Weryfikacja
                  {verificationReport.issues.length > 0 && (
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                      activeTab === 'verification'
                        ? verificationReport.isValid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {verificationReport.issues.filter(i => i.severity !== 'info').length}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {activeTab === 'changes' ? (
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                {proposedChanges.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <ListChecks className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Brak proponowanych zmian</h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                      AI nie zaproponowało żadnych zmian w strukturze kategorii. Możesz przejść do edytora i wprowadzić zmiany ręcznie.
                    </p>
                    <button
                      onClick={() => setActiveTab('editor')}
                      className="mt-6 px-4 py-2 text-sm font-medium text-[#D4A574] bg-[#D4A574]/10 rounded-lg hover:bg-[#D4A574]/20 transition-colors"
                    >
                      Przejdź do edytora
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 mb-4">
                      Poniżej znajdują się proponowane zmiany w strukturze kategorii. Przejdź do zakładki "Edycja kategorii" aby je zastosować lub zmodyfikować.
                    </p>
                    {proposedChanges.map((change, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border-2 ${getChangeColor(change.type)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-white/80">
                            {getChangeIcon(change.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                                {getChangeLabel(change.type)}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-slate-900">
                              {change.description}
                            </p>
                            {change.fromCategory && change.toCategory && (
                              <div className="flex items-center gap-2 mt-2 text-xs">
                                <span className="px-2 py-1 bg-white/60 rounded-md truncate max-w-[140px]">
                                  {change.fromCategory}
                                </span>
                                <ArrowRight className="w-3 h-3 shrink-0 opacity-50" />
                                <span className="px-2 py-1 bg-white/60 rounded-md truncate max-w-[140px]">
                                  {change.toCategory}
                                </span>
                              </div>
                            )}
                            <p className="text-xs text-slate-600 mt-2 italic">
                              {change.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'verification' && verificationReport ? (
              /* Verification Tab Content */
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                {/* Verification Summary */}
                <div className={`p-4 rounded-xl border-2 mb-6 ${
                  verificationReport.isValid
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      verificationReport.isValid ? 'bg-green-100' : 'bg-amber-100'
                    }`}>
                      {verificationReport.isValid ? (
                        <Check className="w-5 h-5 text-green-700" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        verificationReport.isValid ? 'text-green-900' : 'text-amber-900'
                      }`}>
                        {verificationReport.summary}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <div className="text-center p-2 bg-white/60 rounded-lg">
                          <div className="text-lg font-semibold text-slate-900">{verificationReport.totalServices}</div>
                          <div className="text-xs text-slate-500">Usług</div>
                        </div>
                        <div className="text-center p-2 bg-white/60 rounded-lg">
                          <div className="text-lg font-semibold text-slate-900">{verificationReport.totalCategories}</div>
                          <div className="text-xs text-slate-500">Kategorii</div>
                        </div>
                        <div className="text-center p-2 bg-white/60 rounded-lg">
                          <div className="text-lg font-semibold text-green-600">{verificationReport.stats.servicesWithDescriptions}</div>
                          <div className="text-xs text-slate-500">Z opisem</div>
                        </div>
                        <div className="text-center p-2 bg-white/60 rounded-lg">
                          <div className="text-lg font-semibold text-amber-600">{verificationReport.stats.servicesWithoutDescriptions}</div>
                          <div className="text-xs text-slate-500">Bez opisu</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transformation Stats */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Statystyki zmian</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">Transformacje nazw</span>
                        <span className="text-sm font-medium text-slate-900">
                          {verificationReport.stats.transformationsApplied}/{verificationReport.stats.transformationsExpected}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#D4A574] rounded-full transition-all"
                          style={{
                            width: verificationReport.stats.transformationsExpected > 0
                              ? `${(verificationReport.stats.transformationsApplied / verificationReport.stats.transformationsExpected) * 100}%`
                              : '100%'
                          }}
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">Zmiany kategorii</span>
                        <span className="text-sm font-medium text-slate-900">
                          {verificationReport.stats.categoryChangesApplied}/{verificationReport.stats.categoryChangesExpected}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{
                            width: verificationReport.stats.categoryChangesExpected > 0
                              ? `${(verificationReport.stats.categoryChangesApplied / verificationReport.stats.categoryChangesExpected) * 100}%`
                              : '100%'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  {verificationReport.stats.duplicateNames > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{verificationReport.stats.duplicateNames} duplikatów nazw wykrytych</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Issues List */}
                {verificationReport.issues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3">
                      Wykryte problemy ({verificationReport.issues.filter(i => i.severity !== 'info').length})
                    </h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {verificationReport.issues
                        .filter(issue => issue.severity !== 'info')
                        .map((issue, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            issue.severity === 'error'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-amber-50 border-amber-200'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                              issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${
                                issue.severity === 'error' ? 'text-red-900' : 'text-amber-900'
                              }`}>
                                {issue.message}
                              </p>
                              {issue.suggestion && (
                                <p className="text-xs text-slate-600 mt-1 italic">
                                  Sugestia: {issue.suggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {verificationReport.issues.filter(i => i.severity !== 'info').length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Brak problemów</h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                      Wszystkie zmiany zostały poprawnie zastosowane. Cennik jest gotowy do zapisania.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col">
                  {/* Editor Toolbar */}
                  <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50 shrink-0">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Szukaj usług..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]/50 focus:border-[#D4A574]"
                      />
                    </div>

                    {showAddCategory ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Nazwa kategorii"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                          autoFocus
                          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]/50"
                        />
                        <button
                          onClick={addCategory}
                          disabled={!newCategoryName.trim()}
                          className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-40 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddCategory(true)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#D4A574] bg-[#D4A574]/10 rounded-lg hover:bg-[#D4A574]/20 transition-colors"
                      >
                        <FolderPlus className="w-4 h-4" />
                        Nowa kategoria
                      </button>
                    )}

                    <button
                      onClick={handleUndo}
                      disabled={history.length === 0}
                      className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Cofnij"
                    >
                      <Undo2 className="w-4 h-4 text-slate-600" />
                    </button>

                    {/* Empty categories toggle */}
                    {emptyCount > 0 && (
                      <button
                        onClick={() => setHideEmptyCategories(!hideEmptyCategories)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          hideEmptyCategories
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                        title={hideEmptyCategories ? 'Pokaż puste kategorie' : 'Ukryj puste kategorie'}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {hideEmptyCategories ? `+${emptyCount} pustych` : `${emptyCount} pustych`}
                      </button>
                    )}

                    {selectedServices.size > 0 && (
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-sm text-slate-600">{selectedServices.size} wybranych</span>
                        <div className="relative">
                          <button
                            onClick={() => setMoveTargetCategory(moveTargetCategory ? null : 'show')}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#D4A574] rounded-lg hover:bg-[#C9956C] transition-colors"
                          >
                            <MoveRight className="w-4 h-4" />
                            Przenieś
                          </button>
                          {moveTargetCategory && (
                            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                              {categories.map(cat => (
                                <button
                                  key={cat.id}
                                  onClick={() => moveSelectedServices(cat.id)}
                                  className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 truncate"
                                >
                                  {cat.categoryName}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedServices(new Set())}
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Categories list */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-6">
                    {filteredCategories.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">
                          {searchQuery ? 'Brak wyników wyszukiwania' : 'Brak kategorii'}
                        </p>
                      </div>
                    ) : (
                      <Reorder.Group
                        axis="y"
                        values={filteredCategories}
                        onReorder={handleCategoryReorder}
                        className="space-y-3"
                      >
                        {filteredCategories.map((category) => (
                          <Reorder.Item
                            key={category.id}
                            value={category}
                            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
                          >
                            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                              <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200 rounded">
                                <GripVertical className="w-4 h-4 text-slate-400" />
                              </div>

                              <button
                                onClick={() => toggleExpand(category.id)}
                                className="p-1 hover:bg-slate-200 rounded"
                              >
                                {category.isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-slate-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-500" />
                                )}
                              </button>

                              {category.isEditing ? (
                                <input
                                  type="text"
                                  defaultValue={category.categoryName}
                                  autoFocus
                                  onBlur={(e) => saveCategoryName(category.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveCategoryName(category.id, e.currentTarget.value);
                                    else if (e.key === 'Escape') {
                                      setCategories(prev => prev.map(c =>
                                        c.id === category.id ? { ...c, isEditing: false } : c
                                      ));
                                    }
                                  }}
                                  className="flex-1 px-2 py-1 text-sm font-medium border border-[#D4A574] rounded focus:outline-none focus:ring-2 focus:ring-[#D4A574]/50"
                                />
                              ) : (
                                <span
                                  className="flex-1 font-medium text-slate-800 cursor-pointer hover:text-[#D4A574]"
                                  onClick={() => startEditingCategory(category.id)}
                                >
                                  {category.categoryName}
                                </span>
                              )}

                              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-medium rounded-full">
                                {category.services.length}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => startEditingCategory(category.id)}
                                  className="p-1.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteCategory(category.id)}
                                  className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <AnimatePresence>
                              {category.isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  {category.services.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-slate-400 text-sm">
                                      Brak usług w tej kategorii
                                    </div>
                                  ) : (
                                    <Reorder.Group
                                      axis="y"
                                      values={category.services}
                                      onReorder={(newServices) => handleServiceReorder(category.id, newServices)}
                                      className="p-2 space-y-1"
                                    >
                                      {category.services.map((service, idx) => {
                                        const selectionKey = `${category.id}-${idx}`;
                                        const isSelected = selectedServices.has(selectionKey);

                                        return (
                                          <Reorder.Item
                                            key={`${service.name}-${idx}`}
                                            value={service}
                                            className={`
                                              flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors
                                              ${isSelected ? 'bg-[#D4A574]/10 border border-[#D4A574]/30' : 'bg-white hover:bg-slate-50 border border-transparent'}
                                            `}
                                            onClick={() => toggleServiceSelection(category.id, idx)}
                                          >
                                            <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded" onClick={(e) => e.stopPropagation()}>
                                              <GripVertical className="w-3 h-3 text-slate-400" />
                                            </div>

                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#D4A574] border-[#D4A574]' : 'border-slate-300'}`}>
                                              {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>

                                            {/* Service thumbnail */}
                                            {service.imageUrl ? (
                                              <img
                                                src={service.imageUrl}
                                                alt={service.name}
                                                className="w-10 h-10 rounded-lg object-cover shrink-0"
                                              />
                                            ) : (
                                              <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center">
                                                <span className="text-xs text-slate-400">—</span>
                                              </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                              {/* Header row: name + badge + (duration & price for single variant) */}
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                                  <p className="text-sm font-medium text-slate-700">{service.name}</p>
                                                  {/* Auto-fix labels */}
                                                  {service._autoFixes?.includes('name_transformed') && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700 shrink-0">
                                                      nazwa zmieniona
                                                    </span>
                                                  )}
                                                  {service._autoFixes?.includes('name_deduplicated') && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700 shrink-0">
                                                      deduplikacja
                                                    </span>
                                                  )}
                                                  {service._autoFixes?.includes('description_added') && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-sky-100 text-sky-700 shrink-0">
                                                      dodano opis
                                                    </span>
                                                  )}
                                                  {/* Legacy: Transformed service indicator from Set */}
                                                  {!service._autoFixes?.includes('name_transformed') && transformedServices.has(service.name) && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700 shrink-0">
                                                      zmieniono
                                                    </span>
                                                  )}
                                                  {/* Variant count badge with correct Polish declension */}
                                                  {service.variants && service.variants.length > 0 && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-indigo-100 text-indigo-700 shrink-0">
                                                      {service.variants.length === 1
                                                        ? '1 wariant'
                                                        : service.variants.length >= 2 && service.variants.length <= 4
                                                        ? `${service.variants.length} warianty`
                                                        : `${service.variants.length} wariantów`}
                                                    </span>
                                                  )}
                                                  {/* Tags */}
                                                  {service.tags && service.tags.length > 0 && (
                                                    <div className="flex gap-1 shrink-0">
                                                      {service.tags.slice(0, 2).map((tag, tagIdx) => (
                                                        <span
                                                          key={tagIdx}
                                                          className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700"
                                                        >
                                                          {tag}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                                {/* Duration & price aligned right for single variant or no variants */}
                                                {service.variants && service.variants.length === 1 && (() => {
                                                  const v = service.variants[0];
                                                  return (
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      {v.duration && <span className="text-[10px] text-slate-400">{v.duration}</span>}
                                                      <span className="text-sm font-semibold text-slate-700">{v.price}</span>
                                                    </div>
                                                  );
                                                })()}
                                                {(!service.variants || service.variants.length === 0) && (
                                                  <div className="flex items-center gap-2 shrink-0">
                                                    {service.duration && <span className="text-[10px] text-slate-400">{service.duration}</span>}
                                                    <span className="text-sm font-semibold text-slate-700">{service.price}</span>
                                                  </div>
                                                )}
                                              </div>
                                              {/* Description with [więcej] for long text */}
                                              {service.description && (
                                                <div className="flex items-baseline gap-1 mt-0.5">
                                                  <p className="text-xs text-slate-500 line-clamp-1">
                                                    {service.description.length > 60
                                                      ? service.description.substring(0, 60) + '...'
                                                      : service.description
                                                    }
                                                  </p>
                                                  {service.description.length > 60 && (
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDescriptionModal({ serviceName: service.name, description: service.description || '' });
                                                      }}
                                                      className="text-[10px] text-[#D4A574] hover:text-[#C9956C] font-medium shrink-0"
                                                    >
                                                      [więcej]
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                              {/* No description indicator */}
                                              {!service.description && (
                                                <p className="text-xs text-slate-400 italic mt-0.5">brak opisu</p>
                                              )}
                                              {/* Nested variants (only if 2+) - sorted by price */}
                                              {service.variants && service.variants.length > 1 && (
                                                <div className="mt-1.5 pl-2 border-l-2 border-indigo-200 space-y-0.5">
                                                  {[...service.variants]
                                                    .sort((a, b) => {
                                                      // Parse price: "450,00 zł" -> 450.00
                                                      const parsePrice = (p: string) => {
                                                        const num = p.replace(/[^\d,]/g, '').replace(',', '.');
                                                        return parseFloat(num) || 0;
                                                      };
                                                      return parsePrice(a.price) - parsePrice(b.price);
                                                    })
                                                    .map((variant, vIdx) => (
                                                    <div key={vIdx} className="flex items-center justify-between text-xs">
                                                      <span className="text-slate-600">{variant.label}</span>
                                                      <div className="flex items-center gap-2">
                                                        {variant.duration && (
                                                          <span className="text-slate-400">{variant.duration}</span>
                                                        )}
                                                        <span className="font-medium text-slate-700">{variant.price}</span>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </Reorder.Item>
                                        );
                                      })}
                                    </Reorder.Group>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    )}
                  </div>
              </div>
            )}
          </div>

          {/* Footer - Untitled UI style */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
            >
              Anuluj
            </button>

            <div className="flex items-center gap-3">
              {changesFromOriginal > 0 && (
                <span className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {changesFromOriginal} zmian
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#D4A574] rounded-lg hover:bg-[#C9956C] disabled:opacity-50 shadow-sm transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Zapisuję...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Zapisz zmiany
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Description detail modal */}
        {descriptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={() => setDescriptionModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">{descriptionModal.serviceName}</h3>
                <button
                  onClick={() => setDescriptionModal(null)}
                  className="p-1 -m-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-600 whitespace-pre-wrap">{descriptionModal.description}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setDescriptionModal(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Zamknij
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default CategoryEditorModal;
