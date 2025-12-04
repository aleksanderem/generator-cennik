export interface ServiceItem {
  name: string;
  price: string;
  description?: string;
  duration?: string;
  isPromo: boolean;
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