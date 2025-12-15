import jsPDF from 'jspdf';
import { PricingData, ThemeConfig } from '../../../types';

interface PDFExportOptions {
  filename?: string;
  theme?: Partial<ThemeConfig>;
}

// PDF Style configuration
const PDF_STYLES = {
  // Page setup (A4 in mm)
  pageWidth: 210,
  pageHeight: 297,
  margin: 15,

  // Font sizes (in pt)
  salonNameSize: 20,
  categorySize: 13,
  serviceNameSize: 10,
  descriptionSize: 8,
  priceSize: 10,
  durationSize: 7,
  tagSize: 7,
  countBadgeSize: 8,

  // Spacing (in mm)
  lineHeight: 5,
  sectionSpacing: 10,
  serviceSpacing: 3,
  servicePadding: 4,
  tagSpacing: 2,

  // Colors
  primaryColor: [225, 29, 72] as [number, number, number],     // Rose-600
  textColor: [51, 65, 85] as [number, number, number],         // Slate-700
  mutedColor: [100, 116, 139] as [number, number, number],     // Slate-500
  promoColor: [217, 119, 6] as [number, number, number],       // Amber-600
  tagBgColor: [254, 226, 226] as [number, number, number],     // Rose-100 for tags
  tagTextColor: [190, 18, 60] as [number, number, number],     // Rose-700 for tag text
  borderColor: [226, 232, 240] as [number, number, number],    // Slate-200
  cardBgColor: [248, 250, 252] as [number, number, number],    // Slate-50 for service cards
};

// Font cache to avoid reloading
let fontsLoaded = false;
let fontCache: { regular: string; bold: string } | null = null;

// Logo cache
let logoLoaded = false;
let logoCache: string | null = null;

/**
 * Load and register Roboto fonts for Polish character support
 */
const loadFonts = async (pdf: jsPDF): Promise<void> => {
  if (fontsLoaded && fontCache) {
    // Use cached fonts
    pdf.addFileToVFS('Roboto-Regular.ttf', fontCache.regular);
    pdf.addFileToVFS('Roboto-Bold.ttf', fontCache.bold);
    pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    pdf.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    return;
  }

  try {
    // Fetch fonts from public directory
    const [regularResponse, boldResponse] = await Promise.all([
      fetch('/fonts/Roboto-Regular.ttf'),
      fetch('/fonts/Roboto-Bold.ttf'),
    ]);

    if (!regularResponse.ok || !boldResponse.ok) {
      console.warn('Could not load Roboto fonts, falling back to Helvetica');
      return;
    }

    // Convert to base64
    const [regularBuffer, boldBuffer] = await Promise.all([
      regularResponse.arrayBuffer(),
      boldResponse.arrayBuffer(),
    ]);

    const regularBase64 = arrayBufferToBase64(regularBuffer);
    const boldBase64 = arrayBufferToBase64(boldBuffer);

    // Cache fonts
    fontCache = { regular: regularBase64, bold: boldBase64 };
    fontsLoaded = true;

    // Register fonts with jsPDF
    pdf.addFileToVFS('Roboto-Regular.ttf', regularBase64);
    pdf.addFileToVFS('Roboto-Bold.ttf', boldBase64);
    pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    pdf.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  } catch (error) {
    console.warn('Failed to load custom fonts:', error);
  }
};

/**
 * Convert ArrayBuffer to base64 string
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Get the font family name (Roboto if loaded, helvetica as fallback)
 */
const getFontFamily = (): string => {
  return fontsLoaded ? 'Roboto' : 'helvetica';
};

/**
 * Load logo image for PDF footer
 */
const loadLogo = async (): Promise<string | null> => {
  if (logoLoaded && logoCache) {
    return logoCache;
  }

  try {
    const response = await fetch('/logo.png');
    if (!response.ok) {
      console.warn('Could not load logo');
      return null;
    }

    const buffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    logoCache = base64;
    logoLoaded = true;
    return base64;
  } catch (error) {
    console.warn('Failed to load logo:', error);
    return null;
  }
};

/**
 * Add footer with logo and "Wygenerowane w systemie" text to all pages
 */
