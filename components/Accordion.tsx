
import React, { useState } from 'react';
import { ChevronDown, Clock, Sparkles, Tag } from 'lucide-react';
import { Category, ThemeConfig } from '../types';

interface AccordionProps {
  category: Category;
  defaultOpen?: boolean;
  theme: ThemeConfig;
}

const Accordion: React.FC<AccordionProps> = ({ category, defaultOpen = false, theme }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="border-b last:border-b-0"
      style={{ borderColor: theme.boxBorderColor }}
    >
      {/* Category Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left transition-colors hover:bg-slate-50/50"
      >
        <div className="flex items-center gap-3">
          <h3
            className="text-base font-semibold"
            style={{
              fontFamily: theme.fontHeading,
              color: theme.textColor
            }}
          >
            {category.categoryName}
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              color: theme.mutedColor,
              backgroundColor: `${theme.mutedColor}10`
            }}
          >
            {category.services.length}
          </span>
        </div>

        <ChevronDown
          size={18}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: theme.mutedColor }}
        />
      </button>

      {/* Services List */}
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-[2000px] pb-4' : 'max-h-0'
        }`}
      >
        <div className="space-y-2 pl-0" style={{ fontFamily: theme.fontBody }}>
          {category.services.map((service, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-3 rounded-lg transition-colors hover:bg-slate-50/80"
              style={{
                backgroundColor: service.isPromo ? `${theme.promoColor}08` : 'transparent',
              }}
            >
              {/* Image */}
              {service.imageUrl && (
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                />
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4
                    className="font-medium text-sm"
                    style={{ color: theme.textColor }}
                  >
                    {service.name}
                  </h4>

                  {service.isPromo && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        color: theme.promoColor,
                        backgroundColor: `${theme.promoColor}15`
                      }}
                    >
                      Promocja
                    </span>
                  )}

                  {service.tags?.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        color: theme.primaryColor,
                        backgroundColor: `${theme.primaryColor}10`
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {service.description && (
                  <p
                    className="text-xs mt-1 line-clamp-2"
                    style={{ color: theme.mutedColor }}
                  >
                    {service.description}
                  </p>
                )}

                {service.duration && (
                  <span
                    className="text-[11px] mt-1 inline-flex items-center gap-1"
                    style={{ color: theme.mutedColor }}
                  >
                    <Clock size={10} />
                    {service.duration}
                  </span>
                )}
              </div>

              {/* Price */}
              <div
                className="font-semibold text-sm flex-shrink-0"
                style={{ color: service.isPromo ? theme.promoColor : theme.primaryColor }}
              >
                {service.price}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Accordion;
