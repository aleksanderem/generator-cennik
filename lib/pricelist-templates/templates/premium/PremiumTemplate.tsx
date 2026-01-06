import React, { useState } from 'react';
import { ChevronDown, Clock, Star, Sparkles } from 'lucide-react';
import { TemplateProps, TemplateDefinition, ColorZone as ColorZoneType } from '../../types';
import { ColorZone } from '../../components/ColorZone';

// ============================================================================
// COLOR ZONES DEFINITION
// ============================================================================

const COLOR_ZONES: ColorZoneType[] = [
  // Color zones
  { id: 'gradientStart', label: 'Gradient (początek)', themeKey: 'secondaryColor', type: 'color' },
  { id: 'gradientEnd', label: 'Gradient (koniec)', themeKey: 'primaryColor', type: 'color' },
  { id: 'categoryHeader', label: 'Nagłówek kategorii', themeKey: 'textColor', type: 'color' },
  { id: 'categoryBg', label: 'Tło nagłówka kategorii', themeKey: 'secondaryColor', type: 'color' },
  { id: 'serviceName', label: 'Nazwa usługi', themeKey: 'textColor', type: 'color' },
  { id: 'serviceDesc', label: 'Opis usługi', themeKey: 'mutedColor', type: 'color' },
  { id: 'price', label: 'Cena', themeKey: 'primaryColor', type: 'color' },
  { id: 'promo', label: 'Promocja', themeKey: 'promoColor', type: 'color' },
  { id: 'promoBg', label: 'Tło promocji', themeKey: 'promoBgColor', type: 'color' },
  { id: 'tag', label: 'Tag/Badge', themeKey: 'primaryColor', type: 'color' },
  { id: 'tagBg', label: 'Tło tagu', themeKey: 'secondaryColor', type: 'color' },
  { id: 'border', label: 'Obramowanie', themeKey: 'boxBorderColor', type: 'color' },
  { id: 'background', label: 'Tło', themeKey: 'boxBgColor', type: 'color' },
  { id: 'duration', label: 'Czas trwania', themeKey: 'mutedColor', type: 'color' },
  { id: 'counter', label: 'Licznik usług', themeKey: 'primaryColor', type: 'color' },
  // Font size zones
  { id: 'fontSizeCategory', label: 'Rozmiar: Kategoria', themeKey: 'fontSizeCategory', type: 'fontSize' },
  { id: 'fontSizeServiceName', label: 'Rozmiar: Nazwa usługi', themeKey: 'fontSizeServiceName', type: 'fontSize' },
  { id: 'fontSizeDescription', label: 'Rozmiar: Opis', themeKey: 'fontSizeDescription', type: 'fontSize' },
  { id: 'fontSizePrice', label: 'Rozmiar: Cena', themeKey: 'fontSizePrice', type: 'fontSize' },
  { id: 'fontSizeDuration', label: 'Rozmiar: Czas', themeKey: 'fontSizeDuration', type: 'fontSize' },
];

// ============================================================================
// PREMIUM TEMPLATE COMPONENT
// Modern card-based design with gradient header and shadow effects
// ============================================================================

