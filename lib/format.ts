const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹1,24,500 — Indian grouping, glyph with no space (DESIGN §2.2). */
export function formatINR(value: number): string {
  return `₹${inr.format(Math.round(value))}`;
}

/** 1.2K · 2.4L · 1.1Cr — Indian short form for counts. */
export function formatCompactIN(n: number): string {
  if (n >= 1_00_00_000) return `${trim(n / 1_00_00_000)}Cr`;
  if (n >= 1_00_000) return `${trim(n / 1_00_000)}L`;
  if (n >= 1_000) return `${trim(n / 1_000)}K`;
  return String(n);
}

function trim(x: number) {
  return x >= 10 ? Math.round(x).toString() : (Math.round(x * 10) / 10).toString();
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(100, Math.round((km * 1000) / 50) * 50)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** 98XXXX4521 */
export function maskMobile(mobile: string): string {
  const d = mobile.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `${d.slice(0, 2)}XXXX${d.slice(6)}` : mobile;
}

export function discountPct(mrp?: number, price?: number): number | undefined {
  if (!mrp || !price || price >= mrp) return undefined;
  return Math.round(((mrp - price) / mrp) * 100);
}

/** Hinglish relative time: "abhi", "12 min pehle", "3 din pehle". */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "abhi";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min pehle`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ghante pehle`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} din pehle`;
  const mo = Math.round(d / 30);
  return `${mo} mahine pehle`;
}

/** "Sirf 3 din baaki" style countdown; undefined if expired/no date. */
export function daysLeft(iso?: string, now = Date.now()): number | undefined {
  if (!iso) return undefined;
  const d = Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
  return d >= 0 ? d : undefined;
}

export const MOBILE_RE = /^[6-9]\d{9}$/;
export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
