// ============================================================================
// PRICELIST TEMPLATES - PUBLIC API
// ============================================================================

// Types
export type {
  ColorZone as ColorZoneType,
  ThemeConfigKey,
  TemplateMetadata,
  TemplateDefinition,
  TemplateProps,
  ColorPreset,
  TemplateRegistry,
  PricingData,
  Category,
  ServiceItem,
} from './types';

export { SAMPLE_PRICING_DATA, SAMPLE_PRICING_DATA_SHORT } from './types';

// Registry
export {
  templateRegistry,
  getAllTemplates,
  getTemplate,
  getAllPresets,
  getPreset,
  getTemplateComponent,
  DEFAULT_TEMPLATE_ID,
} from './registry';

// Presets
export {
  COLOR_PRESETS,
  getPresetById,
  getPresetsForTemplate,
  applyPreset,
} from './presets';

// Components
export { ColorZone, InlineColorZone } from './components/ColorZone';
export { TemplateEditor } from './components/TemplateEditor';

// Individual Templates (for direct import if needed)
export { default as ModernTemplate, modernTemplateDefinition } from './templates/modern/ModernTemplate';
export { default as ClassicTemplate, classicTemplateDefinition } from './templates/classic/ClassicTemplate';
export { default as MinimalTemplate, minimalTemplateDefinition } from './templates/minimal/MinimalTemplate';
export { default as ProfessionalTemplate, professionalTemplateDefinition } from './templates/professional/ProfessionalTemplate';
export { default as ElegantTemplate, elegantTemplateDefinition } from './templates/elegant/ElegantTemplate';