const PremiumTemplate: React.FC<TemplateProps> = ({
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
      className="rounded-2xl shadow-xl border relative transition-all"
      style={{
        backgroundColor: theme.boxBgColor,
        borderColor: theme.boxBorderColor,
        boxShadow: `0 20px 25px -5px ${theme.primaryColor}15`,
        fontFamily: theme.fontBody,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {/* Top gradient bar - uses border-radius clip */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
        style={{
          background: `linear-gradient(to right, ${theme.secondaryColor}, ${theme.primaryColor})`,
        }}
      />

      {/* Content with padding */}
      <div className="p-6 md:p-8 pt-8">

      {/* Header */}
      {data.salonName && (
        <div className="text-center mb-8">
          <h3
            className="text-2xl font-bold"
            style={{
              fontFamily: theme.fontHeading,
              color: theme.textColor,
            }}
          >
            {data.salonName}
          </h3>
          <ColorZone
            zone={getZone('tagBg')}
            theme={theme}
            editMode={editMode}
            isActive={activeZone === 'tagBg'}
            onClick={onColorZoneClick}
          >
            <div
              className="w-12 h-1 mx-auto mt-4 rounded-full"
              style={{ backgroundColor: theme.secondaryColor }}
            />
          </ColorZone>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-2">
        {data.categories.map((category, catIndex) => {
          const isOpen = openCategories.has(catIndex);

          return (
            <ColorZone
              key={catIndex}
              zone={getZone('border')}
              theme={theme}
              editMode={editMode}
              isActive={activeZone === 'border'}
              onClick={onColorZoneClick}
            >
              <div
                className="mb-4 rounded-xl overflow-hidden shadow-sm transition-all"
                style={{
                  backgroundColor: theme.boxBgColor,
                  border: `1px solid ${theme.boxBorderColor}`,
                }}
              >
                {/* Category Header */}
                <ColorZone
                  zone={getZone('categoryBg')}
                  theme={theme}
                  editMode={editMode}
                  isActive={activeZone === 'categoryBg'}
                  onClick={onColorZoneClick}
                >
                  <button
                    onClick={() => toggleCategory(catIndex)}
                    className="w-full flex items-center justify-between p-5 transition-colors duration-200"
                    style={{
                      backgroundColor: `${theme.secondaryColor}40`,
                    }}
                  >
                    <ColorZone
                      zone={getZone('categoryHeader')}
                      theme={theme}
                      editMode={editMode}
                      isActive={activeZone === 'categoryHeader'}
                      onClick={onColorZoneClick}
                    >
                      <h3
                        className="font-medium flex items-center gap-2"
                        style={{
                          fontFamily: theme.fontHeading,
                          color: theme.textColor,
                          fontSize: `${theme.fontSizeCategory}px`,
                        }}
                      >
                        {category.categoryName}
                        <ColorZone
                          zone={getZone('counter')}
                          theme={theme}
                          editMode={editMode}
                          isActive={activeZone === 'counter'}
                          onClick={onColorZoneClick}
                        >
                          <span
                            className="text-xs font-sans font-normal px-2 py-0.5 rounded-full border"
                            style={{
                              color: theme.primaryColor,
                              backgroundColor: theme.secondaryColor,
                              borderColor: theme.secondaryColor,
                              fontFamily: theme.fontBody,
                            }}
                          >
                            {category.services.length} usług
                          </span>
                        </ColorZone>
                      </h3>
                    </ColorZone>

                    <div
                      className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      style={{ color: theme.primaryColor }}
                    >
                      <ChevronDown size={24} />
                    </div>
                  </button>
                </ColorZone>

                {/* Services */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-5 pt-0">
                    <div
                      className="space-y-4"
                      style={{ fontFamily: theme.fontBody }}
                    >
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
                            className="flex flex-col sm:flex-row gap-4 p-3 rounded-lg border transition-all"
                            style={{
                              backgroundColor: service.isPromo
                                ? theme.promoBgColor
                                : theme.boxBgColor,
                              borderColor: service.isPromo
                                ? `${theme.promoColor}40`
                                : theme.boxBorderColor,
                            }}
                          >
                            {/* Image */}
                            {service.imageUrl && (
                              <div className="flex-shrink-0">
                                <img
                                  src={service.imageUrl}
                                  alt={service.name}
                                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md border"
                                  style={{ borderColor: theme.boxBorderColor }}
                                />
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <ColorZone
                                  zone={getZone('serviceName')}
                                  theme={theme}
                                  editMode={editMode}
                                  isActive={activeZone === 'serviceName'}
                                  onClick={onColorZoneClick}
                                >
                                  <h4
                                    className="font-medium leading-tight"
                                    style={{
                                      color: theme.textColor,
                                      fontSize: `${theme.fontSizeServiceName}px`,
                                    }}
                                  >
                                    {service.name}
                                  </h4>
                                </ColorZone>

                                {/* Tags */}
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
                                      className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
                                      style={{
                                        color: theme.primaryColor,
                                        backgroundColor: theme.secondaryColor,
                                      }}
                                    >
                                      <Star size={10} />
                                      {tag}
                                    </span>
                                  </ColorZone>
                                ))}

                                {/* Promo badge */}
                                {service.isPromo && (
                                  <ColorZone
                                    zone={getZone('promo')}
                                    theme={theme}
                                    editMode={editMode}
                                    isActive={activeZone === 'promo'}
                                    onClick={onColorZoneClick}
                                  >
                                    <span
                                      className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border"
                                      style={{
                                        color: theme.promoColor,
                                        backgroundColor: theme.promoBgColor,
                                        borderColor: `${theme.promoColor}40`,
                                      }}
                                    >
                                      <Sparkles size={10} />
                                      Promocja
                                    </span>
                                  </ColorZone>
                                )}

                                {/* Variants count badge */}
                                {service.variants && service.variants.length > 0 && (
                                  <span
                                    className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
                                    style={{
                                      color: theme.primaryColor,
                                      backgroundColor: theme.secondaryColor,
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
                                    style={{
                                      color: theme.mutedColor,
                                      fontSize: `${theme.fontSizeDescription}px`,
                                    }}
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
                                  <p
                                    className="mt-1 flex items-center gap-1 opacity-70"
                                    style={{
                                      color: theme.mutedColor,
                                      fontSize: `${theme.fontSizeDuration}px`,
                                    }}
                                  >
                                    <Clock size={12} />
                                    {service.duration}
                                  </p>
                                </ColorZone>
                              )}
                            </div>

                            {/* Price - only show if no variants */}
                            {(!service.variants || service.variants.length === 0) && (
                              <div className="mt-2 sm:mt-0 sm:ml-4 flex items-start sm:items-center justify-end">
                                <ColorZone
                                  zone={service.isPromo ? getZone('promo') : getZone('price')}
                                  theme={theme}
                                  editMode={editMode}
                                  isActive={activeZone === (service.isPromo ? 'promo' : 'price')}
                                  onClick={onColorZoneClick}
                                >
                                  <span
                                    className="font-semibold whitespace-nowrap"
                                    style={{
                                      color: service.isPromo
                                        ? theme.promoColor
                                        : theme.primaryColor,
                                      fontSize: `${theme.fontSizePrice}px`,
                                    }}
                                  >
                                    {service.price}
                                  </span>
                                </ColorZone>
                              </div>
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
                                    style={{
                                      color: theme.textColor,
                                      fontSize: `${theme.fontSizeDescription}px`,
                                    }}
                                  >
                                    {variant.label}
                                  </span>
                                  <div className="flex items-center gap-4">
                                    {variant.duration && (
                                      <span
                                        className="flex items-center gap-1 opacity-70"
                                        style={{
                                          color: theme.mutedColor,
                                          fontSize: `${theme.fontSizeDuration}px`,
                                        }}
                                      >
                                        <Clock size={12} />
                                        {variant.duration}
                                      </span>
                                    )}
                                    <span
                                      className="font-semibold"
                                      style={{
                                        color: service.isPromo ? theme.promoColor : theme.primaryColor,
                                        fontSize: `${theme.fontSizePrice}px`,
                                      }}
                                    >
                                      {variant.price}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ColorZone>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ColorZone>
          );
        })}
      </div>
      </div>
    </div>
  );
};

// ============================================================================
// TEMPLATE DEFINITION EXPORT
// ============================================================================

export const premiumTemplateDefinition: TemplateDefinition = {
  metadata: {
    id: 'premium',
    name: 'Premium',
    description: 'Nowoczesny design z kartami, cieniami i gradientem',
    tags: ['premium', 'nowoczesny', 'karty'],
    isPremium: false,
  },
  colorZones: COLOR_ZONES,
  defaultTheme: {
    primaryColor: '#E11D48',
    secondaryColor: '#FFF1F2',
    fontHeading: 'Playfair Display',
    fontBody: 'Inter',
    textColor: '#334155',
    mutedColor: '#64748B',
    boxBgColor: '#FFFFFF',
    boxBorderColor: '#F1F5F9',
    promoColor: '#D97706',
    promoBgColor: '#FFFBEB',
  },
  Component: PremiumTemplate,
};

export default PremiumTemplate;
