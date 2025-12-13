import React, { useState } from 'react';
import { Clock, Star, ChevronDown } from 'lucide-react';
import { TemplateProps, TemplateDefinition, ColorZone as ColorZoneType } from '../../types';
import { ColorZone } from '../../components/ColorZone';

// ============================================================================
// COLOR ZONES DEFINITION
// ============================================================================

const COLOR_ZONES: ColorZoneType[] = [
  { id: 'header', label: 'Nagłówek kategorii', themeKey: 'primaryColor' },
  { id: 'headerBg', label: 'Tło nagłówka', themeKey: 'secondaryColor' },
  { id: 'serviceName', label: 'Nazwa usługi', themeKey: 'textColor' },
  { id: 'serviceDesc', label: 'Opis usługi', themeKey: 'mutedColor' },
  { id: 'price', label: 'Cena', themeKey: 'primaryColor' },
  { id: 'promo', label: 'Promocja', themeKey: 'promoColor' },
  { id: 'divider', label: 'Linia oddzielająca', themeKey: 'boxBorderColor' },
  { id: 'background', label: 'Tło', themeKey: 'boxBgColor' },
  { id: 'duration', label: 'Czas trwania', themeKey: 'mutedColor' },
];

// ============================================================================
// CLASSIC TEMPLATE COMPONENT
// A traditional, elegant layout with category headers and clean lines
// ============================================================================

const ClassicTemplate: React.FC<TemplateProps> = ({
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
      className="overflow-hidden"
      style={{
        backgroundColor: theme.boxBgColor,
        fontFamily: theme.fontBody,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {/* Salon Name Header */}
      {data.salonName && (
        <div
          className="text-center py-6 border-b-2"
          style={{ borderColor: theme.primaryColor }}
        >
          <h1
            className="text-2xl font-bold tracking-wide"
            style={{
              fontFamily: theme.fontHeading,
              color: theme.primaryColor,
            }}
          >
            {data.salonName}
          </h1>
          <div
            className="mt-2 flex items-center justify-center gap-2"
            style={{ color: theme.mutedColor }}
          >
            <div className="w-12 h-px" style={{ backgroundColor: theme.primaryColor }} />
            <Star size={12} style={{ color: theme.primaryColor }} />
            <div className="w-12 h-px" style={{ backgroundColor: theme.primaryColor }} />
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="py-4">
        {data.categories.map((category, catIndex) => {
          const isOpen = openCategories.has(catIndex);

          return (
          <div key={catIndex} className="mb-6 last:mb-0">
            {/* Category Header - Clickable Accordion */}
            <ColorZone
              zone={getZone('headerBg')}
              theme={theme}
              editMode={editMode}
              isActive={activeZone === 'headerBg'}
              onClick={onColorZoneClick}
            >
              <button
                onClick={() => toggleCategory(catIndex)}
                className="w-full px-6 py-3 mb-0 flex items-center justify-between transition-colors"
                style={{ backgroundColor: theme.secondaryColor }}
              >
                <ColorZone
                  zone={getZone('header')}
                  theme={theme}
                  editMode={editMode}
                  isActive={activeZone === 'header'}
                  onClick={onColorZoneClick}
                >
                  <h2
                    className="text-lg font-semibold uppercase tracking-wider flex items-center gap-2"
                    style={{
                      fontFamily: theme.fontHeading,
                      color: theme.primaryColor,
                    }}
                  >
                    {category.categoryName}
                    <span
                      className="text-xs font-normal normal-case tracking-normal"
                      style={{ color: theme.mutedColor }}
                    >
                      ({category.services.length})
                    </span>
                  </h2>
                </ColorZone>
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  style={{ color: theme.primaryColor }}
                />
              </button>
            </ColorZone>

            {/* Services - Collapsible */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isOpen ? 'max-h-[2000px]' : 'max-h-0'
              }`}
            >
            <div className="px-6 space-y-0">
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
                    className="py-3 border-b last:border-b-0"
                    style={{ borderColor: theme.boxBorderColor }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Service Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <ColorZone
                            zone={getZone('serviceName')}
                            theme={theme}
                            editMode={editMode}
                            isActive={activeZone === 'serviceName'}
                            onClick={onColorZoneClick}
                          >
                            <h3
                              className="font-medium"
                              style={{
                                color: service.isPromo ? theme.promoColor : theme.textColor,
                                fontFamily: theme.fontHeading,
                              }}
                            >
                              {service.name}
                            </h3>
                          </ColorZone>

                          {service.isPromo && (
                            <ColorZone
                              zone={getZone('promo')}
                              theme={theme}
                              editMode={editMode}
                              isActive={activeZone === 'promo'}
                              onClick={onColorZoneClick}
                            >
                              <span
                                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                                style={{
                                  color: theme.promoColor,
                                  backgroundColor: `${theme.promoColor}15`,
                                }}
                              >
                                Promocja
                              </span>
                            </ColorZone>
                          )}

                          {service.tags?.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] px-2 py-0.5 rounded"
                              style={{
                                color: theme.primaryColor,
                                backgroundColor: `${theme.primaryColor}10`,
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {service.description && (
                          <ColorZone
                            zone={getZone('serviceDesc')}
                            theme={theme}
                            editMode={editMode}
                            isActive={activeZone === 'serviceDesc'}
                            onClick={onColorZoneClick}
                          >
                            <p
                              className="text-sm mt-1"
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
                              className="text-xs mt-1 inline-flex items-center gap-1"
                              style={{ color: theme.mutedColor }}
                            >
                              <Clock size={11} />
                              {service.duration}
                            </span>
                          </ColorZone>
                        )}
                      </div>

                      {/* Dotted line connector */}
                      <div
                        className="flex-1 border-b border-dotted self-center mx-2"
                        style={{ borderColor: theme.boxBorderColor }}
                      />

                      {/* Price */}
                      <ColorZone
                        zone={getZone('price')}
                        theme={theme}
                        editMode={editMode}
                        isActive={activeZone === 'price'}
                        onClick={onColorZoneClick}
                      >
                        <div
                          className="font-bold text-lg flex-shrink-0"
                          style={{
                            color: service.isPromo ? theme.promoColor : theme.primaryColor,
                            fontFamily: theme.fontHeading,
                          }}
                        >
                          {service.price}
                        </div>
                      </ColorZone>
                    </div>
                  </div>
                </ColorZone>
              ))}
            </div>
            </div>
          </div>
        );
        })}
      </div>

      {/* Footer decoration */}
      <div
        className="flex items-center justify-center gap-2 py-4 border-t"
        style={{ borderColor: theme.boxBorderColor }}
      >
        <div className="w-8 h-px" style={{ backgroundColor: theme.primaryColor }} />
        <Star size={10} style={{ color: theme.primaryColor }} />
        <div className="w-8 h-px" style={{ backgroundColor: theme.primaryColor }} />
      </div>
    </div>
  );
};

// ============================================================================
// TEMPLATE DEFINITION EXPORT
// ============================================================================

export const classicTemplateDefinition: TemplateDefinition = {
  metadata: {
    id: 'classic',
    name: 'Klasyczny',
    description: 'Elegancki, tradycyjny design z liniami i ozdobnikami',
    tags: ['klasyczny', 'elegancki', 'tradycyjny'],
    isPremium: false,
  },
  colorZones: COLOR_ZONES,
  defaultTheme: {
    primaryColor: '#722F37',
    secondaryColor: '#FDF6F6',
    fontHeading: 'Playfair Display',
    fontBody: 'Lora',
  },
  Component: ClassicTemplate,
};

export default ClassicTemplate;
