import React from 'react';
import { ThemeConfig, PricingData, Category, ServiceItem } from '../../types';

// Re-export for convenience
export type { PricingData, Category, ServiceItem };

// ============================================================================
// COLOR ZONE SYSTEM
// Each template defines which ThemeConfig keys are used for which elements
// ============================================================================

export type ThemeConfigKey = keyof Omit<ThemeConfig, 'integrationMode'>;

export type ZoneType = 'color' | 'fontSize';

export interface ColorZone {
  id: string;
  label: string;           // Display name in Polish (e.g., "Kolor nagłówka")
  themeKey: ThemeConfigKey; // Which ThemeConfig property this maps to
  type?: ZoneType;         // 'color' (default) or 'fontSize'
  description?: string;    // Optional tooltip description
}

// ============================================================================
// TEMPLATE DEFINITION
// ============================================================================

export interface TemplateMetadata {
  id: string;
  name: string;           // Display name (e.g., "Nowoczesny")
  description: string;    // Short description
  thumbnail?: string;     // Preview image URL
  tags: string[];         // For filtering (e.g., ["minimalistyczny", "elegancki"])
  isPremium?: boolean;    // For future monetization
}

export interface TemplateDefinition {
  metadata: TemplateMetadata;

  // Color zones this template uses (for the interactive editor)
  colorZones: ColorZone[];

  // Default theme values optimized for this template
  defaultTheme: Partial<ThemeConfig>;

  // The React component that renders the pricelist
  Component: React.ComponentType<TemplateProps>;
}

// ============================================================================
// TEMPLATE COMPONENT PROPS
// ============================================================================

export interface TemplateProps {
  data: PricingData;
  theme: ThemeConfig;

  // Interactive editing mode
  editMode?: boolean;
  onColorZoneClick?: (zone: ColorZone) => void;
  activeZone?: string | null;

  // For responsive preview
  scale?: number;
}

// ============================================================================
// PRESET SYSTEM
// ============================================================================

export interface ColorPreset {
  id: string;
  name: string;           // Display name (e.g., "Eleganckie Złoto")
  description?: string;
  colors: Partial<ThemeConfig>;

  // Optional: which templates this preset works best with
  recommendedTemplates?: string[];
}

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export interface TemplateRegistry {
  templates: Map<string, TemplateDefinition>;
  presets: Map<string, ColorPreset>;

  // Methods
  getTemplate: (id: string) => TemplateDefinition | undefined;
  getAllTemplates: () => TemplateDefinition[];
  getPreset: (id: string) => ColorPreset | undefined;
  getAllPresets: () => ColorPreset[];
  getPresetsForTemplate: (templateId: string) => ColorPreset[];
}

// ============================================================================
// SAMPLE DATA FOR PREVIEWS
// ============================================================================

export const SAMPLE_PRICING_DATA: PricingData = {
  salonName: "Cennik Usług",
  categories: [
    {
      categoryName: "Usługi",
      services: [
        {
          name: "Manicure Hybrydowy",
          price: "120 zł",
          description: "Zdjęcie poprzedniej stylizacji, opracowanie skórek, malowanie.",
          duration: "60 min",
          isPromo: false,
          tags: ["Bestseller"],
        },
        {
          name: "Pedicure SPA",
          price: "180 zł",
          description: "Peeling, maska, masaż, malowanie.",
          duration: "90 min",
          isPromo: true,
        },
        {
          name: "Strzyżenie damskie",
          price: "150 zł",
          description: "Mycie, strzyżenie, modelowanie.",
          duration: "60 min",
          isPromo: false,
          tags: ["Nowość"],
        },
        {
          name: "Koloryzacja globalna",
          price: "od 300 zł",
          description: "Jeden kolor, bez rozjaśniania.",
          duration: "120 min",
          isPromo: false,
          imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=200&auto=format&fit=crop",
        },
        {
          name: "Masaż Relaksacyjny",
          price: "200 zł",
          description: "Pełny masaż ciała olejkami eterycznymi.",
          duration: "60 min",
          isPromo: false,
          tags: ["Hit Sezonu"],
        },
      ],
    },
  ],
};

// Shorter sample for thumbnails
export const SAMPLE_PRICING_DATA_SHORT: PricingData = {
  salonName: "Studio Urody",
  categories: [
    {
      categoryName: "Strzyżenie",
      services: [
        {
          name: "Strzyżenie damskie",
          price: "120 zł",
          duration: "60 min",
          isPromo: false,
        },
        {
          name: "Strzyżenie męskie",
          price: "60 zł",
          isPromo: true,
        },
      ],
    },
  ],
};
