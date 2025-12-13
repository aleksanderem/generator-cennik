import React from 'react';
import { Clock, Gem, Sparkles } from 'lucide-react';
import { TemplateProps, TemplateDefinition, ColorZone as ColorZoneType } from '../../types';
import { ColorZone } from '../../components/ColorZone';

// ============================================================================
// COLOR ZONES DEFINITION
// ============================================================================

const COLOR_ZONES: ColorZoneType[] = [
  { id: 'header', label: 'Nagłówek kategorii', themeKey: 'primaryColor' },
  { id: 'headerDecor', label: 'Dekoracja nagłówka', themeKey: 'primaryColor' },
  { id: 'serviceName', label: 'Nazwa usługi', themeKey: 'textColor' },
  { id: 'serviceDesc', label: 'Opis usługi', themeKey: 'mutedColor' },
  { id: 'price', label: 'Cena', themeKey: 'primaryColor' },
  { id: 'promo', label: 'Promocja', themeKey: 'promoColor' },
  { id: 'accent', label: 'Akcent złoty', themeKey: 'secondaryColor' },
  { id: 'border', label: 'Obramowanie', themeKey: 'boxBorderColor' },
  { id: 'background', label: 'Tło', themeKey: 'boxBgColor' },
  { id: 'duration', label: 'Czas', themeKey: 'mutedColor' },
  { id: 'tag', label: 'Tag premium', themeKey: 'primaryColor' },
];

// ============================================================================
// ELEGANT TEMPLATE COMPONENT
// Luxury, sophisticated design with gold accents
// ============================================================================

const ElegantTemplate: React.FC<TemplateProps> = ({
  data,
  theme,
  editMode = false,
  onColorZoneClick,
  activeZone,
  scale = 1,
}) => {
  const getZone = (id: string) => COLOR_ZONES.find(z => z.id === id)!;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        backgroundColor: theme.boxBgColor,
        fontFamily: theme.fontBody,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {/* Decorative corner elements */}
      <div
        className="absolute top-0 left-0 w-24 h-24 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${theme.primaryColor} 0%, transparent 50%)`,
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-24 h-24 opacity-10"
        style={{
          background: `linear-gradient(-45deg, ${theme.primaryColor} 0%, transparent 50%)`,
        }}
      />

      <div className="relative p-8">
        {/* Header */}
        {data.salonName && (
          <div className="text-center mb-10">
            <ColorZone
              zone={getZone('headerDecor')}
              theme={theme}
              editMode={editMode}
              isActive={activeZone === 'headerDecor'}
              onClick={onColorZoneClick}
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <div
                  className="w-16 h-px"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <Gem size={20} style={{ color: theme.primaryColor }} />
                <div
                  className="w-16 h-px"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              </div>
            </ColorZone>

            <h1
              className="text-3xl font-bold tracking-wide"
              style={{
                fontFamily: theme.fontHeading,
                color: theme.primaryColor,
              }}
            >
              {data.salonName}
            </h1>

            <p
              className="text-sm mt-2 uppercase tracking-[0.2em]"
              style={{ color: theme.mutedColor }}
            >
              Menu usług
            </p>
          </div>
        )}

        {/* Categories */}
        <div className="space-y-10">
          {data.categories.map((category, catIndex) => (
            <div key={catIndex}>
              {/* Category Header - elegant style */}
              <div className="text-center mb-6">
                <ColorZone
                  zone={getZone('header')}
                  theme={theme}
                  editMode={editMode}
                  isActive={activeZone === 'header'}
                  onClick={onColorZoneClick}
                >
                  <div className="inline-block relative">
                    <h2
                      className="text-xl font-semibold px-8"
                      style={{
                        fontFamily: theme.fontHeading,
                        color: theme.primaryColor,
                      }}
                    >
                      {category.categoryName}
                    </h2>
                    {/* Underline decoration */}
                    <div
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                  </div>
                </ColorZone>
              </div>

              {/* Services */}
              <div className="space-y-4">
                {category.services.map((service, svcIndex) => (
                  <ColorZone
                    key={svcIndex}
                    zone={getZone('border')}
                    theme={theme}
                    editMode={editMode}
                    isActive={activeZone === 'border'}
                    onClick={onColorZoneClick}
                  >
                    <div
                      className="p-5 rounded-lg transition-all hover:shadow-lg"
                      style={{
                        backgroundColor: service.isPromo
                          ? `${theme.promoColor}05`
                          : 'transparent',
                        border: `1px solid ${service.isPromo ? theme.promoColor + '30' : theme.boxBorderColor}`,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Decorative bullet */}
                        <div
                          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                          style={{
                            backgroundColor: service.isPromo
                              ? theme.promoColor
                              : theme.primaryColor,
                          }}
                        />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <ColorZone
                                  zone={getZone('serviceName')}
                                  theme={theme}
                                  editMode={editMode}
                                  isActive={activeZone === 'serviceName'}
                                  onClick={onColorZoneClick}
                                >
                                  <h3
                                    className="font-semibold text-lg"
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
                                    zone={getZone('promo')}
                                    theme={theme}
                                    editMode={editMode}
                                    isActive={activeZone === 'promo'}
                                    onClick={onColorZoneClick}
                                  >
                                    <span
                                      className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1"
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
                                      className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border"
                                      style={{
                                        color: theme.primaryColor,
                                        borderColor: theme.primaryColor,
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
                                    className="text-sm mt-2 italic"
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
                                    className="text-xs mt-2 inline-flex items-center gap-1"
                                    style={{ color: theme.mutedColor }}
                                  >
                                    <Clock size={11} />
                                    {service.duration}
                                  </span>
                                </ColorZone>
                              )}
                            </div>

                            {/* Price */}
                            <ColorZone
                              zone={getZone('price')}
                              theme={theme}
                              editMode={editMode}
                              isActive={activeZone === 'price'}
                              onClick={onColorZoneClick}
                            >
                              <div
                                className="text-xl font-bold flex-shrink-0"
                                style={{
                                  color: service.isPromo
                                    ? theme.promoColor
                                    : theme.primaryColor,
                                  fontFamily: theme.fontHeading,
                                }}
                              >
                                {service.price}
                              </div>
                            </ColorZone>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ColorZone>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer decoration */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <div
            className="w-8 h-px"
            style={{ backgroundColor: theme.primaryColor }}
          />
          <Gem size={14} style={{ color: theme.primaryColor }} />
          <div
            className="w-8 h-px"
            style={{ backgroundColor: theme.primaryColor }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TEMPLATE DEFINITION EXPORT
// ============================================================================

export const elegantTemplateDefinition: TemplateDefinition = {
  metadata: {
    id: 'elegant',
    name: 'Elegancki',
    description: 'Luksusowy design z dekoracjami i akcentami',
    tags: ['elegancki', 'luksusowy', 'premium'],
    isPremium: false,
  },
  colorZones: COLOR_ZONES,
  defaultTheme: {
    primaryColor: '#B8860B',
    secondaryColor: '#FDF5E6',
    fontHeading: 'Playfair Display',
    fontBody: 'Lora',
    textColor: '#1a1a1a',
    mutedColor: '#666666',
    boxBgColor: '#FFFEF9',
    boxBorderColor: '#E8E0D0',
  },
  Component: ElegantTemplate,
};

export default ElegantTemplate;