const addFooterToAllPages = (pdf: jsPDF, logoBase64: string | null): void => {
  const totalPages = pdf.getNumberOfPages();
  const { pageWidth, pageHeight, margin } = PDF_STYLES;
  const footerY = pageHeight - 10;
  const fontFamily = getFontFamily();

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    // Add logo if available (maintaining 5:1 aspect ratio - logo is 490x99px)
    const logoWidth = 20;  // mm
    const logoHeight = 4;  // mm (maintains ~5:1 aspect ratio)
    if (logoBase64) {
      try {
        pdf.addImage(
          `data:image/png;base64,${logoBase64}`,
          'PNG',
          margin,
          footerY - 2,
          logoWidth,
          logoHeight
        );
      } catch {
        // Logo failed to load, skip it
      }
    }

    // Add "Wygenerowane w systemie" text
    pdf.setFontSize(7);
    pdf.setTextColor(...PDF_STYLES.mutedColor);
    pdf.setFont(fontFamily, 'normal');

    const textX = logoBase64 ? margin + logoWidth + 2 : margin;
    pdf.text('Wygenerowane w systemie', textX, footerY);

    // Add page number on the right
    pdf.text(`${i} / ${totalPages}`, pageWidth - margin - 8, footerY);
  }
};

/**
 * Check if we need a new page and handle it
 * Returns the new Y position
 */
const checkPageBreak = (
  pdf: jsPDF,
  currentY: number,
  requiredHeight: number,
  currentSection: string | null,
  margin: number,
  pageHeight: number
): { y: number; newPage: boolean } => {
  const availableHeight = pageHeight - margin - currentY;

  if (requiredHeight > availableHeight) {
    pdf.addPage();
    let newY = margin;

    // If we're in a section, repeat the header
    if (currentSection) {
      pdf.setFontSize(PDF_STYLES.categorySize);
      pdf.setTextColor(...PDF_STYLES.textColor);
      pdf.setFont(getFontFamily(), 'bold');
      pdf.text(`${currentSection} (cd.)`, margin, newY + 4);
      newY += PDF_STYLES.lineHeight + 6;

      // Add subtle line under header
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(margin, newY, PDF_STYLES.pageWidth - margin, newY);
      newY += 4;
    }

    return { y: newY, newPage: true };
  }

  return { y: currentY, newPage: false };
};

/**
 * Estimate the height needed for a service item (including card padding and border)
 */
const estimateServiceHeight = (
  pdf: jsPDF,
  service: { name: string; description?: string; duration?: string; tags?: string[] },
  maxWidth: number
): number => {
  const padding = PDF_STYLES.servicePadding;
  let height = padding * 2 + 6; // Top/bottom padding + name line

  // Tags on same line as name or below
  if (service.tags && service.tags.length > 0) {
    height += 5;
  }

  // Description height
  if (service.description) {
    pdf.setFontSize(PDF_STYLES.descriptionSize);
    const lines = pdf.splitTextToSize(service.description, maxWidth - padding * 2 - 10);
    height += lines.length * 3.5 + 2;
  }

  // Duration
  if (service.duration) {
    height += 4;
  }

  return height + PDF_STYLES.serviceSpacing;
};

/**
 * Export pricelist data to PDF
 * Builds PDF programmatically with proper page breaks and header repetition
 */
