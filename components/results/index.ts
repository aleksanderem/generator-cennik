// Re-export all results components
export { default as ResultsLayout } from './ResultsLayout';
export { default as ResultsTabNavigation } from './ResultsTabNavigation';
export { default as FullPricelistDisplay } from './FullPricelistDisplay';
export { default as PricelistInfoSidebar } from './PricelistInfoSidebar';
export { default as QualityScoreCard } from './QualityScoreCard';
export { default as QuickActionsCard } from './QuickActionsCard';

// Multi-step audit analysis components
export { default as KeywordReportCard } from './KeywordReportCard';
export { default as CategoryProposalCard } from './CategoryProposalCard';
export { default as OptimizationOptionsCard } from './OptimizationOptionsCard';
export { default as CategoryEditorModal } from './CategoryEditorModal';

// Re-export types
export type {
  Tab,
  QuickAction,
  StatsData,
  ResultsLayoutProps,
  ResultsTabNavigationProps,
  QualityScoreCardProps,
  QuickActionsCardProps,
  FullPricelistDisplayProps,
  PricelistInfoSidebarProps,
  // Multi-step audit analysis types
  KeywordData,
  CategoryDistribution,
  KeywordReportCardProps,
  CategoryChange,
  CategoryProposalCardProps,
  OptimizationOptionType,
  OptimizationOptionsCardProps,
} from './types';

export type { CategoryEditorModalProps } from './CategoryEditorModal';
