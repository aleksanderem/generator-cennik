import React from 'react';
import { ThemeConfig, PricingData, Category, ServiceItem } from '../../types';

// Re-export for convenience
export type { PricingData, Category, ServiceItem };

// ============================================================================
// COLOR ZONE SYSTEM
// Each template defines which ThemeConfig keys are used for which elements
// ============================================================================

export type ThemeConfigKey = keyof Omit<ThemeConfig, 'integrationMode'>;

export interface ColorZone {
  id: string;
  label: string;           // Display name in Polish (e.g., "Kolor nagłówka")
  themeKey: ThemeConfigKey; // Which ThemeConfig property this maps to
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
  salonName: "Studio Urody Anna",
  categories: [
    {
      categoryName: "Strzyżenie",
      services: [
        {
          name: "Strzyżenie damskie",
          price: "120 zł",
          description: "Konsultacja, mycie, strzyżenie, stylizacja",
          duration: "60 min",
          isPromo: false,
        },
        {
          name: "Strzyżenie męskie",
          price: "60 zł",
          duration: "30 min",
          isPromo: false,
        },
        {
          name: "Strzyżenie dziecięce",
          price: "45 zł",
          duration: "30 min",
          isPromo: true,
          tags: ["Promocja -20%"],
        },
      ],
    },
    {
      categoryName: "Koloryzacja",
      services: [
        {
          name: "Koloryzacja całościowa",
          price: "od 200 zł",
          description: "Pełna koloryzacja włosów farbą profesjonalną",
          duration: "120 min",
          isPromo: false,
          tags: ["Bestseller"],
        },
        {
          name: "Baleyage",
          price: "od 350 zł",
          description: "Naturalne rozjaśnienie z efektem sun-kissed",
          duration: "180 min",
          isPromo: false,
        },
        {
          name: "Odrost",
          price: "150 zł",
          duration: "90 min",
          isPromo: false,
        },
      ],
    },
    {
      categoryName: "Pielęgnacja",
      services: [
        {
          name: "Regeneracja Olaplex",
          price: "80 zł",
          description: "Głęboka regeneracja zniszczonych włosów",
          duration: "45 min",
          isPromo: false,
          tags: ["Nowość"],
        },
        {
          name: "Keratynowe prostowanie",
          price: "od 400 zł",
          description: "Trwałe wygładzenie i regeneracja",
          duration: "180 min",
          isPromo: false,
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
