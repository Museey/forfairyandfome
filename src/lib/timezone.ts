// Every user is in Thailand, so the app always reasons in Bangkok time —
// explicitly, via Intl's timeZone option, rather than the server process's
// ambient timezone. Vercel reserves the TZ env var (can't be set from the
// dashboard) and mutating process.env.TZ at runtime isn't reliably honored
// by Node's Date/Intl internals on Vercel's runtime, so nothing here may
// depend on the server "thinking" it's in any particular timezone.
export const APP_TIME_ZONE = "Asia/Bangkok";

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

const BANGKOK_DATE_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" for the given instant, as seen in Bangkok. */
export function bangkokDateKey(date: Date) {
  return BANGKOK_DATE_KEY_FORMATTER.format(date);
}

export function isSameBangkokDay(a: Date, b: Date) {
  return bangkokDateKey(a) === bangkokDateKey(b);
}

/** The UTC instant that is midnight in Bangkok, `offsetDays` from `from`'s Bangkok date. */
export function bangkokMidnight(offsetDays = 0, from: Date = new Date()) {
  const [y, m, d] = bangkokDateKey(from).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + offsetDays) - BANGKOK_OFFSET_MS);
}

/** [start, end) instants spanning one Bangkok calendar day, `offsetDays` from today. */
export function bangkokDayRange(offsetDays = 0, from: Date = new Date()) {
  return {
    start: bangkokMidnight(offsetDays, from),
    end: bangkokMidnight(offsetDays + 1, from),
  };
}

/** [start, end) instants spanning one Bangkok calendar month (month is 1-12). */
export function bangkokMonthRange(year: number, month: number) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1) - BANGKOK_OFFSET_MS),
    end: new Date(Date.UTC(year, month, 1) - BANGKOK_OFFSET_MS),
  };
}

const BANGKOK_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "HH:MM" for the given instant, as seen in Bangkok. */
export function bangkokTimeKey(date: Date) {
  return BANGKOK_TIME_FORMATTER.format(date);
}

/** The year and 1-12 month the given instant falls in, in Bangkok. */
export function bangkokYearMonth(date: Date) {
  const [year, month] = bangkokDateKey(date).split("-").map(Number);
  return { year, month };
}
