export type JobDates = {
  storylineSendDate: Date | null;
  shootDate: Date | null;
  draftSendDate: Date | null;
  postDate: Date | null;
};

export const JOB_DATE_FIELDS: {
  key: keyof JobDates;
  label: string;
}[] = [
  { key: "storylineSendDate", label: "ส่ง Storyline" },
  { key: "shootDate", label: "ถ่ายงาน" },
  { key: "draftSendDate", label: "ส่ง Draft" },
  { key: "postDate", label: "โพสต์งาน" },
];

export function nextMilestone(job: JobDates) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const candidates = JOB_DATE_FIELDS.map(({ key, label }) => {
    const date = job[key];
    return date ? { key, label, date } : null;
  }).filter((v): v is { key: keyof JobDates; label: string; date: Date } => !!v);

  if (candidates.length === 0) return null;

  const upcoming = candidates
    .filter((c) => c.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (upcoming.length > 0) return upcoming[0];

  return candidates.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
}
