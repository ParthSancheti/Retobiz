// Domain model — IMPLEMENTATION_PLAN §3.1
import type { ImageKey, Focal } from "@/data/images";

export type ID = string;
export type ISO = string;

export type Role = "buyer" | "merchant" | "admin";
export type Lang = "en" | "hi" | "mr";
export type Wash = "mint" | "peach" | "sky" | "cream" | "lavender";

/** Lucide icon names used as category fallback glyphs (resolved in components/media/glyphs.ts). */
export type GlyphName =
  | "shopping-basket"
  | "shirt"
  | "footprints"
  | "smartphone"
  | "cake-slice"
  | "pill"
  | "plug-zap"
  | "scissors"
  | "gem"
  | "pen-tool"
  | "store";

export interface Category {
  id: ID;
  slug: string;
  name: string;
  nameHi?: string;
  wash: Wash;
  imageKey?: ImageKey;
  glyph: GlyphName;
  order: number;
  active: boolean;
}

export interface SubCategory {
  id: ID;
  categoryId: ID;
  slug: string;
  name: string;
  imageKey?: ImageKey;
  active: boolean;
}

export type LocationLevel = "state" | "district" | "city" | "area";
export interface Location {
  id: ID;
  level: LocationLevel;
  name: string;
  parentId?: ID;
  lat?: number;
  lng?: number;
}

export type VerificationStatus = "pending" | "approved" | "rejected" | "suspended";
export type Plan = "free" | "pro";

export interface Shop {
  id: ID;
  slug: string;
  qrCode: string;
  name: string;
  ownerName: string;
  phone: string;
  categoryId: ID;
  subCategoryIds: ID[];
  areaId: ID;
  address: string;
  landmark?: string;
  geo: { lat: number; lng: number };
  hours: string;
  tagline?: string;
  verification: { gst: boolean; gstin?: string; google: boolean; status: VerificationStatus };
  /** Derived on write: approved && (gst || google). */
  isVerified: boolean;
  plan: Plan;
  agencyCredits: { month: string; used: number };
  coverImageKey?: ImageKey;
  followerIds: ID[];
  /** ≤10, ordered; references Offer ids with kind 'product'. */
  featuredItemIds: ID[];
  referralCode?: string;
  /** Base follower count from before the demo (so counts look real). */
  followerBase: number;
  /** Local buyer rating (Justdial-style trust chip). */
  rating?: number;
  ratingCount?: number;
  stats: { views7d: number; offerClicks7d: number; qrScans7d: number };
  createdAt: ISO;
}

export type OfferKind = "offer" | "product";
export type OfferStatus = "live" | "draft" | "expired";

export interface Offer {
  id: ID;
  shopId: ID;
  kind: OfferKind;
  title: string;
  description?: string;
  categoryId: ID;
  subCategoryId: ID;
  mrp?: number;
  price?: number;
  /** Explicit % off (flat offers) or derived from mrp/price. */
  discountPct?: number;
  unit?: string;
  imageKey: ImageKey;
  /** Merchant-uploaded photo (data URL ≤ 300 KB), takes precedence over imageKey. */
  customImage?: string;
  validTill?: ISO;
  status: OfferStatus;
  clicks: number;
  createdAt: ISO;
}

export interface ReelFrame {
  imageKey: ImageKey;
  focal?: Focal;
}

export interface Reel {
  id: ID;
  shopId: ID;
  caption: string;
  offerId?: ID;
  frames: ReelFrame[];
  views: number;
  createdAt: ISO;
}

export type CustomerSource = "qr" | "follow" | "manual";
export interface Customer {
  id: ID;
  shopId: ID;
  name: string;
  mobile: string;
  source: CustomerSource;
  optInWhatsApp: boolean;
  passId: string;
  passLang: Lang;
  joinedAt: ISO;
  tags: string[];
}

export interface Broadcast {
  id: ID;
  shopId: ID;
  message: string;
  recipientIds: ID[];
  sentAt: ISO;
  templateKey?: string;
}

export type AgencyTemplateKey =
  | "ai-promo-reel"
  | "ugc-video"
  | "brand-collab"
  | "festival-poster"
  | "shop-tour-reel"
  | "whatsapp-banner"
  | "google-review-card";

export type AgencyStatus = "new" | "creator_assigned" | "in_review" | "delivered";
export type AgencyPaidWith = "credit" | "pro_discount" | "addon";

export interface AgencyRequest {
  id: ID;
  shopId: ID;
  templateKey: AgencyTemplateKey;
  brief: { goal: string; offerId?: ID; language: Lang; preferredDate?: ISO; notes?: string };
  pricing: { listPrice: number; charged: number; paidWith: AgencyPaidWith };
  status: AgencyStatus;
  creator?: { name: string; handle: string };
  deliverable?: { caption: string; frames: ImageKey[] };
  history: { status: AgencyStatus; at: ISO }[];
  createdAt: ISO;
}

export type QrOrderStatus = "placed" | "printed" | "dispatched" | "delivered";
export type StandeeStyle = "classic" | "festive" | "bold";
export interface QrOrder {
  id: ID;
  shopId: ID;
  design: { lang: Lang; style: StandeeStyle; headline: string };
  amount: 49;
  address: string;
  paymentMode: "cod_demo";
  status: QrOrderStatus;
  trackingId?: string;
  history: { status: QrOrderStatus; at: ISO }[];
  createdAt: ISO;
}

export interface Distributor {
  id: ID;
  name: string;
  city: string;
  code: string;
}

export type ReferralEvent = "signup" | "verified" | "pro_upgrade" | "standee_order";
export interface ReferralEntry {
  id: ID;
  distributorId: ID;
  shopId: ID;
  event: ReferralEvent;
  commission: number;
  at: ISO;
}

export type ActivityType =
  | "follow"
  | "offer_posted"
  | "offer_click"
  | "shop_view"
  | "qr_scan"
  | "plan_changed"
  | "agency_requested"
  | "agency_moved"
  | "qr_ordered"
  | "qr_advanced"
  | "verification"
  | "category_changed"
  | "location_changed"
  | "shop_created"
  | "broadcast_sent"
  | "customer_added"
  | "demo_reset";

export interface ActivityEvent {
  id: ID;
  at: ISO;
  actor: Role;
  type: ActivityType;
  shopId?: ID;
  text: string;
}

export interface BuyerProfile {
  name: string;
  mobile: string;
}

/** A buyer's received WhatsApp-style message (simulated inbox on /passes). */
export interface InboxMessage {
  id: ID;
  shopId: ID;
  broadcastId: ID;
  text: string;
  at: ISO;
  read: boolean;
}
