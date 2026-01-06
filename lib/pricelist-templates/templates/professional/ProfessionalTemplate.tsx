import React, { useState } from 'react';
import { Clock, CheckCircle, ChevronDown } from 'lucide-react';
import { TemplateProps, TemplateDefinition, ColorZone as ColorZoneType } from '../../types';
import { ColorZone } from '../../components/ColorZone';

// ============================================================================
// COLOR ZONES DEFINITION
// ============================================================================

const COLOR_ZONES: ColorZoneType[] = [
  { id: 'header', label: 'Nagłówek kategorii', themeKey: 'boxBgColor' },
  { id: 'headerText', label: 'Tekst nagłówka', themeKey: 'primaryColor' },
  { id: 'headerAccent', label: 'Akcent nagłówka', themeKey: 'primaryColor' },
  { id: 'serviceName', label: 'Nazwa usługi', themeKey: 'textColor' },
  { id: 'serviceDesc', label: 'Opis usługi', themeKey: 'mutedColor' },
  { id: 'price', label: 'Cena', themeKey: 'primaryColor' },
  { id: 'promo', label: 'Promocja', themeKey: 'promoColor' },
  { id: 'promoBadge', label: 'Badge promocji', themeKey: 'promoBgColor' },
  { id: 'card', label: 'Karta usługi', themeKey: 'boxBgColor' },
  { id: 'cardBorder', label: 'Obramowanie karty', themeKey: 'boxBorderColor' },
  { id: 'duration', label: 'Czas', themeKey: 'mutedColor' },
  { id: 'tag', label: 'Tag', themeKey: 'secondaryColor' },
];

// ============================================================================
// PROFESSIONAL TEMPLATE COMPONENT
// Business-like, structured design with cards
// ============================================================================

