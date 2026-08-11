/**
 * HTTP header values must be Latin-1; Thai filenames need RFC 5987 encoding.
 * Provides both an ASCII fallback and the UTF-8 filename* form.
 */
export function pdfContentDisposition(filename: string) {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `inline; filename="${asciiFallback}.pdf"; filename*=UTF-8''${encoded}.pdf`;
}
