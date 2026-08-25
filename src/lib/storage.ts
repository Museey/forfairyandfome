import { randomUUID } from "crypto";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), ".data", "uploads");

function safeExtension(filename: string) {
  const ext = filename.split(".").pop();
  if (!ext || ext.length > 8 || !/^[a-zA-Z0-9]+$/.test(ext)) return "bin";
  return ext.toLowerCase();
}

/**
 * Uploads a file and returns a publicly fetchable URL.
 * Uses Supabase Storage when SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are set
 * (production), otherwise falls back to local disk under .data/uploads,
 * served via /api/uploads/[...path] — dev-only, not durable, gitignored.
 */
export async function uploadFile(
  file: File,
  folder: string,
): Promise<string> {
  const key = `${folder}/${randomUUID()}.${safeExtension(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (USE_SUPABASE) {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { error } = await supabase.storage
      .from("attachments")
      .upload(key, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
    const { data } = supabase.storage.from("attachments").getPublicUrl(key);
    return data.publicUrl;
  }

  const { writeFile, mkdir } = await import("fs/promises");
  const destination = path.join(LOCAL_UPLOAD_ROOT, key);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, buffer);
  return `/api/uploads/${key}`;
}

const SUPABASE_PUBLIC_PREFIX = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/attachments/`
  : null;

/**
 * Deletes a previously-uploaded file given the URL uploadFile() returned.
 * Silently no-ops for URLs it doesn't recognize (e.g. LINK attachments,
 * which aren't files we own) so callers can pass any attachment URL
 * unconditionally.
 */
export async function deleteFile(url: string): Promise<void> {
  if (USE_SUPABASE && SUPABASE_PUBLIC_PREFIX && url.startsWith(SUPABASE_PUBLIC_PREFIX)) {
    const key = url.slice(SUPABASE_PUBLIC_PREFIX.length);
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    await supabase.storage.from("attachments").remove([key]);
    return;
  }

  if (!USE_SUPABASE && url.startsWith("/api/uploads/")) {
    const { unlink } = await import("fs/promises");
    const destination = path.join(LOCAL_UPLOAD_ROOT, url.replace("/api/uploads/", ""));
    await unlink(destination).catch(() => {});
  }
}

export const UPLOAD_LOCAL_ROOT = LOCAL_UPLOAD_ROOT;
export const UPLOAD_USES_SUPABASE = USE_SUPABASE;
