/** Parse "Mon–Sat · 10 am–9:30 pm" / "Daily · 7 am–10 pm" / "Tue–Sun · …" → open-now status. */
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function toMinutes(t: string): number | undefined {
  const m = t.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!m) return undefined;
  let h = Number(m[1]) % 12;
  if (m[3] === "pm") h += 12;
  return h * 60 + Number(m[2] ?? 0);
}

export function openStatus(hours: string, now = new Date()): { open: boolean; label: string } {
  const [daysPart, timePart] = hours.split("·").map((s) => s.trim());
  if (!timePart) return { open: true, label: hours };
  const today = now.getDay();
  let dayOk = true;
  const range = daysPart.toLowerCase().match(/^(\w{3})\s*[–-]\s*(\w{3})$/);
  if (range) {
    const a = DAYS.indexOf(range[1]);
    const b = DAYS.indexOf(range[2]);
    dayOk = a <= b ? today >= a && today <= b : today >= a || today <= b;
  }
  const [from, to] = timePart.split(/[–-]/).map((s) => toMinutes(s));
  if (from == null || to == null) return { open: dayOk, label: timePart };
  const mins = now.getHours() * 60 + now.getMinutes();
  const open = dayOk && mins >= from && mins < to;
  const closeLabel = timePart.split(/[–-]/)[1]?.trim();
  const openLabel = timePart.split(/[–-]/)[0]?.trim();
  return open ? { open, label: `Khula hai · ${closeLabel} tak` } : { open, label: dayOk && mins < from ? `Band · ${openLabel} khulega` : "Band · kal khulega" };
}
