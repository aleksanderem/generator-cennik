import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Settings2,
  Flame,
  Star,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Save,
} from 'lucide-react';
import CategoryTree from './CategoryTree';
import {
  PricingData,
  CategoryConfig,
  PricelistCategoryConfig,
  ServiceAssignment,
} from '../types';
import {
  applyConfigToPricingData,
  generateServiceId,
  countPromoServices,
  countBestsellerServices,
} from '../lib/categoryUtils';

interface CategoryManagerProps {
  pricingData: PricingData;
  categoryConfig: PricelistCategoryConfig;
  onConfigChange: (config: PricelistCategoryConfig) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export default function CategoryManager({
  pricingData,
  categoryConfig,
  onConfigChange,
  onSave,
  isSaving = false,
}: CategoryManagerProps) {
  const [activeSection, setActiveSection] = useState<'categories' | 'services' | null>('categories');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Count promo and bestseller services
  const promoCount = countPromoServices(pricingData);
  const bestsellerCount = countBestsellerServices(pricingData);

  // Build service assignments from current config
  const serviceAssignments = useMemo<ServiceAssignment[]>(() => {
    const assignments: ServiceAssignment[] = [];

    pricingData.categories.forEach((cat, catIdx) => {
      cat.services.forEach((service, svcIdx) => {
        const serviceId = generateServiceId(catIdx, svcIdx);

        // Default assignment is to original category
        const existingAssignment = categoryConfig.serviceAssignments?.find(
          (a) => a.serviceId === serviceId
        );

        assignments.push({
          serviceId,
          serviceName: service.name,
          originalCategoryIndex: catIdx,
          originalServiceIndex: svcIdx,
          assignedCategoryIndices: existingAssignment?.assignedCategoryIndices || [catIdx],
        });
      });
    });

    return assignments;
  }, [pricingData, categoryConfig.serviceAssignments]);

  // Update categories
  const handleCategoriesChange = (newCategories: CategoryConfig[]) => {
    onConfigChange({
      ...categoryConfig,
      categories: newCategories,
    });
  };

  // Generate unique key for category
  const getCategoryKey = (cat: CategoryConfig) =>
    `${cat.isAggregation ? 'agg' : 'cat'}-${cat.originalIndex}-${cat.aggregationType || ''}`;

  // Handle move up - receives category key from CategoryTree
  const handleMoveUp = (categoryKey: string) => {
    const sorted = [...categoryConfig.categories].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex(c => getCategoryKey(c) === categoryKey);

    if (currentIndex <= 0) return;

    const current = sorted[currentIndex];
    const above = sorted[currentIndex - 1];

    const newCategories = categoryConfig.categories.map((c) => {
      const key = getCategoryKey(c);
      if (key === categoryKey) {
        return { ...c, order: above.order };
      }
      if (key === getCategoryKey(above)) {
        return { ...c, order: current.order };
      }
      return c;
    });

    handleCategoriesChange(newCategories);
  };

  // Handle move down - receives category key from CategoryTree
  const handleMoveDown = (categoryKey: string) => {
    const sorted = [...categoryConfig.categories].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex(c => getCategoryKey(c) === categoryKey);

    if (currentIndex >= sorted.length - 1) return;

    const current = sorted[currentIndex];
    const below = sorted[currentIndex + 1];

    const newCategories = categoryConfig.categories.map((c) => {
      const key = getCategoryKey(c);
      if (key === categoryKey) {
        return { ...c, order: below.order };
      }
      if (key === getCategoryKey(below)) {
        return { ...c, order: current.order };
      }
      return c;
    });

    handleCategoriesChange(newCategories);
  };

  // Handle rename - receives category key
  const handleRename = (categoryKey: string, newName: string) => {
    const newCategories = categoryConfig.categories.map((cat) =>
      getCategoryKey(cat) === categoryKey ? { ...cat, categoryName: newName } : cat
    );
    handleCategoriesChange(newCategories);
  };

  // Toggle aggregation mode
  const handleAggregationModeChange = (mode: 'copy' | 'move') => {
    onConfigChange({
      ...categoryConfig,
      aggregationMode: mode,
    });
  };

  // Toggle promotions
  const handleTogglePromotions = () => {
    onConfigChange({
      ...categoryConfig,
      enablePromotions: !categoryConfig.enablePromotions,
    });
  };

  // Toggle bestsellers
  const handleToggleBestsellers = () => {
    onConfigChange({
      ...categoryConfig,
      enableBestsellers: !categoryConfig.enableBestsellers,
    });
  };

  // Toggle category expansion in service assignment view
  const toggleCategoryExpanded = (catIdx: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(catIdx)) {
      newExpanded.delete(catIdx);
    } else {
      newExpanded.add(catIdx);
    }
    setExpandedCategories(newExpanded);
  };

