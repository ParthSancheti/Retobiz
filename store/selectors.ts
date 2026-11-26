/**
 * Pure derivations (IMPLEMENTATION_PLAN §3.4). Call inside useMemo with raw slices.
 */
import type { AgencyStatus, Category, ID, Location, Offer, QrOrderStatus, Shop, SubCategory } from "@/lib/types";
import { haversineKm } from "@/lib/geo";
import { daysLeft } from "@/lib/format";
import type { StoreState } from "./index";
import { countLiveOffers, FREE_OFFER_LIMIT } from "./index";

/* ─────────────────────────── Locations ─────────────────────────── */

export function locationById(locations: Location[]) {
  return Object.fromEntries(locations.map((l) => [l.id, l])) as Record<ID, Location>;
}

/** All area ids under a state/district/city/area id. */
export function areaIdsUnder(locations: Location[], rootId: ID): Set<ID> {
  const children = new Map<ID, ID[]>();
  for (const l of locations) if (l.parentId) children.set(l.parentId, [...(children.get(l.parentId) ?? []), l.id]);
  const out = new Set<ID>();
  const walk = (id: ID) => {
    const node = locations.find((l) => l.id === id);
    if (node?.level === "area") out.add(id);
    (children.get(id) ?? []).forEach(walk);
  };
  walk(rootId);
  return out;
}

/** "Akurdi, Pune (PCMC)" */
export function areaLabel(locations: Location[], areaId: ID): string {
  const byId = locationById(locations);
  const area = byId[areaId];
  const city = area?.parentId ? byId[area.parentId] : undefined;
  return [area?.name, city?.name].filter(Boolean).join(", ");
}

/* ─────────────────────────── Search engine ─────────────────────────── */

export interface DiscoveryFilters {
  q?: string;
  categoryId?: ID;
  subCategoryId?: ID;
  /** Any of state/district/city/area id — narrowest wins. */
  locationId?: ID;
  /** Radius search centred on this area's centroid. */
  originAreaId?: ID;
  radiusKm?: number;
  minDiscount?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  hasActiveOffers?: boolean;
  shopId?: ID;
  kind?: Offer["kind"];
  sort?: "relevance" | "nearest" | "discount" | "newest" | "ending";
}

/** Hinglish → catalogue synonyms so "chappal" finds Footwear etc. */
const SYNONYMS: Record<string, string[]> = {
  chappal: ["footwear", "sandals", "kolhapuri"],
  joote: ["footwear", "shoes"],
  dawai: ["medical", "medicines", "chemist"],
  dawa: ["medical", "medicines"],
  mithai: ["mithai", "sweets", "bakery", "kaju", "ladoo"],
  sweets: ["mithai"],
  parlour: ["salon"],
  parlor: ["salon"],
  kapde: ["saree", "readymade", "kurti"],
  sari: ["saree"],
  kirana: ["kirana", "grocery", "combo", "dal", "masala"],
  grocery: ["kirana"],
  masala: ["masale", "spices"],
  bulb: ["led", "lighting"],
  bijli: ["electricals", "electrical"],
  phone: ["mobile"],
  chudi: ["bangles"],
  bangdi: ["bangles"],
  jhumka: ["earrings", "jhumkas"],
  copy: ["notebook", "stationery"],
  vahi: ["notebook"],
};

function tokens(q: string): string[] {
  const base = q.toLowerCase().replace(/[^a-z0-9₹\s]/g, " ").split(/\s+/).filter((t) => t.length > 1);
  return [...new Set(base.flatMap((t) => [t, ...(SYNONYMS[t] ?? [])]))];
}

function scoreText(hay: string, toks: string[]): number {
  if (!toks.length) return 1;
  const h = hay.toLowerCase();
  let score = 0;
  for (const t of toks) if (h.includes(t)) score += t.length > 3 ? 2 : 1;
  return score;
}

export interface DiscoveryContext {
  shops: Record<ID, Shop>;
  offers: Record<ID, Offer>;
  categories: Category[];
  subCategories: SubCategory[];
  locations: Location[];
}

function shopDistanceKm(ctx: DiscoveryContext, shop: Shop, originAreaId?: ID) {
  if (!originAreaId) return undefined;
  const origin = ctx.locations.find((l) => l.id === originAreaId);
  if (origin?.lat == null || origin.lng == null) return undefined;
  return haversineKm({ lat: origin.lat, lng: origin.lng }, shop.geo);
}

function baseShopPass(ctx: DiscoveryContext, shop: Shop, f: DiscoveryFilters, areaSet?: Set<ID>) {
  const cat = ctx.categories.find((c) => c.id === shop.categoryId);
  if (cat && !cat.active) return false;
  if (shop.verification.status === "suspended" || shop.verification.status === "rejected") return false;
  if (f.shopId && shop.id !== f.shopId) return false;
  if (f.verifiedOnly && !shop.isVerified) return false;
  if (areaSet && !areaSet.has(shop.areaId)) return false;
  if (f.radiusKm != null) {
    const d = shopDistanceKm(ctx, shop, f.originAreaId);
    if (d != null && d > f.radiusKm) return false;
  }
  return true;
}