export const exportToPDFFromData = async (
  data: PricingData,
  options: PDFExportOptions = {}
): Promise<void> => {
  const { filename = 'cennik' } = options;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Load custom fonts with Polish character support
  await loadFonts(pdf);
  const fontFamily = getFontFamily();

  // Load logo for footer
  const logoBase64 = await loadLogo();

  const { margin, pageWidth, pageHeight } = PDF_STYLES;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin;
  let currentSection: string | null = null;

  // === SALON NAME ===
  if (data.salonName) {
    pdf.setFontSize(PDF_STYLES.salonNameSize);
    pdf.setTextColor(...PDF_STYLES.primaryColor);
    pdf.setFont(fontFamily, 'bold');
    pdf.text(data.salonName, margin, currentY + 5);
    currentY += 12;

    // Decorative line
    pdf.setDrawColor(...PDF_STYLES.primaryColor);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, margin + 40, currentY);
    currentY += PDF_STYLES.sectionSpacing;
  }

  // === CATEGORIES ===
  for (const category of data.categories) {
    // Check if category header fits
    const result = checkPageBreak(pdf, currentY, 25, null, margin, pageHeight);
    currentY = result.y;

    // Category header with background
    currentSection = category.categoryName;

    // Draw category background bar
    pdf.setFillColor(248, 250, 252); // Slate-50
    pdf.rect(margin, currentY, contentWidth, 8, 'F');

    // Category name
    pdf.setFontSize(PDF_STYLES.categorySize);
    pdf.setTextColor(...PDF_STYLES.textColor);
    pdf.setFont(fontFamily, 'bold');
    pdf.text(category.categoryName, margin + 3, currentY + 5.5);

    // Service count badge (separate styling)
    const categoryNameWidth = pdf.getTextWidth(category.categoryName);
    pdf.setFontSize(PDF_STYLES.countBadgeSize);
    pdf.setTextColor(...PDF_STYLES.mutedColor);
    pdf.setFont(fontFamily, 'normal');
    const serviceCountText = category.services.length === 1 ? '1 usługa' :
                             category.services.length < 5 ? `${category.services.length} usługi` :
                             `${category.services.length} usług`;
    pdf.text(serviceCountText, margin + 3 + categoryNameWidth + 4, currentY + 5.5);

    currentY += 12;

    // === SERVICES ===
    for (const service of category.services) {
      const padding = PDF_STYLES.servicePadding;

      // Estimate height needed for this service
      const serviceHeight = estimateServiceHeight(pdf, service, contentWidth);

      // Check page break
      const breakResult = checkPageBreak(pdf, currentY, serviceHeight, currentSection, margin, pageHeight);
      currentY = breakResult.y;

      const cardStartY = currentY;
      let innerY = currentY + padding;

      // === SERVICE CARD CONTENT ===

      // Service name (left side)
      pdf.setFontSize(PDF_STYLES.serviceNameSize);
      pdf.setFont(fontFamily, 'bold');

      if (service.isPromo) {
        pdf.setTextColor(...PDF_STYLES.promoColor);
      } else {
        pdf.setTextColor(...PDF_STYLES.textColor);
      }

      const nameText = service.isPromo ? `★ ${service.name}` : service.name;
      pdf.text(nameText, margin + padding, innerY + 3);

      // Price (right side, same line)
      pdf.setFontSize(PDF_STYLES.priceSize);
      pdf.setFont(fontFamily, 'bold');
      if (service.isPromo) {
        pdf.setTextColor(...PDF_STYLES.promoColor);
      } else {
        pdf.setTextColor(...PDF_STYLES.primaryColor);
      }
      const priceWidth = pdf.getTextWidth(service.price);
      pdf.text(service.price, pageWidth - margin - padding - priceWidth, innerY + 3);

      innerY += 6;

      // Tags (below name, with visible styling)
      if (service.tags && service.tags.length > 0) {
        let tagX = margin + padding;
        pdf.setFontSize(PDF_STYLES.tagSize);
        pdf.setFont(fontFamily, 'normal');

        for (const tag of service.tags) {
          const tagTextWidth = pdf.getTextWidth(tag);
          const tagWidth = tagTextWidth + 4;
          const tagHeight = 4;

          // Tag background (rose tinted)
          pdf.setFillColor(...PDF_STYLES.tagBgColor);
          pdf.roundedRect(tagX, innerY - 0.5, tagWidth, tagHeight, 0.8, 0.8, 'F');

          // Tag text
          pdf.setTextColor(...PDF_STYLES.tagTextColor);
          pdf.text(tag, tagX + 2, innerY + 2.5);

          tagX += tagWidth + 2;
        }
        innerY += 5;
      }

      // Description (muted, below tags)
      if (service.description) {
        pdf.setFontSize(PDF_STYLES.descriptionSize);
        pdf.setTextColor(...PDF_STYLES.mutedColor);
        pdf.setFont(fontFamily, 'normal');

        const maxDescWidth = contentWidth - (padding * 2) - 10;
        const lines = pdf.splitTextToSize(service.description, maxDescWidth);
        for (const line of lines) {
          pdf.text(line, margin + padding, innerY + 2);
          innerY += 3.5;
        }
        innerY += 1;
      }

      // Duration (at bottom)
      if (service.duration) {
        pdf.setFontSize(PDF_STYLES.durationSize);
        pdf.setTextColor(...PDF_STYLES.mutedColor);
        pdf.setFont(fontFamily, 'normal');
        pdf.text(`Czas: ${service.duration}`, margin + padding, innerY + 2);
        innerY += 4;
      }

      innerY += padding;

      // Draw service card border
      const cardHeight = innerY - cardStartY;
      pdf.setDrawColor(...PDF_STYLES.borderColor);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, cardStartY, contentWidth, cardHeight, 1.5, 1.5, 'S');

      currentY = innerY + PDF_STYLES.serviceSpacing;
    }

    currentY += PDF_STYLES.sectionSpacing;
  }

  // Add footer with logo to all pages
  addFooterToAllPages(pdf, logoBase64);

  // Save PDF
  pdf.save(`${filename}.pdf`);
};

