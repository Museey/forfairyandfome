"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { notifyOtherUsers } from "@/lib/push";

export async function checkIn() {
  const user = await requireCurrentUser();
  if (user.role !== "MANAGER") return;
  await prisma.checkEvent.create({
    data: { userId: user.id, type: "CHECK_IN" },
  });
  await notifyOtherUsers(user.id, {
    title: "เช็คอินวันนี้",
    body: `${user.name} เช็คอินแล้ว`,
    url: "/",
  });
  revalidatePath("/");
}

export async function checkOut() {
  const user = await requireCurrentUser();
  if (user.role !== "MANAGER") return;
  await prisma.checkEvent.create({
    data: { userId: user.id, type: "CHECK_OUT" },
  });
  await notifyOtherUsers(user.id, {
    title: "เช็คเอาท์วันนี้",
    body: `${user.name} เช็คเอาท์แล้ว`,
    url: "/",
  });
  revalidatePath("/");
}
