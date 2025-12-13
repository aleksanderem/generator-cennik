import React, { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { TemplateProps, TemplateDefinition, ColorZone as ColorZoneType } from '../../types';
import { ColorZone } from '../../components/ColorZone';

// ============================================================================
// COLOR ZONES DEFINITION
// ============================================================================

const COLOR_ZONES: ColorZoneType[] = [
  { id: 'header', label: 'Nagłówek kategorii', themeKey: 'textColor' },
  { id: 'serviceName', label: 'Nazwa usługi', themeKey: 'textColor' },
  { id: 'serviceDesc', label: 'Opis usługi', themeKey: 'mutedColor' },
  { id: 'price', label: 'Cena', themeKey: 'textColor' },
  { id: 'promo', label: 'Promocja', themeKey: 'promoColor' },
  { id: 'accent', label: 'Akcent', themeKey: 'primaryColor' },
  { id: 'divider', label: 'Linia', themeKey: 'boxBorderColor' },
  { id: 'background', label: 'Tło', themeKey: 'boxBgColor' },
  { id: 'duration', label: 'Czas', themeKey: 'mutedColor' },
];

// ============================================================================
// MINIMAL TEMPLATE COMPONENT
// Ultra-clean, whitespace-focused design
// ============================================================================

const MinimalTemplate: React.FC<TemplateProps> = ({
  data,
  theme,
  editMode = false,
  onColorZoneClick,
  activeZone,
  scale = 1,
}) => {
  const [openCategories, setOpenCategories] = useState<Set<number>>(new Set([0]));

  const toggleCategory = (index: number) => {
    setOpenCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getZone = (id: string) => COLOR_ZONES.find(z => z.id === id)!;

  return (
    <div
      className="p-8"
      style={{
        backgroundColor: theme.boxBgColor,
        fontFamily: theme.fontBody,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {/* Salon Name - minimal, just text */}
      {data.salonName && (
        <div className="mb-12 text-center">
          <h1
            className="text-3xl font-light tracking-widest uppercase"
            style={{
              fontFamily: theme.fontHeading,
              color: theme.textColor,
            }}
          >
            {data.salonName}
          </h1>
          <ColorZone
            zone={getZone('accent')}
            theme={theme}
            editMode={editMode}
            isActive={activeZone === 'accent'}
            onClick={onColorZoneClick}
          >
            <div
              className="w-12 h-0.5 mx-auto mt-4"
              style={{ backgroundColor: theme.primaryColor }}
            />
          </ColorZone>
        </div>
      )}

      {/* Categories */}
      <ColorZone
        zone={getZone('divider')}
        theme={theme}
        editMode={editMode}
        isActive={activeZone === 'divider'}
        onClick={onColorZoneClick}
      >
        <div className="space-y-8">
          {data.categories.map((category, catIndex) => {
            const isOpen = openCategories.has(catIndex);

            return (
            <div key={catIndex}>
            {/* Category Header - Clickable Accordion */}
            <ColorZone
              zone={getZone('header')}
              theme={theme}
              editMode={editMode}
              isActive={activeZone === 'header'}
              onClick={onColorZoneClick}
            >
              <button
                onClick={() => toggleCategory(catIndex)}
                className="w-full flex items-center justify-between mb-4 pb-2 border-b"
                style={{ borderColor: theme.boxBorderColor }}
              >
                <h2
                  className="text-xs font-medium uppercase tracking-[0.3em] flex items-center gap-3"
                  style={{
                    color: theme.mutedColor,
                    fontFamily: theme.fontBody,
                  }}
                >
                  {category.categoryName}
                  <span className="text-[10px] normal-case tracking-normal">
                    ({category.services.length})
                  </span>
                </h2>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  style={{ color: theme.mutedColor }}
                />
              </button>
            </ColorZone>

            {/* Services - Collapsible */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isOpen ? 'max-h-[2000px]' : 'max-h-0'
              }`}
            >
            <div className="space-y-4">
              {category.services.map((service, svcIndex) => (
                <ColorZone
                  key={svcIndex}
                  zone={getZone('divider')}
                  theme={theme}
                  editMode={editMode}
                  isActive={activeZone === 'divider'}
                  onClick={onColorZoneClick}
                >
                  <div
                    className="pb-4 border-b last:border-b-0"
                    style={{ borderColor: theme.boxBorderColor }}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      {/* Service Name */}
                      <ColorZone
                        zone={getZone('serviceName')}
                        theme={theme}
                        editMode={editMode}
                        isActive={activeZone === 'serviceName'}
                        onClick={onColorZoneClick}
                      >
                        <h3
                          className="text-base"
                          style={{
                            color: service.isPromo ? theme.promoColor : theme.textColor,
                            fontFamily: theme.fontHeading,
                          }}
                        >
                          {service.name}
                          {service.isPromo && (
                            <span
                              className="ml-2 text-[10px] uppercase tracking-wider"
                              style={{ color: theme.promoColor }}
                            >
                              promo
                            </span>
                          )}
                        </h3>
                      </ColorZone>

                      {/* Price */}
                      <ColorZone
                        zone={getZone('price')}
                        theme={theme}
                        editMode={editMode}
                        isActive={activeZone === 'price'}
                        onClick={onColorZoneClick}
                      >
                        <span
                          className="text-base tabular-nums"
                          style={{
                            color: service.isPromo ? theme.promoColor : theme.textColor,
                          }}
                        >
                          {service.price}
                        </span>
                      </ColorZone>
                    </div>

                    {/* Description & Duration - subtle */}
                    {(service.description || service.duration) && (
                      <div className="mt-1 flex items-center gap-4">
                        {service.description && (
                          <ColorZone
                            zone={getZone('serviceDesc')}
                            theme={theme}
                            editMode={editMode}
                            isActive={activeZone === 'serviceDesc'}
                            onClick={onColorZoneClick}
                          >
                            <p
                              className="text-sm"
                              style={{ color: theme.mutedColor }}
                            >
                              {service.description}
                            </p>
                          </ColorZone>
                        )}

                        {service.duration && (
                          <ColorZone
                            zone={getZone('duration')}
                            theme={theme}
                            editMode={editMode}
                            isActive={activeZone === 'duration'}
                            onClick={onColorZoneClick}
                          >
                            <span
                              className="text-xs flex items-center gap-1 flex-shrink-0"
                              style={{ color: theme.mutedColor }}
                            >
                              <Clock size={10} />
                              {service.duration}
                            </span>
                          </ColorZone>
                        )}
                      </div>
                    )}

                    {/* Tags - very subtle */}
                    {service.tags && service.tags.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {service.tags.map((tag, tIdx) => (
                          <ColorZone
                            key={tIdx}
                            zone={getZone('accent')}
                            theme={theme}
                            editMode={editMode}
                            isActive={activeZone === 'accent'}
                            onClick={onColorZoneClick}
                          >
                            <span
                              className="text-[10px] uppercase tracking-wider"
                              style={{ color: theme.primaryColor }}
                            >
                              {tag}
                            </span>
                          </ColorZone>
                        ))}
                      </div>
                    )}
                  </div>
                </ColorZone>
              ))}
            </div>
            </div>
          </div>
          );
          })}
        </div>
      </ColorZone>
    </div>
  );
};

// ============================================================================
// TEMPLATE DEFINITION EXPORT
// ============================================================================

export const minimalTemplateDefinition: TemplateDefinition = {
  metadata: {
    id: 'minimal',
    name: 'Minimalistyczny',
    description: 'Ultra-czysty design z dużą ilością białej przestrzeni',
    tags: ['minimalistyczny', 'czysty', 'prosty'],
    isPremium: false,
  },
  colorZones: COLOR_ZONES,
  defaultTheme: {
    primaryColor: '#18181B',
    secondaryColor: '#F4F4F5',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    textColor: '#27272A',
    mutedColor: '#A1A1AA',
    boxBorderColor: '#E4E4E7',
  },
  Component: MinimalTemplate,
};

export default MinimalTemplate;
