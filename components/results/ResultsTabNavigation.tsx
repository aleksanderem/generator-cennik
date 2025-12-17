"use client";
import React from 'react';
import type { ResultsTabNavigationProps } from './types';

/**
 * ResultsTabNavigation - Generic tab navigation bar for results pages
 *
 * Features:
 * - Horizontal scrollable tabs
 * - Active state styling
 * - Optional badge counts per tab
 * - Right-side actions slot (e.g., dropdown menu)
 */
const ResultsTabNavigation: React.FC<ResultsTabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  actions,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isDisabled = tab.disabled === true;
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && onTabChange(tab.id)}
                  disabled={isDisabled}
                  className={`
                    relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all rounded-lg
                    ${isDisabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : isActive
                        ? 'text-[#D4A574] bg-[#D4A574]/10'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }
                  `}
                >
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-[#D4A574]/20' : 'bg-slate-200'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Actions slot */}
          {actions}
        </div>
      </div>
    </div>
  );
};

export default ResultsTabNavigation;
