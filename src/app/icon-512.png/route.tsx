import { ImageResponse } from "next/og";
import { AppIconGlyph } from "@/lib/app-icon";

export async function GET() {
  return new ImageResponse(<AppIconGlyph size={512} />, {
    width: 512,
    height: 512,
  });
}