  // Handle service category assignment toggle
  const handleServiceCategoryToggle = (
    serviceId: string,
    targetCategoryIndex: number
  ) => {
    const existingAssignments = categoryConfig.serviceAssignments || [];
    const existingIdx = existingAssignments.findIndex(
      (a) => a.serviceId === serviceId
    );
    const assignment = serviceAssignments.find((a) => a.serviceId === serviceId);
    if (!assignment) return;

    let newAssignedIndices: number[];

    if (categoryConfig.aggregationMode === 'move') {
      // Move mode: only one category assignment allowed
      newAssignedIndices = [targetCategoryIndex];
    } else {
      // Copy mode: toggle the category
      const currentAssigned = existingIdx >= 0
        ? existingAssignments[existingIdx].assignedCategoryIndices
        : assignment.assignedCategoryIndices;

      if (currentAssigned.includes(targetCategoryIndex)) {
        // Remove if already assigned (but keep at least one)
        if (currentAssigned.length > 1) {
          newAssignedIndices = currentAssigned.filter(
            (idx) => idx !== targetCategoryIndex
          );
        } else {
          return; // Can't remove last assignment
        }
      } else {
        // Add new assignment
        newAssignedIndices = [...currentAssigned, targetCategoryIndex];
      }
    }

    const newAssignment: ServiceAssignment = {
      ...assignment,
      assignedCategoryIndices: newAssignedIndices,
    };

    let newAssignments: ServiceAssignment[];
    if (existingIdx >= 0) {
      newAssignments = [...existingAssignments];
      newAssignments[existingIdx] = newAssignment;
    } else {
      newAssignments = [...existingAssignments, newAssignment];
    }

    onConfigChange({
      ...categoryConfig,
      serviceAssignments: newAssignments,
    });
  };

  // Build display categories including aggregations
  const displayCategories = useMemo(() => {
    const result: CategoryConfig[] = [...categoryConfig.categories];

    if (categoryConfig.enablePromotions && promoCount > 0) {
      result.push({
        categoryName: '🔥 Promocje',
        order: -2,
        originalIndex: -1,
        isAggregation: true,
        aggregationType: 'promotions',
      });
    }

    if (categoryConfig.enableBestsellers && bestsellerCount > 0) {
      result.push({
        categoryName: '⭐ Bestsellery',
        order: -1,
        originalIndex: -2,
        isAggregation: true,
        aggregationType: 'bestsellers',
      });
    }

    return result;
  }, [categoryConfig, promoCount, bestsellerCount]);

