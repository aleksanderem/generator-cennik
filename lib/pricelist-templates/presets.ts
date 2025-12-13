import { ColorPreset } from './types';
import { ThemeConfig } from '../../types';

// ============================================================================
// COLOR PRESETS
// Predefined color schemes that users can apply with one click
// ============================================================================

export const COLOR_PRESETS: ColorPreset[] = [
  // --- PREMIUM TEMPLATE PRESETS ---
  {
    id: 'premium-rose',
    name: 'Premium Róż',
    description: 'Elegancki różowy gradient z bursztynowymi promocjami',
    colors: {
      primaryColor: '#E11D48',
      secondaryColor: '#FFF1F2',
      textColor: '#334155',
      mutedColor: '#64748B',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#F1F5F9',
      promoColor: '#D97706',
      promoBgColor: '#FFFBEB',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['premium'],
  },
  {
    id: 'premium-violet',
    name: 'Premium Fiolet',
    description: 'Luksusowy fioletowy gradient',
    colors: {
      primaryColor: '#7C3AED',
      secondaryColor: '#EDE9FE',
      textColor: '#1E1B4B',
      mutedColor: '#6B7280',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#E5E7EB',
      promoColor: '#DB2777',
      promoBgColor: '#FCE7F3',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['premium'],
  },
  {
    id: 'premium-emerald',
    name: 'Premium Szmaragd',
    description: 'Naturalny szmaragdowy design',
    colors: {
      primaryColor: '#059669',
      secondaryColor: '#D1FAE5',
      textColor: '#064E3B',
      mutedColor: '#6B7280',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#ECFDF5',
      promoColor: '#DC2626',
      promoBgColor: '#FEE2E2',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['premium'],
  },
  {
    id: 'premium-ocean',
    name: 'Premium Ocean',
    description: 'Spokojny niebieski gradient',
    colors: {
      primaryColor: '#0284C7',
      secondaryColor: '#E0F2FE',
      textColor: '#0C4A6E',
      mutedColor: '#64748B',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#F0F9FF',
      promoColor: '#EA580C',
      promoBgColor: '#FFF7ED',
      fontHeading: 'Montserrat',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['premium'],
  },
  {
    id: 'premium-gold',
    name: 'Premium Złoto',
    description: 'Luksusowe złoto z eleganckim tłem',
    colors: {
      primaryColor: '#B8860B',
      secondaryColor: '#FEF3C7',
      textColor: '#1C1917',
      mutedColor: '#78716C',
      boxBgColor: '#FFFEF7',
      boxBorderColor: '#FDE68A',
      promoColor: '#DC2626',
      promoBgColor: '#FEE2E2',
      fontHeading: 'Playfair Display',
      fontBody: 'Lora',
    },
    recommendedTemplates: ['premium', 'elegant'],
  },
  {
    id: 'premium-coral',
    name: 'Premium Koral',
    description: 'Ciepły koralowy gradient',
    colors: {
      primaryColor: '#F97316',
      secondaryColor: '#FFEDD5',
      textColor: '#1C1917',
      mutedColor: '#78716C',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#FED7AA',
      promoColor: '#E11D48',
      promoBgColor: '#FFE4E6',
      fontHeading: 'Montserrat',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['premium'],
  },
  {
    id: 'premium-slate',
    name: 'Premium Grafit',
    description: 'Elegancki ciemny motyw',
    colors: {
      primaryColor: '#475569',
      secondaryColor: '#F1F5F9',
      textColor: '#1E293B',
      mutedColor: '#64748B',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#E2E8F0',
      promoColor: '#059669',
      promoBgColor: '#D1FAE5',
      fontHeading: 'Montserrat',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['premium', 'professional'],
  },
  {
    id: 'premium-berry',
    name: 'Premium Jagoda',
    description: 'Głęboki jagodowy gradient',
    colors: {
      primaryColor: '#A21CAF',
      secondaryColor: '#FAE8FF',
      textColor: '#4A044E',
      mutedColor: '#6B7280',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#F5D0FE',
      promoColor: '#0891B2',
      promoBgColor: '#CFFAFE',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['premium'],
  },
  {
    id: 'premium-dark',
    name: 'Premium Dark',
    description: 'Ciemny luksusowy motyw ze złotem',
    colors: {
      primaryColor: '#F59E0B',
      secondaryColor: '#292524',
      textColor: '#FAFAF9',
      mutedColor: '#A8A29E',
      boxBgColor: '#1C1917',
      boxBorderColor: '#44403C',
      promoColor: '#10B981',
      promoBgColor: '#064E3B',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['premium'],
  },
  {
    id: 'premium-blush',
    name: 'Premium Blush',
    description: 'Delikatny pudrowy róż',
    colors: {
      primaryColor: '#EC4899',
      secondaryColor: '#FDF2F8',
      textColor: '#831843',
      mutedColor: '#9CA3AF',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#FBCFE8',
      promoColor: '#8B5CF6',
      promoBgColor: '#EDE9FE',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['premium'],
  },
  {
    id: 'premium-mint',
    name: 'Premium Mięta',
    description: 'Świeży miętowy gradient',
    colors: {
      primaryColor: '#14B8A6',
      secondaryColor: '#CCFBF1',
      textColor: '#134E4A',
      mutedColor: '#6B7280',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#99F6E4',
      promoColor: '#F43F5E',
      promoBgColor: '#FFE4E6',
      fontHeading: 'Montserrat',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['premium'],
  },
  {
    id: 'premium-lavender',
    name: 'Premium Lawenda',
    description: 'Spokojny lawendowy gradient',
    colors: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#F3E8FF',
      textColor: '#3B0764',
      mutedColor: '#6B7280',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#E9D5FF',
      promoColor: '#F97316',
      promoBgColor: '#FFEDD5',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['premium'],
  },

  // --- ELEGANT / LUXURY ---
  {
    id: 'elegant-gold',
    name: 'Eleganckie Złoto',
    description: 'Klasyczna elegancja z akcentami złota',
    colors: {
      primaryColor: '#B8860B',      // Dark goldenrod
      secondaryColor: '#FDF5E6',    // Old lace
      textColor: '#1a1a1a',
      mutedColor: '#666666',
      boxBgColor: '#FFFEF9',
      boxBorderColor: '#E8E0D0',
      promoColor: '#8B4513',        // Saddle brown
      promoBgColor: '#FFF8DC',      // Cornsilk
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['elegant', 'classic'],
  },
  {
    id: 'luxury-black',
    name: 'Luksusowa Czerń',
    description: 'Wyrafinowany ciemny motyw premium',
    colors: {
      primaryColor: '#D4AF37',      // Metallic gold
      secondaryColor: '#1a1a1a',
      textColor: '#F5F5F5',
      mutedColor: '#999999',
      boxBgColor: '#0D0D0D',
      boxBorderColor: '#333333',
      promoColor: '#FFD700',
      promoBgColor: '#1a1a0a',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['elegant', 'professional'],
  },

  // --- MODERN / TRENDY ---
  {
    id: 'modern-rose',
    name: 'Nowoczesny Róż',
    description: 'Świeży, kobiecy design',
    colors: {
      primaryColor: '#E11D48',      // Rose 600
      secondaryColor: '#FFF1F2',    // Rose 50
      textColor: '#334155',
      mutedColor: '#64748B',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#F1F5F9',
      promoColor: '#DB2777',        // Pink 600
      promoBgColor: '#FDF2F8',
      fontHeading: 'Montserrat',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['modern', 'minimal'],
  },
  {
    id: 'modern-violet',
    name: 'Nowoczesny Fiolet',
    description: 'Kreatywny i wyrazisty',
    colors: {
      primaryColor: '#7C3AED',      // Violet 600
      secondaryColor: '#F5F3FF',    // Violet 50
      textColor: '#1E1B4B',
      mutedColor: '#6B7280',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#E5E7EB',
      promoColor: '#A855F7',        // Purple 500
      promoBgColor: '#FAF5FF',
      fontHeading: 'Montserrat',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['modern'],
  },
  {
    id: 'modern-teal',
    name: 'Świeży Turkus',
    description: 'Energetyczny i profesjonalny',
    colors: {
      primaryColor: '#0D9488',      // Teal 600
      secondaryColor: '#F0FDFA',    // Teal 50
      textColor: '#134E4A',
      mutedColor: '#5E7676',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#E6FFFA',
      promoColor: '#0891B2',        // Cyan 600
      promoBgColor: '#ECFEFF',
      fontHeading: 'Lato',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['modern', 'professional'],
  },

  // --- MINIMAL / CLEAN ---
  {
    id: 'minimal-mono',
    name: 'Minimalistyczny Mono',
    description: 'Czysty, monochromatyczny design',
    colors: {
      primaryColor: '#18181B',      // Zinc 900
      secondaryColor: '#F4F4F5',    // Zinc 100
      textColor: '#27272A',
      mutedColor: '#71717A',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#E4E4E7',
      promoColor: '#3F3F46',        // Zinc 700
      promoBgColor: '#FAFAFA',
      fontHeading: 'Inter',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['minimal'],
  },
  {
    id: 'minimal-warm',
    name: 'Ciepły Minimalizm',
    description: 'Stonowane, ciepłe odcienie',
    colors: {
      primaryColor: '#78716C',      // Stone 500
      secondaryColor: '#FAF9F7',
      textColor: '#44403C',
      mutedColor: '#A8A29E',
      boxBgColor: '#FAFAF9',
      boxBorderColor: '#E7E5E4',
      promoColor: '#92400E',        // Amber 800
      promoBgColor: '#FFFBEB',
      fontHeading: 'Lora',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['minimal', 'classic'],
  },

  // --- CLASSIC / TRADITIONAL ---
  {
    id: 'classic-burgundy',
    name: 'Klasyczny Bordo',
    description: 'Tradycyjna elegancja w stylu beauty',
    colors: {
      primaryColor: '#722F37',      // Wine/Burgundy
      secondaryColor: '#FDF6F6',
      textColor: '#1E1E1E',
      mutedColor: '#666666',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#E8E0E0',
      promoColor: '#B8860B',
      promoBgColor: '#FFFEF5',
      fontHeading: 'Playfair Display',
      fontBody: 'Lora',
    },
    recommendedTemplates: ['classic', 'elegant'],
  },
  {
    id: 'classic-navy',
    name: 'Klasyczny Granat',
    description: 'Profesjonalny i zaufany',
    colors: {
      primaryColor: '#1E3A5F',      // Navy
      secondaryColor: '#F0F4F8',
      textColor: '#1A202C',
      mutedColor: '#4A5568',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#E2E8F0',
      promoColor: '#C53030',
      promoBgColor: '#FFF5F5',
      fontHeading: 'Merriweather',
      fontBody: 'Open Sans',
    },
    recommendedTemplates: ['classic', 'professional'],
  },

  // --- PROFESSIONAL / CORPORATE ---
  {
    id: 'professional-blue',
    name: 'Profesjonalny Błękit',
    description: 'Biznesowy, godny zaufania',
    colors: {
      primaryColor: '#2563EB',      // Blue 600
      secondaryColor: '#EFF6FF',    // Blue 50
      textColor: '#1E293B',
      mutedColor: '#64748B',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#E2E8F0',
      promoColor: '#DC2626',        // Red 600
      promoBgColor: '#FEF2F2',
      fontHeading: 'Montserrat',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['professional'],
  },
  {
    id: 'professional-green',
    name: 'Naturalny Zielony',
    description: 'Ekologiczny, naturalny vibe',
    colors: {
      primaryColor: '#166534',      // Green 800
      secondaryColor: '#F0FDF4',    // Green 50
      textColor: '#14532D',
      mutedColor: '#4B5563',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#D1FAE5',
      promoColor: '#B45309',        // Amber 700
      promoBgColor: '#FFFBEB',
      fontHeading: 'Lato',
      fontBody: 'Open Sans',
    },
    recommendedTemplates: ['professional', 'minimal'],
  },

  // --- PLAYFUL / FUN ---
  {
    id: 'playful-coral',
    name: 'Żywy Koral',
    description: 'Radosny i przyjazny',
    colors: {
      primaryColor: '#F97316',      // Orange 500
      secondaryColor: '#FFF7ED',    // Orange 50
      textColor: '#1C1917',
      mutedColor: '#78716C',
      boxBgColor: '#FFFFFF',
      boxBorderColor: '#FED7AA',
      promoColor: '#EA580C',
      promoBgColor: '#FFEDD5',
      fontHeading: 'Montserrat',
      fontBody: 'Inter',
    },
    recommendedTemplates: ['modern'],
  },
];

// Helper to get preset by ID
export const getPresetById = (id: string): ColorPreset | undefined => {
  return COLOR_PRESETS.find(p => p.id === id);
};

// Helper to get presets recommended for a template
export const getPresetsForTemplate = (templateId: string): ColorPreset[] => {
  return COLOR_PRESETS.filter(p =>
    !p.recommendedTemplates ||
    p.recommendedTemplates.includes(templateId)
  );
};

// Apply preset to existing theme (merges, doesn't replace)
export const applyPreset = (
  currentTheme: ThemeConfig,
  preset: ColorPreset
): ThemeConfig => {
  return {
    ...currentTheme,
    ...preset.colors,
  };
};
