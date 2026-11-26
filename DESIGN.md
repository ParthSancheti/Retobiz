# Retobiz — Design System (`DESIGN.md`)

> Status: **v2 — revised per stakeholder review, awaiting GO** · Scope: Phase-1 interactive prototype (Buyer · Shop Owner · Admin)
> Stack this maps to: Tailwind CSS v4 `@theme` tokens · `next/font` · Motion (Framer Motion) · Lucide React

---

## 0. North Star

**"The busiest, friendliest bazaar lane, laid out on a clean counter."**

Retobiz should feel like walking down Akurdi's main road at 7 pm: lots going on, signboards competing, offers everywhere. The UI should still be as orderly as a well-kept kirana shelf. We borrow:

| From | We take | We do NOT take |
|---|---|---|
| Blinkit / Zepto | Pastel cutout tiles, dense horizontal rails, saffron banners, ₹ price punch | Cart, ETA timers, checkout urgency |
| Swiggy | Flame-orange CTAs, offer ribbons, warm food-grade appetite | Delivery chrome |
| Justdial | Category depth, location precision, "verified" trust stacking | Cluttered ad slots, phone-number walls |
| IndiaMART | GST / trust badges, business credibility | Grey B2B tables on buyer screens |
| Instagram | Shop profile grammar (followers, grid, reels) | Infinite feeds, likes as currency |

Three tests every screen must pass:
1. **The Kaka test:** a 55-year-old saree shop owner in Malegaon understands the primary action without reading more than 6 words.
2. **The thumb test:** every primary action on mobile sits in the bottom 40% of the screen.
3. **The slop test:** if a screenshot could pass for a generic AI SaaS template, it fails.

---

## 1. Color System

### 1.1 Core tokens

| Token | Hex | Role |
|---|---|---|
| `--color-canvas` | `#F6F7FA` | App background (light-first; there is no dark mode in Phase 1) |
| `--color-surface` | `#FFFFFF` | Cards, sheets, nav, inputs |
| `--color-surface-sunk` | `#EEF0F4` | Input wells, segmented-control tracks, skeletons |
| `--color-hairline` | `#E6E8EE` | 1px borders and dividers (default border everywhere) |
| `--color-hairline-strong` | `#D5D8E0` | Focused or hovered borders, table rules |

### 1.2 Ink (typography)

| Token | Hex | Use |
|---|---|---|
| `ink-900` | `#12141A` | Headings, prices, primary text |
| `ink-700` | `#3A3F4B` | Body text |
| `ink-500` | `#6B7180` | Secondary text, metadata, timestamps |
| `ink-300` | `#A9AEBA` | Placeholder text, disabled states |

### 1.3 Brand accents (each has **one job**)

| Family | 50 | 100 | 500 | 600 | 700 | Semantic job |
|---|---|---|---|---|---|---|
| **Indigo** (trust, authority) | `#EEF0FB` | `#DDE1F7` | `#3B49C4` | `#2F3BA8` | `#252F86` | Verified badge, merchant/admin primary, active nav, links |
| **Flame** (hot deals, buyer CTA) | `#FFF1EC` | `#FFDCCF` | `#FF5A2C` | `#EC4613` | `#C2370C` | Offer %, "Apni Dukaan List Karein", buyer primary CTA, paywall CTA |
| **Saffron** (lively, VIP) | `#FFF8E1` | `#FFEDB0` | `#FFC629` | `#F5B400` | `#8A6400` | Banners, VIP Member Pass, Pro badge, festival highlights |
| **Leaf** (WhatsApp, verified-GST, open) | `#EAF8EF` | `#CFF0DB` | `#1FAA59` | `#168A47` | `#106B37` | WhatsApp opt-in, "Open now", GST ✓, success toasts |

Danger is used sparingly: `#D92D20` on `#FEF0EE`, for destructive admin actions and form errors only.

**Rules**
- Flame is the **buyer** action color and Indigo is the **merchant/admin** action color. Never put both as primaries on the same screen.
- Saffron is **never** used for text on white. For text on saffron, use `saffron-700` or `ink-900`.
- For flame text on white, use `flame-600`, which meets AA for bold ≥14px. Body-size flame text is banned.
- Leaf means "yes / safe / WhatsApp". Don't spend it on decoration.
- Accent coverage: at most about 15% of any viewport. Most of each screen is canvas, white and ink.

### 1.4 Pastel washes (image frames & category tiles)

| Wash | Hex | Default categories |
|---|---|---|
| Mint | `#E3F6EC` | Kirana & General Store · Medical & Chemist |
| Peach | `#FFE9DD` | Bakery & Mithai · Footwear & Bags |
| Sky | `#E3EEFD` | Mobile & Repair · Hardware & Electricals |
| Cream | `#FFF6DC` | Jewellers & Imitation · Stationery & Gifts |
| Lavender | `#EEEAFB` | Saree & Readymade Apparel · Salon & Parlour |

- Every category in the Category Master stores its `wash`. New admin-created categories pick from these 5 and never get a random color.
- Pastels are **flat fills**. No gradients on tiles.

### 1.5 Shutter & brand-dark tokens
| Token | Hex | Use |
|---|---|---|
| `slate-900` | `#1E2436` | Shutter slat base, standee dark variant |
| `slate-800` | `#2B3245` | Shutter slat highlight band, Owner Mode Bar hover |
| `slate-600` | `#465069` | Slat grooves, bottom rail |
| `sheen` | `rgba(255,255,255,.14)` | Static top specular strip on the shutter |

