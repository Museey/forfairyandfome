import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUsersByRole } from "@/lib/push";
import { JOB_DATE_FIELDS, isDateFieldDone } from "@/lib/job-dates";
import { bangkokDayRange } from "@/lib/timezone";

const MAX_LINES = 8;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { start, end } = bangkokDayRange(0);

  const jobs = await prisma.job.findMany({
    where: {
      OR: JOB_DATE_FIELDS.map(({ key }) => ({
        [key]: { gte: start, lt: end },
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

  const lines: string[] = [];

  for (const job of jobs) {
    for (const { key, label } of JOB_DATE_FIELDS) {
      const date = job[key];
      if (!date || date < start || date >= end) continue;
      if (isDateFieldDone(key, job.status)) continue;
      lines.push(`${job.brandName} · ${job.title} (${label})`);
    }
  }

  if (lines.length > 0) {
    const shown = lines.slice(0, MAX_LINES);
    const extra = lines.length - shown.length;
    const body = [...shown, ...(extra > 0 ? [`+ อีก ${extra} รายการ`] : [])].join("\n");

    await notifyUsersByRole("CREATOR", {
      title: "งานที่ต้องทำวันนี้",
      body,
      url: "/",
    });
  }

  return NextResponse.json({ ok: true, count: lines.length });
}
