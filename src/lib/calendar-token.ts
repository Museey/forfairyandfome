import { prisma } from "@/lib/prisma";

export async function getOrCreateCalendarToken(userId: string) {
  const existing = await prisma.calendarToken.findFirst({ where: { userId } });
  if (existing) return existing.token;

  const created = await prisma.calendarToken.create({ data: { userId } });
  return created.token;
}
