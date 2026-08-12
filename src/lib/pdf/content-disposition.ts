/**
 * HTTP header values must be Latin-1; Thai filenames need RFC 5987 encoding.
 * Provides both an ASCII fallback and the UTF-8 filename* form.
 *
 * Uses "attachment" rather than "inline": installed PWAs run with no browser
 * chrome (no share/download button), so an inline PDF just renders with no
 * way to save it. "attachment" makes the browser trigger its normal
 * download/save flow instead, which works even with no chrome.
 */
export function pdfContentDisposition(filename: string) {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${asciiFallback}.pdf"; filename*=UTF-8''${encoded}.pdf`;
}
