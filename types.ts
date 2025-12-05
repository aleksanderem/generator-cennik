
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

export interface ThemeConfig {
  // Brand
  primaryColor: string; // Main brand color (prices, icons)
  secondaryColor: string; // Light background accent
  
  // Typography
  fontHeading: string;
  fontBody: string;
  textColor: string; // Main text color
  mutedColor: string; // Secondary text color (descriptions)

  // Boxes & Borders
  boxBgColor: string;
  boxBorderColor: string;
  
  // Promo Specific
  promoColor: string; // Text/Icon color for promo
  promoBgColor: string; // Background for promo box
}

export const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#e11d48', // Rose-600
  secondaryColor: '#fff1f2', // Rose-50
  
  fontHeading: 'Playfair Display',
  fontBody: 'Inter',
  textColor: '#334155', // Slate-700
  mutedColor: '#64748b', // Slate-500

  boxBgColor: '#ffffff',
  boxBorderColor: '#f1f5f9', // Slate-100

  promoColor: '#d97706', // Amber-600
  promoBgColor: '#fffbeb', // Amber-50
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

export interface StructuredAudit {
  executiveSummary: string; // Short paragraph
  strengths: string[]; // Bullet points of what is good
  weaknesses: string[]; // Bullet points of what is bad
  marketingScore: number; // 0-100 score calculated by AI
  toneVoice: string; // e.g. "Formalny", "Chaotyczny"
}

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

export interface AuditResult {
  overallScore: number;
  categories: AuditCategory[];
  stats: AuditStats;
  rawCsv: string; // The raw data extracted
  optimizedText: string; // The AI improved version
  generalFeedback: string;
  recommendations?: string[]; // New list for specific bullet points in PDF
  structuredReport?: StructuredAudit; // New AI-processed report structure
}
