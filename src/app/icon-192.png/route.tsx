import { ImageResponse } from "next/og";
import { AppIconGlyph } from "@/lib/app-icon";

export async function GET() {
  return new ImageResponse(<AppIconGlyph size={192} />, {
    width: 192,
    height: 192,
  });
}