// === LEGACY SUPPORT ===
// Keep the old function signature for backward compatibility
// This extracts data from the DOM and calls the new function

interface LegacyPDFExportOptions {
  filename?: string;
  scale?: number;
  margin?: number;
}

/**
 * Legacy export function - extracts data from DOM element
 * For backward compatibility with existing code
 */
export const exportToPDF = async (
  element: HTMLElement,
  options: LegacyPDFExportOptions = {}
): Promise<void> => {
  const { filename = 'cennik' } = options;

  // Extract data from DOM
  const data = extractPricingDataFromDOM(element);

  // Use the new data-based export
  await exportToPDFFromData(data, { filename });
};

/**
 * Extract PricingData from DOM element
 */
const extractPricingDataFromDOM = (element: HTMLElement): PricingData => {
  const data: PricingData = {
    categories: [],
  };

  // Try to find salon name
  const salonNameEl = element.querySelector('h2');
  if (salonNameEl) {
    data.salonName = salonNameEl.textContent?.trim();
  }

  // Find categories - they're in divs inside divide-y containers
  const categoryContainers = element.querySelectorAll('[class*="divide-y"] > div, [class*="divide-"] > div');

  categoryContainers.forEach((container) => {
    const category: { categoryName: string; services: Array<{
      name: string;
      price: string;
      description?: string;
      duration?: string;
      isPromo: boolean;
      tags?: string[];
    }> } = {
      categoryName: '',
      services: [],
    };

    // Find category name
    const h3 = container.querySelector('h3');
    if (h3) {
      category.categoryName = h3.textContent?.trim() || '';
    }

    // Find services
    const serviceElements = container.querySelectorAll('[class*="space-y"] > div, [class*="rounded-xl"]');

    serviceElements.forEach((serviceEl) => {
      // Skip if it's likely a container, not a service
      if (serviceEl.querySelector('h3')) return;

      const service: {
        name: string;
        price: string;
        description?: string;
        duration?: string;
        isPromo: boolean;
        tags?: string[];
      } = {
        name: '',
        price: '',
        isPromo: false,
      };

      // Find service name (h4 or first bold text)
      const h4 = serviceEl.querySelector('h4');
      if (h4) {
        service.name = h4.textContent?.trim() || '';
      }

      // Check for promo
      const promoEl = serviceEl.querySelector('[class*="promo"], [class*="Promo"]');
      service.isPromo = !!promoEl;

      // Find price (usually in a div with font-semibold and color styling)
      const priceEl = serviceEl.querySelector('[class*="font-semibold"]:last-child, [class*="text-right"]');
      if (priceEl) {
        const priceText = priceEl.textContent?.trim();
        if (priceText && priceText.includes('zł')) {
          service.price = priceText;
        }
      }

      // If no price found, try to find any text ending with "zł"
      if (!service.price) {
        const allText = serviceEl.textContent || '';
        const priceMatch = allText.match(/\d+[,.]?\d*\s*zł/);
        if (priceMatch) {
          service.price = priceMatch[0];
        }
      }

      // Find description (p tag or muted text)
      const descEl = serviceEl.querySelector('p, [class*="text-xs"]:not([class*="flex"])');
      if (descEl && !descEl.textContent?.includes('min') && !descEl.textContent?.includes('zł')) {
        service.description = descEl.textContent?.trim();
      }

      // Find duration
      const durationEl = serviceEl.querySelector('[class*="Clock"]')?.parentElement;
      if (durationEl) {
        service.duration = durationEl.textContent?.trim();
      } else {
        const durationMatch = serviceEl.textContent?.match(/\d+\s*min/);
        if (durationMatch) {
          service.duration = durationMatch[0];
        }
      }

      // Find tags
      const tagElements = serviceEl.querySelectorAll('[class*="rounded"][class*="px-"]');
      const tags: string[] = [];
      tagElements.forEach((tagEl) => {
        const text = tagEl.textContent?.trim();
        if (text && text.length < 20 && !text.includes('zł') && !text.includes('min')) {
          tags.push(text);
        }
      });
      if (tags.length > 0) {
        service.tags = tags;
      }

      // Only add if we have name and price
      if (service.name && service.price) {
        category.services.push(service);
      }
    });

    // Only add category if it has services
    if (category.categoryName && category.services.length > 0) {
      data.categories.push(category);
    }
  });

  return data;
};
