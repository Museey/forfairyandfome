import Link from "next/link";
import { CalendarClock, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { AttendanceStatus } from "@/components/attendance-status";
import { groupFeedRows, type RawFeedRow } from "@/lib/feed";
import { ReminderCard, TopicCard } from "@/components/board/board-card";
import {
  addContent,
  addReminder,
  addSlip,
  deleteBoardPost,
} from "@/app/(app)/board-actions";
import { requireCurrentUser } from "@/lib/auth";
import { canPostToTopic } from "@/lib/board";
import { JOB_STATUS_ORDER } from "@/lib/job-status";
import { dateKey } from "@/lib/calendar-grid";
import { buildEventsByDay } from "@/lib/calendar-events";
import { bangkokDayRange } from "@/lib/timezone";
import type { BoardTopic } from "@/generated/prisma/enums";

type BoardRow = {
  id: string;
  topic: BoardTopic;
  groupId: string | null;
  authorId: string;
  type: string;
  content: string | null;
  fileUrl: string | null;
  createdAt: Date;
  author: { name: string; colorTag: string };
};

function toFeedRow(row: BoardRow): RawFeedRow {
  return {
    id: row.id,
    groupId: row.groupId,
    type: row.type,
    body: row.content,
    attachmentUrl: row.type === "LINK" ? null : row.fileUrl,
    linkUrl: row.type === "LINK" ? row.fileUrl : null,
    createdAt: row.createdAt,
    author: row.author,
  };
}

export default async function TodayPage() {
  const currentUser = await requireCurrentUser();
  const today = new Date();
  const { start: todayStart, end: todayEnd } = bangkokDayRange(0, today);

  const [
    statusCounts,
    allJobsWithDates,
    todayJobCheckEvents,
    users,
    boardPosts,
  ] = await Promise.all([
    prisma.job.groupBy({ by: ["status"], _count: true }),
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
    prisma.user.findMany(),
    prisma.boardPost.findMany({
      include: { author: true },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    }),
  ]);

  const manager = users.find((u) => u.role === "MANAGER") ?? null;
  const otherUser = users.find((u) => u.id !== currentUser.id) ?? null;
  const otherUserName = otherUser?.name ?? "-";

  const managerTodayEvents = manager
    ? await prisma.checkEvent.findMany({
        where: {
          userId: manager.id,
          occurredAt: { gte: todayStart, lt: todayEnd },
        },
        orderBy: { occurredAt: "asc" },
      })
    : [];
  const lastManagerEvent = managerTodayEvents.at(-1) ?? null;

  const countMap = new Map(statusCounts.map((s) => [s.status, s._count]));
  const activeCount = JOB_STATUS_ORDER.filter((s) => s !== "PAID").reduce(
    (sum, s) => sum + (countMap.get(s) ?? 0),
    0,
  );

  const jobCheckEvents = todayJobCheckEvents.filter(
    (e): e is typeof e & { jobId: string; job: NonNullable<typeof e.job> } =>
      e.job !== null,
  );
  const eventsByDay = buildEventsByDay(allJobsWithDates, jobCheckEvents);
  const todayEvents = eventsByDay.get(dateKey(today)) ?? [];

  const byTopic = (topic: BoardTopic) =>
    boardPosts.filter((p) => p.topic === topic);

  const reminders = byTopic("REMINDER");
  const myReminder = groupFeedRows(
    reminders.filter((r) => r.authorId === currentUser.id).map(toFeedRow),
  )[0];
  const theirReminder = otherUser
    ? groupFeedRows(
        reminders.filter((r) => r.authorId === otherUser.id).map(toFeedRow),
      )[0]
    : undefined;

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted">งานที่กำลังดำเนินการ</p>
          <p className="text-3xl font-semibold text-teal">{activeCount}</p>
        </div>
        <Link href="/jobs/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            งานใหม่
          </Button>
        </Link>
      </div>

      {manager && (
        <AttendanceStatus
          canToggle={currentUser.role === "MANAGER"}
          managerName={manager.name}
          isCheckedIn={lastManagerEvent?.type === "CHECK_IN"}
          lastEventAt={lastManagerEvent?.occurredAt ?? null}
        />
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-muted">วันนี้ต้องทำอะไรบ้าง</h2>
          <Link href="/calendar" className="text-xs text-teal">
            ดูปฏิทิน
          </Link>
        </div>
        {todayEvents.length === 0 ? (
          <div className="flex items-center gap-2 rounded-card border border-border bg-card px-4 py-3 text-sm text-text-faint">
            <CalendarClock className="h-4 w-4" />
            วันนี้ไม่มีนัดหมาย
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayEvents.map((event, i) => (
              <Link
                key={i}
                href={`/jobs/${event.jobId}`}
                className="flex items-center gap-3 rounded-card border border-border bg-card p-3"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm">{event.jobTitle}</p>
                  <p className="text-xs text-text-faint">{event.label}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <ReminderCard
        otherUserName={otherUserName}
        theirPost={theirReminder}
        myPost={myReminder}
        onPost={addReminder}
        onDelete={deleteBoardPost}
      />

      <TopicCard
        topic="CONTENT"
        canPost={canPostToTopic("CONTENT", currentUser.role)}
        counterpartName={otherUserName}
        posts={groupFeedRows(byTopic("CONTENT").map(toFeedRow))}
        onPost={addContent}
        onDelete={deleteBoardPost}
      />

      <TopicCard
        topic="SLIP"
        canPost={canPostToTopic("SLIP", currentUser.role)}
        counterpartName={otherUserName}
        posts={groupFeedRows(byTopic("SLIP").map(toFeedRow))}
        onPost={addSlip}
        onDelete={deleteBoardPost}
      />
    </div>
  );
}
