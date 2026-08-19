export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Local-calendar-day key (YYYY-MM-DD), NOT UTC — use with parseDateKey to round-trip safely. */
export function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a dateKey() string back into a local-midnight Date (avoids the UTC-midnight shift `new Date("YYYY-MM-DD")` causes). */
export function parseDateKey(key: string) {
  return new Date(`${key}T00:00:00`);
}

const shortDay = new Intl.DateTimeFormat("th-TH", { weekday: "short" });
export function shortThaiWeekday(date: Date) {
  return shortDay.format(date);
}
