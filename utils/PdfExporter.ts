
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
  clone.style.padding = '0';
  clone.style.margin = '0';
  clone.style.backgroundColor = 'white';
  clone.style.color = '#000000';
  
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
    // Some ESM loaders/shims wrap the function in a default property
    const html2pdfFunc = (html2pdf as any).default || html2pdf;
    
    if (typeof html2pdfFunc !== 'function') {
      throw new Error("html2pdf is not resolved as a function. Check import map or library version.");
    }

    await html2pdfFunc().from(clone).set(options).save();
  } catch (error: any) {
    console.error("PDF Generation error:", error);
    alert(`There was an issue generating your PDF: ${error.message || 'Unknown error'}`);
  } finally {
    document.body.removeChild(tempWrapper);
  }
};
