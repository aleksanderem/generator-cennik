import type { LucideIcon } from 'lucide-react';
import type { PricingData, ThemeConfig } from '../../types';

// Tab configuration
export interface Tab {
  id: string;
  label: string;
  badge?: number;
  disabled?: boolean;
}

// Quick action for action grids
export interface QuickAction {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

// Stats data for summary cards
export interface StatsData {
  categories: { count: number; delta?: number };
  changes: { count: number };
  services: { count: number; delta?: number };
}

// ResultsLayout props
export interface ResultsLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  backPath: string;
  backLabel?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

// ResultsTabNavigation props
export interface ResultsTabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  actions?: React.ReactNode;
}

// QualityScoreCard props
export interface QualityScoreCardProps {
  qualityScore: number;
  stats: StatsData;
  salesPotentialDescription?: string;
  /** 'before' shows original pricelist state, 'after' shows optimized state */
  variant?: 'before' | 'after';
}

// QuickActionsCard props
export interface QuickActionsCardProps {
  actions: QuickAction[];
}

// FullPricelistDisplay props
export interface FullPricelistDisplayProps {
  data: PricingData;
  theme: ThemeConfig;
  templateId: string;
  label?: string;
  variant: 'original' | 'optimized';
  isLoading?: boolean;
  showLabel?: boolean;
}

// PricelistInfoSidebar props
export interface PricelistInfoSidebarProps {
  pricingData: PricingData;
  themeConfig: ThemeConfig;
  templateId: string;
  variant: 'original' | 'optimized';
  pricelistId?: string;
  onExportPDF?: () => void;
  isExportingPDF?: boolean;
  showEmbedCode?: boolean;
  /** Show re-fetch from Booksy button for corrupted data recovery */
  showRefetchButton?: boolean;
  onRefetchFromBooksy?: () => void;
  isRefetching?: boolean;
}

// ============================================
// Multi-step Audit Analysis Components
// ============================================

// Keyword data structure (from auditAnalysis)
export interface KeywordData {
  keyword: string;
  count: number;
  categories: string[];
  services: string[];
}

// Category distribution for keyword report
export interface CategoryDistribution {
  categoryName: string;
  keywordCount: number;
  topKeywords: string[];
}

// Proposed keyword for after-optimization view
export interface ProposedKeyword {
  keyword: string;
  source: 'transformation' | 'suggestion';
  searchVolume?: 'high' | 'medium' | 'low';
  placement?: string;
  reason?: string;
  beforePhrase?: string;
  afterPhrase?: string;
}

// KeywordReportCard props
export interface KeywordReportCardProps {
  keywords: KeywordData[];
  categoryDistribution: CategoryDistribution[];
  suggestions: string[];
  /** Proposed keywords from V2 audit transformations */
  proposedKeywords?: ProposedKeyword[];
  /** Improvement percentage after applying changes */
  improvementPercent?: number;
  onExportCSV?: () => void;
  isLoading?: boolean;
}

// Category change structure (from schema)
export interface CategoryChange {
  type: 'move_service' | 'merge_categories' | 'split_category' | 'rename_category' | 'reorder_categories' | 'create_category';
  description: string;
  fromCategory?: string;
  toCategory?: string;
  services?: string[];
  reason: string;
}

// CategoryProposalCard props
export interface CategoryProposalCardProps {
  originalStructure: { name: string; servicesCount: number }[];
  proposedStructure: { name: string; servicesCount: number }[];
  changes: CategoryChange[];
  status: 'pending' | 'accepted' | 'modified' | 'rejected';
  onAccept?: () => void;
  onReject?: () => void;
  onModify?: () => void;
  isLoading?: boolean;
}

// Optimization option type
export type OptimizationOptionType =
  | 'descriptions'
  | 'seo'
  | 'categories'
  | 'order'
  | 'prices'
  | 'duplicates'
  | 'duration'
  | 'tags';

// OptimizationOptionsCard props
export interface OptimizationOptionsCardProps {
  selectedOptions: OptimizationOptionType[];
  onToggleOption: (option: OptimizationOptionType) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onStartOptimization: () => void;
  hasCategoryProposal?: boolean;
  categoryProposalAccepted?: boolean;
  isLoading?: boolean;
  isOptimizing?: boolean;
}
