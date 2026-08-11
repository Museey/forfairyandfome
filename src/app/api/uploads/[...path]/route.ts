import path from "path";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { UPLOAD_LOCAL_ROOT } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  pdf: "application/pdf",
  txt: "text/plain",
};

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/uploads/[...path]">,
) {
  const { path: segments } = await params;

  if (segments.some((s) => s.includes("..") || s.includes("\\"))) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }

  const filePath = path.join(UPLOAD_LOCAL_ROOT, ...segments);
  if (!filePath.startsWith(UPLOAD_LOCAL_ROOT)) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }

  try {
    const data = await readFile(filePath);
    const ext = segments[segments.length - 1].split(".").pop() ?? "";
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
