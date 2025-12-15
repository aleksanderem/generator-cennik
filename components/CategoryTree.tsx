import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Pencil, Check, X, Layers, Flame, Star } from 'lucide-react';
import { CategoryConfig, PricingData } from '../types';

interface CategoryTreeProps {
  categories: CategoryConfig[];
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRename: (index: number, newName: string) => void;
  pricingData?: PricingData;
  editable?: boolean;
}

export default function CategoryTree({
  categories,
  onMoveUp,
  onMoveDown,
  onRename,
  pricingData,
  editable = true,
}: CategoryTreeProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(categories[index].categoryName);
  };

  const confirmEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      onRename(editingIndex, editValue.trim());
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      confirmEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Get service count for a category
  const getServiceCount = (category: CategoryConfig): number => {
    if (!pricingData) return 0;

    // For aggregation categories, count matching services across all categories
    if (category.isAggregation) {
      if (category.aggregationType === 'promotions') {
        return pricingData.categories.reduce((count, cat) =>
          count + cat.services.filter(s => s.isPromo).length, 0
        );
      }
      if (category.aggregationType === 'bestsellers') {
        return pricingData.categories.reduce((count, cat) =>
          count + cat.services.filter(s => s.tags?.includes('Bestseller')).length, 0
        );
      }
      return 0;
    }

    // For regular categories, get count from original index
    const originalCategory = pricingData.categories[category.originalIndex];
    return originalCategory?.services.length ?? 0;
  };

  // Get icon for category type
  const getCategoryIcon = (category: CategoryConfig) => {
    if (category.aggregationType === 'promotions') {
      return <Flame size={16} className="text-orange-500" />;
    }
    if (category.aggregationType === 'bestsellers') {
      return <Star size={16} className="text-amber-500" />;
    }
    return <Layers size={16} className="text-slate-400" />;
  };

  // Sort categories by order
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-1">
      {sortedCategories.map((category, displayIndex) => {
        const actualIndex = categories.findIndex(c => c.originalIndex === category.originalIndex && c.isAggregation === category.isAggregation);
        const serviceCount = getServiceCount(category);
        const isFirst = displayIndex === 0;
        const isLast = displayIndex === sortedCategories.length - 1;
        const isEditing = editingIndex === actualIndex;

        return (
          <div
            key={`${category.isAggregation ? 'agg' : 'cat'}-${category.originalIndex}-${category.aggregationType || ''}`}
            className={`
              group flex items-center gap-2 p-3 rounded-lg border transition-all
              ${category.isAggregation
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                : 'bg-white border-slate-200 hover:border-slate-300'
              }
            `}
          >
            {/* Reorder buttons */}
            {editable && (
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => onMoveUp(actualIndex)}
                  disabled={isFirst}
                  className={`
                    p-0.5 rounded transition-colors
                    ${isFirst
                      ? 'text-slate-200 cursor-not-allowed'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }
                  `}
                  title="Przesuń w górę"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => onMoveDown(actualIndex)}
                  disabled={isLast}
                  className={`
                    p-0.5 rounded transition-colors
                    ${isLast
                      ? 'text-slate-200 cursor-not-allowed'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }
                  `}
                  title="Przesuń w dół"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            )}

            {/* Category icon */}
            <div className="flex-shrink-0">
              {getCategoryIcon(category)}
            </div>

            {/* Category name (editable or static) */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={confirmEdit}
                    className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <button
                    onClick={confirmEdit}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                    title="Zatwierdź"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Anuluj"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium truncate ${category.isAggregation ? 'text-amber-800' : 'text-slate-700'}`}>
                    {category.categoryName}
                  </span>
                  {editable && !category.isAggregation && (
                    <button
                      onClick={() => startEditing(actualIndex)}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Zmień nazwę"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Service count badge */}
            <div className={`
              flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full
              ${category.isAggregation
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-600'
              }
            `}>
              {serviceCount} {serviceCount === 1 ? 'usługa' : serviceCount < 5 ? 'usługi' : 'usług'}
            </div>
          </div>
        );
      })}

      {categories.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          Brak kategorii do wyświetlenia
        </div>
      )}
    </div>
  );
}
