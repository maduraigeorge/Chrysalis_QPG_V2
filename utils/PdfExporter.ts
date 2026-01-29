
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
  
  // Requirement: Re-apply paper styling specifically for the PDF engine
  // This ensures the exported file looks professional even if the portal preview is responsive.
  clone.style.width = '210mm'; 
  clone.style.minHeight = '297mm';
  clone.style.padding = '15mm'; // Adding professional padding for print
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

  const displayTitle = metadata.title.trim() || "Exam";
  const filename = `${displayTitle}_${metadata.subject}_${metadata.grade}.pdf`.replace(/\s+/g, '_');

  const options = {
    margin: 0, // Margin is handled by clone.style.padding for precision
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
    // Fix: Correctly resolve the html2pdf function from the ESM import
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