### 1.6 Gradient policy
- **Allowed:** (a) the shop shutter's brushed slate-indigo slat shading and its static top specular sheen (§5.4, functional realism); (b) a single saffron→flame 2-stop on the **festival banner only** (`#FFC629 → #FF7A45`, 120°); (c) the bottom scrim on reel/photo overlays (`rgba(18,20,26,0) → .65`) for caption legibility.
- **Banned:** purple→pink, blue→purple, any gradient text, glassmorphism blobs, glows, mesh backgrounds.

---

## 2. Typography

### 2.1 Families (via `next/font/google`, self-hosted, `display: swap`)

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display / headings | **Plus Jakarta Sans** | 600, 700, 800 | Tight tracking at large sizes |
| Body / UI / numbers | **Be Vietnam Pro** | 400, 500, 600, 700 | `font-variant-numeric: tabular-nums` on all ₹, %, counts |
| Devanagari (HI/MR) | **Mukta** | 500, 700 | QR Standee, Hinglish/Marathi strings, VIP pass greeting |

Banned: Inter, Roboto, Space Grotesk, system-ui as a visible face, and monospace for prices.

### 2.2 Scale (mobile → desktop)

| Token | Mobile | Desktop | Font | Weight | Tracking | Use |
|---|---|---|---|---|---|---|
| `display` | 32/36 | 44/48 | Jakarta | 800 | -0.02em | Landing hero, shop name on storefront |
| `h1` | 24/30 | 30/36 | Jakarta | 700 | -0.015em | Page titles |
| `h2` | 20/26 | 22/28 | Jakarta | 700 | -0.01em | Section titles ("Aaj ke Offers") |
| `h3` | 16/22 | 17/24 | Jakarta | 700 | -0.005em | Card titles, shop names in lists |
| `body` | 15/22 | 15/22 | Vietnam | 400 | 0 | Default text |
| `body-sm` | 13/18 | 13/18 | Vietnam | 500 | 0 | Metadata, addresses |
| `caption` | 11/14 | 11/14 | Vietnam | 600 | +0.04em, uppercase | Eyebrows, badge labels |
| `price-lg` | 22/24 | 24/28 | Vietnam | 700 | -0.01em | Offer price |
| `price-strike` | 13/16 | 13/16 | Vietnam | 500 | 0 | MRP with `line-through`, `ink-500` |
| `discount` | 12/14 | 12/14 | Vietnam | 800 | 0 | "40% OFF" chip |

**Rules**
- Use the ₹ glyph with no space: `₹1,299`. Format with Indian grouping via `Intl.NumberFormat('en-IN')` (`₹1,24,500`).
- Large counts use the Indian short form: `1.2K followers`, `2.4L views`. Never "120k".
- Body text never goes below 13px on mobile.

---

## 3. Space, Radius, Elevation, Borders

**Spacing (4px base):** `1=4 · 2=8 · 3=12 · 4=16 · 5=20 · 6=24 · 8=32 · 10=40 · 12=48 · 16=64`
- Mobile page gutter: 16. Desktop: 24 to 32. Card padding: 12 (dense) or 16 (default).
- Rail item gap: 12. Section vertical rhythm: 28 mobile, 40 desktop.

**Radius**
| Token | px | Use |
|---|---|---|
| `r-sm` | 8 | Chips, badges, inputs |
| `r-md` | 12 | Buttons, small cards |
| `r-lg` | 16 | Product/offer cards, category tiles |
| `r-xl` | 24 | Bottom sheets (top corners only), hero banners |
| `r-full` | 9999 | Pills, avatars, FABs |

**Elevation** (warm and low; never a big blurry drop)
| Token | Value | Use |
|---|---|---|
| `shadow-0` | none + 1px hairline | Default cards (borders do the work) |
| `shadow-1` | `0 1px 2px rgba(18,20,26,.06)` | Resting raised elements |
| `shadow-2` | `0 6px 16px -6px rgba(18,20,26,.14)` | Hovered card, sticky header after scroll |
| `shadow-sheet` | `0 -8px 32px -8px rgba(18,20,26,.18)` | Bottom sheets, drawers |
| `shadow-ground` | radial ellipse `rgba(18,20,26,.18)→0`, 70% w × 10px h | Under framed product photos & category tiles only |

**Borders:** 1px `hairline` is the default separator. A 2px border appears only on focused inputs (`indigo-500`) and on the selected state of selectable cards.

---

## 4. Curated Retail Visuals + Pastel Frame System (the Blinkit layer)

> Decision (locked): **no hand-drawn product SVGs.** We use curated real-world photographs inside pastel frames. Custom SVG is used only for the **Retobiz brand mark**, **QR codes** (`qrcode`) and **QR standee frames**.

### 4.1 Image sourcing & curation
- **Source:** license-free, high-resolution photography (Unsplash / Pexels, `images.unsplash.com` / `images.pexels.com`) of **Indian retail goods and shopfronts**: Paithani & cotton sarees, kurtis, kolhapuri chappals, school bags, kaju katli & pedha trays, kirana staples, phone accessories, LED bulbs & switches, oxidised jewellery, stationery, salon interiors.
- **Curation rules** (every URL is vetted by a human eye before it enters `data/images.ts`):
  1. Product photos should be on a **plain light or white background** whenever possible. This lets the frame do the cutout trick (§4.3).
  2. No identifiable faces in product shots. Reels may show hands, shop interiors, and people at a distance.
  3. No visible third-party logos or brand packaging, and no western cafe/latte imagery.
  4. Warm, daylight colour temperature. Reject heavily filtered, dark or moody images.
  5. Request a sized URL (`?w=600&q=80&auto=format&fit=crop` for cards, `w=1080` for reels) so we never pull 6 MB originals.
