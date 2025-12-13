import { TemplateDefinition, ColorPreset, TemplateRegistry } from './types';
import { COLOR_PRESETS, getPresetsForTemplate } from './presets';

// Import all templates
import { modernTemplateDefinition } from './templates/modern/ModernTemplate';
import { classicTemplateDefinition } from './templates/classic/ClassicTemplate';
import { minimalTemplateDefinition } from './templates/minimal/MinimalTemplate';
import { professionalTemplateDefinition } from './templates/professional/ProfessionalTemplate';
import { elegantTemplateDefinition } from './templates/elegant/ElegantTemplate';

// ============================================================================
// TEMPLATE REGISTRY
// Central place where all templates are registered
// To add a new template: just import it and add to TEMPLATES array
// ============================================================================

const TEMPLATES: TemplateDefinition[] = [
  modernTemplateDefinition,
  classicTemplateDefinition,
  minimalTemplateDefinition,
  professionalTemplateDefinition,
  elegantTemplateDefinition,
];

// Create Maps for fast lookup
const templateMap = new Map<string, TemplateDefinition>(
  TEMPLATES.map(t => [t.metadata.id, t])
);

const presetMap = new Map<string, ColorPreset>(
  COLOR_PRESETS.map(p => [p.id, p])
);

// ============================================================================
// REGISTRY IMPLEMENTATION
// ============================================================================

export const templateRegistry: TemplateRegistry = {
  templates: templateMap,
  presets: presetMap,

  getTemplate: (id: string) => templateMap.get(id),

  getAllTemplates: () => TEMPLATES,

  getPreset: (id: string) => presetMap.get(id),

  getAllPresets: () => COLOR_PRESETS,

  getPresetsForTemplate: (templateId: string) => getPresetsForTemplate(templateId),
};

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const getAllTemplates = () => templateRegistry.getAllTemplates();
export const getTemplate = (id: string) => templateRegistry.getTemplate(id);
export const getAllPresets = () => templateRegistry.getAllPresets();
export const getPreset = (id: string) => templateRegistry.getPreset(id);

// Default template
export const DEFAULT_TEMPLATE_ID = 'modern';

// Helper to get template component directly
export const getTemplateComponent = (id: string) => {
  const template = templateRegistry.getTemplate(id);
  return template?.Component;
};

export default templateRegistry;
