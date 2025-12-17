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
  Merge,
  ChevronDown,
  ChevronRight,
  Search,
  MoveRight,
  Undo2,
  Save,
  AlertCircle,
  Info,
  ArrowRight,
  Sparkles,
  GitMerge,
  FolderEdit,
  ArrowUpDown,
  Scissors,
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

export interface CategoryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalStructure: Category[];
  proposedStructure: Category[];
  proposedChanges?: CategoryChange[];
  onSave: (modifiedStructure: Category[]) => Promise<void>;
}

interface EditableCategory extends Category {
  id: string;
  isExpanded: boolean;
  isEditing: boolean;
}

/**
 * CategoryEditorModal - Full-featured category structure editor
 *
 * Features:
 * - Drag & drop reordering of categories
 * - Drag & drop moving services between categories
 * - Add/rename/delete categories
 * - Merge categories together
 * - Search and filter services
 * - Undo changes
 * - Side-by-side comparison with original
 */
const CategoryEditorModal: React.FC<CategoryEditorModalProps> = ({
  isOpen,
  onClose,
  originalStructure,
  proposedStructure,
  proposedChanges = [],
  onSave,
}) => {
  // Initialize editable structure - MERGE proposed category names with original services
  // proposedStructure has AI-suggested category names but may lack full service data
  // originalStructure has full service data but old category structure
  const initialStructure = useMemo(() => {
    console.log('[CategoryEditorModal] Input data:', {
      proposedLength: proposedStructure.length,
      originalLength: originalStructure.length,
      proposedFirst: proposedStructure[0],
      originalFirst: originalStructure[0],
    });

    // If proposed has categories with services, use it directly
    if (proposedStructure.length > 0 && proposedStructure[0]?.services?.length > 0) {
      return proposedStructure.map((cat, idx) => ({
        ...cat,
        categoryName: cat.categoryName || `Kategoria ${idx + 1}`,
        id: `cat-${idx}-${Date.now()}`,
        isExpanded: idx < 5,
        isEditing: false,
      }));
    }

    // Otherwise, we need to merge: proposed category names + original services
    // Build a map of all services from original structure
    const allServicesMap = new Map<string, ServiceItem>();
    originalStructure.forEach(cat => {
      cat.services?.forEach(service => {
        // Use service name as key (normalized)
        const key = service.name?.toLowerCase().trim() || '';
        if (key) {
          allServicesMap.set(key, service);
        }
      });
    });

    // Map proposed categories and try to find matching services
    if (proposedStructure.length > 0) {
      return proposedStructure.map((proposedCat, idx) => {
        // Try to find services for this category
        let services: ServiceItem[] = proposedCat.services || [];

        // If proposed category has no services, try to match from original by category name
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

    // Fallback to original structure
    return originalStructure.map((cat, idx) => ({
      ...cat,
      categoryName: cat.categoryName || `Kategoria ${idx + 1}`,
      id: `cat-${idx}-${Date.now()}`,
      isExpanded: idx < 5,
      isEditing: false,
    }));
  }, [proposedStructure, originalStructure]);

  const [categories, setCategories] = useState<EditableCategory[]>(initialStructure);
  const [showProposedChanges, setShowProposedChanges] = useState(true);

  // Reset categories when modal opens with new data
  React.useEffect(() => {
    if (isOpen) {
      setCategories(initialStructure);
      setHistory([]);
      setSelectedServices(new Set());
      setSearchQuery('');
      setShowProposedChanges(proposedChanges.length > 0);
    }
  }, [isOpen, initialStructure]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [moveTargetCategory, setMoveTargetCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [history, setHistory] = useState<EditableCategory[][]>([]);

  // Save current state to history for undo
  const saveToHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-10), categories.map(c => ({ ...c, services: [...c.services] }))]);
  }, [categories]);

  // Undo last change
  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setCategories(previousState);
      setHistory(prev => prev.slice(0, -1));
    }
  }, [history]);

  // Filter categories and services by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    return categories
      .map(cat => ({
        ...cat,
        services: cat.services.filter(s =>
          s.name.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query)
        ),
        // Keep category if name matches or has matching services
        matchesCategoryName: cat.categoryName.toLowerCase().includes(query),
      }))
      .filter(cat => cat.matchesCategoryName || cat.services.length > 0);
  }, [categories, searchQuery]);

  // Toggle category expansion
  const toggleExpand = (categoryId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, isExpanded: !cat.isExpanded } : cat
    ));
  };

  // Start editing category name
  const startEditingCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, isEditing: true } : { ...cat, isEditing: false }
    ));
  };

  // Save category name
  const saveCategoryName = (categoryId: string, newName: string) => {
    if (!newName.trim()) return;
    saveToHistory();
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, categoryName: newName.trim(), isEditing: false } : cat
    ));
  };

  // Add new category
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

  // Delete category (moves services to "Bez kategorii" or deletes if empty)
  const deleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    saveToHistory();

    if (category.services.length > 0) {
      // Move services to "Bez kategorii" or first available category
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
        // No other category, just delete
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      }
    } else {
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    }
  };

  // Toggle service selection for bulk move
  const toggleServiceSelection = (categoryId: string, serviceIndex: number) => {
    const key = `${categoryId}-${serviceIndex}`;
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Move selected services to target category
  const moveSelectedServices = (targetCategoryId: string) => {
    if (selectedServices.size === 0) return;
    saveToHistory();

    const servicesToMove: { fromCatId: string; service: ServiceItem; originalIndex: number }[] = [];

    selectedServices.forEach(key => {
      const [catId, indexStr] = key.split('-').slice(0, 2);
      const fullCatId = categories.find(c => c.id.startsWith(catId))?.id;
      if (!fullCatId) return;

      // Find the actual category and service
      const cat = categories.find(c => c.id === fullCatId || key.startsWith(c.id));
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

    // Group by source category and sort by index descending (to remove from end first)
    const groupedBySource = servicesToMove.reduce((acc, item) => {
      if (!acc[item.fromCatId]) acc[item.fromCatId] = [];
      acc[item.fromCatId].push(item);
      return acc;
    }, {} as Record<string, typeof servicesToMove>);

    setCategories(prev => {
      let newCategories = [...prev];

      // Remove services from source categories
      Object.entries(groupedBySource).forEach(([fromCatId, items]) => {
        const sortedItems = items.sort((a, b) => b.originalIndex - a.originalIndex);
        newCategories = newCategories.map(cat => {
          if (cat.id === fromCatId) {
            const newServices = [...cat.services];
            sortedItems.forEach(item => {
              newServices.splice(item.originalIndex, 1);
            });
            return { ...cat, services: newServices };
          }
          return cat;
        });
      });

      // Add services to target category
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

  // Handle category reorder
  const handleCategoryReorder = (newOrder: EditableCategory[]) => {
    saveToHistory();
    setCategories(newOrder);
  };

  // Handle service reorder within category
  const handleServiceReorder = (categoryId: string, newServices: ServiceItem[]) => {
    saveToHistory();
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, services: newServices } : cat
    ));
  };

  // Merge two categories
  const mergeCategories = (sourceCatId: string, targetCatId: string) => {
    const sourceCat = categories.find(c => c.id === sourceCatId);
    const targetCat = categories.find(c => c.id === targetCatId);
    if (!sourceCat || !targetCat) return;

    saveToHistory();
    setCategories(prev => prev
      .map(cat => {
        if (cat.id === targetCatId) {
          return {
            ...cat,
            services: [...cat.services, ...sourceCat.services],
          };
        }
        return cat;
      })
      .filter(cat => cat.id !== sourceCatId)
    );
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert back to Category[] format
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

  // Calculate stats
  const totalServices = categories.reduce((sum, cat) => sum + cat.services.length, 0);
  const changesFromOriginal = useMemo(() => {
    let changes = 0;
    // Compare category count
    if (categories.length !== originalStructure.length) changes++;
    // Compare category names
    categories.forEach((cat, idx) => {
      if (!originalStructure[idx] || cat.categoryName !== originalStructure[idx].categoryName) {
        changes++;
      }
    });
    return changes;
  }, [categories, originalStructure]);

  if (!isOpen) return null;

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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#D4A574]/10 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-[#D4A574]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Edytor struktury kategorii</h2>
                <p className="text-sm text-slate-500">
                  {categories.length} kategorii, {totalServices} usług
                  {changesFromOriginal > 0 && (
                    <span className="ml-2 text-amber-600">({changesFromOriginal} zmian)</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Cofnij"
              >
                <Undo2 className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-4 bg-white">
            {/* Search */}
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

            {/* Add category button */}
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

            {/* Bulk move selected */}
            {selectedServices.size > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-slate-600">
                  {selectedServices.size} wybranych
                </span>
                <div className="relative">
                  <button
                    onClick={() => setMoveTargetCategory(moveTargetCategory ? null : 'show')}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#D4A574] rounded-lg hover:bg-[#C9956C] transition-colors"
                  >
                    <MoveRight className="w-4 h-4" />
                    Przenieś do...
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

          {/* Proposed Changes Panel */}
          {proposedChanges.length > 0 && (
            <div className="border-b border-slate-200">
              <button
                onClick={() => setShowProposedChanges(!showProposedChanges)}
                className="w-full px-6 py-3 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-slate-800">
                      Proponowane zmiany AI
                    </span>
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      {proposedChanges.length}
                    </span>
                  </div>
                </div>
                {showProposedChanges ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </button>

              <AnimatePresence>
                {showProposedChanges && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 py-4 bg-slate-50 space-y-2 max-h-48 overflow-y-auto">
                      {proposedChanges.map((change, idx) => {
                        const getChangeIcon = () => {
                          switch (change.type) {
                            case 'move_service': return <MoveRight className="w-4 h-4" />;
                            case 'merge_categories': return <GitMerge className="w-4 h-4" />;
                            case 'split_category': return <Scissors className="w-4 h-4" />;
                            case 'rename_category': return <FolderEdit className="w-4 h-4" />;
                            case 'reorder_categories': return <ArrowUpDown className="w-4 h-4" />;
                            case 'create_category': return <FolderPlus className="w-4 h-4" />;
                            default: return <Info className="w-4 h-4" />;
                          }
                        };

                        const getChangeColor = () => {
                          switch (change.type) {
                            case 'move_service': return 'bg-blue-100 text-blue-700';
                            case 'merge_categories': return 'bg-purple-100 text-purple-700';
                            case 'split_category': return 'bg-orange-100 text-orange-700';
                            case 'rename_category': return 'bg-emerald-100 text-emerald-700';
                            case 'reorder_categories': return 'bg-slate-100 text-slate-700';
                            case 'create_category': return 'bg-indigo-100 text-indigo-700';
                            default: return 'bg-slate-100 text-slate-700';
                          }
                        };

                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200"
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${getChangeColor()}`}>
                              {getChangeIcon()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800">
                                {change.description}
                              </p>
                              {change.fromCategory && change.toCategory && (
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                  <span className="truncate max-w-[120px]">{change.fromCategory}</span>
                                  <ArrowRight className="w-3 h-3 shrink-0" />
                                  <span className="truncate max-w-[120px]">{change.toCategory}</span>
                                </p>
                              )}
                              <p className="text-xs text-slate-500 mt-1">
                                {change.reason}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Content - Categories list */}
          <div className="flex-1 overflow-y-auto p-6">
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
                    className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
                  >
                    {/* Category header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
                      <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded">
                        <GripVertical className="w-4 h-4 text-slate-400" />
                      </div>

                      <button
                        onClick={() => toggleExpand(category.id)}
                        className="p-1 hover:bg-slate-100 rounded"
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
                          defaultValue={category.categoryName || `Kategoria ${filteredCategories.indexOf(category) + 1}`}
                          autoFocus
                          onBlur={(e) => saveCategoryName(category.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveCategoryName(category.id, e.currentTarget.value);
                            } else if (e.key === 'Escape') {
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
                          {category.categoryName || `Kategoria ${filteredCategories.indexOf(category) + 1}`}
                        </span>
                      )}

                      <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-medium rounded-full">
                        {category.services.length} usług
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditingCategory(category.id)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                          title="Zmień nazwę"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"
                          title="Usuń kategorię"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Services list */}
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

                                    <div
                                      className={`
                                        w-4 h-4 rounded border-2 flex items-center justify-center shrink-0
                                        ${isSelected ? 'bg-[#D4A574] border-[#D4A574]' : 'border-slate-300'}
                                      `}
                                    >
                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-700 truncate">
                                        {service.name}
                                      </p>
                                      {service.description && (
                                        <p className="text-xs text-slate-500 truncate">
                                          {service.description}
                                        </p>
                                      )}
                                    </div>

                                    <span className="text-sm font-medium text-slate-600 shrink-0">
                                      {service.price}
                                    </span>
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

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Anuluj
            </button>

            <div className="flex items-center gap-3">
              {changesFromOriginal > 0 && (
                <span className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {changesFromOriginal} niezapisanych zmian
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#D4A574] rounded-lg hover:bg-[#C9956C] disabled:opacity-50 transition-colors"
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
      </motion.div>
    </AnimatePresence>
  );
};

export default CategoryEditorModal;
