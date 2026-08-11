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
  const link = String(formData.get("link") || "").trim();
  const body = String(formData.get("body") || "").trim();

  const resolved: ResolvedPost[] = [];

  for (const file of files) {
    const url = await uploadFile(file, folder);
    const isImage = file.type.startsWith("image/");
    resolved.push({ kind: isImage ? "PHOTO" : "FILE", url, body: null });
  }
  if (link) {
    resolved.push({ kind: "LINK", url: link, body: null });
  }
  if (body) {
    resolved.push({ kind: "TEXT", url: null, body });
  }
  return resolved;
}
