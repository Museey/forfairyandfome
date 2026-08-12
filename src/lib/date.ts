import { APP_TIME_ZONE, isSameBangkokDay } from "@/lib/timezone";

const APP_DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  calendar: "gregory",
  timeZone: APP_TIME_ZONE,
});

const APP_DATE_SHORT_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  calendar: "gregory",
  timeZone: APP_TIME_ZONE,
});

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return APP_DATE_FORMATTER.format(d);
}

export function formatDateShort(date: Date | string | null | undefined) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return APP_DATE_SHORT_FORMATTER.format(d);
}

export function toDateInputValue(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

const APP_TIME_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: APP_TIME_ZONE,
});

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  const prefix = isSameBangkokDay(d, today)
    ? "วันนี้"
    : APP_DATE_SHORT_FORMATTER.format(d);
  return `${prefix} · ${APP_TIME_FORMATTER.format(d)}`;
}

export function formatTime(date: Date | string | null | undefined) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return APP_TIME_FORMATTER.format(d);
}
