import path from "path";

// Fome signs every document we issue by default — a real signature can
// still be added later if the client needs one from someone else.
export const FOME_SIGNATURE_PATH = path.join(
  process.cwd(),
  "public/signatures/fome.png",
);