  // Get preview of applied configuration
  const previewData = useMemo(() => {
    return applyConfigToPricingData(pricingData, categoryConfig);
  }, [pricingData, categoryConfig]);

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Zarządzanie kategoriami
              </h2>
              <p className="text-sm text-slate-500">
                Edytuj strukturę i przypisania usług
              </p>
            </div>
          </div>
          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Zapisuję...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Zapisz zmiany
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSection('categories')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeSection === 'categories'
              ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Kolejność kategorii
        </button>
        <button
          onClick={() => setActiveSection('services')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeSection === 'services'
              ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Przypisania usług
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Categories section */}
        {activeSection === 'categories' && (
          <div className="space-y-6">
            {/* Category tree */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                Kolejność i nazwy
              </h3>
              <CategoryTree
                categories={displayCategories}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onRename={handleRename}
                pricingData={pricingData}
                editable={true}
              />
            </div>

            {/* Aggregation settings */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Agregacje specjalne
              </h3>

              {/* Aggregation mode */}
              <div className="mb-6">
                <p className="text-xs text-slate-500 mb-3">Tryb agregacji:</p>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-amber-300 transition-colors">
                    <input
                      type="radio"
                      name="aggregationMode"
                      value="move"
                      checked={categoryConfig.aggregationMode === 'move'}
                      onChange={() => handleAggregationModeChange('move')}
                      className="mt-0.5 text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700">Przenieś</span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Usługi pojawiają się tylko w agregacji
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-amber-300 transition-colors">
                    <input
                      type="radio"
                      name="aggregationMode"
                      value="copy"
                      checked={categoryConfig.aggregationMode === 'copy'}
                      onChange={() => handleAggregationModeChange('copy')}
                      className="mt-0.5 text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-700">Kopiuj</span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Usługi w agregacji i oryginalnej kategorii
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                        <AlertTriangle size={12} />
                        <span>Uwaga: może tworzyć zduplikowaną treść</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Toggle switches */}
              <div className="space-y-3">
                {/* Promotions */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Flame size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Promocje</p>
                      <p className="text-xs text-slate-500">
                        {promoCount} usług promocyjnych
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleTogglePromotions}
                    disabled={promoCount === 0}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      promoCount === 0
                        ? 'bg-slate-200 cursor-not-allowed'
                        : categoryConfig.enablePromotions
                        ? 'bg-amber-500'
                        : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        categoryConfig.enablePromotions
                          ? 'translate-x-7'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Bestsellers */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Star size={20} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Bestsellery</p>
                      <p className="text-xs text-slate-500">
                        {bestsellerCount} usług z tagiem
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleBestsellers}
                    disabled={bestsellerCount === 0}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      bestsellerCount === 0
                        ? 'bg-slate-200 cursor-not-allowed'
                        : categoryConfig.enableBestsellers
                        ? 'bg-amber-500'
                        : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        categoryConfig.enableBestsellers
                          ? 'translate-x-7'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services section */}
        {activeSection === 'services' && (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
              <p className="font-medium mb-1">
                Tryb: {categoryConfig.aggregationMode === 'move' ? 'Przenieś' : 'Kopiuj'}
              </p>
              <p className="text-xs text-amber-700">
                {categoryConfig.aggregationMode === 'move'
                  ? 'Każda usługa może być przypisana tylko do jednej kategorii.'
                  : 'Usługi mogą być widoczne w wielu kategoriach jednocześnie.'}
              </p>
            </div>

            {/* Category list with services */}
            {pricingData.categories.map((cat, catIdx) => {
              const isExpanded = expandedCategories.has(catIdx);
              const catConfig = categoryConfig.categories.find(
                (c) => c.originalIndex === catIdx
              );

              return (
                <div
                  key={catIdx}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategoryExpanded(catIdx)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={16} className="text-slate-400" />
                      )}
                      <span className="font-medium text-slate-700">
                        {catConfig?.categoryName || cat.categoryName}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({cat.services.length} usług)
                      </span>
                    </div>
                  </button>

                  {/* Services list */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-100">
                      {cat.services.map((service, svcIdx) => {
                        const serviceId = generateServiceId(catIdx, svcIdx);
                        const assignment = serviceAssignments.find(
                          (a) => a.serviceId === serviceId
                        );
                        const assignedIndices =
                          assignment?.assignedCategoryIndices || [catIdx];

                        return (
                          <div
                            key={svcIdx}
                            className="p-4 bg-white hover:bg-slate-50/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">
                                  {service.name}
                                </p>
                                {service.description && (
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                    {service.description}
                                  </p>
                                )}
                                <p className="text-xs text-slate-400 mt-1">
                                  {service.price}
                                  {service.duration && ` • ${service.duration}`}
                                </p>
                              </div>

                              {/* Category assignment checkboxes */}
                              <div className="flex flex-wrap gap-1.5 justify-end">
                                {categoryConfig.categories
                                  .filter((c) => !c.isAggregation)
                                  .sort((a, b) => a.order - b.order)
                                  .map((targetCat) => {
                                    const isAssigned = assignedIndices.includes(
                                      targetCat.originalIndex
                                    );
                                    const isOriginal =
                                      targetCat.originalIndex === catIdx;

                                    return (
                                      <button
                                        key={targetCat.originalIndex}
                                        onClick={() =>
                                          handleServiceCategoryToggle(
                                            serviceId,
                                            targetCat.originalIndex
                                          )
                                        }
                                        className={`
                                          px-2 py-1 text-xs rounded-lg border transition-all
                                          ${
                                            isAssigned
                                              ? 'bg-amber-100 border-amber-300 text-amber-800'
                                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-amber-300'
                                          }
                                          ${isOriginal && isAssigned ? 'ring-1 ring-amber-400' : ''}
                                        `}
                                        title={
                                          isAssigned
                                            ? `Usuń z "${targetCat.categoryName}"`
                                            : `Dodaj do "${targetCat.categoryName}"`
                                        }
                                      >
                                        {isAssigned && (
                                          <Check
                                            size={10}
                                            className="inline mr-1"
                                          />
                                        )}
                                        {targetCat.categoryName.slice(0, 12)}
                                        {targetCat.categoryName.length > 12 && '...'}
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Podgląd:</span>
          <div className="flex items-center gap-4 text-slate-700">
            <span>
              <span className="font-medium">{previewData.categories.length}</span>{' '}
              kategorii
            </span>
            <span>
              <span className="font-medium">
                {previewData.categories.reduce(
                  (acc, cat) => acc + cat.services.length,
                  0
                )}
              </span>{' '}
              usług
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