const ProfessionalTemplate: React.FC<TemplateProps> = ({
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
      className="p-6"
      style={{
        backgroundColor: theme.secondaryColor,
        fontFamily: theme.fontBody,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {/* Header */}
      {data.salonName && (
        <ColorZone
          zone={getZone('card')}
          theme={theme}
          editMode={editMode}
          isActive={activeZone === 'card'}
          onClick={onColorZoneClick}
        >
          <div
            className="rounded-xl p-6 mb-6 shadow-sm"
            style={{
              backgroundColor: theme.boxBgColor,
              border: `1px solid ${theme.boxBorderColor}`,
            }}
          >
            <ColorZone
              zone={getZone('headerAccent')}
              theme={theme}
              editMode={editMode}
              isActive={activeZone === 'headerAccent'}
              onClick={onColorZoneClick}
            >
              <div
                className="w-10 h-1 rounded-full mb-3"
                style={{ backgroundColor: theme.primaryColor }}
              />
            </ColorZone>
            <h1
              className="text-2xl font-bold"
              style={{
                fontFamily: theme.fontHeading,
                color: theme.textColor,
              }}
            >
              {data.salonName}
            </h1>
            <p className="text-sm mt-1" style={{ color: theme.mutedColor }}>
              Cennik usług
            </p>
          </div>
        </ColorZone>
      )}

      {/* Categories */}
      <ColorZone
        zone={getZone('cardBorder')}
        theme={theme}
        editMode={editMode}
        isActive={activeZone === 'cardBorder'}
        onClick={onColorZoneClick}
      >
        <div className="space-y-6">
          {data.categories.map((category, catIndex) => {
            const isOpen = openCategories.has(catIndex);

            return (
            <div key={catIndex}>
            {/* Category Header - Clickable Accordion */}
            <ColorZone
              zone={getZone('headerText')}
              theme={theme}
              editMode={editMode}
              isActive={activeZone === 'headerText'}
              onClick={onColorZoneClick}
            >
              <button
                onClick={() => toggleCategory(catIndex)}
                className="w-full flex items-center gap-3 mb-4"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <h2
                  className="text-lg font-semibold"
                  style={{
                    fontFamily: theme.fontHeading,
                    color: theme.primaryColor,
                  }}
                >
                  {category.categoryName}
                </h2>
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: theme.boxBorderColor }}
                />
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    color: theme.mutedColor,
                    backgroundColor: theme.boxBgColor,
                  }}
                >
                  {category.services.length} usług
                </span>
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  style={{ color: theme.primaryColor }}
                />
              </button>
            </ColorZone>

            {/* Services Grid - Collapsible */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isOpen ? 'max-h-[2000px]' : 'max-h-0'
              }`}
            >
            <div className="grid gap-3">
              {category.services.map((service, svcIndex) => (
                <ColorZone
                  key={svcIndex}
                  zone={getZone('card')}
                  theme={theme}
                  editMode={editMode}
                  isActive={activeZone === 'card'}
                  onClick={onColorZoneClick}
                >
                  <div
                    className="rounded-lg p-4 transition-shadow hover:shadow-md"
                    style={{
                      backgroundColor: theme.boxBgColor,
                      border: `1px solid ${service.isPromo ? theme.promoColor + '40' : theme.boxBorderColor}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left side - info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <ColorZone
                            zone={getZone('serviceName')}
                            theme={theme}
                            editMode={editMode}
                            isActive={activeZone === 'serviceName'}
                            onClick={onColorZoneClick}
                          >
                            <h3
                              className="font-semibold"
                              style={{
                                color: theme.textColor,
                                fontFamily: theme.fontHeading,
                              }}
                            >
                              {service.name}
                            </h3>
                          </ColorZone>

                          {service.isPromo && (
                            <ColorZone
                              zone={getZone('promoBadge')}
                              theme={theme}
                              editMode={editMode}
                              isActive={activeZone === 'promoBadge'}
                              onClick={onColorZoneClick}
                            >
                              <span
                                className="text-[10px] font-bold uppercase px-2 py-1 rounded-full"
                                style={{
                                  color: theme.promoColor,
                                  backgroundColor: theme.promoBgColor,
                                }}
                              >
                                Promocja
                              </span>
                            </ColorZone>
                          )}

                          {service.tags?.map((tag, tIdx) => (
                            <ColorZone
                              key={tIdx}
                              zone={getZone('tag')}
                              theme={theme}
                              editMode={editMode}
                              isActive={activeZone === 'tag'}
                              onClick={onColorZoneClick}
                            >
                              <span
                                className="text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1"
                                style={{
                                  color: theme.primaryColor,
                                  backgroundColor: theme.secondaryColor,
                                }}
                              >
                                <CheckCircle size={10} />
                                {tag}
                              </span>
                            </ColorZone>
                          ))}

                          {/* Variants count badge */}
                          {service.variants && service.variants.length > 0 && (
                            <span
                              className="text-[10px] font-medium px-2 py-1 rounded-full"
                              style={{
                                color: theme.primaryColor,
                                backgroundColor: `${theme.primaryColor}15`,
                              }}
                            >
                              {service.variants.length} wariantów
                            </span>
                          )}
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
                              className="text-sm mt-1.5 line-clamp-2"
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
                              className="text-xs mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded"
                              style={{
                                color: theme.mutedColor,
                                backgroundColor: theme.secondaryColor,
                              }}
                            >
                              <Clock size={12} />
                              {service.duration}
                            </span>
                          </ColorZone>
                        )}
                      </div>

                      {/* Right side - price - only show if no variants */}
                      {(!service.variants || service.variants.length === 0) && (
                        <ColorZone
                          zone={getZone('price')}
                          theme={theme}
                          editMode={editMode}
                          isActive={activeZone === 'price'}
                          onClick={onColorZoneClick}
                        >
                          <div
                            className="text-xl font-bold flex-shrink-0 text-right"
                            style={{
                              color: service.isPromo ? theme.promoColor : theme.primaryColor,
                              fontFamily: theme.fontHeading,
                            }}
                          >
                            {service.price}
                          </div>
                        </ColorZone>
                      )}
                    </div>

                    {/* Nested variants display */}
                    {service.variants && service.variants.length > 0 && (
                      <div
                        className="mt-3 ml-4 pl-3 border-l-2 space-y-2"
                        style={{ borderColor: `${theme.primaryColor}30` }}
                      >
                        {service.variants.map((variant, vIdx) => (
                          <div
                            key={vIdx}
                            className="flex items-center justify-between py-1"
                          >
                            <span
                              className="text-sm"
                              style={{ color: theme.textColor }}
                            >
                              {variant.label}
                            </span>
                            <div className="flex items-center gap-4">
                              {variant.duration && (
                                <span
                                  className="text-xs flex items-center gap-1.5 px-2 py-0.5 rounded"
                                  style={{
                                    color: theme.mutedColor,
                                    backgroundColor: theme.secondaryColor,
                                  }}
                                >
                                  <Clock size={10} />
                                  {variant.duration}
                                </span>
                              )}
                              <span
                                className="font-bold text-lg"
                                style={{
                                  color: service.isPromo ? theme.promoColor : theme.primaryColor,
                                  fontFamily: theme.fontHeading,
                                }}
                              >
                                {variant.price}
                              </span>
                            </div>
                          </div>
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

export const professionalTemplateDefinition: TemplateDefinition = {
  metadata: {
    id: 'professional',
    name: 'Profesjonalny',
    description: 'Biznesowy design z kartami i cieniami',
    tags: ['profesjonalny', 'biznesowy', 'nowoczesny'],
    isPremium: false,
  },
  colorZones: COLOR_ZONES,
  defaultTheme: {
    primaryColor: '#2563EB',
    secondaryColor: '#EFF6FF',
    fontHeading: 'Montserrat',
    fontBody: 'Inter',
    boxBgColor: '#FFFFFF',
    boxBorderColor: '#E2E8F0',
  },
  Component: ProfessionalTemplate,
};

export default ProfessionalTemplate;
