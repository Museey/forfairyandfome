import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyAllUsers } from "@/lib/push";
import { JOB_DATE_FIELDS, isDateFieldDone } from "@/lib/job-dates";
import { bangkokDayRange } from "@/lib/timezone";

const MAX_LINES_PER_SECTION = 5;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = bangkokDayRange(0);
  const tomorrow = bangkokDayRange(1);

  const jobs = await prisma.job.findMany({
    where: {
      OR: JOB_DATE_FIELDS.map(({ key }) => ({
        [key]: { gte: today.start, lt: tomorrow.end },
      })),
    },
    select: {
      id: true,
      title: true,
      brandName: true,
      status: true,
      storylineSendDate: true,
      shootDate: true,
      draftSendDate: true,
      postDate: true,
    },
  });

  const todayLines: string[] = [];
  const tomorrowLines: string[] = [];

  for (const job of jobs) {
    for (const { key, label } of JOB_DATE_FIELDS) {
      const date = job[key];
      if (!date) continue;
      const jobLabel = `${job.brandName} · ${job.title} (${label})`;

      if (date >= today.start && date < today.end) {
        const done = isDateFieldDone(key, job.status);
        todayLines.push(`${done ? "✅" : "⏳"} ${jobLabel}`);
      } else if (date >= tomorrow.start && date < tomorrow.end) {
        tomorrowLines.push(jobLabel);
      }
    }
  }

  function formatSection(title: string, lines: string[]) {
    if (lines.length === 0) return `${title}\nไม่มีงานครบกำหนด`;
    const shown = lines.slice(0, MAX_LINES_PER_SECTION);
    const extra = lines.length - shown.length;
    return [
      title,
      ...shown,
      ...(extra > 0 ? [`+ อีก ${extra} รายการ`] : []),
    ].join("\n");
  }

  const body = [
    formatSection("วันนี้:", todayLines),
    formatSection("พรุ่งนี้:", tomorrowLines),
  ].join("\n\n");

  await notifyAllUsers({
    title: "สรุปงานประจำวัน",
    body,
    url: "/calendar",
  });

  return NextResponse.json({ ok: true, today: todayLines.length, tomorrow: tomorrowLines.length });
}
