"use client";
/**
 * Single reactive store (IMPLEMENTATION_PLAN §3.2–3.3).
 * Zustand + immer + persist(localStorage). Cross-tab sync lives in store/sync.ts.
 *
 * Rule for components: select raw slices (`useStore(s => s.offers)`) and derive
 * lists with useMemo + the pure functions in store/selectors.ts. Never return a
 * freshly built array/object straight from a useStore selector.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type {
  ActivityEvent,
  ActivityType,
  AgencyRequest,
  AgencyStatus,
  AgencyTemplateKey,
  Broadcast,
  BuyerProfile,
  Category,
  Customer,
  CustomerSource,
  ID,
  InboxMessage,
  Lang,
  Location,
  Offer,
  OfferKind,
  Plan,
  QrOrder,
  QrOrderStatus,
  ReferralEvent,
  Role,
  Shop,
  StandeeStyle,
  SubCategory,
} from "@/lib/types";
import { CATEGORY_REEL_PHOTO, DEFAULT_REEL_PHOTO, type ImageKey } from "@/data/images";
import { buildSeed, HERO_SHOP_ID, slugify, SSR_SEED_ANCHOR, type SeedData } from "@/data/seed";
import {
  LOCAL_CREATORS,
  REFERRAL_COMMISSION,
  TEMPLATE_BY_KEY,
  currentMonthKey,
  resolveAgencyPrice,
} from "@/data/agency-templates";
import { discountPct } from "@/lib/format";
import { toast, useUiStore } from "./ui";
import { DEFAULT_BUYER_AREA_ID } from "@/data/catalog";

export const DEFAULT_RADIUS_KM = 10;

export type { Toast } from "./ui";

export const STORAGE_KEY = "retobiz-demo-v1";
export const STORE_VERSION = 3;
/** Free plan: 1 live promotional offer (kind 'offer'). Showroom products are not gated. */
export const FREE_OFFER_LIMIT = 1;
const ACTIVITY_CAP = 200;
const SSR_SEEDED_AT = new Date(SSR_SEED_ANCHOR).toISOString();

/* ─────────────────────────── State shape ─────────────────────────── */

interface DomainState extends SeedData {
  activeMerchantShopId: ID;
  buyer: BuyerProfile | null;
  /** Customer ids created from this device (buyer's VIP passes). */
  buyerPassIds: ID[];
  inbox: InboxMessage[];
  broadcasts: Record<ID, Broadcast>;
  /** Buyer's chosen discovery origin (Location Sheet). */
  buyerLocation: { areaId: ID; radiusKm: number };
  savedOfferIds: ID[];
}

export interface OfferDraft {
  shopId: ID;
  kind: OfferKind;
  title: string;
  description?: string;
  categoryId: ID;
  subCategoryId: ID;
  mrp?: number;
  price?: number;
  discountPct?: number;
  unit?: string;
  imageKey: ImageKey;
  customImage?: string;
  validTill?: string;
}

export interface OnboardingInput {
  name: string;
  ownerName: string;
  phone: string;
  categoryId: ID;
  subCategoryIds: ID[];
  areaId: ID;
  address: string;
  landmark?: string;
  gstin?: string;
  google: boolean;
  referralCode?: ID;
}

export type CreateOfferResult = { ok: true; offer: Offer } | { ok: false; reason: "paywall" };

