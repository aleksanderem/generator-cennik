import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
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
      className="mb-4 rounded-xl overflow-hidden shadow-sm transition-all"
      style={{ 
        backgroundColor: theme.boxBgColor,
        border: `1px solid ${theme.boxBorderColor}`
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 transition-colors duration-200"
        style={{ 
          backgroundColor: isOpen ? theme.secondaryColor + '40' : theme.boxBgColor,
        }}
      >
        <h3 
          className="text-xl font-medium flex items-center gap-2"
          style={{ 
            fontFamily: theme.fontHeading,
            color: theme.textColor
          }}
        >
          {category.categoryName}
          <span 
            className="text-xs font-sans font-normal px-2 py-0.5 rounded-full border"
            style={{ 
              color: theme.primaryColor,
              backgroundColor: theme.secondaryColor,
              borderColor: theme.secondaryColor,
              fontFamily: theme.fontBody
            }}
          >
            {category.services.length} usług
          </span>
        </h3>
        <div 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: theme.primaryColor }}
        >
          <ChevronDown size={24} />
        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-5 pt-0">
          <div className="space-y-4" style={{ fontFamily: theme.fontBody }}>
            {category.services.map((service, index) => (
              <div 
                key={index} 
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border transition-all`}
                style={{
                  backgroundColor: service.isPromo ? theme.promoBgColor : theme.boxBgColor,
                  borderColor: service.isPromo ? theme.promoColor + '40' : theme.boxBorderColor, // 40 is hex opacity
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 
                      className="font-medium"
                      style={{ color: theme.textColor }}
                    >
                      {service.name}
                    </h4>
                    {service.isPromo && (
                      <span 
                        className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                        style={{
                          color: theme.promoColor,
                          backgroundColor: theme.promoBgColor,
                          border: `1px solid ${theme.promoColor}40`
                        }}
                      >
                        <Sparkles size={10} /> Promocja
                      </span>
                    )}
                  </div>
                  {service.description && (
                    <p 
                      className="text-sm mt-1"
                      style={{ color: theme.mutedColor }}
                    >
                      {service.description}
                    </p>
                  )}
                  {service.duration && (
                    <p 
                      className="text-xs mt-1 flex items-center gap-1 opacity-70"
                      style={{ color: theme.mutedColor }}
                    >
                      ⏱ {service.duration}
                    </p>
                  )}
                </div>
                <div className="mt-2 sm:mt-0 sm:ml-4 text-right">
                  <span 
                    className="text-lg font-semibold"
                    style={{ color: service.isPromo ? theme.promoColor : theme.primaryColor }}
                  >
                    {service.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accordion;