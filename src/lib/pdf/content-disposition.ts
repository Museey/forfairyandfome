/**
 * HTTP header values must be Latin-1; Thai filenames need RFC 5987 encoding.
 * Provides both an ASCII fallback and the UTF-8 filename* form.
 *
 * Always "inline": the preview button embeds this URL in an iframe (needs
 * inline to render instead of trying to download), and the export/share
 * button fetches the bytes itself and builds a File client-side, so this
 * header doesn't affect it either way.
 */
export function pdfContentDisposition(filename: string) {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `inline; filename="${asciiFallback}.pdf"; filename*=UTF-8''${encoded}.pdf`;
}
