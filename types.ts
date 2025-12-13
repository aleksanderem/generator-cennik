
export interface ServiceItem {
  name: string;
  price: string;
  description?: string;
  duration?: string;
  isPromo: boolean;
  imageUrl?: string; // Optional image URL
  tags?: string[];   // Optional tags like "Bestseller", "Nowość"
}

export interface Category {
  categoryName: string;
  services: ServiceItem[];
}

export interface PricingData {
  salonName?: string;
  categories: Category[];
}

export enum AppState {
  INPUT = 'INPUT',
  PROCESSING = 'PROCESSING',
  PREVIEW = 'PREVIEW',
  ERROR = 'ERROR'
}

export type IntegrationMode = 'N8N' | 'NATIVE';

export interface ThemeConfig {
  // Brand
  primaryColor: string; // Main brand color (prices, icons)
  secondaryColor: string; // Light background accent

  // Typography
  fontHeading: string;
  fontBody: string;
  textColor: string; // Main text color
  mutedColor: string; // Secondary text color (descriptions)

  // Font Sizes (in px)
  fontSizeCategory: number;   // Category header
  fontSizeServiceName: number; // Service name
  fontSizeDescription: number; // Service description
  fontSizePrice: number;       // Price
  fontSizeDuration: number;    // Duration text

  // Boxes & Borders
  boxBgColor: string;
  boxBorderColor: string;

  // Promo Specific
  promoColor: string; // Text/Icon color for promo
  promoBgColor: string; // Background for promo box

  // Settings
  integrationMode: IntegrationMode;
}

export const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#e11d48', // Rose-600
  secondaryColor: '#fff1f2', // Rose-50

  fontHeading: 'Playfair Display',
  fontBody: 'Inter',
  textColor: '#334155', // Slate-700
  mutedColor: '#64748b', // Slate-500

  // Font Sizes (px)
  fontSizeCategory: 20,
  fontSizeServiceName: 18,
  fontSizeDescription: 14,
  fontSizePrice: 18,
  fontSizeDuration: 12,

  boxBgColor: '#ffffff',
  boxBorderColor: '#f1f5f9', // Slate-100

  promoColor: '#d97706', // Amber-600
  promoBgColor: '#fffbeb', // Amber-50

  integrationMode: 'N8N',
};

export const FONT_OPTIONS = {
  headings: [
    { label: 'Playfair Display (Serif)', value: 'Playfair Display' },
    { label: 'Montserrat (Sans)', value: 'Montserrat' },
    { label: 'Lato (Sans)', value: 'Lato' },
    { label: 'Merriweather (Serif)', value: 'Merriweather' },
    { label: 'Oswald (Condensed)', value: 'Oswald' },
  ],
  body: [
    { label: 'Inter', value: 'Inter' },
    { label: 'Roboto', value: 'Roboto' },
    { label: 'Open Sans', value: 'Open Sans' },
    { label: 'Lora (Serif)', value: 'Lora' },
  ]
};

// --- AUDIT INTERFACES ---

export interface AuditCategory {
  name: string;
  score: number; // 0-100
  status: 'ok' | 'warning' | 'error';
  message: string;
  suggestion: string;
}

export interface AuditStats {
  serviceCount: number;
  missingDescriptions: number;
  missingDurations: number;
}

export interface GrowthTip {
  category: 'SEO' | 'Konwersja' | 'Retencja' | 'Wizerunek';
  title: string;
  description: string;
  impact: 'Wysoki' | 'Średni' | 'Niski';
}

export interface AuditResult {
  id?: string; // For saving
  date?: string; // For saving
  overallScore: number;
  categories: AuditCategory[]; // Kept for backward compatibility / summary
  stats: AuditStats;
  rawCsv: string; // The raw data extracted
  optimizedText: string; // The AI improved version
  generalFeedback: string;
  
  // New Detailed Report Fields
  strengths?: string[];
  weaknesses?: { point: string; consequence: string }[];
  recommendations?: string[];
  beforeAfter?: { before: string; after: string; explanation: string };
  salesPotential?: string;
  
  // Holistic Growth Strategy
  growthTips?: GrowthTip[];
}