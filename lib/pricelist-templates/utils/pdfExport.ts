import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PDFExportOptions {
  filename?: string;
  scale?: number;
  margin?: number;
}

/**
 * Inline all computed styles on elements and remove stylesheets
 * This works around html2canvas not supporting modern CSS color functions like oklch()
 */
const inlineAllStyles = (clonedDoc: Document, clonedElement: HTMLElement) => {
  // First, inline all computed styles on elements within the target
  const allElements = clonedElement.querySelectorAll('*');
  const elementsToProcess = [clonedElement, ...Array.from(allElements)];

  elementsToProcess.forEach((el) => {
    if (!(el instanceof HTMLElement)) return;

    // Get the original element from the main document for computed styles
    const computedStyle = window.getComputedStyle(el);

    // Critical style properties to inline
    const properties = [
      'color',
      'background-color',
      'background-image',
      'background',
      'border-color',
      'border-top-color',
      'border-right-color',
      'border-bottom-color',
      'border-left-color',
      'border-width',
      'border-style',
      'border-radius',
      'outline-color',
      'text-decoration-color',
      'box-shadow',
      'fill',
      'stroke',
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
      'letter-spacing',
      'text-align',
      'padding',
      'margin',
      'width',
      'height',
      'max-width',
      'max-height',
      'min-width',
      'min-height',
      'display',
      'flex-direction',
      'justify-content',
      'align-items',
      'gap',
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'z-index',
      'overflow',
      'opacity',
      'transform',
      'transition',
    ];

    properties.forEach((prop) => {
      try {
        const value = computedStyle.getPropertyValue(prop);
        if (value && value !== 'none' && value !== 'initial' && value !== 'inherit') {
          el.style.setProperty(prop, value, 'important');
        }
      } catch (e) {
        // Ignore errors for properties that can't be read
      }
    });
  });

  // Remove all stylesheets to prevent html2canvas from parsing oklch values
  const styleElements = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
  styleElements.forEach((el) => el.remove());
};

/**
 * Export an element to PDF
 * Automatically expands all accordions before taking screenshot
 */
export const exportToPDF = async (
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> => {
  const {
    filename = 'cennik',
    scale = 2,
    margin = 10,
  } = options;

  // Store original styles to restore later
  const originalStyles: Map<HTMLElement, string> = new Map();

  // Find and expand all collapsed sections
  // Templates use max-h-0 for collapsed state
  const collapsedElements = element.querySelectorAll<HTMLElement>('[class*="max-h-0"]');
  collapsedElements.forEach((el) => {
    originalStyles.set(el, el.style.maxHeight);
    el.style.maxHeight = 'none';
    // Remove the max-h-0 class temporarily
    el.classList.remove('max-h-0');
    el.classList.add('max-h-none');
  });

  // Also handle details elements if any
  const detailsElements = element.querySelectorAll<HTMLDetailsElement>('details');
  const detailsOriginalState: Map<HTMLDetailsElement, boolean> = new Map();
  detailsElements.forEach((el) => {
    detailsOriginalState.set(el, el.open);
    el.open = true;
  });

  // Wait for transitions to complete
  await new Promise(resolve => setTimeout(resolve, 350));

  try {
    // Generate canvas with onclone to fix oklch colors
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc, clonedElement) => {
        // Inline all computed styles and remove stylesheets
        inlineAllStyles(clonedDoc, clonedElement);
      },
    });

    // Calculate PDF dimensions
    const imgWidth = 210 - (margin * 2); // A4 width in mm minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF - use 'p' for portrait, handle multiple pages if needed
    const pdf = new jsPDF({
      orientation: imgHeight > 297 - (margin * 2) ? 'p' : 'p',
      unit: 'mm',
      format: 'a4',
    });

    const pageHeight = 297 - (margin * 2); // A4 height in mm minus margins
    let heightLeft = imgHeight;
    let position = margin;

    // Add first page
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content exceeds one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save PDF
    pdf.save(`${filename}.pdf`);
  } finally {
    // Restore original accordion states
    collapsedElements.forEach((el) => {
      const originalMaxHeight = originalStyles.get(el);
      if (originalMaxHeight !== undefined) {
        el.style.maxHeight = originalMaxHeight;
      } else {
        el.style.maxHeight = '';
      }
      el.classList.remove('max-h-none');
      el.classList.add('max-h-0');
    });

    // Restore details elements
    detailsElements.forEach((el) => {
      const wasOpen = detailsOriginalState.get(el);
      if (wasOpen !== undefined) {
        el.open = wasOpen;
      }
    });
  }
};
