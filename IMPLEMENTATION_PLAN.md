# Retobiz — Implementation Plan (`IMPLEMENTATION_PLAN.md`)

> Status: **v3.1 — All 5 phases + visual craft pass** (see §10–§15 for build-time decisions) · Companion to `DESIGN.md`
> Goal: a fully clickable, stakeholder-demo-grade prototype where every action in one role is visible live in the other two. There is no backend and no payments.

---

## 1. Stack & Conventions

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (latest stable, App Router), React 19, TypeScript `strict` | All interactive surfaces are client components. Server components are only used for static shells/layouts. |
| Styling | Tailwind CSS v4 (`@theme` tokens from `DESIGN.md §11`) | No CSS-in-JS. `clsx` + `tailwind-merge` via `cn()` |
| Motion | `motion` (Framer Motion, `motion/react`) | All springs/eases imported from `lib/motion.ts` |
| Icons | `lucide-react` | `strokeWidth 1.75` set via wrapper |
| State | `zustand` + `persist` (localStorage) + `immer` middleware | One store, sliced. Versioned + migrations |
| Utils | `nanoid` (ids), `date-fns` (dates), `qrcode` (real scannable QR SVGs), `html-to-image` (standee PNG export) | |
| Images | Curated remote photos (Unsplash/Pexels) via `data/images.ts` registry + `<RetailImage>` fallback | `next.config` `images.unoptimized: true` (Vercel-safe, no remotePatterns churn) |
| Lint/format | ESLint (next config) + Prettier + `prettier-plugin-tailwindcss` | |
| Quality gates | `tsc --noEmit` + `next lint` + `next build` must pass at every phase gate, plus a manual visual check at **390px** and **1440px** | No test frameworks in the prototype; speed over ceremony |
| Deploy | Standalone Next.js app, zero env vars, `vercel` 1-click preview from repo root | localStorage only, so every visitor gets their own seeded demo |

**Conventions**
- `kebab-case` files, `PascalCase` components, one component per file.
- Domain types live in `lib/types.ts` and are imported everywhere. No `any`.
- No component reads `localStorage` directly; only the store does.
- Currency/number formatting goes through `lib/format.ts` (`formatINR`, `formatCompactIN`, `formatDistance`).
- Every CTA either performs a store action, navigates, or opens a sheet. The **only** allowed "Coming in Phase 2" toasts are: (1) Call shop, (2) Get directions (opens the map URL instead, if acceptable), (3) Share profile, which falls back to copying the link.

---

## 2. Route Architecture

Route groups keep the three apps isolated while sharing one store and one design system.

```
app/
├── layout.tsx                      # fonts, <StoreHydrationGate>, <RoleSwitcher>, <Toaster>
├── globals.css                     # Tailwind v4 @theme tokens
│
├── (buyer)/                        # Public, no login wall
│   ├── layout.tsx                  # Top bar (location pill + search + "Apni Dukaan List Karein") + bottom nav
│   ├── page.tsx                    # /            Home: hero offer, category window, rails, nearby shops
│   ├── search/page.tsx             # /search?q=&cat=&sub=&state=&district=&city=&area=&radius=&disc=&verified=&offers=
│   ├── category/[slug]/page.tsx    # /category/kirana   (same engine as search, preset facet)
│   ├── offers/page.tsx             # /offers     Universal Offers Hub
│   ├── shop/[slug]/page.tsx        # /shop/laxmi-saree-readymade-centre-akurdi   Storefront + shutter; ?reel=<id> opens ReelViewer
│   └── passes/page.tsx             # /passes     "My VIP Passes" (buyer's opt-ins, from this device)
│
├── q/[shopId]/page.tsx             # /q/LSC-AKD-001   QR entry → redirect to storefront with ?src=qr
│                                   #   (forces shutter, auto-opens opt-in sheet after 1.2s)
│
├── list-your-shop/                 # Merchant acquisition funnel (public)
│   ├── page.tsx                    # Profit Estimator + value prop + "Shuru Karein"
│   └── onboard/page.tsx            # 3-step wizard: Basic Info → Verification → Instant Storefront
│
├── merchant/                       # Shop Owner app ("logged in" as the active demo merchant)
│   ├── layout.tsx                  # Sidebar (desktop) / bottom nav (mobile) + engagement alert strip
│   ├── page.tsx                    # /merchant   Home: alerts, KPIs, profile checklist, quick actions
│   ├── offers/page.tsx             # List of my offers & products (+ status)
│   ├── offers/new/page.tsx         # Structured upload: Cat → Sub-cat, live card preview, freemium gate
│   ├── studio/page.tsx             # Marketing Agency Studio: weekly AI planner + 7 templates + my requests
│   ├── customers/page.tsx          # CRM list + filters + bulk select
│   ├── broadcast/page.tsx          # WhatsApp composer + phone bezel preview + send log
│   ├── qr-standee/page.tsx         # QR poster designer (EN/HI/MR) + ₹49 order flow + order status
│   ├── profile/page.tsx            # Edit shop profile, featured items (top 9–10), hours
│   └── plan/page.tsx               # Free vs Pro, demo Pro toggle
│
└── admin/
    ├── layout.tsx                  # Sidebar + top bar
    ├── page.tsx                    # /admin  Executive KPIs + activity feed
    ├── shops/page.tsx              # Verification & approval table (toggle Verified/GST/Google, approve/suspend)
    ├── fulfillment/page.tsx        # Agency Kanban: New → Creator Assigned → In Review → Delivered
    ├── qr-orders/page.tsx          # ₹49 standee dispatch tracker
    ├── masters/categories/page.tsx # Category & Sub-category master (CRUD, wash, image, glyph)
    ├── masters/locations/page.tsx  # State → District → City → Area master
    └── referrals/page.tsx          # Distributor referral attribution ledger
```

**Owner Mode:** if `role === 'merchant'` and the storefront is the active merchant's own shop, `/shop/[slug]` renders the **Owner Mode Bar** (`DESIGN.md §5.7`) and swaps the Follow CTA for an owner preview chip. The Merchant sidebar has a "Meri Dukaan Dekhein" link that opens it.