interface Actions {
  // session
  setActiveMerchant: (shopId: ID) => void;
  // buyer
  followShop: (
    shopId: ID,
    input: { name: string; mobile: string; lang?: Lang; source?: CustomerSource },
  ) => { customer: Customer; alreadyMember: boolean };
  setPassLang: (customerId: ID, lang: Lang) => void;
  trackView: (shopId: ID) => void;
  trackOfferClick: (offerId: ID) => void;
  trackQrScan: (shopId: ID) => void;
  markInboxRead: () => void;
  setBuyerLocation: (loc: { areaId: ID; radiusKm: number }) => void;
  toggleSaveOffer: (offerId: ID) => boolean;
  trackReelView: (reelId: ID) => void;
  // merchant
  createOffer: (draft: OfferDraft) => CreateOfferResult;
  setOfferStatus: (offerId: ID, status: Offer["status"]) => void;
  setPlan: (shopId: ID, plan: Plan) => void;
  updateShop: (shopId: ID, patch: Partial<Pick<Shop, "name" | "tagline" | "hours" | "address" | "landmark" | "coverImageKey">>) => void;
  setFeaturedItems: (shopId: ID, ids: ID[]) => void;
  submitAgencyRequest: (shopId: ID, templateKey: AgencyTemplateKey, brief: AgencyRequest["brief"]) => AgencyRequest;
  placeQrOrder: (shopId: ID, design: { lang: Lang; style: StandeeStyle; headline: string }, address: string) => QrOrder;
  addCustomer: (shopId: ID, input: { name: string; mobile: string; tags?: string[] }) => Customer;
  sendBroadcast: (shopId: ID, recipientIds: ID[], message: string, templateKey?: string) => Broadcast;
  createShopFromOnboarding: (input: OnboardingInput) => Shop;
  // admin
  moveAgencyRequest: (id: ID, status: AgencyStatus, opts?: { creator?: { name: string; handle: string }; deliverableCaption?: string }) => void;
  advanceQrOrder: (id: ID) => void;
  setVerification: (shopId: ID, patch: Partial<Shop["verification"]>) => void;
  upsertCategory: (c: Partial<Category> & Pick<Category, "name">) => Category;
  toggleCategory: (id: ID) => void;
  upsertSubCategory: (s: Partial<SubCategory> & Pick<SubCategory, "name" | "categoryId">) => SubCategory;
  toggleSubCategory: (id: ID) => void;
  upsertLocation: (l: Partial<Location> & Pick<Location, "name" | "level">) => Location;
  // system
  resetDemo: (opts?: { silent?: boolean }) => void;
}

export type StoreState = DomainState & Actions;

/* ─────────────────────────── Helpers ─────────────────────────── */

function initialDomain(nowMs: number): DomainState {
  return {
    ...buildSeed(nowMs),
    activeMerchantShopId: HERO_SHOP_ID,
    buyer: null,
    buyerPassIds: [],
    inbox: [],
    broadcasts: {},
    buyerLocation: { areaId: DEFAULT_BUYER_AREA_ID, radiusKm: DEFAULT_RADIUS_KM },
    savedOfferIds: [],
  };
}

const now = () => new Date().toISOString();

function pushActivity(s: DomainState, actor: Role, type: ActivityType, shopId: ID | undefined, text: string) {
  const e: ActivityEvent = { id: nanoid(8), at: now(), actor, type, shopId, text };
  s.activity.unshift(e);
  if (s.activity.length > ACTIVITY_CAP) s.activity.length = ACTIVITY_CAP;
}

function addReferral(s: DomainState, shopId: ID, event: ReferralEvent) {
  const shop = s.shops[shopId];
  if (!shop?.referralCode) return;
  if (event !== "standee_order" && s.referralEntries.some((r) => r.shopId === shopId && r.event === event)) return;
  s.referralEntries.unshift({
    id: nanoid(8),
    distributorId: shop.referralCode,
    shopId,
    event,
    commission: REFERRAL_COMMISSION[event],
    at: now(),
  });
}

function recomputeVerified(shop: Shop) {
  shop.isVerified = shop.verification.status === "approved" && (shop.verification.gst || shop.verification.google);
}

function shopPrefix(name: string): string {
  const letters = name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (letters + "XXX").slice(0, 3);
}

export function countLiveOffers(offers: Record<ID, Offer>, shopId: ID, kind: OfferKind = "offer"): number {
  let n = 0;
  for (const o of Object.values(offers)) if (o.shopId === shopId && o.kind === kind && o.status === "live") n++;
  return n;
}

export function canPostOffer(shop: Shop, offers: Record<ID, Offer>): boolean {
  return shop.plan === "pro" || countLiveOffers(offers, shop.id, "offer") < FREE_OFFER_LIMIT;
}

/* ─────────────────────────── Store ─────────────────────────── */

