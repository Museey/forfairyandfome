import { Text } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { ReactNode } from "react";

// react-pdf's text shaping can silently drop the last rendered glyph of a
// <Text> node for certain Thai character sequences — reproduced across many
// strings (including plain hardcoded labels and numbers), independent of
// container width, font weight, or wrapping. Padding with an invisible
// zero-width space on ONE side (leading-only or trailing-only) was not
// reliable; padding on BOTH sides was, verified deterministic across
// repeated renders of many different strings. Use this in place of
// react-pdf's <Text> everywhere in PDF templates so no spot gets missed.
const ZERO_WIDTH_SPACE = "​";

export function SafeText({
  children,
  style,
  wrap,
}: {
  children?: ReactNode;
  style?: Style | Style[];
  wrap?: boolean;
}) {
  return (
    <Text style={style} wrap={wrap}>
      {ZERO_WIDTH_SPACE}
      {children}
      {ZERO_WIDTH_SPACE}
    </Text>
  );
}
