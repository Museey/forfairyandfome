import Link from "next/link";
import { CalendarClock, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/job-card";
import { AttendanceStatus } from "@/components/attendance-status";
import { Composer } from "@/components/timeline/composer";
import { PostItem } from "@/components/timeline/post-item";
import { groupFeedRows } from "@/lib/feed";
import { addReminder, deleteReminder } from "@/app/(app)/reminder-actions";
import { requireCurrentUser } from "@/lib/auth";
import {
  JOB_STATUS_ORDER,
  JOB_STATUS_SHORT_LABEL,
  JOB_STATUS_COLOR,
} from "@/lib/job-status";
import { dateKey } from "@/lib/calendar-grid";
import { buildEventsByDay } from "@/lib/calendar-events";

export default async function TodayPage() {
  const currentUser = await requireCurrentUser();
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const [jobs, statusCounts, allJobsWithDates, todayJobCheckEvents, manager, reminders] =
    await Promise.all([
      prisma.job.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
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
      prisma.user.findFirst({ where: { role: "MANAGER" } }),
      prisma.reminder.findMany({
        include: { author: true },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      }),
    ]);

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

  const reminderFeed = groupFeedRows(
    reminders.map((r) => ({
      id: r.id,
      groupId: r.groupId,
      type: r.type,
      body: r.content,
      attachmentUrl: r.type === "LINK" ? null : r.fileUrl,
      linkUrl: r.type === "LINK" ? r.fileUrl : null,
      createdAt: r.createdAt,
      author: r.author,
    })),
  );

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2">
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

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-text-muted">เตือนความจำ</h2>
        <Composer
          action={addReminder}
          placeholder="ฝากเตือนความจำ (text / รูป / ไฟล์ / ลิงก์)"
        />
        {reminderFeed.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {reminderFeed.map((item) => (
              <PostItem key={item.id} item={item} onDelete={deleteReminder} />
            ))}
          </div>
        )}
      </section>

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

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
        {JOB_STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={`/jobs?status=${s}`}
            className="flex shrink-0 flex-col items-center gap-1 rounded-2xl border border-border bg-card px-4 py-2.5"
          >
            <span
              className="text-lg font-semibold"
              style={{ color: JOB_STATUS_COLOR[s] }}
            >
              {countMap.get(s) ?? 0}
            </span>
            <span className="text-[11px] text-text-faint">
              {JOB_STATUS_SHORT_LABEL[s]}
            </span>
          </Link>
        ))}
      </div>

      <section className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-muted">
            งานล่าสุด
          </h2>
          <Link href="/jobs" className="text-xs text-teal">
            ดูทั้งหมด
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center text-text-faint">
            <p>ยังไม่มีงาน — เริ่มสร้างงานแรกกันเลย</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