export const useStore = create<StoreState>()(
  persist(
    immer((set, get) => ({
      ...initialDomain(SSR_SEED_ANCHOR),

      /* session */
      setActiveMerchant: (shopId) => set((s) => void (s.activeMerchantShopId = shopId)),

      /* buyer */
      followShop: (shopId, input) => {
        const mobile = input.mobile.replace(/\D/g, "").slice(-10);
        const existing = Object.values(get().customers).find((c) => c.shopId === shopId && c.mobile === mobile);
        if (existing) {
          set((s) => {
            if (!s.buyerPassIds.includes(existing.id)) s.buyerPassIds.push(existing.id);
            s.buyer = { name: existing.name, mobile };
          });
          return { customer: get().customers[existing.id], alreadyMember: true };
        }
        const shop = get().shops[shopId];
        const seq = Object.values(get().customers).filter((c) => c.shopId === shopId).length + 1;
        const prefix = shop.qrCode.split("-")[0];
        const customer: Customer = {
          id: nanoid(10),
          shopId,
          name: input.name.trim(),
          mobile,
          source: input.source ?? "follow",
          optInWhatsApp: true,
          passId: `${prefix}-${String(seq).padStart(4, "0")}`,
          passLang: input.lang ?? "en",
          joinedAt: now(),
          tags: ["Naya member"],
        };
        set((s) => {
          s.customers[customer.id] = customer;
          s.shops[shopId].followerIds.push(customer.id);
          s.buyerPassIds.push(customer.id);
          s.buyer = { name: customer.name, mobile };
          pushActivity(s, "buyer", "follow", shopId, `${customer.name} ne ${shop.name} ko follow kiya${customer.source === "qr" ? " (QR)" : ""}`);
        });
        return { customer, alreadyMember: false };
      },
      setPassLang: (customerId, lang) =>
        set((s) => {
          if (s.customers[customerId]) s.customers[customerId].passLang = lang;
        }),
      trackView: (shopId) =>
        set((s) => {
          if (s.shops[shopId]) s.shops[shopId].stats.views7d += 1;
        }),
      trackOfferClick: (offerId) =>
        set((s) => {
          const o = s.offers[offerId];
          if (!o) return;
          o.clicks += 1;
          s.shops[o.shopId].stats.offerClicks7d += 1;
        }),
      trackQrScan: (shopId) =>
        set((s) => {
          const shop = s.shops[shopId];
          if (!shop) return;
          shop.stats.qrScans7d += 1;
          pushActivity(s, "buyer", "qr_scan", shopId, `${shop.name} ka QR standee scan hua`);
        }),
      markInboxRead: () => set((s) => s.inbox.forEach((m) => (m.read = true))),
      setBuyerLocation: (loc) => set((s) => void (s.buyerLocation = loc)),
      toggleSaveOffer: (offerId) => {
        const saved = !get().savedOfferIds.includes(offerId);
        set((s) => {
          s.savedOfferIds = saved ? [...s.savedOfferIds, offerId] : s.savedOfferIds.filter((x) => x !== offerId);
        });
        return saved;
      },
      trackReelView: (reelId) =>
        set((s) => {
          if (s.reels[reelId]) s.reels[reelId].views += 1;
        }),

      /* merchant */
      createOffer: (draft) => {
        const st = get();
        const shop = st.shops[draft.shopId];
        if (draft.kind === "offer" && !canPostOffer(shop, st.offers)) return { ok: false, reason: "paywall" };
        const offer: Offer = {
          id: nanoid(10),
          shopId: draft.shopId,
          kind: draft.kind,
          title: draft.title.trim(),
          description: draft.description?.trim() || undefined,
          categoryId: draft.categoryId,
          subCategoryId: draft.subCategoryId,
          mrp: draft.mrp,
          price: draft.price,
          discountPct: draft.discountPct ?? discountPct(draft.mrp, draft.price),
          unit: draft.unit,
          imageKey: draft.imageKey,
          customImage: draft.customImage,
          validTill: draft.validTill,
          status: "live",
          clicks: 0,
          createdAt: now(),
        };
        set((s) => {
          s.offers[offer.id] = offer;
          const sh = s.shops[offer.shopId];
          if (offer.kind === "product" && sh.featuredItemIds.length < 10) sh.featuredItemIds.push(offer.id);
          pushActivity(s, "merchant", "offer_posted", offer.shopId, `${sh.name} ne naya ${offer.kind === "offer" ? "offer" : "product"} daala: ${offer.title}`);
        });
        return { ok: true, offer };
      },
      setOfferStatus: (offerId, status) =>
        set((s) => {
          if (s.offers[offerId]) s.offers[offerId].status = status;
        }),
      setPlan: (shopId, plan) =>
        set((s) => {
          const shop = s.shops[shopId];
          if (!shop || shop.plan === plan) return;
          shop.plan = plan;
          shop.agencyCredits = { month: currentMonthKey(), used: 0 };
          if (plan === "pro") addReferral(s, shopId, "pro_upgrade");
          pushActivity(s, "merchant", "plan_changed", shopId, `${shop.name} ${plan === "pro" ? "Pro par upgrade hua (₹999/saal)" : "Free plan par wapas"}`);
        }),
      updateShop: (shopId, patch) =>
        set((s) => {
          if (s.shops[shopId]) Object.assign(s.shops[shopId], patch);
        }),
      setFeaturedItems: (shopId, ids) =>
        set((s) => {
          if (s.shops[shopId]) s.shops[shopId].featuredItemIds = ids.slice(0, 10);
        }),
      submitAgencyRequest: (shopId, templateKey, brief) => {
        const shop = get().shops[shopId];
        const tpl = TEMPLATE_BY_KEY[templateKey];
        const month = currentMonthKey();
        const used = shop.agencyCredits.month === month ? shop.agencyCredits.used : 0;
        const { charged, paidWith } = resolveAgencyPrice(tpl.listPrice, shop.plan, used);
        const req: AgencyRequest = {
          id: nanoid(10),
          shopId,
          templateKey,
          brief,
          pricing: { listPrice: tpl.listPrice, charged, paidWith },
          status: "new",
          history: [{ status: "new", at: now() }],
          createdAt: now(),
        };
        set((s) => {
          s.agencyRequests[req.id] = req;
          const sh = s.shops[shopId];
          if (paidWith === "credit") sh.agencyCredits = { month, used: used + 1 };
          pushActivity(s, "merchant", "agency_requested", shopId, `${sh.name} ne ${tpl.name} request kiya`);
        });
        return req;
      },
      placeQrOrder: (shopId, design, address) => {
        const order: QrOrder = {
          id: nanoid(10),
          shopId,
          design,
          amount: 49,
          address,
          paymentMode: "cod_demo",
          status: "placed",
          history: [{ status: "placed", at: now() }],
          createdAt: now(),
        };
        set((s) => {
          s.qrOrders[order.id] = order;
          addReferral(s, shopId, "standee_order");
          pushActivity(s, "merchant", "qr_ordered", shopId, `${s.shops[shopId].name} ne ₹49 standee order kiya`);
        });
        return order;
      },
      addCustomer: (shopId, input) => {
        const mobile = input.mobile.replace(/\D/g, "").slice(-10);
        const shop = get().shops[shopId];
        const seq = Object.values(get().customers).filter((c) => c.shopId === shopId).length + 1;
        const customer: Customer = {
          id: nanoid(10),
          shopId,
          name: input.name.trim(),
          mobile,
          source: "manual",
          optInWhatsApp: true,
          passId: `${shop.qrCode.split("-")[0]}-${String(seq).padStart(4, "0")}`,
          passLang: "en",
          joinedAt: now(),
          tags: input.tags ?? [],
        };
        set((s) => {
          s.customers[customer.id] = customer;
          pushActivity(s, "merchant", "customer_added", shopId, `${shop.name} ne ${customer.name} ko CRM mein joda`);
        });
        return customer;
      },
      sendBroadcast: (shopId, recipientIds, message, templateKey) => {
        const b: Broadcast = { id: nanoid(10), shopId, message, recipientIds, sentAt: now(), templateKey };
        set((s) => {
          s.broadcasts[b.id] = b;
          const shop = s.shops[shopId];
          // Simulated delivery to this device's buyer if they are a recipient.
          const mine = recipientIds.find((id) => s.buyerPassIds.includes(id));
          if (mine) {
            const c = s.customers[mine];
            s.inbox.unshift({
              id: nanoid(8),
              shopId,
              broadcastId: b.id,
              text: message.replaceAll("{name}", c.name.split(" ")[0]).replaceAll("{shop}", shop.name),
              at: b.sentAt,
              read: false,
            });
          }
          pushActivity(s, "merchant", "broadcast_sent", shopId, `${shop.name} ne ${recipientIds.length} customers ko WhatsApp bheja`);
        });
        return b;
      },
      createShopFromOnboarding: (input) => {
        const st = get();
        const area = st.locations.find((l) => l.id === input.areaId);
        const prefix = shopPrefix(input.name);
        const base = slugify(`${input.name} ${area?.name ?? ""}`);
        const slug = st.shopOrder.some((id) => st.shops[id].slug === base) ? `${base}-${nanoid(4).toLowerCase()}` : base;
        const shop: Shop = {
          id: `shop-${nanoid(8)}`,
          slug,
          qrCode: `${prefix}-${(area?.name ?? "LOC").slice(0, 3).toUpperCase()}-${String(st.shopOrder.length + 1).padStart(3, "0")}`,
          name: input.name.trim(),
          ownerName: input.ownerName.trim(),
          phone: input.phone,
          categoryId: input.categoryId,
          subCategoryIds: input.subCategoryIds,
          areaId: input.areaId,
          address: input.address.trim(),
          landmark: input.landmark?.trim() || undefined,
          geo: { lat: area?.lat ?? 18.65, lng: area?.lng ?? 73.77 },
          hours: "Mon–Sat · 10 am–9 pm",
          verification: { gst: !!input.gstin, gstin: input.gstin, google: input.google, status: "pending" },
          isVerified: false,
          plan: "free",
          agencyCredits: { month: currentMonthKey(), used: 0 },
          coverImageKey: st.categories.find((c) => c.id === input.categoryId)?.imageKey ?? "promo-new-shops",
          followerIds: [],
          featuredItemIds: [],
          referralCode: input.referralCode,
          followerBase: 0,
          stats: { views7d: 0, offerClicks7d: 0, qrScans7d: 0 },
          createdAt: now(),
        };
        set((s) => {
          s.shops[shop.id] = shop;
          s.shopOrder.unshift(shop.id);
          s.activeMerchantShopId = shop.id;
          addReferral(s, shop.id, "signup");
          pushActivity(s, "merchant", "shop_created", shop.id, `${shop.name} ne Retobiz join kiya — verification pending`);
        });
        return shop;
      },

      /* admin */
      moveAgencyRequest: (id, status, opts) =>
        set((s) => {
          const r = s.agencyRequests[id];
          if (!r || r.status === status) return;
          r.status = status;
          r.history.push({ status, at: now() });
          if (status === "creator_assigned" && !r.creator) r.creator = opts?.creator ?? LOCAL_CREATORS[0];
          if (opts?.creator) r.creator = opts.creator;
          const tpl = TEMPLATE_BY_KEY[r.templateKey];
          const shop = s.shops[r.shopId];
          if (status === "delivered" && !r.deliverable) {
            const offer = r.brief.offerId ? s.offers[r.brief.offerId] : undefined;
            const photo = CATEGORY_REEL_PHOTO[shop.categoryId] ?? DEFAULT_REEL_PHOTO;
            const frames: ImageKey[] = r.templateKey === "ugc-video" || r.templateKey === "brand-collab" ? [DEFAULT_REEL_PHOTO, photo] : [photo, DEFAULT_REEL_PHOTO];
            r.deliverable = { caption: opts?.deliverableCaption?.trim() || r.brief.goal || tpl.name, frames };
            const reelId = nanoid(10);
            s.reels[reelId] = {
              id: reelId,
              shopId: r.shopId,
              caption: r.deliverable.caption,
              offerId: r.brief.offerId,
              frames: frames.map((imageKey) => ({ imageKey })),
              views: 0,
              createdAt: now(),
            };
          }
          const label = { new: "New", creator_assigned: "Creator Assigned", in_review: "In Review", delivered: "Delivered" }[status];
          pushActivity(s, "admin", "agency_moved", r.shopId, `${tpl.name} (${shop.name}) → ${label}`);
        }),
      advanceQrOrder: (id) =>
        set((s) => {
          const o = s.qrOrders[id];
          if (!o) return;
          const flow: QrOrderStatus[] = ["placed", "printed", "dispatched", "delivered"];
          const next = flow[flow.indexOf(o.status) + 1];
          if (!next) return;
          o.status = next;
          o.history.push({ status: next, at: now() });
          if (next === "dispatched" && !o.trackingId) o.trackingId = `RBZ${Math.floor(400000 + Math.random() * 99999)}`;
          pushActivity(s, "admin", "qr_advanced", o.shopId, `${s.shops[o.shopId].name} ka standee → ${next}`);
        }),
      setVerification: (shopId, patch) =>
        set((s) => {
          const shop = s.shops[shopId];
          if (!shop) return;
          const wasVerified = shop.isVerified;
          Object.assign(shop.verification, patch);
          recomputeVerified(shop);
          if (!wasVerified && shop.isVerified) addReferral(s, shopId, "verified");
          if (wasVerified !== shop.isVerified)
            pushActivity(s, "admin", "verification", shopId, `${shop.name} ${shop.isVerified ? "Verified ✓ ho gaya" : "ka Verified badge hata"}`);
        }),
      upsertCategory: (c) => {
        const existing = c.id ? get().categories.find((x) => x.id === c.id) : undefined;
        const cat: Category = existing
          ? { ...existing, ...c }
          : {
              id: `cat-${nanoid(6)}`,
              slug: slugify(c.name),
              name: c.name,
              nameHi: c.nameHi,
              wash: c.wash ?? "mint",
              imageKey: c.imageKey,
              glyph: c.glyph ?? "store",
              order: get().categories.length + 1,
              active: c.active ?? true,
            };
        set((s) => {
          const i = s.categories.findIndex((x) => x.id === cat.id);
          if (i >= 0) s.categories[i] = cat;
          else s.categories.push(cat);
          pushActivity(s, "admin", "category_changed", undefined, `Category ${existing ? "update" : "add"} hui: ${cat.name}`);
        });
        return cat;
      },
      toggleCategory: (id) =>
        set((s) => {
          const c = s.categories.find((x) => x.id === id);
          if (c) c.active = !c.active;
        }),
      upsertSubCategory: (sc) => {
        const existing = sc.id ? get().subCategories.find((x) => x.id === sc.id) : undefined;
        const sub: SubCategory = existing
          ? { ...existing, ...sc }
          : { id: `sub-${nanoid(6)}`, slug: slugify(sc.name), name: sc.name, categoryId: sc.categoryId, imageKey: sc.imageKey, active: sc.active ?? true };
        set((s) => {
          const i = s.subCategories.findIndex((x) => x.id === sub.id);
          if (i >= 0) s.subCategories[i] = sub;
          else s.subCategories.push(sub);
          const cat = s.categories.find((c) => c.id === sub.categoryId);
          pushActivity(s, "admin", "category_changed", undefined, `Sub-category ${existing ? "update" : "add"} hui: ${sub.name}${cat ? ` (${cat.name})` : ""}`);
        });
        return sub;
      },
      toggleSubCategory: (id) =>
        set((s) => {
          const c = s.subCategories.find((x) => x.id === id);
          if (c) c.active = !c.active;
        }),
      upsertLocation: (l) => {
        const existing = l.id ? get().locations.find((x) => x.id === l.id) : undefined;
        const loc: Location = existing ? { ...existing, ...l } : { id: `${l.level}-${nanoid(6)}`, ...l };
        set((s) => {
          const i = s.locations.findIndex((x) => x.id === loc.id);
          if (i >= 0) s.locations[i] = loc;
          else s.locations.push(loc);
          pushActivity(s, "admin", "location_changed", undefined, `Location ${existing ? "update" : "add"} hui: ${loc.name}`);
        });
        return loc;
      },

      /* system */
      resetDemo: (opts) => {
        set((s) => {
          const fresh = initialDomain(Date.now());
          Object.assign(s, fresh);
          if (!opts?.silent) pushActivity(s, "admin", "demo_reset", undefined, "Demo data reset hua");
        });
        useUiStore.getState().resetShutters();
        if (!opts?.silent) toast({ message: "Demo data reset ho gaya", tone: "success" });
      },
    })),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s): DomainState => ({
        seededAt: s.seededAt,
        categories: s.categories,
        subCategories: s.subCategories,
        locations: s.locations,
        shops: s.shops,
        shopOrder: s.shopOrder,
        offers: s.offers,
        reels: s.reels,
        customers: s.customers,
        agencyRequests: s.agencyRequests,
        qrOrders: s.qrOrders,
        distributors: s.distributors,
        referralEntries: s.referralEntries,
        activity: s.activity,
        activeMerchantShopId: s.activeMerchantShopId,
        buyer: s.buyer,
        buyerPassIds: s.buyerPassIds,
        inbox: s.inbox,
        broadcasts: s.broadcasts,
        buyerLocation: s.buyerLocation,
        savedOfferIds: s.savedOfferIds,
      }),
      // Unknown/older schema → start from a fresh seed rather than crash.
      migrate: (persisted, version) =>
        (version === STORE_VERSION ? persisted : initialDomain(Date.now())) as StoreState,
    },
  ),
);

/** True when the in-memory state is still the SSR placeholder seed (never re-seeded on this device). */
export function isPlaceholderSeed(seededAt: string) {
  return seededAt === SSR_SEEDED_AT;
}
