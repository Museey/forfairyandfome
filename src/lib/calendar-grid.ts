import { bangkokDateKey } from "@/lib/timezone";

// Bangkok-explicit rather than local accessors: real timestamps (e.g. check-in
// events) need the Bangkok calendar day regardless of server ambient timezone.
// Grid cells built from Date.UTC-anchored or local `new Date(y,m,d)` values are
// unaffected since Bangkok is always ahead of UTC within the same day.
export function dateKey(date: Date) {
  return bangkokDateKey(date);
}

/** Returns a 42-cell (6 week) grid of dates for the given month, including
 * leading/trailing days from adjacent months so every row is a full week
 * (Sunday-start). */
export function getMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export const THAI_WEEKDAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