**Role ↔ route behavior**
- The Role Switcher navigates to that role's home (`/`, `/merchant`, `/admin`) and remembers the last route per role, so switching back returns you where you were.
- Visiting `/merchant/*` or `/admin/*` directly sets the role accordingly. There are no auth guards; this is a demo.
- `merchant` acts as `session.activeMerchantShopId`, defaulting to **Laxmi Saree & Readymade Centre, Akurdi (Pune)**. A "Switch demo shop" selector sits in the merchant `More` menu. Completing onboarding switches the active merchant to the newly created shop.

**Rendering:** all pages are client-rendered against the persisted store. `generateStaticParams` is used only for seed shop slugs, so deep links don't 404 on first paint. Unknown slugs show a "Dukaan nahi mili" state with a link to Explore.

---

## 3. Reactive State Blueprint

### 3.1 Domain model (`lib/types.ts`)

```ts
type ID = string;
type ISO = string;

type ImageKey = keyof typeof IMAGES;                // data/images.ts registry
interface Category   { id: ID; slug: string; name: string; nameHi?: string; wash: Wash; imageKey?: ImageKey; glyph: LucideIconName; order: number; active: boolean }
interface SubCategory{ id: ID; categoryId: ID; slug: string; name: string; imageKey?: ImageKey; active: boolean }
interface Location   { id: ID; level: 'state'|'district'|'city'|'area'; name: string; parentId?: ID; lat?: number; lng?: number }

interface Shop {
  id: ID; slug: string; qrCode: string;             // e.g. LSC-AKD-001
  name: string; ownerName: string; phone: string;
  categoryId: ID; subCategoryIds: ID[];
  areaId: ID; address: string; landmark?: string; geo: { lat: number; lng: number };
  hours: string; tagline?: string;
  verification: { gst: boolean; gstin?: string; google: boolean; status: 'pending'|'approved'|'rejected'|'suspended' };
  isVerified: boolean;                               // derived on write: approved && (gst || google)
  plan: 'free' | 'pro';
  agencyCredits: { month: string; used: number };   // Pro: 2 credits / month
  coverImageKey?: ImageKey;                          // storefront cover photo
  followerIds: ID[];                                 // customer ids
  featuredItemIds: ID[];                             // ≤10, ordered
  referralCode?: string;                             // distributor attribution
  stats: { views7d: number; offerClicks7d: number; qrScans7d: number };
  createdAt: ISO;
}

interface Offer {
  id: ID; shopId: ID; kind: 'offer' | 'product';
  title: string; description?: string;
  categoryId: ID; subCategoryId: ID;
  mrp?: number; price?: number; discountPct?: number; // derived if mrp & price
  imageKey: ImageKey; validTill?: ISO;
  status: 'live' | 'draft' | 'expired';
  clicks: number; createdAt: ISO;
}

interface Reel { id: ID; shopId: ID; caption: string; offerId?: ID; frames: { imageKey: ImageKey; focal?: 'center'|'top'|'bottom' }[]; views: number; createdAt: ISO }

interface Customer {                                 // CRM record, per shop
  id: ID; shopId: ID; name: string; mobile: string;
  source: 'qr' | 'follow' | 'manual'; optInWhatsApp: boolean;
  passId: string; passLang: 'en'|'hi'|'mr'; joinedAt: ISO; tags: string[];
}

interface Broadcast { id: ID; shopId: ID; message: string; recipientIds: ID[]; sentAt: ISO; templateKey?: string }

interface AgencyRequest {
  id: ID; shopId: ID; templateKey: AgencyTemplateKey;
  brief: { goal: string; offerId?: ID; language: 'en'|'hi'|'mr'; preferredDate?: ISO; notes?: string };
  status: 'new' | 'creator_assigned' | 'in_review' | 'delivered';
  creator?: { name: string; handle: string };
  pricing: { listPrice: number; charged: number; paidWith: 'credit' | 'pro_discount' | 'addon' };
  deliverable?: { caption: string; frames: ImageKey[] };  // becomes a Reel on storefront when delivered
  history: { status: AgencyRequest['status']; at: ISO }[];
  createdAt: ISO;
}

interface QrOrder {
  id: ID; shopId: ID; design: { lang: 'en'|'hi'|'mr'; style: CategoryStyleKey; headline: string };
  amount: 49; address: string; paymentMode: 'cod_demo';
  status: 'placed' | 'printed' | 'dispatched' | 'delivered';
  trackingId?: string; history: { status: QrOrder['status']; at: ISO }[]; createdAt: ISO;
}

interface Distributor { id: ID; name: string; city: string; code: string }
interface ReferralEntry { id: ID; distributorId: ID; shopId: ID; event: 'signup'|'verified'|'pro_upgrade'|'standee_order'; commission: number; at: ISO }

interface ActivityEvent { id: ID; at: ISO; actor: 'buyer'|'merchant'|'admin'; type: string; shopId?: ID; text: string }
```

### 3.2 Store shape (`store/index.ts`)

One `create()` with slices composed together. Persisted keys are explicit.

```
RootState
├── session        { role, lastRouteByRole, activeMerchantShopId (default: Laxmi Saree Centre), buyerProfile{name,mobile}, seenShutterShopIds (NOT persisted) }
├── catalog        { categories, subCategories, locations }               ← Admin masters write here
├── shops          { byId, order }
├── offers         { byId }
├── reels          { byId }
├── crm            { customersById, broadcastsById }
├── agency         { requestsById }
├── qr             { ordersById }
├── referrals      { distributors, entries }
├── activity       { events (cap 200, newest first) }
└── ui             { toasts, sheets (NOT persisted) }
```