- **Registry:** `data/images.ts` exports a typed map `ImageKey → { src, alt, focal?: 'center'|'top'|'bottom', tone: 'light'|'busy' }`. Seed data references keys and never raw URLs. Swapping a weak photo is then a one-line change.
- **Resilience:** `<RetailImage imageKey fallback={{ categoryId, label }} />`
  - It renders a plain `<img loading="lazy" decoding="async">` (or `next/image` with `unoptimized`) and shows a pastel-wash skeleton until `onLoad`.
  - `onError` and a 6s timeout swap in the **Pastel Fallback**: the category wash plus a centered Lucide category glyph (32px, `ink-700`, stroke 1.75) and a 1-line label. It looks intentional, so **a broken image never appears**.
  - Optional hardening for live demos: `npm run images:cache` downloads all registry images into `/public/img/` and flips the registry to local paths (one-command offline mode).

### 4.2 Category Tiles (10)
```
┌──────────────────────────┐  r-lg, pastel wash fill, no border, aspect 1:1
│   ┌──────────────────┐   │
│   │  curated product │   │  ← photo masked in r-md, 78% width, bottom-aligned,
│   │  thumbnail       │   │    mix-blend-multiply on wash (white bg → disappears)
│   └──────────────────┘   │
│      ░░░░░░░░░░░░        │  ← ground shadow ellipse (shadow-ground)
└──────────────────────────┘
  Saree & Readymade         ← label OUTSIDE tile, 13px/600, 2-line clamp
```
- Each category has **one hero image** picked to read as the category at 64px: a folded Paithani for Saree, kolhapuri chappals for Footwear, a kaju katli tray for Mithai, and so on.
- The image is stored on the Category record (`imageKey`). For an admin-created category, the admin picks from the image registry. If none is chosen, the tile uses the Pastel Fallback glyph tile, which is designed to sit comfortably next to photo tiles.

### 4.3 The cutout effect (how photos look like Blinkit cutouts)
1. The tile/card has a flat pastel wash.
2. The photo sits in an inner frame (`r-md`, 10–14px inset) with `mix-blend-mode: multiply`. White backgrounds melt into the wash, so the product appears "cut out".
3. A `shadow-ground` ellipse sits under the frame's bottom edge.
4. Photos tagged `tone: 'busy'` (non-white backgrounds) skip the blend. They get a crisp 2px white inner border + `shadow-1`, which reads as a printed photo card on the wash. This is deliberate rather than accidental.

### 4.4 Interaction
- **Hover (pointer devices only):** container `y: -4`, image `y: -6, scale: 1.04`, ground shadow `scaleX: .88, opacity: .7` (`spring.gentle`). The image lifts more than the tile, which gives parallax.
- **Press:** `scale: 0.96` (`spring.snappy`).
- No idle animation. Tiles don't wobble, float or pulse.

