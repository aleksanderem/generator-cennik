
// Service to handle PDF generation
declare var html2pdf: any;

export const pdfService = {
  generateAuditReport: async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id ${elementId} not found`);
      return;
    }

    const opt = {
      margin:       [10, 10, 10, 10], // top, left, bottom, right
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Use html2pdf lib
    try {
      if (typeof html2pdf !== 'undefined') {
        await html2pdf().set(opt).from(element).save();
        return true;
      } else {
        console.error('html2pdf library is not loaded');
        alert('Biblioteka PDF nie została załadowana. Odśwież stronę.');
        return false;
      }
    } catch (e) {
      console.error('PDF Generation failed', e);
      return false;
    }
  }
};
