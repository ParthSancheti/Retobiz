"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  BadgePercent,
  Check,
  ChevronRight,
  Clapperboard,
  Eye,
  Megaphone,
  MousePointerClick,
  QrCode,
  ScanLine,
  Sparkles,
  Store,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { useStore } from "@/store";
import { Hydrated } from "@/components/shell/hydrated";
import { merchantDashboard } from "@/store/selectors";
import { formatCompactIN, maskMobile, timeAgo } from "@/lib/format";
import { LiveFlash, SectionHeader, StatTile } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";
import { Card, initials, PageSkeleton, useActiveShop } from "./common";

export function MerchantHome() {
  return (
    <Hydrated fallback={<PageSkeleton />}>
      <Content />
    </Hydrated>
  );
}

const ALERT_ICON = { follow: UserPlus, qr_scan: ScanLine, offer_click: MousePointerClick, shop_view: Eye } as const;

function Content() {
  const { shopId, shop } = useActiveShop();
  const offers = useStore((s) => s.offers);
  const customers = useStore((s) => s.customers);
  const shops = useStore((s) => s.shops);
  const qrOrders = useStore((s) => s.qrOrders);
  const reels = useStore((s) => s.reels);
  const activity = useStore((s) => s.activity);
  const agency = useStore((s) => s.agencyRequests);
  const broadcasts = useStore((s) => s.broadcasts);

  const d = useMemo(() => merchantDashboard({ shops, offers, customers, qrOrders, reels }, shopId), [shops, offers, customers, qrOrders, reels, shopId]);
  const alerts = useMemo(() => {
    const live = activity.filter((a) => a.shopId === shopId && a.type in ALERT_ICON).slice(0, 4);
    // Pad the ticker with recent opt-ins so it never looks empty on a fresh seed.
    const fromCrm = Object.values(customers)
      .filter((c) => c.shopId === shopId)
      .map((c) => ({ id: `c-${c.id}`, type: c.source === "qr" ? "qr_scan" : "follow", at: c.joinedAt, text: `${c.name} ne ${c.source === "qr" ? "QR scan karke" : "online"} follow kiya` }));
    const seen = new Set(live.map((a) => a.text.split(" ne ")[0]));
    return [...live, ...fromCrm.filter((c) => !seen.has(c.text.split(" ne ")[0]))].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
  }, [activity, customers, shopId]);
  const recent = useMemo(
    () =>
      Object.values(customers)
        .filter((c) => c.shopId === shopId)
        .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
        .slice(0, 5),
    [customers, shopId],
  );

  if (!d || !shop) return <PageSkeleton />;

  const hasStandee = Object.values(qrOrders).some((o) => o.shopId === shopId);
  const hasAgency = Object.values(agency).some((r) => r.shopId === shopId);
  const hasBroadcast = Object.values(broadcasts).some((b) => b.shopId === shopId);
  const checklist = [
    { label: "Dukaan profile complete", done: !!shop.tagline && !!shop.landmark, href: "/merchant/profile" },
    { label: "Pehla offer live karein", done: d.liveOffers > 0, href: "/merchant/offers/new" },
    { label: "Verification (GST / Google)", done: shop.isVerified, href: "/merchant/profile" },
    { label: "Counter ke liye QR standee", done: hasStandee, href: "/merchant/qr-standee" },
    { label: "Pehla WhatsApp broadcast", done: hasBroadcast, href: "/merchant/broadcast" },
    { label: "Studio se promo reel", done: hasAgency, href: "/merchant/studio" },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checklist.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[24px] leading-[30px] font-bold tracking-[-0.015em] lg:text-[30px] lg:leading-9">Namaste, {shop.ownerName.split(" ")[0]} ji</h1>
          <p className="mt-1 text-[14px] text-ink-500">Aapki dukaan ka is hafte ka haal</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href={`/shop/${shop.slug}?as=owner`} variant="secondary" size="md" icon={<Store className="size-4" />}>
            Meri Dukaan
          </ButtonLink>
          <ButtonLink href="/merchant/offers/new" variant="primary-indigo" size="md">
            + Naya Offer
          </ButtonLink>
        </div>
      </div>

      {/* Row A: Truecaller-style hero + live activity ticker (balanced 12-col bento) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Link
          href="/merchant/customers"
          className="group relative flex min-h-[188px] flex-col justify-between overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1E2660] via-[#2B3684] to-[#4450B8] p-6 text-white shadow-lift ring-1 ring-white/15 ring-inset transition-transform active:scale-[0.99] lg:col-span-7"
        >
          <span aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-2 text-[12px] font-semibold tracking-[0.06em] text-white/70 uppercase">
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-white/15">
              <Eye className="size-4" strokeWidth={2} />
            </span>
            Is hafte aapki dukaan
          </div>
          <div className="relative">
            <div className="flex items-end gap-3">
              <LiveFlash watch={shop.stats.views7d}>
                <span className="tabular text-[56px] leading-none font-extrabold tracking-[-0.04em]">{shop.stats.views7d}</span>
              </LiveFlash>
              <span className="pb-1.5 text-[16px] leading-5 font-semibold text-white/85">
                local buyers ne
                <br />
                dekhi
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] font-semibold">
              {d.newFollowers7d > 0 && <span className="rounded-full bg-leaf-500 px-3 py-1 text-white">+{d.newFollowers7d} followers</span>}
              <span className="rounded-full bg-white/12 px-3 py-1">{shop.stats.qrScans7d} QR scans</span>
              <span className="rounded-full bg-white/12 px-3 py-1">{shop.stats.offerClicks7d} offer clicks</span>
              <ChevronRight className="ml-auto size-5 opacity-70 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        <Card className="flex flex-col p-5 lg:col-span-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf-500 opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-leaf-500" />
            </span>
            <span className="text-[13px] font-bold">Live activity</span>
            <span className="ml-auto text-[12px] text-ink-500">abhi tak</span>
          </div>
          <motion.ul layout className="flex flex-1 flex-col gap-1">
            <AnimatePresence initial={false}>
              {alerts.map((a) => {
                const Icon = ALERT_ICON[a.type as keyof typeof ALERT_ICON];
                return (
                  <motion.li
                    key={a.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={spring.snappy}
                    className="flex items-center gap-3 rounded-[14px] px-2 py-2 hover:bg-canvas"
                  >
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[12px]", a.type === "follow" ? "bg-leaf-50 text-leaf-700" : "bg-saffron-50 text-saffron-700")}>
                      <Icon className="size-[18px]" strokeWidth={2} />
                    </span>
                    <span className="line-clamp-2 min-w-0 flex-1 text-[13.5px] leading-[18px] text-ink-900">{a.text}</span>
                    <span className="shrink-0 text-[12px] text-ink-500">{timeAgo(a.at)}</span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {alerts.length === 0 && <li className="py-6 text-center text-[13px] text-ink-500">Jaise hi koi dukaan dekhega, yahan dikhega.</li>}
          </motion.ul>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile label="Followers" value={d.followers} format={formatCompactIN} icon={<Users />} hint="Total" tone="leaf" />
        <StatTile label="Profile views" value={shop.stats.views7d} icon={<Eye />} hint="7 din" spark={[22, 30, 28, 35, 41, 38, shop.stats.views7d]} />
        <StatTile label="Offer clicks" value={shop.stats.offerClicks7d} icon={<MousePointerClick />} hint="7 din" tone="flame" />
        <StatTile label="QR scans" value={shop.stats.qrScans7d} icon={<QrCode />} hint="7 din" tone="saffron" />
      </div>

      <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0 lg:grid-cols-[1.1fr_1fr]">
        {/* Checklist */}
        <Card className="p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">Growth checklist</div>
              <div className="mt-0.5 text-[17px] font-bold">
                {doneCount}/{checklist.length} kaam pure
              </div>
            </div>
            <div className="relative size-12">
              <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-sunk)" strokeWidth="4" />
                <motion.circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="var(--color-leaf-500)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={94.25}
                  initial={false}
                  animate={{ strokeDashoffset: 94.25 * (1 - pct / 100) }}
                />
              </svg>
              <span className="tabular absolute inset-0 flex items-center justify-center text-[11px] font-bold">{pct}%</span>
            </div>
          </div>
          <ul className="mt-3 divide-y divide-hairline">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="flex items-center gap-3 py-2.5 text-[14px]">
                  <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border", c.done ? "border-leaf-500 bg-leaf-500 text-white" : "border-hairline")}>
                    {c.done && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className={cn("flex-1", c.done ? "text-ink-500 line-through decoration-ink-300" : "font-semibold text-ink-900")}>{c.label}</span>
                  {!c.done && <ChevronRight className="size-4 text-ink-300" />}
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex flex-col gap-4">
          {/* Offer quota */}
          <Card className="p-5 lg:p-6">
            <div className="text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">Offers</div>
            <div className="mt-1 flex items-end justify-between gap-3">
              <div className="text-[17px] font-bold">
                {shop.plan === "pro" ? (
                  <>
                    <span className="tabular">{d.liveOffers}</span> live · Pro unlimited
                  </>
                ) : (
                  <>
                    <span className="tabular">
                      {Math.min(d.liveOffers, d.freeOfferLimit)}/{d.freeOfferLimit}
                    </span>{" "}
                    Free Offer Active
                  </>
                )}
                <div className="text-[13px] font-normal text-ink-500">{d.products} showroom products live</div>
              </div>
              {shop.plan === "free" && (
                <Link href="/merchant/plan" className="inline-flex items-center gap-1 rounded-full bg-saffron-100 px-3 py-1.5 text-[12px] font-bold text-saffron-700">
                  <Sparkles className="size-3.5" /> Pro ₹999/yr
                </Link>
              )}
            </div>
          </Card>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/merchant/offers/new", label: "Naya Offer", icon: BadgePercent, tint: "bg-wash-peach text-flame-700" },
              { href: "/merchant/broadcast", label: "WhatsApp Blast", icon: Megaphone, tint: "bg-wash-mint text-leaf-700" },
              { href: "/merchant/studio", label: "Reel banwayein", icon: Clapperboard, tint: "bg-wash-lavender text-indigo-700" },
              { href: "/merchant/qr-standee", label: "QR Standee", icon: QrCode, tint: "bg-wash-cream text-saffron-700" },
            ].map((q) => (
              <Link key={q.href} href={q.href} className={cn("flex flex-col gap-3 rounded-[20px] p-4 shadow-soft transition-transform hover:-translate-y-0.5 active:scale-[0.97]", q.tint)}>
                <q.icon className="size-5" strokeWidth={2} />
                <span className="text-[14px] font-bold text-ink-900">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section>
        <SectionHeader
          title="Naye customers"
          eyebrow="QR & Follow opt-ins"
          className="mb-3"
          action={
            <Link href="/merchant/customers" className="text-[13px] font-bold text-indigo-600">
              Sab dekhein
            </Link>
          }
        />
        <ul className="divide-y divide-hairline overflow-hidden rounded-[22px] border border-black/[0.05] bg-surface shadow-soft">
          {recent.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-leaf-50 text-[13px] font-bold text-leaf-700">{initials(c.name)}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-ink-900">{c.name}</div>
                <div className="tabular text-[12px] text-ink-500">
                  {maskMobile(c.mobile)} · {c.source === "qr" ? "QR scan" : c.source === "follow" ? "Follow" : "Manual"}
                </div>
              </div>
              <span className="shrink-0 text-[12px] text-ink-500">{timeAgo(c.joinedAt)}</span>
            </li>
          ))}
          {recent.length === 0 && <li className="px-4 py-6 text-center text-[14px] text-ink-500">Abhi koi customer nahi — counter par QR standee lagayein.</li>}
        </ul>
      </section>
    </div>
  );
}