**Persistence**
- Key `retobiz-demo-v1`. `version: 1` + `migrate()`. `partialize` excludes `ui` and `session.seenShutterShopIds`.
- **Image registry is static code** (`data/images.ts`), not persisted state, so swapping a photo never requires a demo reset.
- **Hydration gate:** `skipHydration: true`, and `<StoreHydrationGate>` calls `persist.rehydrate()` on mount and renders skeletons until hydrated. This avoids SSR/client mismatch.
- **Cross-tab live sync:** a `storage` event listener calls `persist.rehydrate()`. This lets stakeholders open Buyer, Merchant and Admin in **three browser tabs/devices on one machine** and watch changes propagate. A `BroadcastChannel('retobiz')` ping is used as a faster path.
- **Reset:** `resetDemo()` re-seeds from `data/seed.ts` and keeps the role.

### 3.3 Actions (the contract that wires the three views)

| Action | Triggered by | Writes | Instantly visible in |
|---|---|---|---|
| `followShop(shopId, {name, mobile})` | Buyer opt-in sheet / QR | `crm.customers` (+pass), `shops.followerIds`, `activity` | Buyer: VIP Pass, follower count · Merchant: CRM row, alert "1 naya follower", KPI · Admin: activity feed, KPI |
| `trackView / trackOfferClick / trackQrScan` | Buyer browsing | `shops.stats`, `offers.clicks` | Merchant alerts & KPIs · Admin KPIs |
| `createOffer(draft)` | Merchant upload | `offers` (gated: free plan & ≥1 live offer → returns `{blocked:'paywall'}`) | Buyer: home rails, /offers, storefront, search · Admin KPIs |
| `setPlan(shopId, plan)` / `toggleDemoPro()` | Merchant paywall / plan page | `shops.plan` | Merchant gate state · Storefront "Pro" ring · Admin table · Referral ledger (`pro_upgrade`) |
| `submitAgencyRequest(templateKey, brief)` | Merchant Studio | `agency.requests` (status `new`) + pricing resolution (Pro: credit if available → else 40% off; Free: list price add-on), `shops.agencyCredits` | Admin Kanban "New" column · Merchant "My requests" tracker |
| `moveAgencyRequest(id, status, creator?)` | Admin Kanban drag | status + history; on `delivered` → creates `Reel` | Merchant tracker stepper + alert · Buyer storefront reels rail |
| `placeQrOrder(design, address)` | Merchant QR Studio | `qr.orders`, referral entry | Admin QR Orders · Merchant order status stepper |
| `advanceQrOrder(id)` | Admin tracker | status + `trackingId` | Merchant stepper |
| `setVerification(shopId, patch)` | Admin Shops table | `shops.verification` → recompute `isVerified` | Buyer: badge everywhere, "Verified only" filter results · Merchant: checklist item ticks |
| `upsertCategory / upsertSubCategory / toggleCategory` | Admin Masters | `catalog` | Buyer: Category Window, filters · Merchant: upload dropdowns |
| `upsertLocation` | Admin Masters | `catalog.locations` | Buyer: location sheet · Onboarding area picker |
| `createShopFromOnboarding(data)` | Onboarding wizard | `shops` (status `pending`), sets `activeMerchantShopId`, referral `signup` | Admin verification queue (pending) · Buyer: visible as "New" (unverified) |
| `sendBroadcast(recipientIds, message)` | Merchant Broadcast | `crm.broadcasts`, `activity` | Merchant send log · Admin activity · Buyer `/passes`: "Message from shop" inbox item if that device's buyer is a recipient |
| `resetDemo()` | Role switcher menu | everything | everywhere |

Every action appends an `ActivityEvent` (human-readable, Hinglish where natural). This powers the merchant alerts, the admin feed, and the one-shot "live-sync flash" (`DESIGN.md §5.3`).

### 3.4 Selectors (`store/selectors.ts`, memoized)

