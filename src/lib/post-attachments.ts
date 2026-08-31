import { uploadFile } from "@/lib/storage";

export type ResolvedPost = {
  kind: "PHOTO" | "FILE" | "LINK" | "TEXT";
  url: string | null;
  body: string | null;
};

export async function resolvePosts(
  formData: FormData,
  folder: string,
): Promise<ResolvedPost[]> {
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  // "link" (singular) is still accepted so older clients keep working.
  const links = [...formData.getAll("links"), ...formData.getAll("link")]
    .map((l) => String(l).trim())
    .filter(Boolean);
  const body = String(formData.get("body") || "").trim();

  const resolved: ResolvedPost[] = [];

  for (const file of files) {
    const url = await uploadFile(file, folder);
    const isImage = file.type.startsWith("image/");
    resolved.push({ kind: isImage ? "PHOTO" : "FILE", url, body: null });
  }
  for (const link of links) {
    resolved.push({ kind: "LINK", url: link, body: null });
  }
  if (body) {
    resolved.push({ kind: "TEXT", url: null, body });
  }
  return resolved;
}
