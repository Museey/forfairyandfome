"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function saveSellerProfile(formData: FormData) {
  await requireCurrentUser();

  const data = {
    name: String(formData.get("name") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    taxId: String(formData.get("taxId") || "").trim(),
    bankName: String(formData.get("bankName") || "").trim(),
    bankAccountNo: String(formData.get("bankAccountNo") || "").trim(),
    bankAccountName: String(formData.get("bankAccountName") || "").trim(),
    branch: String(formData.get("branch") || "").trim(),
    contactName: String(formData.get("contactName") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    email: String(formData.get("email") || "").trim(),
  };

  await prisma.sellerProfile.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  revalidatePath("/settings");
}
