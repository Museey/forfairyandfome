// react-pdf's text shaping can silently drop the last rendered glyph of a
// <Text> node for certain Thai character sequences — reproduced across many
// different strings/endings, independent of container width, font weight,
// or wrapping. Appending an invisible zero-width space reliably prevents it
// (confirmed empirically; the exact upstream cause wasn't pinned down).
const ZERO_WIDTH_SPACE = "​";

export function pdfSafeText<T extends string | null | undefined>(text: T): T {
  if (!text) return text;
  return `${text}${ZERO_WIDTH_SPACE}` as T;
}
