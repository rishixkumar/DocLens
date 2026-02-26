/**
 * PDF.js Loader
 *
 * Initializes PDF.js worker and exposes the library globally for
 * DocumentIngestion component. Worker is loaded from CDN for compatibility.
 */

import * as pdfjsLib from "pdfjs-dist";

// Use CDN worker for browser compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Expose for DocumentIngestion (which uses window.pdfjsLib for simplicity)
if (typeof window !== "undefined") {
  window.pdfjsLib = pdfjsLib;
}

export { pdfjsLib };
