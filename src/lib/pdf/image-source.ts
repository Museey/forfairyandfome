import path from "path";
import { UPLOAD_LOCAL_ROOT } from "@/lib/storage";

/**
 * @react-pdf/renderer's <Image> needs a local file path or a publicly
 * fetchable URL. Local-dev uploads are served through an authenticated
 * route handler, so resolve them straight to disk instead.
 */
export function resolveImageSource(url: string): string {
  if (url.startsWith("/api/uploads/")) {
    return path.join(UPLOAD_LOCAL_ROOT, url.replace("/api/uploads/", ""));
  }
  return url;
}
