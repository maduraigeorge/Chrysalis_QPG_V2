
import html2pdf from 'html2pdf.js';
import { PaperMetadata } from '../types';

/**
 * Directly exports the currently rendered question paper to a PDF file.
 * It clones the hidden print-ready version to ensure perfect styling without interrupting the user's view.
 */
export const exportPaperToPdf = async (metadata: PaperMetadata) => {
  const container = document.querySelector('.print-only');
  const content = container?.querySelector('div');
  
  if (!content) {
    console.error("PDF Export failed: Paper content not found in DOM.");
    return;
  }

  // Clone to avoid style conflicts during rendering
  const clone = content.cloneNode(true) as HTMLElement;
  
  // Style the clone for the PDF engine
  clone.style.width = '210mm'; // Standard A4 width
  clone.style.padding = '10mm';
  clone.style.backgroundColor = 'white';
  clone.style.color = '#0f172a'; // Slate-900
  
  // Create a hidden temporary container
  const tempWrapper = document.createElement('div');
  tempWrapper.style.position = 'fixed';
  tempWrapper.style.top = '-10000px';
  tempWrapper.style.left = '-10000px';
  tempWrapper.appendChild(clone);
  document.body.appendChild(tempWrapper);

  const filename = `${metadata.title || 'Question_Paper'}_${metadata.subject}_${metadata.grade}.pdf`.replace(/\s+/g, '_');

  const options = {
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      letterRendering: true,
      logging: false 
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    await html2pdf().from(clone).set(options).save();
  } catch (error) {
    console.error("PDF Generation error:", error);
    alert("There was an issue generating your PDF. Please try the standard Print option.");
  } finally {
    document.body.removeChild(tempWrapper);
  }
};
