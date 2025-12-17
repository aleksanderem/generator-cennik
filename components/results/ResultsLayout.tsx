"use client";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Header from '../layout/Header';
import type { ResultsLayoutProps } from './types';

/**
 * ResultsLayout - Shell component for results pages (optimization, audit, etc.)
 *
 * Provides consistent layout with:
 * - Main application header
 * - Dark sub-navigation bar with back button, icon, and title
 * - Content area for tabs and page content
 */
const ResultsLayout: React.FC<ResultsLayoutProps> = ({
  title,
  subtitle,
  backPath,
  backLabel = 'Powrót',
  icon,
  children,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Application Header/Navbar */}
      <Header
        currentPage="optimization"
        onNavigate={() => {}}
      />

      {/* Dark sub-navigation bar */}
      <div className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(backPath)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </button>
              <div className="h-5 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                {icon || <Sparkles className="w-4 h-4 text-[#D4A574]" />}
                {subtitle && (
                  <span className="text-sm text-slate-400">
                    {subtitle}
                  </span>
                )}
              </div>
              <div className="h-5 w-px bg-slate-700" />
              <span className="text-sm font-medium text-white">
                {title}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
};

export default ResultsLayout;
