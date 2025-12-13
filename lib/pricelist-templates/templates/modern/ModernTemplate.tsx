import React, { useState } from 'react';
import { ChevronDown, Clock, Sparkles } from 'lucide-react';
import { TemplateProps, TemplateDefinition, ColorZone as ColorZoneType } from '../../types';
import { ColorZone, InlineColorZone } from '../../components/ColorZone';

// ============================================================================
// COLOR ZONES DEFINITION
// ============================================================================

const COLOR_ZONES: ColorZoneType[] = [
  { id: 'header', label: 'Nagłówek kategorii', themeKey: 'textColor' },
  { id: 'headerFont', label: 'Czcionka nagłówka', themeKey: 'fontHeading' },
  { id: 'serviceName', label: 'Nazwa usługi', themeKey: 'textColor' },
  { id: 'serviceDesc', label: 'Opis usługi', themeKey: 'mutedColor' },
  { id: 'price', label: 'Cena', themeKey: 'primaryColor' },
  { id: 'promo', label: 'Promocja', themeKey: 'promoColor' },
  { id: 'promoBg', label: 'Tło promocji', themeKey: 'promoBgColor' },
  { id: 'tag', label: 'Tag/Badge', themeKey: 'primaryColor' },
  { id: 'border', label: 'Obramowanie', themeKey: 'boxBorderColor' },
  { id: 'background', label: 'Tło', themeKey: 'boxBgColor' },
  { id: 'accent', label: 'Akcent', themeKey: 'secondaryColor' },
  { id: 'duration', label: 'Czas trwania', themeKey: 'mutedColor' },
  { id: 'counter', label: 'Licznik usług', themeKey: 'mutedColor' },
];

// ============================================================================
// MODERN TEMPLATE COMPONENT
// ============================================================================

const ModernTemplate: React.FC<TemplateProps> = ({
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
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{
        backgroundColor: theme.boxBgColor,
        border: `1px solid ${theme.boxBorderColor}`,
        fontFamily: theme.fontBody,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {/* Header */}
      {data.salonName && (
        <ColorZone
          zone={getZone('accent')}
          theme={theme}
          editMode={editMode}
          isActive={activeZone === 'accent'}
          onClick={onColorZoneClick}
        >
          <div
            className="px-6 py-4 border-b"
            style={{
              backgroundColor: theme.secondaryColor,
              borderColor: theme.boxBorderColor,
            }}
          >
            <InlineColorZone
              zone={getZone('headerFont')}
              theme={theme}
              editMode={editMode}
              isActive={activeZone === 'headerFont'}
              onClick={onColorZoneClick}
              as="h2"
              className="text-xl font-semibold"
              style={{
                fontFamily: theme.fontHeading,
                color: theme.textColor,
              }}
            >
              {data.salonName}
            </InlineColorZone>
          </div>
        </ColorZone>
      )}

      {/* Categories */}
      <div className="divide-y" style={{ borderColor: theme.boxBorderColor }}>
        {data.categories.map((category, catIndex) => {
          const isOpen = openCategories.has(catIndex);

          return (
            <div key={catIndex}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(catIndex)}
                className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-black/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <ColorZone
                    zone={getZone('header')}
                    theme={theme}
                    editMode={editMode}
                    isActive={activeZone === 'header'}
                    onClick={onColorZoneClick}
                  >
                    <h3
                      className="text-base font-semibold"
                      style={{
                        fontFamily: theme.fontHeading,
                        color: theme.textColor,
                      }}
                    >
                      {category.categoryName}
                    </h3>
                  </ColorZone>

                  <ColorZone
                    zone={getZone('counter')}
                    theme={theme}
                    editMode={editMode}
                    isActive={activeZone === 'counter'}
                    onClick={onColorZoneClick}
                  >
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        color: theme.mutedColor,
                        backgroundColor: `${theme.mutedColor}15`,
                      }}
                    >
                      {category.services.length}
                    </span>
                  </ColorZone>
                </div>

                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  style={{ color: theme.mutedColor }}
                />
              </button>

              {/* Services */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? 'max-h-[2000px]' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-4 space-y-2">
                  {category.services.map((service, svcIndex) => (
                    <ColorZone
                      key={svcIndex}
                      zone={service.isPromo ? getZone('promoBg') : getZone('background')}
                      theme={theme}
                      editMode={editMode}
                      isActive={activeZone === (service.isPromo ? 'promoBg' : 'background')}
                      onClick={onColorZoneClick}
                    >
                      <div
                        className="flex items-start gap-4 p-3 rounded-xl transition-colors"
                        style={{
                          backgroundColor: service.isPromo
                            ? `${theme.promoColor}08`
                            : 'transparent',
                        }}
                      >
                        {/* Image placeholder */}
                        {service.imageUrl && (
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                          />
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <ColorZone
                              zone={getZone('serviceName')}
                              theme={theme}
                              editMode={editMode}
                              isActive={activeZone === 'serviceName'}
                              onClick={onColorZoneClick}
                            >
                              <h4
                                className="font-medium text-sm"
                                style={{ color: theme.textColor }}
                              >
                                {service.name}
                              </h4>
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
                                  className="text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1"
                                  style={{
                                    color: theme.promoColor,
                                    backgroundColor: `${theme.promoColor}15`,
                                  }}
                                >
                                  <Sparkles size={10} />
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
                                  className="text-[10px] px-1.5 py-0.5 rounded"
                                  style={{
                                    color: theme.primaryColor,
                                    backgroundColor: `${theme.primaryColor}10`,
                                  }}
                                >
                                  {tag}
                                </span>
                              </ColorZone>
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
                                className="text-xs mt-1 line-clamp-2"
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
                                className="text-[11px] mt-1 inline-flex items-center gap-1"
                                style={{ color: theme.mutedColor }}
                              >
                                <Clock size={10} />
                                {service.duration}
                              </span>
                            </ColorZone>
                          )}
                        </div>

                        {/* Price */}
                        <ColorZone
                          zone={service.isPromo ? getZone('promo') : getZone('price')}
                          theme={theme}
                          editMode={editMode}
                          isActive={activeZone === (service.isPromo ? 'promo' : 'price')}
                          onClick={onColorZoneClick}
                        >
                          <div
                            className="font-semibold text-sm flex-shrink-0"
                            style={{
                              color: service.isPromo ? theme.promoColor : theme.primaryColor,
                            }}
                          >
                            {service.price}
                          </div>
                        </ColorZone>
                      </div>
                    </ColorZone>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// TEMPLATE DEFINITION EXPORT
// ============================================================================

export const modernTemplateDefinition: TemplateDefinition = {
  metadata: {
    id: 'modern',
    name: 'Nowoczesny',
    description: 'Świeży, minimalistyczny design z zaokrąglonymi rogami',
    tags: ['nowoczesny', 'minimalistyczny', 'świeży'],
    isPremium: false,
  },
  colorZones: COLOR_ZONES,
  defaultTheme: {
    primaryColor: '#E11D48',
    secondaryColor: '#FFF1F2',
    fontHeading: 'Montserrat',
    fontBody: 'Inter',
  },
  Component: ModernTemplate,
};

export default ModernTemplate;