export interface ShopResult {
  shop: Shop;
  distanceKm?: number;
  liveOfferCount: number;
  bestDiscount?: number;
  score: number;
}

export function searchShops(ctx: DiscoveryContext, f: DiscoveryFilters): ShopResult[] {
  const toks = tokens(f.q ?? "");
  const areaSet = f.locationId ? areaIdsUnder(ctx.locations, f.locationId) : undefined;
  const offersByShop = new Map<ID, Offer[]>();
  for (const o of Object.values(ctx.offers)) {
    if (o.status !== "live" || (o.validTill && daysLeft(o.validTill) === undefined)) continue;
    offersByShop.set(o.shopId, [...(offersByShop.get(o.shopId) ?? []), o]);
  }
  const out: ShopResult[] = [];
  for (const shop of Object.values(ctx.shops)) {
    if (!baseShopPass(ctx, shop, f, areaSet)) continue;
    if (f.categoryId && shop.categoryId !== f.categoryId) continue;
    if (f.subCategoryId && !shop.subCategoryIds.includes(f.subCategoryId)) continue;
    const live = (offersByShop.get(shop.id) ?? []).filter((o) => o.kind === "offer");
    if (f.hasActiveOffers && live.length === 0) continue;
    const bestDiscount = Math.max(0, ...(offersByShop.get(shop.id) ?? []).map((o) => o.discountPct ?? 0)) || undefined;
    if (f.minDiscount && (bestDiscount ?? 0) < f.minDiscount) continue;
    const cat = ctx.categories.find((c) => c.id === shop.categoryId);
    const subs = ctx.subCategories.filter((s) => shop.subCategoryIds.includes(s.id)).map((s) => s.name);
    const area = ctx.locations.find((l) => l.id === shop.areaId)?.name ?? "";
    const offerText = (offersByShop.get(shop.id) ?? []).map((o) => o.title).join(" ");
    const score = scoreText(`${shop.name} ${shop.tagline ?? ""} ${cat?.name ?? ""} ${subs.join(" ")} ${area} ${offerText}`, toks);
    if (toks.length && score === 0) continue;
    out.push({ shop, distanceKm: shopDistanceKm(ctx, shop, f.originAreaId), liveOfferCount: live.length, bestDiscount, score });
  }
  return sortResults(out, f.sort, (r) => ({ d: r.distanceKm, disc: r.bestDiscount, at: r.shop.createdAt, score: r.score + (r.shop.isVerified ? 0.5 : 0) }));
}

export interface OfferResult {
  offer: Offer;
  shop: Shop;
  distanceKm?: number;
  score: number;
}

export function searchOffers(ctx: DiscoveryContext, f: DiscoveryFilters): OfferResult[] {
  const toks = tokens(f.q ?? "");
  const areaSet = f.locationId ? areaIdsUnder(ctx.locations, f.locationId) : undefined;
  const out: OfferResult[] = [];
  for (const offer of Object.values(ctx.offers)) {
    if (offer.status !== "live") continue;
    if (offer.validTill && daysLeft(offer.validTill) === undefined) continue;
    if (f.kind && offer.kind !== f.kind) continue;
    const shop = ctx.shops[offer.shopId];
    if (!shop || !baseShopPass(ctx, shop, f, areaSet)) continue;
    if (f.categoryId && offer.categoryId !== f.categoryId) continue;
    if (f.subCategoryId && offer.subCategoryId !== f.subCategoryId) continue;
    if (f.minDiscount && (offer.discountPct ?? 0) < f.minDiscount) continue;
    if (f.maxPrice && (offer.price == null || offer.price > f.maxPrice)) continue;
    const sub = ctx.subCategories.find((s) => s.id === offer.subCategoryId);
    if (sub && !sub.active) continue;
    const cat = ctx.categories.find((c) => c.id === offer.categoryId);
    const score = scoreText(`${offer.title} ${offer.description ?? ""} ${sub?.name ?? ""} ${cat?.name ?? ""} ${shop.name}`, toks);
    if (toks.length && score === 0) continue;
    out.push({ offer, shop, distanceKm: shopDistanceKm(ctx, shop, f.originAreaId), score });
  }
  return sortResults(out, f.sort, (r) => ({
    d: r.distanceKm,
    disc: r.offer.discountPct,
    at: r.offer.createdAt,
    end: r.offer.validTill,
    score: r.score + (r.offer.kind === "offer" ? 0.5 : 0) + (r.shop.isVerified ? 0.3 : 0),
  }));
}

