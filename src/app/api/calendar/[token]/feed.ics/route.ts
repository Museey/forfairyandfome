import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildIcsFeed } from "@/lib/ics-feed";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/calendar/[token]/feed.ics">,
) {
  const { token } = await params;

  const calendarToken = await prisma.calendarToken.findUnique({ where: { token } });
  if (!calendarToken) {
    return NextResponse.json({ error: "invalid token" }, { status: 404 });
  }

  const [jobs, checkEvents] = await Promise.all([
    prisma.job.findMany({
      select: {
        id: true,
        title: true,
        brandName: true,
        storylineSendDate: true,
        shootDate: true,
        draftSendDate: true,
        postDate: true,
      },
    }),
    prisma.checkEvent.findMany({
      where: { jobId: { not: null } },
      include: { user: true, job: true },
      orderBy: { occurredAt: "desc" },
      take: 200,
    }),
  ]);

  const jobCheckEvents = checkEvents.filter(
    (e): e is typeof e & { jobId: string; job: NonNullable<typeof e.job> } =>
      e.job !== null,
  );
  const ics = buildIcsFeed(jobs, jobCheckEvents);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="fairy-and-Fome.ics"',
      "Cache-Control": "private, max-age=1800",
    },
  });
}
