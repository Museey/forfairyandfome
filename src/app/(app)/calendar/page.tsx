import Link from "next/link";
import { ChevronLeft, ChevronRight, LogIn, LogOut } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import {
  dateKey,
  getMonthGrid,
  THAI_MONTHS_FULL,
  THAI_WEEKDAYS_SHORT,
} from "@/lib/calendar-grid";
import { buildEventsByDay } from "@/lib/calendar-events";

export default async function CalendarPage({
  searchParams,
}: PageProps<"/calendar">) {
  const sp = await searchParams;
  const today = new Date();
  const year = Number(sp.y) || today.getFullYear();
  const month = sp.m ? Number(sp.m) - 1 : today.getMonth();
  const selectedDay = typeof sp.d === "string" ? sp.d : dateKey(today);

  const grid = getMonthGrid(year, month);
  const gridStart = grid[0];
  const gridEnd = grid[grid.length - 1];

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
      where: { occurredAt: { gte: gridStart, lte: gridEnd }, jobId: { not: null } },
      include: { user: true, job: true },
      orderBy: { occurredAt: "asc" },
    }),
  ]);

  const jobCheckEvents = checkEvents.filter(
    (e): e is typeof e & { jobId: string; job: NonNullable<typeof e.job> } =>
      e.job !== null,
  );
  const eventsByDay = buildEventsByDay(jobs, jobCheckEvents);

  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);
  const todayKey = dateKey(today);
  const selectedEvents = eventsByDay.get(selectedDay) ?? [];

  return (
    <div className="flex flex-1 flex-col gap-4 pt-2 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {THAI_MONTHS_FULL[month]} {year + 543}
        </h1>
        <div className="flex items-center gap-1">
          <Link
            href={`/calendar?y=${prevMonth.getFullYear()}&m=${prevMonth.getMonth() + 1}`}
            className="rounded-full p-2 text-text-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <Link
            href={`/calendar?y=${nextMonth.getFullYear()}&m=${nextMonth.getMonth() + 1}`}
            className="rounded-full p-2 text-text-muted"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] text-text-faint">
        {THAI_WEEKDAYS_SHORT.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {grid.map((date) => {
          const key = dateKey(date);
          const inMonth = date.getMonth() === month;
          const isToday = key === todayKey;
          const isSelected = key === selectedDay;
          const dayEvents = eventsByDay.get(key) ?? [];
          const dotColors = [...new Set(dayEvents.map((e) => e.color))].slice(0, 4);

          return (
            <Link
              key={key}
              href={`/calendar?y=${year}&m=${month + 1}&d=${key}`}
              className="flex flex-col items-center gap-1 py-1"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs",
                  !inMonth && "text-text-faint/40",
                  inMonth && !isSelected && "text-text",
                  isSelected && "bg-teal text-bg font-semibold",
                  !isSelected && isToday && "border border-teal text-teal",
                )}
              >
                {date.getDate()}
              </span>
              <span className="flex h-1.5 gap-0.5">
                {dotColors.map((c) => (
                  <span
                    key={c}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-2 flex flex-col gap-2.5">
        <h2 className="text-sm font-medium text-text-muted">
          {selectedDay === todayKey ? "วันนี้" : selectedDay}
        </h2>

        {selectedEvents.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-faint">
            ไม่มีนัดหมายในวันนี้
          </p>
        ) : (
          selectedEvents.map((event, i) => (
            <Link
              key={i}
              href={`/jobs/${event.jobId}`}
              className="flex items-center gap-3 rounded-card border border-border bg-card p-3"
            >
              {event.icon ? (
                event.icon === "in" ? (
                  <LogIn className="h-4 w-4 shrink-0" style={{ color: event.color }} />
                ) : (
                  <LogOut className="h-4 w-4 shrink-0" style={{ color: event.color }} />
                )
              ) : (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm">{event.jobTitle}</p>
                <p className="text-xs text-text-faint">{event.label}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
