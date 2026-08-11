import path from "path";
import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  const regular = path.join(process.cwd(), "src/lib/fonts/Sarabun-Regular.ttf");
  const bold = path.join(process.cwd(), "src/lib/fonts/Sarabun-Bold.ttf");

  Font.register({
    family: "Sarabun",
    fonts: [
      { src: regular, fontWeight: "normal" },
      { src: bold, fontWeight: "bold" },
    ],
  });

  // Disable hyphenation — default word-hyphenation callback assumes Latin text
  // and mangles Thai (which has no spaces between words).
  Font.registerHyphenationCallback((word) => [word]);
}