### 4.5 Product / offer cards
- Image area: 1:1 pastel wash (from the sub-category's category) + framed photo per §4.3 + a **sharp top-left discount badge** (`flame-500` bg, white 12/800, `r-sm`, 8px from edges, overlapping the frame by 4px).
- Below: title (2-line clamp) · `price-lg` + `price-strike` · shop name + 1-line distance ("Akurdi · 1.2 km") + verified tick.
- Offers with an expiry show a slim `saffron-50` strip: "Sirf 3 din baaki".

### 4.6 Brand mark, tagline & SVG scope
- **Retobiz lockup** (custom SVG, the only hand-authored brand art): a compact shop-awning glyph (3 scalloped stripes, indigo/flame/saffron) + the wordmark "retobiz" (Jakarta 800, `ink-900`, tracking -0.03em). It comes in three sizes: `sm` 20px header, `md` 28px footer/standee, `lg` 40px `/list-your-shop` hero.
- **Heritage tagline:** *"व्यवसाय तुमचा, प्लॅटफॉर्म आमचा"* (Mukta 500, `lang="mr"`, `ink-500`, 12–14px).
  - **Header:** the lockup only on mobile; lockup + tagline on desktop ≥1024.
  - **Footer:** lockup + tagline + "Made for Bharat ki dukaanein".
  - **`/list-your-shop`:** a large lockup with the tagline as the hero eyebrow.
  - **QR Standee:** the lockup in the bottom band + the tagline in the selected standee language (EN: "Your business, our platform", HI: "व्यवसाय आपका, प्लेटफ़ॉर्म हमारा", MR: original).
  - **Shutter:** the tagline is painted on the bottom rail (§5.4).
- The only other custom SVGs are QR codes (`qrcode` lib output) and the standee frame templates (3 category styles × 3 languages, all built from tokens).

## 5. Motion System (Apple-fluid, never chaotic)

Implementation: `motion/react` (Framer Motion). All values live in `lib/motion.ts` and are never inlined ad hoc.

### 5.1 Spring tokens
| Token | stiffness | damping | mass | Use |
|---|---|---|---|---|
| `spring.default` | 380 | 28 | 1 | Bottom sheets, drawers, modals |
| `spring.snappy` | 520 | 32 | 0.8 | `whileTap`, toggles, chip selection |
| `spring.pill` | 420 | 34 | 1 | `layoutId` tab/segment pill morphs |
| `spring.gentle` | 260 | 30 | 1 | Card hover lift, list reorder (Kanban) |

### 5.2 Tween tokens (only where a fixed duration matters)
| Token | Duration | Easing | Use |
|---|---|---|---|
| `ease.out` | 200ms | `[0.22, 1, 0.36, 1]` | Fades, toasts in |
| `ease.inOut` | 280ms | `[0.65, 0, 0.35, 1]` | Route-level content swap |
| `ease.shutter` | 650ms | `[0.32, 0.72, 0, 1]` | Shop shutter (see 5.4) |

### 5.3 Choreography rules
- **Staggered reveal:** `staggerChildren: 0.035`, child `y: 8 → 0, opacity: 0 → 1`, max 8 staggered items (the rest appear together). It runs on first mount only and never on re-render or filter change.
- **Filter changes:** results use `AnimatePresence mode="popLayout"` + `layout` with `spring.gentle`, so cards slide into new places without replaying the entrance.
- **Bottom sheet:** enters `y: 100% → 0` (`spring.default`) with backdrop `rgba(18,20,26,.4)` fading in 200ms. Drag-to-dismiss is allowed: past 30% height or velocity > 500, it closes.
- **Tab pill:** a single `motion.div layoutId="nav-pill"` per tab group.
- **Counters** (KPIs, followers): animate number on *change* only, 400ms, `tabular-nums`.
- **Live-sync pulse:** when a value updates because of another role's action, it gets a one-shot 600ms `leaf-50` background flash. It never loops.
- **Banned:** infinite bounce/pulse/float/shimmer loops. There are three sanctioned, purposeful cycles: the skeleton shimmer (only while loading, capped at 600ms of simulated latency), the rotating search placeholder (§5.5, pauses on focus/hidden/off-screen), and reel progress (§5.6, user-pausable), rotate-in, flip cards, parallax scroll-jacking, confetti storms. One restrained confetti burst is allowed **once** on VIP Pass creation and once on onboarding completion.
- **`prefers-reduced-motion`:** springs become 150ms opacity fades, the shutter becomes a 150ms crossfade, the search placeholder becomes static, reels drop Ken-Burns, and hover lifts are disabled.
- **Performance:** animate only `transform` and `opacity`. No `filter: blur` animations, no layout animations on lists longer than 40 items.

### 5.4 Signature: Digital Shop Shutter (0.65s) — Brushed Slate-Indigo
```
LAYERS (top → bottom of shutter, full viewport)
  Sheen     static 18% height strip at top: linear-gradient(rgba(255,255,255,.14) → 0)
  Fascia    painted signboard band at 16–34% height: category wash fill, 3px slate-600
            frame, shop name (Jakarta 800, 28–44px, ink-900), category caption,
            Verified ✓ chip (indigo) if verified. Slight inner shadow = "painted metal".
  Slats     repeating-linear-gradient(180deg,
              #2B3245 0 2px, #1E2436 2px 11px, #465069 11px 12px)  → 12px pitch,
            plus a 1px rgba(255,255,255,.05) highlight per slat for brushed feel
            (single background, NOT 60 DOM nodes)
  Rail      bottom 44px: slate-600 bar, centred lock-notch, tagline
            "व्यवसाय तुमचा, प्लॅटफॉर्म आमचा" (Mukta 500, 13px, white/70%)
Underneath: bright #FFFFFF showroom (storefront cover + content), max contrast reveal.

TIMELINE
t=0ms     Shutter covers storefront.
0–80ms    Unlatch: y 0 → +6px.
80–650ms  Lift: y +6px → -100%, ease.shutter. Slats scaleY 1 → .96 (origin top), as if
          rolling into a drum. A 28px soft shadow (rgba(18,20,26,.35)) under the rail
          travels up, casting onto the white showroom.
300–650ms Showroom: opacity 0 → 1, scale .985 → 1, y 12 → 0.
650ms     Shutter unmounted; focus → storefront h1.
```
- Plays **once per shop per session** (tracked in non-persisted store state). The "Replay shutter" ghost button (`RotateCcw`, top-right of cover) re-triggers it. A QR entry (`/q/[shopId]`) always plays it.
- `will-change: transform` is set only during the animation. No sound, no haptics.
- Reduced motion: a 150ms crossfade from shutter to showroom.

### 5.5 Rotating predictive search placeholder
- Applies to the Buyer Home top bar and `/search`. Hints cycle **every 2.8s**: `Search 'Paithani Saree'…` → `'Kaju Katli'…` → `'Mobile Screen Guard'…` → `'Kirana Combo'…` → `'Kolhapuri Chappal'…` → `'BP Monitor'…`.
- The static prefix "Search" stays put, and only the quoted term animates. Outgoing term: `y: 0 → -10, opacity 1 → 0` (180ms `ease.out`). Incoming: `y: 10 → 0, opacity 0 → 1` (220ms, 40ms delay). The term is clipped in a fixed-height overflow-hidden span, so there's no layout shift.
- Hints come from the active area's top offers when available (e.g. "Search 'Paithani Saree' in Akurdi"), falling back to the static list.
- **Pauses** when the input is focused or has a value, when the tab is hidden (`visibilitychange`), and when the element is off-screen (IntersectionObserver).
- Reduced motion: a static "Search sarees, mithai, mobile repair…".
- The real `<input placeholder>` is set to the static string for screen readers. The animated layer is `aria-hidden`.

### 5.6 Reels player
- Opened via a **`?reel=<reelId>` query param** on `/shop/[slug]` (and on Home for the reels rail), with no parallel or intercepted routes. Closing removes the param (`router.replace`, scroll preserved). The URL stays shareable.
- Full-bleed **9:16** viewer: a modal on desktop (centered 420×746, `r-xl`, backdrop `rgba(18,20,26,.8)`) and full-screen on mobile.
- **Ken-Burns:** each reel is 2–4 curated photos, ~5s per frame. Each frame does one pan + zoom (`scale 1.0 → 1.08`, `x/y ±3%` toward the image's `focal`) as a linear tween over its duration, with a 300ms crossfade between frames. It runs once per frame; the next reel starts only on user swipe/tap or auto-advance at the end.
- **Story progress bar** (Instagram-style): segmented 2px bars at the top (white/35% track, white fill), with the fill tracking frame progress and a 4px gap between segments. Shop monogram + name + Verified tick + "2 din pehle" below it.
- **Kinetic caption:** an offer headline in Jakarta 800, 28–34px, white on the bottom scrim. Words enter with a 40ms stagger (`y: 14 → 0, opacity`, `spring.snappy`) on each new frame. The price chip shows `₹1,299` + a strike MRP + a `flame-500` "% OFF" badge.
- **Gestures:** press-and-hold **pauses** (progress + Ken-Burns freeze, caption dims to 80%); release resumes. Tapping the left or right third goes to the previous or next frame. A swipe down or `Esc` closes. Arrow keys work on desktop.
- **Sticky bottom CTA pill:** "Offer Claim Karein" (flame, opens the opt-in sheet prefilled with the offer) + "Follow" (white outline), 52px, above the safe area. When the viewer already follows the shop, it shows "✓ Following".
- Reduced motion: no Ken-Burns, instant frame cuts, and the progress bar still advances.

### 5.7 Owner Mode Bar (merchant viewing own storefront)
- Shown when `role === 'merchant'` and `shop.id === activeMerchantShopId` on `/shop/[slug]`, *after* the shutter lifts. It slides down `y: -100% → 0` with `spring.default`.
- Sticky top, 48px, `indigo-600` bg, white text: left "**Aapki dukaan live hai** · 51 views is hafte" (live count, flashes on change); right two compact buttons: `Edit Storefront` (white/15% bg) → `/merchant/profile`, `+ Naya Offer` (white bg, indigo text) → `/merchant/offers/new`.
- The buyer Follow CTA is replaced by a muted "Aap owner hain — buyers ko yeh button dikhega" preview chip.
- Mobile: the copy collapses to "Live · 51 views" + two icon buttons with labels.

## 6. Layout & Thumb-Zone Geometry

### 6.1 Breakpoints
`sm 390` (base design width) · `md 768` · `lg 1024` · `xl 1280` · `2xl 1440` (content max-width 1280, centered)

### 6.2 Mobile (< 768)
```
┌───────────────────────────┐
│ Top bar 56: location pill │  ← "Akurdi, Pune ▾" (opens location sheet)
│ + search field (48)       │     + flame "Dukaan List Karein" chip
├───────────────────────────┤
│                           │  STRETCH ZONE (top 30%): read-only content,
│   banners / category      │  headers, banners. No primary actions.
│   window / rails          │
│                           │  NATURAL ZONE (middle): rails, cards, filters
│                           │
│   ┌─────────────────────┐ │  EASY ZONE (bottom 40%): primary CTA,
│   │  Sticky CTA bar     │ │  sticky "Follow & WhatsApp pe Offers Paayein",
│   └─────────────────────┘ │  sheet handles, FAB
├───────────────────────────┤
│ Bottom nav 64 + safe-area │  Buyer: Home · Search · Offers · My Passes
└───────────────────────────┘  Merchant: Home · Offers · Studio · Customers · More
```
- Min tap target **44×44**. Primary buttons are **52** tall and full-width in sheets.
- Horizontal rails show 2.3 cards (so scroll is obvious) with `scroll-snap-type: x mandatory`, 16px inset padding, and the scrollbar hidden.
- Filters live in a bottom sheet (never a top dropdown on mobile). Applied filters show as a horizontal chip row under search.
- `padding-bottom: env(safe-area-inset-bottom)` on the bottom nav and sticky bars.

### 6.3 Desktop (≥ 1024)
- **Buyer:** a 12-col grid. Home is a **bento**: 8-col hero offer banner + 4-col "Nearby verified shops" stack; category window as a 5×2 tile grid; offer grid of 4 to 5 columns. Search uses a left 280px filter rail + results grid.
- **Merchant & Admin:** 248px left sidebar (collapsible to 72px icons), top bar 64, content max 1200. The merchant home is a bento of alert strip + KPI tiles + checklist + quick actions.
- The bottom nav is replaced by the top bar + sidebar. Bottom sheets become right-side drawers (480px) or centered modals (≤560px) depending on content.

### 6.4 Demo Role Switcher
- A floating segmented pill (`Buyer | Shop Owner | Admin`), bottom-left on desktop and above the bottom nav (right side, collapsed into a 40px `Users` icon FAB) on mobile.
- Surface: `ink-900` at 92% with white text, so it's clearly *meta UI* and not part of the product. `layoutId` pill morph.
- Includes a tiny "Reset demo data" item behind a long-press or `⋯` menu.

---

## 7. Component Inventory (visual contract)

| Component | Key specs |
|---|---|
| `Button` | Variants: `primary-flame`, `primary-indigo`, `secondary` (white + hairline), `ghost`, `whatsapp` (leaf-500 + WhatsApp glyph). Sizes 36/44/52. `whileTap 0.96`. Loading = inline spinner replacing the icon, never the label. |
| `Chip` / `FilterChip` | 32h, r-full, hairline. Selected = `ink-900` bg, white text, with a check icon sliding in. |
| `Badge` | `Verified` (indigo-50 bg, indigo-600 `BadgeCheck`), `GST` (leaf), `Google` (white + hairline, "G" monogram — no Google logo), `Pro` (saffron), `New` (flame-50). |
| `DiscountChip` | flame-500 bg, white 12/800, r-sm, angled 0°. No starbursts. |
| `CategoryTile` | §4.2–4.4. Curated photo in pastel frame, Pastel Fallback glyph if missing. |
| `OfferCard` / `ProductCard` | §4.5. |
| `RetailImage` | §4.1. Skeleton → photo (multiply blend or white-border by `tone`) → Pastel Fallback on error/timeout. The only way images render. |
| `BrandLockup` | §4.6. `sm/md/lg`, `withTagline`, `lang` prop for standee variants. |
| `RotatingSearchHint` | §5.5. |
| `ReelViewer` | §5.6. Segmented progress, Ken-Burns frames, kinetic caption, hold-to-pause, sticky CTA pill. |
| `OwnerModeBar` | §5.7. |
| `Shutter` | §5.4. One component, `play()` / `replay()` via store, reduced-motion aware. |
| `ShopCard` | Monogram + name + verified + area·distance + "3 offers" flame text + open/closed leaf/ink dot. |
| `BottomSheet` | r-xl top, 36×4 grabber, `spring.default`, focus-trapped, Esc/drag closes. |
| `SegmentedControl` / `Tabs` | sunk track, white pill `layoutId`, `spring.pill`. |
| `Toast` | Bottom-center (above nav), ink-900 surface, 3s, with optional "Undo". |
| `StatTile` | Label caption + big number (Jakarta 700, tabular) + delta chip (leaf ▲ / danger ▼) + optional sparkline (indigo-500, 1.5px). |
| `EngagementAlert` | Sticky strip, indigo-50 bg, left icon, one line ("51 log ne aapki profile dekhi is hafte"), chevron. Dismissible. Rotates on change only, not on a timer. |
| `ProgressChecklist` | Instagram-style ring (indigo) with % + 5–6 rows, each a deep link. |
| `PhoneBezel` | 300×620 rounded device with notch, WhatsApp-style chat (`#ECE5DD`-ish neutral wallpaper rendered as flat `#EFEAE2`, green bubbles `#D9FDD3`). Generic "WA" styling only, no WhatsApp logo assets. |
| `KanbanColumn/Card` | 4 columns, drag via `Reorder`/pointer DnD, `spring.gentle`; card shows template icon, shop, due date, assignee avatar. |
| `DataTable` (admin) | 44 rows, hairline rules, sticky header, row hover `canvas`, inline status pills. |
| `EmptyState` | Pastel wash tile with a Lucide category glyph + one sentence + one action. Never a sad-face icon. |
| `Skeleton` | sunk fill blocks matching final geometry, shimmer ≤ 600ms. |

**Icons:** Lucide only, `strokeWidth={1.75}`, 20px default (16 in chips, 24 in nav). Icons are never used decoratively in rows of three.

---

## 8. Voice & Micro-copy

**Tone:** a helpful bhaiya at the shop counter, not a SaaS onboarding robot. Use natural Indian English with Hinglish *where a real shopkeeper would say it*. Devanagari appears only in the HI/MR standee and greeting moments.

| Context | ✅ Use | ❌ Avoid |
|---|---|---|
| Top CTA | **Apni Dukaan List Karein** | "Get started for free" |
| Opt-in | **Follow & WhatsApp pe Offers Paayein** | "Subscribe to updates" |
| Section | "Aaj ke Offers", "Aas-paas ki Dukaanein", "Naye Shops in Akurdi" | "Discover amazing deals!" |
| Empty search | "Is area mein abhi koi match nahi. Radius 5 km karein?" | "No results found." |
| Merchant alert | "51 local buyers ne is hafte aapki profile dekhi" | "Your engagement is up 23%!" |
| Paywall | "Pehla offer free tha. Unlimited offers ke liye Pro lein — ₹999/saal (₹2.7/din)" | "Upgrade to unlock premium features" |
| Success | "Ho gaya! Offer live hai." | "Success!" |
| VIP pass | "Aap ab **Laxmi Saree Centre** ke VIP member hain" (EN/HI/MR toggle on pass) | "Membership confirmed." |
| Owner bar | "Aapki dukaan live hai · 51 views is hafte" | "Preview mode enabled" |
| Reel CTA | "Offer Claim Karein" · "Follow" | "Learn more" |
| Agency price | "₹299 · Pro mein included (2 credits/mahina + 40% off)" | "Premium add-on" |
| Standee order | "₹49 mein standee aapki dukaan tak — 3–5 din" | "Order now" |

**Copy rules**
- Every button says what happens ("Offer Post Karein", not "Submit").
- Numbers are concrete and local: "1.2 km", "Akurdi Chowk ke paas", "Sat–Thu · 9 am–9:30 pm".
- No exclamation-mark stacks, no emojis in UI chrome. One emoji is allowed inside WhatsApp message *templates* (that's how merchants actually write).
- Names and data are realistic: Laxmi Saree & Readymade Centre (default demo merchant), Shree Ganesh Kirana, Patil Footwear, Om Sai Mobile Point, Kayani-style bakery names (generic, no real brands), Jain Medical, Siddhivinayak Hardware, Glamour Ladies Parlour, Mahalaxmi Imitation Jewellers, Vidya Stationery & Gifts.

---

## 9. Accessibility

- Text contrast ≥ 4.5:1 (body) and ≥ 3:1 (≥18px or bold ≥14px). Pairings are validated in Phase 1 with a token test.
- Visible focus ring: 2px `indigo-500` + 2px white offset on every interactive element.
- Sheets/modals trap focus, restore it on close, and support `Esc`.
- Product/category photos carry a meaningful `alt` from the image registry; decorative frames, ground shadows and the animated search layer are `aria-hidden`. The shutter is `aria-hidden`, and the storefront `h1` receives focus after reveal.
- Hit targets ≥ 44px. Rails are keyboard-scrollable (focusable cards, arrow-key nudge on desktop).
- `lang="hi"` / `lang="mr"` are set on Devanagari spans.

---

## 10. Anti-AI-Slop Rules (hard gates)

A screen is rejected in review if any of these appear:

1. Purple→pink or blue→purple gradients, gradient text, neon glows, glassmorphism blobs, dark-mode hero.
2. Inter / Roboto / Space Grotesk anywhere visible.
3. Lorem ipsum, "John Doe", "Acme", "$" prices, western cafe/latte imagery, "Your Company".
4. A centered hero with headline + subhead + two buttons + floating 3D mockup.
5. A 3-column "Feature icon + title + 2 lines" grid. (Use real content rails instead.)
6. Any infinite animation outside the three sanctioned, purposeful cycles in §5.3: (a) the skeleton shimmer while loading, (b) the rotating search placeholder (§5.5, pauses on focus/hidden/off-screen), (c) reel progress (§5.6, user-pausable).
7. Emojis as icons in navigation, headers or buttons.
8. Generic western stock-photo people, AI-render faces, posed corporate models, clip-art SVG product illustrations, or broken/missing images (every image goes through `RetailImage`).
9. Dead buttons. Every tappable element either works, opens a real sheet, or shows a deliberate "Coming in Phase 2" toast (allowed in ≤ 3 places, each listed in the plan).
10. Overused SaaS words: "seamless", "empower", "unlock your potential", "revolutionize", "elevate".
11. Uniform card grids with identical visual weight. Every section must have one dominant element.
12. Shadows used where a hairline would do. Default to borders.
13. More than two accent colors competing in one card.
14. Rounded-everything at 24px+. Radius follows §3, so small things get small radii.

---

## 11. Token Implementation Sketch (Tailwind v4)

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --font-display: var(--font-jakarta), ui-sans-serif;
  --font-sans: var(--font-vietnam), ui-sans-serif;
  --font-deva: var(--font-mukta), var(--font-vietnam);

  --color-canvas: #F6F7FA;
  --color-surface: #FFFFFF;
  --color-sunk: #EEF0F4;
  --color-hairline: #E6E8EE;
  --color-hairline-strong: #D5D8E0;

  --color-ink-900: #12141A; --color-ink-700: #3A3F4B;
  --color-ink-500: #6B7180; --color-ink-300: #A9AEBA;

  --color-indigo-50: #EEF0FB; --color-indigo-100: #DDE1F7;
  --color-indigo-500: #3B49C4; --color-indigo-600: #2F3BA8; --color-indigo-700: #252F86;

  --color-flame-50: #FFF1EC; --color-flame-100: #FFDCCF;
  --color-flame-500: #FF5A2C; --color-flame-600: #EC4613; --color-flame-700: #C2370C;

  --color-saffron-50: #FFF8E1; --color-saffron-100: #FFEDB0;
  --color-saffron-400: #FFC629; --color-saffron-500: #F5B400; --color-saffron-700: #8A6400;

  --color-leaf-50: #EAF8EF; --color-leaf-100: #CFF0DB;
  --color-leaf-500: #1FAA59; --color-leaf-600: #168A47; --color-leaf-700: #106B37;

  --color-wash-mint: #E3F6EC; --color-wash-peach: #FFE9DD; --color-wash-sky: #E3EEFD;
  --color-wash-cream: #FFF6DC; --color-wash-lavender: #EEEAFB;

  --color-slate-900: #1E2436; --color-slate-800: #2B3245; --color-slate-600: #465069;

  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 24px;

  --shadow-1: 0 1px 2px rgb(18 20 26 / .06);
  --shadow-2: 0 6px 16px -6px rgb(18 20 26 / .14);
  --shadow-sheet: 0 -8px 32px -8px rgb(18 20 26 / .18);
}
```

```ts
// lib/motion.ts
export const spring = {
  default: { type: "spring", stiffness: 380, damping: 28, mass: 1 },
  snappy:  { type: "spring", stiffness: 520, damping: 32, mass: 0.8 },
  pill:    { type: "spring", stiffness: 420, damping: 34, mass: 1 },
  gentle:  { type: "spring", stiffness: 260, damping: 30, mass: 1 },
} as const;
export const ease = {
  out: [0.22, 1, 0.36, 1], inOut: [0.65, 0, 0.35, 1], shutter: [0.32, 0.72, 0, 1],
} as const;
export const tap = { scale: 0.96 };
```

---

## 12. Split Personality: Bazaar Mode (Consumer) vs Counter Mode (Dashboards)

> Added after the Phase 1 review. The restraint in §1–§10 (pale canvas, hairlines, ≤15% accent) applies to **Counter Mode** only: `/merchant/*` and `/admin/*`. Buyer routes (`/`, `/search`, `/offers`, `/category/*`, `/shop/*`, `/passes`) use **Bazaar Mode** (Blinkit × Swiggy × Zepto energy).

### 12.1 What changes in Bazaar Mode
| Rule | Counter Mode | Bazaar Mode |
|---|---|---|
| Accent coverage | ≤ 15% | No cap. Photos, saffron/flame blocks and ribbons can dominate the first screen. |
| Separation | 1px hairline borders | Soft `shadow-1` + `ring-1 ring-ink-900/5` cards on canvas; hairlines only inside cards |
| Imagery | Rare | Every card leads with a **full-bleed photo** (cover mode); framed cutouts only in Category tiles |
| Type | Calm | Heavier: hero 48/50 desktop, ₹ prices 17–19px weight 800, uppercase deal hooks on scrims |
| Radius | per §3 | Same scale; hero uses an organic `rounded-l-[96px]` photo mask |

### 12.2 Bazaar top canvas
- Token `--color-bazaar: #FFF1C9` (warm saffron tint) is the header background on all buyer routes.
- On Home, a full-bleed band continues it behind the hero bento and fades to `canvas` (`bazaar → bazaar 45% → canvas`).
- The desktop demo role switcher lives in a slim `ink-900` utility strip above the header. On mobile it sits in the header (icon → dropdown). It never floats over content.

### 12.3 Offer / product card
- 1:1 full-bleed photo with hover zoom 1.05.
- **Flame corner ribbon** flush to the left edge (`40% OFF` or `FLAT ₹300 OFF`, whichever reads bigger).
- Save heart top-right, and a saffron "N din baaki" chip when ≤7 days remain.
- Title (2-line clamp) → ₹ price 800 + strike MRP → verified tick + shop + distance → full-width `Offer Dekhein` (flame-50).

### 12.4 Shop card (Swiggy/Zomato store card)
- 16:9 cover photo with a bottom dark scrim carrying the shop's **top deal** in uppercase plus a distance pill, and a white Verified chip top-left.
- Body: name, category · area, follower count, "N offers live", GST tag, and a leaf `Follow` / `✓ Following` button.
- Monogram rows are dashboard-only.

### 12.5 Reels
- Rail cards are 9:16 (138px mobile, 172px desktop): full-bleed photo, top and bottom scrims, shop chip, play glyph, bold hook text and views.
- The viewer spec is in §5.6.

### 12.6 Image failure state (revised from §4.1)
- **No icon-in-circle, ever.** A failed photo renders the category wash, a soft diagonal weave and a white organic blob.
- A typographic label is shown **only** where no other text is attached:
  - Category tiles show the Hindi/Marathi name.
  - The hero shows "पैठणी".
- Cards whose title sits on or below the image render no label, so text never duplicates.
- Production target is zero fallbacks. Run `npm run images:verify`, or `npm run images:cache` (downloads, checks for a real JPEG > 15 KB, switches the registry to local `/public/img`).

---

## 13. Reference Study (Zepto · Swiggy Instamart · Justdial · IndiaMART), 25 Nov 2026

Studied live in Chrome. Bazaar Mode (§12) is revised to match these patterns:

| Source | Pattern observed | Retobiz adoption |
|---|---|---|
| Zepto | Sticky category tab strip under header (icon + label + underline) | `CategoryStrip`: mini cutout + label + flame underline (`layoutId`) on every buyer route |
| Zepto | Product card has almost no chrome: faint-ring image box, **ADD button overlapping the image's bottom-right**, **solid green price pill** + struck MRP, 2–3-line title, unit | `OfferCard`: overlapping **CLAIM** (our ADD = WhatsApp opt-in), `leaf-600` price pill, no card shadow, no full-width button |
| Instamart | Category tiles use **glossy 3D-rendered objects** on pale tiles with big bold labels | ChatGPT-generated 3D cutout set (§13.1), tiles `rounded-2xl`, 13–14px bold label + Devanagari name |
| Instamart | Banner row of saturated cards: text left, cutout right, pill CTA | Hero + promo cards in tinted panels with cutouts breaking the frame |
| Instamart | Bilingual product names: "Onion (Kanda)" | Devanagari names on category tiles/strip and the category hero |
| Justdial | Shop rows: green rating chip, tags, **Show Number / WhatsApp / Get Best Deal** | `ShopCoverCard` action row: WhatsApp Offers (opt-in) · Number (reveal → `tel:`) · Directions (Maps) + `4.5★` chip |
| Justdial / IndiaMART | Sticky lead form "Get the list of top X — Name + Mobile" | Phase 3: "Akurdi ki top saree dukaanein WhatsApp par" panel on /search desktop |
| IndiaMART | "₹ x/Piece · Get Latest Price", verified supplier badges, dominant "Contact Supplier" | Price-unit suffix (`/kg`), Verified + GST chips, single dominant action per card |

Buyer routes now sit on a **white** canvas (`bg-surface`), as Zepto and Instamart do. The warm `bazaar` tint is limited to the header and the top band.

### 13.1 Retobiz cutout image set
- **Source:** generated in ChatGPT as 7 sprite sheets (3×2 cells of 512px each, 1536×1024, transparent PNG) in one consistent style. The house style:
  - glossy 3D render, 3/4 front angle, top-left studio light, soft contact shadow
  - saturated but friendly colours
  - no text, logos or people
- **Pipeline:** `python3 scripts/slice-sprites.py <folder>` slices each sheet, trims to the object, pads to a square bottom-weighted canvas, and writes `public/images/{key}.webp` (640px, about 30–90 KB).
- **Registry:** keys with `tone: "cutout"` (`cat-*`, `p-*`, `promo-*`) are local files. They render with `object-contain` and a ground shadow on the category wash. No external host is needed, so they work offline and on Vercel.
