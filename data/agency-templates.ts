import type { AgencyPaidWith, AgencyTemplateKey, Plan } from "@/lib/types";

// IMPLEMENTATION_PLAN §4 B5 — locked pricing.
export const PRO_MONTHLY_CREDITS = 2;
export const PRO_DISCOUNT = 0.4;
export const PRO_PRICE_YEARLY = 999;

export interface AgencyTemplate {
  key: AgencyTemplateKey;
  name: string;
  blurb: string;
  listPrice: number;
  turnaround: string;
}

export const AGENCY_TEMPLATES: AgencyTemplate[] = [
  { key: "ai-promo-reel", name: "AI Promo Reel", blurb: "15-sec reel from your offer photos, music aur captions ke saath", listPrice: 299, turnaround: "24 ghante" },
  { key: "ugc-video", name: "Local Creator UGC Video", blurb: "Aapke area ka creator dukaan aakar honest review shoot karega", listPrice: 1499, turnaround: "3–4 din" },
  { key: "brand-collab", name: "Brand Collab Video", blurb: "Aapke top brand ke saath co-branded promo video", listPrice: 2499, turnaround: "5–7 din" },
  { key: "festival-poster", name: "Festival Offer Poster", blurb: "Festival-ready poster, WhatsApp status aur print dono ke liye", listPrice: 199, turnaround: "12 ghante" },
  { key: "shop-tour-reel", name: "Shop Tour Reel", blurb: "Dukaan ka 30-sec walkthrough — counter se showroom tak", listPrice: 799, turnaround: "2 din" },
  { key: "whatsapp-banner", name: "WhatsApp Flash Banner", blurb: "Flash sale banner jo broadcast mein turant bheja ja sake", listPrice: 149, turnaround: "6 ghante" },
  { key: "google-review-card", name: "Google Review Booster Card", blurb: "Counter card + QR jo customers se Google review maange", listPrice: 99, turnaround: "6 ghante" },
];

export const TEMPLATE_BY_KEY = Object.fromEntries(AGENCY_TEMPLATES.map((t) => [t.key, t])) as Record<
  AgencyTemplateKey,
  AgencyTemplate
>;

export function proPrice(listPrice: number): number {
  return Math.round(listPrice * (1 - PRO_DISCOUNT));
}

export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Credit first, then 40% off for Pro; list price add-on for Free. */
export function resolveAgencyPrice(
  listPrice: number,
  plan: Plan,
  creditsUsedThisMonth: number,
): { charged: number; paidWith: AgencyPaidWith } {
  if (plan === "pro") {
    if (creditsUsedThisMonth < PRO_MONTHLY_CREDITS) return { charged: 0, paidWith: "credit" };
    return { charged: proPrice(listPrice), paidWith: "pro_discount" };
  }
  return { charged: listPrice, paidWith: "addon" };
}

export const LOCAL_CREATORS = [
  { name: "Sneha Kulkarni", handle: "@puneri.sneha" },
  { name: "Rohit Jadhav", handle: "@akurdi_eats" },
  { name: "Ayesha Shaikh", handle: "@malegaon.style" },
  { name: "Omkar Deshmukh", handle: "@nashik.ki.galiyan" },
  { name: "Pooja Bhosale", handle: "@pcmc.shopping.diaries" },
];

export const REFERRAL_COMMISSION = { signup: 50, verified: 50, pro_upgrade: 200, standee_order: 10 } as const;