function sortResults<T>(
  arr: T[],
  sort: DiscoveryFilters["sort"],
  key: (t: T) => { d?: number; disc?: number; at: string; end?: string; score: number },
): T[] {
  const s = sort ?? "relevance";
  return [...arr].sort((a, b) => {
    const A = key(a);
    const B = key(b);
    switch (s) {
      case "nearest":
        return (A.d ?? 1e9) - (B.d ?? 1e9);
      case "discount":
        return (B.disc ?? 0) - (A.disc ?? 0);
      case "newest":
        return B.at.localeCompare(A.at);
      case "ending":
        return (A.end ?? "9999").localeCompare(B.end ?? "9999");
      default:
        return B.score - A.score || (A.d ?? 1e9) - (B.d ?? 1e9);
    }
  });
}

/* ─────────────────────────── Shop helpers ─────────────────────────── */

export function followerCount(shop: Shop): number {
  return shop.followerBase + shop.followerIds.length;
}

export function liveOffersFor(offers: Record<ID, Offer>, shopId: ID, kind?: Offer["kind"]): Offer[] {
  return Object.values(offers)
    .filter((o) => o.shopId === shopId && o.status === "live" && (!kind || o.kind === kind))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ─────────────────────────── Merchant dashboard ─────────────────────────── */

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  href: string;
}

export function merchantDashboard(s: Pick<StoreState, "shops" | "offers" | "customers" | "qrOrders" | "reels">, shopId: ID) {
  const shop = s.shops[shopId];
  if (!shop) return null;
  const liveOffers = countLiveOffers(s.offers, shopId, "offer");
  const products = countLiveOffers(s.offers, shopId, "product");
  const customers = Object.values(s.customers).filter((c) => c.shopId === shopId);
  const weekAgo = Date.now() - 7 * 86_400_000;
  const newFollowers7d = customers.filter((c) => c.source !== "manual" && Date.parse(c.joinedAt) > weekAgo).length;
  const hasStandee = Object.values(s.qrOrders).some((o) => o.shopId === shopId);
  const checklist: ChecklistItem[] = [
    { key: "profile", label: "Dukaan ki details & timing", done: !!shop.hours && !!shop.address, href: "/merchant/profile" },
    { key: "featured", label: "3+ showroom items daalein", done: products >= 3, href: "/merchant/offers/new" },
    { key: "offer", label: "Pehla offer post karein", done: liveOffers >= 1, href: "/merchant/offers/new" },
    { key: "verify", label: "GST / Google verification", done: shop.isVerified, href: "/merchant/profile" },
    { key: "standee", label: "Counter QR standee lagaayein", done: hasStandee, href: "/merchant/qr-standee" },
    { key: "first-customer", label: "Pehla customer opt-in", done: customers.length > 0, href: "/merchant/qr-standee" },
  ];
  return {
    shop,
    liveOffers,
    freeOfferLimit: FREE_OFFER_LIMIT,
    products,
    followers: followerCount(shop),
    customers: customers.length,
    newFollowers7d,
    checklist,
    completion: Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100),
    reels: Object.values(s.reels).filter((r) => r.shopId === shopId).length,
  };
}

/* ─────────────────────────── Admin KPIs ─────────────────────────── */

export function adminKpis(
  s: Pick<StoreState, "shops" | "offers" | "customers" | "agencyRequests" | "qrOrders" | "referralEntries">,
) {
  const shops = Object.values(s.shops);
  const weekAgo = Date.now() - 7 * 86_400_000;
  const pipeline: Record<AgencyStatus, number> = { new: 0, creator_assigned: 0, in_review: 0, delivered: 0 };
  Object.values(s.agencyRequests).forEach((r) => pipeline[r.status]++);
  const qr: Record<QrOrderStatus, number> = { placed: 0, printed: 0, dispatched: 0, delivered: 0 };
  Object.values(s.qrOrders).forEach((o) => qr[o.status]++);
  return {
    shopsTotal: shops.length,
    shopsVerified: shops.filter((x) => x.isVerified).length,
    shopsPending: shops.filter((x) => x.verification.status === "pending").length,
    proShops: shops.filter((x) => x.plan === "pro").length,
    liveOffers: Object.values(s.offers).filter((o) => o.status === "live" && o.kind === "offer").length,
    optIns7d: Object.values(s.customers).filter((c) => c.source !== "manual" && Date.parse(c.joinedAt) > weekAgo).length,
    pipeline,
    qr,
    qrRevenue: Object.values(s.qrOrders).length * 49,
    agencyRevenue: Object.values(s.agencyRequests).reduce((a, r) => a + r.pricing.charged, 0),
    referralPayout: s.referralEntries.reduce((a, r) => a + r.commission, 0),
  };
}