- `selectFilteredShops(filters)` and `selectFilteredOffers(filters)` form a single search engine used by Home rails, `/search`, `/category/[slug]`, `/offers`, and in-shop search (scoped by `shopId`).
- Filters: `q` (tokenized match over shop name, offer title, category/sub-cat names, area, plus a Hinglish synonym map: "chappal→footwear", "dawai→medical", "mithai→bakery", "parlour→salon"), `categoryId`, `subCategoryId`, `stateId/districtId/cityId/areaId`, `radiusKm` (haversine from the selected area's centroid), `minDiscount` (10/20/30/50), `verifiedOnly`, `hasActiveOffers`, and `sort` (relevance · nearest · biggest discount · newest).
- Predictive search returns grouped suggestions: Categories · Shops · Offers · Areas, at most 3 each, with keyboard navigation.
- Facets are URL-synced (`useSearchParams`), so filtered views are shareable during demos.
- `selectMerchantDashboard(shopId)` returns the KPIs, alert list, checklist completion %, and next best action.
- `selectAdminKpis()` returns shops (total/verified/pending), live offers, opt-ins (7d), agency pipeline counts, QR orders (₹ value), Pro conversions, and referral payouts.

### 3.5 Seed data (`data/seed.ts`): curated, quality over bloat
- **Locations:** Maharashtra → Pune district (Pune city: **Akurdi**, Nigdi, Pimpri, Chinchwad, Ravet) · Nashik district (Nashik city: College Road, Panchavati, Cidco) · Malegaon (Camp, Sangameshwar). Each area has a realistic centroid lat/lng for radius search.
- **Categories (10):** the brief's exact list. Each has a hero `imageKey`, a Lucide fallback glyph, a wash, and 3–4 sub-categories (e.g. Saree & Readymade → Paithani, Cotton Sarees, Kurtis, Kids Wear).
- **Shops: 15 rich profiles**, one or two per category. Seven are in Pune (four in Akurdi), four in Nashik and four in Malegaon. About ten are verified, three pending and two unverified. Four are on Pro. Each shop has a tagline, hours, landmark-style address ("Akurdi Railway Station Road, Sambhaji Chowk ke paas"), a cover photo, a monogram, and 6–10 featured showroom items.
  - **Hero:** Laxmi Saree & Readymade Centre (Akurdi, Pro OFF by default so the paywall demo works). It has 10 featured items, 3 live offers, 2 reels and 38 CRM customers.
  - **Others:** Shree Ganesh Kirana (Akurdi) · Patil Footwear & Bags (Nigdi) · Om Sai Mobile Point (Pimpri) · Mauli Sweets & Bakery (Chinchwad) · Jain Medical & General (Akurdi) · Siddhivinayak Hardware & Electricals (Ravet) · Godavari Saree Emporium (Panchavati, Nashik) · Nashik Mobile Care (College Road) · Glamour Ladies Parlour (Cidco) · Mahalaxmi Imitation Jewellers (Nashik) · Vidya Stationery & Gifts (Malegaon Camp) · Al-Noor Readymade (Malegaon) · Bismillah Footwear (Sangameshwar) · Saraf Kirana Stores (Malegaon).
- **Offers/products: ~45**, each with a vetted photo and real INR price points: ₹6,450 Paithani-border silk saree, ₹1,299 cotton saree, ₹549 kurti, ₹399 kolhapuri chappal, ₹349 school bag, ₹199 screen guard + fitting, ₹520/kg kaju katli, ₹1,399 BP monitor, ₹299 9W LED 3-pack, ₹499 fruit facial, ₹249 oxidised jhumka, ₹899 monthly kirana combo, and so on.
- **Reels:** about 10, each with 2–4 frames. **Customers:** 8–40 per shop, with Marathi/Hindi/Urdu names and masked mobiles. **Agency requests:** 6 spread across the Kanban. **QR orders:** 5 across statuses. **Distributors:** 3 (Pune, Nashik, Malegaon) with about 15 ledger entries.
- Generation is deterministic, so every demo reset looks identical.

---

## 4. Feature Specs (acceptance-level)

**A. Buyer**
1. **Home:** Retobiz lockup (+ tagline on desktop) · location pill · search with **rotating Hinglish hints** (`DESIGN.md §5.5`) · flame "Apni Dukaan List Karein" chip → `/list-your-shop` · saffron hero offer banner (carousel, manual swipe only, no autoplay) · Category Window (10 curated-photo pastel tiles, from master) · "Aaj ke Offers" rail · "Aas-paas ki Verified Dukaanein" rail · "Naye Shops" rail · Reels rail · footer with lockup + tagline + CTA for shop owners.
2. **Search:** predictive overlay · facet sheet (mobile) / left rail (desktop) with 4-tier cascading location + radius slider (1/3/5/10 km) · result tabs `Shops | Offers` with a `layoutId` pill · zero-result recovery (widen radius, clear a facet).
3. **Offers Hub:** search + category chips + shop filter + discount filter + "Ending soon" sort.
4. **Storefront:** brushed slate-indigo shutter (DESIGN §5.4) revealing a white showroom · cover signboard · monogram · Verified/GST/Google badges · address + hours + open status · followers + Follow button · sticky bottom "Follow & WhatsApp pe Offers Paayein" · tabs `Showroom (top 9–10) | Offers | Reels | About` · in-shop search + sub-cat chips + discount filter · "← Explore All Nearby Shops" (top-left, plus an end-of-page card) · Replay Shutter · **Owner Mode Bar** when the merchant views their own shop (DESIGN §5.7).
4a. **Reels Viewer** (opened via `?reel=<id>` query param, no intercepted routes): 9:16 full-bleed photos with Ken-Burns, segmented story progress bar, kinetic offer caption, hold-to-pause, tap-zones, sticky "Offer Claim Karein / Follow" pill (DESIGN §5.6).
5. **Opt-in sheet:** Name + 10-digit mobile (Indian validation `^[6-9]\d{9}$`) + WhatsApp consent checkbox (pre-checked, explicit copy) → submit → sheet morphs into the **VIP Member Pass** (saffron card with shop name, member name, member no. `LSC-0042`, join date, a QR of the pass ID, an **EN/HI/MR language toggle** that re-renders the pass copy, and an "Add to Home Screen" hint) · one confetti burst · CTA "Explore nearby shops". Following again shows "Aap pehle se member hain" plus the pass.
6. **My Passes:** all passes created from this device + received broadcast messages.

**B. Merchant**
1. **Profit Estimator** (`/list-your-shop`, large Retobiz lockup + Marathi tagline hero): sliders for daily footfall, avg bill ₹, % repeat customers, plus a category select → shows "extra monthly profit" estimate with transparent assumptions (opt-in rate, repeat-visit uplift, margin by category) and the ₹999/year Pro cost vs estimated gain ("Pro ka kharcha 6 din mein wasool").
2. **Onboarding:** Step 1 shop name, owner, mobile, category + sub-cats, 4-tier location, address. Step 2 GSTIN (format-validated, simulated 1.2s check → ✓) and/or "Google Business se verify karein" (simulated) or "Baad mein karein". Step 3 **Instant Storefront** reveal (the shutter plays on their new shop) + share link + "Merchant dashboard kholein".
3. **Home:** sticky engagement alert (rotates on change only) · KPI tiles (views, followers, offer clicks, QR scans; 7d with delta) · Profile Completion ring + checklist (Logo/monogram ✓, Hours, 3 featured items, 1st offer, Verification, QR standee) · Quick actions · Recent activity.
4. **Offer upload:** kind toggle (Offer/Product) · Category → Sub-cat (from master) · title · MRP/price (auto % off) or a flat "% off" · validity · photo picker from the curated registry (filtered by sub-cat) or "Apni photo" upload (object URL, kept as data-URL ≤ 300 KB) · **live card preview** (desktop side-by-side; mobile preview sheet) · post. **Gate:** a free plan with ≥1 live offer opens the **Pro Paywall** sheet (lock illustration, 4 concrete benefits, ₹999/year, "₹2.7/din", "Pro lein (demo)" → sets plan pro → returns to the form with state intact). A visible "Demo: Free/Pro" toggle sits on the plan page and in the paywall footer.
5. **Agency Studio:** "Is hafte ka content plan" with 7 day cards generated from category rules + an upcoming festival calendar (Nov–Dec 2026: wedding season, Christmas, year-end sale; extendable). Each card is clickable and pre-fills a template. A credit meter at the top shows "Pro credits: 1/2 is mahine" or "Free plan · Pro mein 2 credits + 40% off".

   | # | Template | Free (add-on) | Pro |
   |---|---|---|---|
   | 1 | AI Promo Reel | ₹299 | 1 credit, or ₹179 |
   | 2 | Local Creator UGC Video | ₹1,499 | 1 credit, or ₹899 |
   | 3 | Brand Collab Video | ₹2,499 | 1 credit, or ₹1,499 |
   | 4 | Festival Offer Poster | ₹199 | 1 credit, or ₹119 |
   | 5 | Shop Tour Reel | ₹799 | 1 credit, or ₹479 |
   | 6 | WhatsApp Flash Banner | ₹149 | 1 credit, or ₹89 |
   | 7 | Google Review Booster Card | ₹99 | 1 credit, or ₹59 |

   Every template card shows the list price and an "Included in Pro (2 credits/mo + 40% off)" line. Free users see a one-line ROI nudge, e.g. "2 reels/mahina = ₹598 · Pro ₹999/saal". Each template opens a brief form (goal, linked offer, language, date, notes, price summary) → "Request Bhejein" (simulated payment confirm for add-ons, no gateway) → it appears in "Meri Requests" with a 4-step status stepper.
6. **CRM:** table/list with search, source filter (QR/Follow/Manual), date filter, bulk select, "Add customer" manual entry, and an export-CSV (real download of a generated CSV).
7. **Broadcast:** recipients (all / selected / tag) · template chips (Flash Sale, Naya Stock, Festival Wishes, Thank-you) · message editor with `{name}` and `{shop}` variables · **PhoneBezel live preview** with variable substitution · "Bhejein" → animated sent ticks ✓✓ in the bezel · send log.
8. **QR Standee Studio:** live poster preview (A5 ratio) · language toggle EN/HI/MR (all headline copy pre-translated) · category style auto-applied (wash + hero photo) · Retobiz lockup + language-matched tagline in the bottom band · real scannable QR → `/q/[qrCode]` · "Download PNG" (`html-to-image`) · **"Order Physical Standee for ₹49"** sheet (address prefilled, COD-demo, 3–5 days) → order status stepper.

**C. Admin**
1. **Overview:** KPI bento + 7-day sparkline trends + live activity feed + "needs attention" (pending verifications, new agency requests, undispatched orders).
2. **Shops:** table with search/filters, row expand (GSTIN, docs placeholders), toggles GST/Google/Approve/Suspend; changes reflect immediately on Buyer.
3. **Fulfillment Kanban:** drag between 4 columns (keyboard accessible via a "Move to" menu as an alternative); "Creator Assigned" prompts a creator picker from a seed list of local creators; "Delivered" prompts a deliverable title, which generates a Reel.
4. **QR Orders:** table + status advance button + tracking ID generation + filters + total ₹ collected.
5. **Masters:** Category CRUD (name, Hindi name, wash picker, image picker (registry), fallback glyph, order, active) with live preview tile; Sub-category CRUD; Location tree CRUD.
6. **Referrals:** distributor list + ledger table + per-distributor totals + commission rules (signup ₹50, verified ₹50, Pro ₹200, standee ₹10).

---

## 5. Folder Structure

```
retobiz/
├── app/                      # routes (§2)
├── components/
│   ├── ui/                   # Button, Chip, Badge, BottomSheet, Drawer, Tabs, Toast, Skeleton, StatTile, DataTable, PhoneBezel…
│   ├── media/                # RetailImage, PastelFallback, ReelViewer, Shutter
│   ├── brand/                # BrandLockup (SVG), StandeeFrame templates
│   ├── buyer/                # CategoryWindow, OfferCard, ShopCard, Rail, RotatingSearchHint, SearchOverlay, FilterSheet, OwnerModeBar, OptInSheet, VipPass…
│   ├── merchant/             # EngagementAlert, ProfileChecklist, OfferForm, Paywall, StudioPlanner, TemplateBriefForm, CrmTable, BroadcastComposer, StandeeDesigner…
│   ├── admin/                # KpiBento, ShopsTable, Kanban, QrOrdersTable, CategoryMaster, LocationTree, ReferralLedger
│   └── shell/                # RoleSwitcher, BuyerTopBar, BottomNav, Sidebar, StoreHydrationGate
├── store/                    # index.ts, slices/*.ts, selectors.ts, sync.ts
├── data/                     # seed.ts, images.ts (curated registry), rng.ts, festivals.ts, agency-templates.ts, translations.ts (EN/HI/MR)
├── scripts/                  # cache-images.mjs (optional offline mode)
├── lib/                      # types.ts, motion.ts, format.ts, geo.ts, search.ts, cn.ts
├── DESIGN.md
└── IMPLEMENTATION_PLAN.md
```

---

## 6. Phased Execution Plan (5 phases)

**Gate at the end of every phase:**
1. `tsc --noEmit`, `next lint` and `next build` are clean.
2. Manual visual pass at **390px** and **1440px**.
3. The phase's demo flow works start to finish.
4. A short checkpoint note goes to you listing what shipped and which DESIGN/PLAN §§ it implements.

The next phase starts only after your OK.

### Phase 1 — Foundations: Tokens, Primitives, Store, Seed, Shell
- Scaffold Next.js (TS strict, App Router, Tailwind v4), add deps, Prettier, `next.config` (`images.unoptimized`).
- Fonts (Jakarta, Be Vietnam Pro, Mukta), `@theme` tokens (DESIGN §11), `lib/motion.ts`, `lib/format.ts`, `cn()`.
- UI primitives (DESIGN §7): Button, Chip, Badge, DiscountChip, BottomSheet/Drawer, Tabs (`layoutId`), Toast, Skeleton, StatTile, EmptyState, **RetailImage + PastelFallback**, **BrandLockup**.
- Store: all slices, actions (§3.3), selectors (§3.4), persist + migrate + hydration gate + cross-tab sync (`storage` + `BroadcastChannel`), `resetDemo`.
- Curated `data/images.ts` registry (~70 vetted photos) + deterministic seed (**15 shops, ~45 offers**).
- Shell: RoleSwitcher (with reset), Buyer top bar + bottom nav, Merchant/Admin sidebars (routes stubbed).
- **Demo checkpoint:** switch roles; an action in one tab updates another tab; deliberately broken image URLs render clean pastel fallbacks.

### Phase 2 — Buyer Discovery
- `/` bento home: hero banner, rotating search hints, Category Window, offer/shop/new/reels rails, footer lockup.
- Predictive search overlay; `/search` facet engine (category, sub-cat, 4-tier location + radius, discount, verified, active offers, sort) with URL sync and zero-result recovery; `/category/[slug]`; `/offers` hub; location sheet.
- **Demo checkpoint:** every facet combination filters correctly; mobile thumb-zone rules (DESIGN §6.2) hold; desktop bento at 1440.

### Phase 3 — Storefront, Shutter, Reels, QR Opt-in
- `/shop/[slug]`: cover, badges, follow, tabs, in-shop search/filters, Explore-nearby path, Replay Shutter.
- Brushed slate-indigo **Shutter** (DESIGN §5.4), **Owner Mode Bar** (§5.7), **Reels Viewer** (§5.6) driven by a `?reel=` query param.
- `/q/[shopId]` QR entry → opt-in sheet → **VIP Pass** morph (EN/HI/MR) → `/passes`.
- **Demo checkpoint:** Journey 1 up to "customer appears in merchant CRM" (CRM shown as a raw list until Phase 4).

### Phase 4 — Merchant Growth OS
- `/list-your-shop` Profit Estimator + 3-step onboarding → instant storefront (shutter on the new shop) → pending in admin.
- `/merchant` Home: Truecaller-style alerts, KPI tiles, profile checklist, quick actions, activity.
- Offers list + upload with live preview; free-plan gate → **₹999/yr Pro Paywall** + demo toggle; Plan page; Profile editor (featured items reorder).
- **Agency Studio:** weekly AI planner + **7 priced templates** + Pro credits/discount logic + request tracker.
- CRM (filters, bulk select, CSV export) + **WhatsApp Broadcast** composer with PhoneBezel preview + buyer inbox.
- **QR Standee Studio** (EN/HI/MR, category styles, lockup + tagline, PNG download) + **₹49 order** flow + status stepper.
- **Demo checkpoint:** Journeys 2 (merchant half), 3, and the merchant halves of 4 and 5.

### Phase 5 — Admin Operations + Polish Pass
- `/admin` KPI bento + activity feed + needs-attention; Shop Verification table; **Agency Fulfillment Kanban** (drag + keyboard "Move to"; Delivered → Reel on the storefront); **₹49 QR Dispatch Tracker**; Category/Sub-category/Location **Masters** (live into Buyer filters + Merchant dropdowns); **Distributor Referral ledger**.
- `/demo` launcher page with Journey 1–5 quick links + reset.
- **Anti-Slop Visual & Responsiveness Polish Pass:**
  - every screen checked against DESIGN §10 at 390 and 1440
  - a dead-button sweep
  - an image audit (swap any weak photos)
  - reduced-motion check
  - font/CLS check
  - Vercel preview build
- **Demo checkpoint:** all 5 journeys run end-to-end across three tabs.

## 7. Demo Journeys (acceptance tests for the whole prototype)

1. **QR walk-in:** scan Laxmi Saree Centre standee → slate-indigo shutter → watch a reel → "Offer Claim Karein" → opt-in → VIP Pass (toggle to मराठी) → (switch to Shop Owner) new customer in CRM + alert → send WhatsApp broadcast → (switch to Buyer) message in My Passes.
2. **New shopkeeper:** "Apni Dukaan List Karein" → estimator → 3-step onboarding → instant storefront → (Admin) approve + GST verify → (Buyer) Verified badge in search with "Verified only" filter.
3. **Freemium:** (Shop Owner: Laxmi Saree Centre) view own storefront in Owner Mode → "+ Naya Offer" → post 1st offer (live on Buyer home) → try 2nd → paywall → demo Pro → posts → Admin referral ledger shows `pro_upgrade`.
4. **Agency-in-a-box:** Studio → see ₹199 vs "Included in Pro" → "Festival Offer Poster" brief → (Admin) Kanban New → Creator Assigned → In Review → Delivered → (Merchant) stepper complete → (Buyer) new reel on storefront.
5. **Standee + masters:** design MR standee (lockup + tagline) → order ₹49 → (Admin) dispatch → (Merchant) "Dispatched" · Admin adds sub-category "Smartwatch Straps" → visible in Buyer filters and Merchant upload.

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Remote photos break, load slowly or look off-brand | Typed registry with vetted URLs + sized query params; `RetailImage` skeleton → pastel fallback on error/6s timeout; optional `cache-images` script for offline demos; photo swaps are one-line edits |
| Real photos clash in colour/background | Curation rules (DESIGN §4.1) + multiply blend for light-bg photos and white-border treatment for busy ones (§4.3) |
| Hydration mismatch with persisted store | `skipHydration` + gate + skeletons; no store reads in server components |
| localStorage bloat / stale schema | `partialize`, activity cap 200, versioned `migrate`, Reset button |
| Regressions without automated tests | Strict TS + `next build` gate each phase; store actions kept small and pure; journeys re-run manually at each gate |
| Context drift across phases | This plan + DESIGN.md are the source of truth; each phase checkpoint lists the §§ it implements |
| Shutter/reel jank on low-end Android | Transform/opacity only, `will-change` only while animating, slats as one CSS background, reel frames preloaded one ahead |
| "Live" sync only within one browser | Documented as a demo constraint; cross-tab works, cross-device needs a backend (Phase 2 of the product) |

---

## 9. Locked Decisions

| # | Decision | Locked answer |
|---|---|---|
| 1 | Imagery | Curated high-res retail photography via the typed registry, with resilient pastel fallbacks. No hand-drawn product SVGs; SVG only for the brand mark, QR codes and standee frames. |
| 2 | Default demo merchant | **Laxmi Saree & Readymade Centre, Akurdi (Pune)**. Shree Ganesh Kirana and the other 13 shops are available via the shop switcher. |
| 3 | 7th agency template | **Google Review Booster Card** (7 templates total). |
| 4 | Agency pricing | ₹ add-on prices shown to Free users (§4 B5 table) + "Included in Pro (2 credits/mo + 40% off)" on every template. |
| 5 | Hosting | Standalone Next.js build, zero env vars, ready for 1-click Vercel preview. |
| 6 | Language | UI chrome in natural Indian English + Hinglish. Full EN/HI/MR toggle inside the QR Standee Studio and the VIP Member Pass. |

---

## 10. Phase 1 Build Decisions (as implemented)

| Area | Decision | Why |
|---|---|---|
| Next.js | 16.4 with Cache Components + Partial Prefetching (scaffold default) | Latest conventions. Path-aware shell parts (`usePathname`) sit under `<Suspense>`. |
| Hydration gate | `<Hydrated fallback={skeleton}>` around every store-driven view | Prerendered HTML = skeletons; no SSR mismatch, no `Date.now()` during prerender. |
| Store split | `store/index.ts` (persisted domain) + `store/ui.ts` (per-tab: hydrated, toasts, shutter-seen, route memory, sync marker) | Any `set()` on a persisted store writes the whole snapshot. Keeping UI-only state out stops a stale tab clobbering another tab's write (found and fixed during the cross-tab test). |
| Role | Derived from URL (`/merchant/*`, `/admin/*`, else buyer), never persisted | Each tab keeps its own role during three-tab demos. |
| Cross-tab sync | `storage` event → `persist.rehydrate()` → one-shot `LiveFlash` | Covers same-browser tabs; a BroadcastChannel isn't needed. |
| Seed | SSR renders a fixed-anchor seed; first client boot re-seeds with `Date.now()` | Relative times ("2 din pehle") stay truthful; resets are deterministic. |
| Freemium gate | `FREE_OFFER_LIMIT = 1` applies to `kind: 'offer'` only; showroom products are never gated | Matches guardrail 2. |
| Fonts | Self-hosted woff2 (`@fontsource`, latin + latin-ext for ₹ U+20B9, Mukta Devanagari) via `@font-face` | Zero network at build; Vercel-safe. |
| Images | 31 curated Pexels photos in `data/images.ts`; `npm run images:verify` HEAD-checks all 62 sized URLs | Build sandbox blocks image hosts, so run the verify script once on a networked machine or in CI. |
| Quality gate | `npm run check` = `next typegen` + `tsc --noEmit` + `eslint` + `next build` | Typegen is needed for the global `LayoutProps`/`PageProps`. |

---

## 11. Phase 2 Build Notes (as implemented)

- **Visual mode:** buyer routes follow DESIGN §12 (Bazaar Mode); dashboards are unchanged.
- **Engine:** one URL-synced `DiscoveryView` powers `/search`, `/category/[slug]` and `/offers`.
  - Params: `q, tab, cat, sub, loc, r, disc, v, live, sort, shop`.
  - `loc` = an area → radius search centred on that area.
  - `loc` = a city, district or state → tier filter with no radius.
  - `r=0` → no limit.
- **Store additions:** `buyerLocation {areaId, radiusKm}` (Location Sheet), `savedOfferIds` (heart), and `trackReelView`. All are persisted and merge into v1 state without a migration.
- **Reels:** `ReelViewerHost` is mounted in the buyer layout and opens via `?reel=` on any buyer route (Home today, the storefront in Phase 3).
- **Categories:** seed categories prerender via `generateStaticParams`; admin-added slugs resolve client-side from the store.
- **Demo switcher:** buyer pages use a desktop utility strip plus a mobile header icon; dashboards use the sidebar dock plus a mobile header icon. Nothing floats over content.
- **Known Phase 3 dependency:** "Offer Dekhein", shop cards and hero links land on `/shop/[slug]?offer=…`, which is still a placeholder until Phase 3.

## 12. Phase 3 Build Notes — Storefront (as implemented)

- **Imagery:** 42 local 3D cutouts (`public/images/*.webp`, `tone:"cutout"`), generated as ChatGPT sprite sheets and sliced by `scripts/slice-sprites.py`. The image audit reports 0 broken images on every buyer route at 390 and 1440.
- **Storefront** `/shop/[slug]`:
  - The shutter plays once per session; `?src=qr` forces it and auto-opens the opt-in sheet 1.2s after the reveal.
  - `?offer=` highlights and scrolls to an offer.
  - `?as=owner` (only when the shop is the active merchant) shows the indigo Owner bar and hides the buyer sticky CTA.
  - The escape hatch to nearby shops sits at the top and the bottom.
  - A repeat tap on CLAIM/Follow reopens the existing VIP pass instead of the form.
- **QR entry:** `/q/[code]` → storefront with `?src=qr`.
- **Passes:** `/passes` shows the passes grid (EN/HI/MR), a simulated WhatsApp inbox and saved offers.

## 13. Phase 4 Build Notes — Merchant Growth OS (as implemented)

- **`/list-your-shop`:** a profit estimator with daily walk-ins and average bill.
  - Assumptions shown openly: 18% scan, 35% return, 22% margin.
- **`/list-your-shop/onboard`:** a 3-step wizard (Dukaan → Location → Bharosa) with a "Demo fill" chip.
  - It creates the shop (pending verification), switches the active merchant and lands on `/shop/{slug}?as=owner&src=qr` (the shutter plays).
  - The distributor code (e.g. `GD-PUN`) logs a referral signup.
- **`/merchant` home:**
  - Truecaller-style views strip plus live alerts from activity (follow / QR / clicks).
  - KPI tiles, a 6-item growth checklist with a progress ring, offer quota, quick actions and recent customers.
- **Offers:**
  - The list has Offers/Showroom tabs and pause/live toggles; re-living over the limit opens the paywall.
  - The composer has category photo picks or your own photo (resized to 640px JPEG) and a live `OfferCard` preview.
  - Paywall: Free = 1 live offer. The 2nd offer opens the ₹999/yr sheet; "Pro lein" upgrades in demo mode and auto-publishes the kept form.
- **Plan:** Free vs Pro cards, a comparison table and a demo downgrade.
- **Profile:** edit name, tagline, hours, address and landmark; verification status; Top-10 showroom reorder.
- **Studio:**
  - Weekly planner (rule-based per category; today highlighted).
  - 7 templates showing Free ₹ list price + "Included in Pro", or for Pro, credit / 40% off.
  - Request sheet: goal, offer, language, notes.
  - Tracker with a 4-step stepper. Admin moves requests in Phase 5.
- **CRM:** search, source chips, bulk select, CSV export, manual add; selected customers can be sent to broadcast via `?to=`.
- **Broadcast:**
  - Audiences: all / QR / this week / selected.
  - 4 templates with `{name}`/`{shop}`, a phone-bezel WhatsApp preview and history.
  - Delivery reaches the buyer's `/passes` inbox.
- **QR Standee Studio:** an A-series standee in EN/HI/MR with Festive/Classic/Bold styles, a QR to `/q/{code}`, the lockup and tagline.
  - PNG export via html-to-image at 3x (verified 1080×1527).
  - The ₹49 order sheet feeds an order stepper.

## 14. Phase 5 Build Notes — Admin + Polish (as implemented)

- **`/admin` overview:**
  - Ink revenue hero (Pro + Studio + Standees, animated) inside a KPI bento.
  - "Needs attention" cards for pending verification, new agency requests and undispatched standees, each with a deep link.
  - Verification queue and live activity feed.
- **Shop Verification:** search + status chips (`?f=pending` deep link), GST/Google switches, and Approve / Suspend / Reject.
  - `isVerified` is recomputed and the buyer's "Verified only" search updates live.
  - A verified shop logs a referral.
- **Agency Kanban:** HTML5 drag between columns, plus a keyboard-friendly "Move to…" select on every card.
  - Moving to "Creator Assigned" opens the creator picker.
  - Moving to "Delivered" opens a caption sheet and creates a Reel, which appears in the storefront's story-style reels strip and Reels tab and completes the merchant's stepper.
- **QR Orders:** status chips plus one-tap advance (Print → Dispatch → Delivered). Dispatch generates a tracking ID that is visible in the merchant's Standee Studio.
- **Masters:**
  - Category CRUD with a live tile preview, wash + cutout picker, active toggles, and sub-category add/toggle (live in buyer filters + merchant upload).
  - Location tree (state → district → city → area) with inline add; new areas inherit a nearby centroid so radius search still works.
- **Referrals:** per-distributor totals, a commission legend and the ledger (signup ₹50 / verified ₹50 / Pro ₹200 / standee ₹10).
- **`/demo`:** a launcher with buttons that open each role in a new tab, a reset button, and 5 journey cards with deep links.
- **Verified end-to-end (Playwright, 3 tabs):** J2 onboard → approve → verified search · J3 paywall → Pro → auto-publish → `pro_upgrade` · J4 brief → Kanban → Delivered → reel on storefront · J5 standee → dispatch → merchant tracking; new sub-category in the buyer filter.
- **Image audit:** 0 broken images across 16 routes at 390 and 1440.
- **Gemini final-review fixes:**
  - `/demo` journey links pin Laxmi Saree as the active shop (J1/3/4/5).
  - "QR scan (naya tab)" buttons on `/demo` and the Standee Studio keep the presenter in one browser (localStorage sync does not reach a second device).
  - J1 verified live across 2 tabs (QR → shutter → opt-in → मराठी pass → CRM 38→39 → broadcast → buyer inbox).
  - Responsive sweep: 25 routes at 390px with no horizontal overflow. The custom `sm` breakpoint is 390px, so 2+-column layouts use `md:`.

## 15. Visual Craft, Real Media & Motion Pass (v3.1)

- **Real media:** 9 photoreal 9:16 Reel/UGC frames generated in ChatGPT as 3 triptychs, sliced by `scripts/slice-reels.py` into `public/images/reels/` (6) and `public/images/studio/` (3). They are registered as `tone: "photo"`. Studio deliveries pick a frame by shop category via `CATEGORY_REEL_PHOTO`.
  - `ReelCard`, `ReelViewer`, the storefront story strip, the Studio templates, the Kanban thumbnails and `/demo` all use these real frames. Cutout-on-gradient reels have been removed.
  - Cards show a creator handle pill, a REEL/UGC badge and a play pill.
  - `STORE_VERSION` is now 3, so persisted demos reseed with the new reel frames.
- **Buyer:**
  - Marigold → cream `bazaar-canvas` header with a 6% toran watermark and glass location/search pills.
  - The top category strip is replaced by a quick-filter strip: Sab Deals · Under ₹499 (new `max` param) · Verified Only · Flash Sales · 30%+ off · Reels · Naye Shops.
  - The Category Window sits in a white 28px dock.
  - Offer cards are white 22px squircles with a taller stage, ₹17px price pills, hover lift and tap scale.
  - Grids are 4 columns on desktop and 2 on mobile.
  - Clicking a shop card adds `?src=card`, which always plays the shutter.
- **Dashboards:**
  - Floating 26px sidebar dock with a larger lockup, 21px icons and 16px nav pills; the shop/ops identity card sits at the bottom above the role pill.
  - Shared tokens `--shadow-soft` and `--shadow-lift`; `Card` and `StatTile` use 22px radii with tinted squircle icon badges.
  - Merchant home is a 12-column bento: an indigo views hero (7 columns) next to a live-activity ticker (5 columns, padded with recent CRM opt-ins).
  - Admin revenue hero uses a #181F4B → #2B3684 gradient with an inset highlight.
  - Kanban: tinted 22px column tracks, template thumbnails, creator avatar pills, a one-tap "next stage" button and a custom "Move to" popover (no native select).
  - Studio shows 4-column photo templates plus a "Kuch aur chahiye?" tile.
- **`/demo`:** keynote-style command deck: editorial hero, dark-indigo quick-launch dock, photo journey cards with step timelines and role chips, auto-pinned shop, "Open QR in new tab" for J1, and a presenter-tips tile.
- **Verified:** tsc/eslint/build clean; J1–J5 Playwright journeys pass; 25 routes at 390px have no horizontal overflow; no broken images.
