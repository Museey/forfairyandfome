import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dateKey } from "@/lib/calendar-grid";
import { buildEventsByDay } from "@/lib/calendar-events";
import { bangkokDayRange, bangkokMidnight } from "@/lib/timezone";
import { groupFeedRows } from "@/lib/feed";

// Read by the iOS home-screen widget (Scriptable), which can't hold a session
// cookie — it authenticates with the same per-user token as the calendar feed.
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/widget/[token]">,
) {
  const { token } = await params;

  const calendarToken = await prisma.calendarToken.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!calendarToken) {
    return NextResponse.json({ error: "invalid token" }, { status: 404 });
  }

  const today = new Date();
  const { start: todayStart, end: todayEnd } = bangkokDayRange(0, today);

  const [allJobsWithDates, todayJobCheckEvents, reminderRows] =
    await Promise.all([
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
        where: { occurredAt: { gte: todayStart, lt: todayEnd }, jobId: { not: null } },
        include: { user: true, job: true },
      }),
      // The reminder worth surfacing is the one the *other* person left.
      prisma.boardPost.findMany({
        where: { topic: "REMINDER", authorId: { not: calendarToken.userId } },
        include: { author: true },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      }),
    ]);

  const jobCheckEvents = todayJobCheckEvents.filter(
    (e): e is typeof e & { jobId: string; job: NonNullable<typeof e.job> } =>
      e.job !== null,
  );
  const eventsByDay = buildEventsByDay(allJobsWithDates, jobCheckEvents);
  const agendaFor = (date: Date) =>
    (eventsByDay.get(dateKey(date)) ?? []).map((event) => ({
      title: event.jobTitle,
      label: event.label,
      color: event.color,
    }));

  const latestReminder = groupFeedRows(
    reminderRows.map((r) => ({
      id: r.id,
      groupId: r.groupId,
      type: r.type,
      body: r.content,
      attachmentUrl: r.type === "LINK" ? null : r.fileUrl,
      linkUrl: r.type === "LINK" ? r.fileUrl : null,
      createdAt: r.createdAt,
      author: r.author,
    })),
  )[0];

  const reminder = latestReminder
    ? {
        from: latestReminder.author.name,
        text:
          latestReminder.body ??
          (latestReminder.attachments.length > 0
            ? `ส่ง ${latestReminder.attachments.length} ไฟล์แนบ`
            : ""),
      }
    : null;

  return NextResponse.json(
    {
      user: calendarToken.user.name,
      today: agendaFor(today),
      tomorrow: agendaFor(bangkokMidnight(1, today)),
      reminder,
      updatedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
