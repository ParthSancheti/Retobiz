"use client";
import Link from "next/link";
import { AlertCircle, BadgeCheck, ChevronRight, Clapperboard, IndianRupee, Store, Truck, UserPlus, Waypoints } from "lucide-react";
import { useMemo } from "react";
import { useStore } from "@/store";
import { Hydrated } from "@/components/shell/hydrated";
import { PageSkeleton } from "@/components/merchant/common";
import { adminKpis } from "@/store/selectors";
import { formatINR, timeAgo } from "@/lib/format";
import { AnimatedNumber, LiveFlash, SectionHeader, StatTile } from "@/components/ui/misc";
import { cn } from "@/lib/cn";

export const ACTOR_TONE = { buyer: "bg-flame-50 text-flame-700", merchant: "bg-indigo-50 text-indigo-700", admin: "bg-sunk text-ink-700" } as const;
export const ACTOR_LABEL = { buyer: "Buyer", merchant: "Shop", admin: "Admin" } as const;

export function AdminOverview() {
  return (
    <Hydrated fallback={<PageSkeleton />}>
      <Content />
    </Hydrated>
  );
}

function Content() {
  const shops = useStore((s) => s.shops);
  const offers = useStore((s) => s.offers);
  const customers = useStore((s) => s.customers);
  const agencyRequests = useStore((s) => s.agencyRequests);
  const qrOrders = useStore((s) => s.qrOrders);
  const referralEntries = useStore((s) => s.referralEntries);
  const activity = useStore((s) => s.activity);

  const k = useMemo(() => adminKpis({ shops, offers, customers, agencyRequests, qrOrders, referralEntries }), [shops, offers, customers, agencyRequests, qrOrders, referralEntries]);
  const revenue = k.qrRevenue + k.agencyRevenue + k.proShops * 999;
  const pending = Object.values(shops).filter((s) => s.verification.status === "pending");

  const attention = [
    { n: k.shopsPending, label: "shops verification ka intezaar", href: "/admin/shops?f=pending", icon: Store, tone: "bg-saffron-50 text-saffron-700" },
    { n: k.pipeline.new, label: "nayi agency requests", href: "/admin/fulfillment", icon: Clapperboard, tone: "bg-indigo-50 text-indigo-700" },
    { n: k.qr.placed + k.qr.printed, label: "standee dispatch baaki", href: "/admin/qr-orders", icon: Truck, tone: "bg-flame-50 text-flame-700" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] leading-[30px] font-bold tracking-[-0.015em] lg:text-[30px] lg:leading-9">Operations overview</h1>
        <p className="text-[14px] text-ink-500">Pune · Nashik · Malegaon — live from all three roles</p>
      </div>

      {/* Bento */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:grid-rows-[auto_auto] lg:gap-4">
        <div className="relative col-span-2 row-span-2 flex min-h-[240px] flex-col justify-between overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#181F4B_0%,#2B3684_100%)] p-6 text-white shadow-lift ring-1 ring-white/15 ring-inset">
          <span aria-hidden className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-indigo-400/25 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="relative flex items-center gap-2 text-[12px] font-semibold tracking-[0.06em] text-white/70 uppercase">
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-white/12 ring-1 ring-white/15 ring-inset">
              <IndianRupee className="size-4" />
            </span>
            Platform revenue (demo)
          </div>
          <div className="relative">
            <LiveFlash watch={revenue}>
              <AnimatedNumber value={revenue} format={formatINR} className="tabular text-[40px] leading-none font-extrabold tracking-[-0.03em] lg:text-[52px]" />
            </LiveFlash>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[12px] text-white/70">
              <div className="rounded-[14px] bg-white/8 px-3 py-2.5 ring-1 ring-white/10 ring-inset">
                <div className="tabular text-[16px] font-bold text-white">{formatINR(k.proShops * 999)}</div>Pro ({k.proShops})
              </div>
              <div className="rounded-[14px] bg-white/8 px-3 py-2.5 ring-1 ring-white/10 ring-inset">
                <div className="tabular text-[16px] font-bold text-white">{formatINR(k.agencyRevenue)}</div>Studio
              </div>
              <div className="rounded-[14px] bg-white/8 px-3 py-2.5 ring-1 ring-white/10 ring-inset">
                <div className="tabular text-[16px] font-bold text-white">{formatINR(k.qrRevenue)}</div>Standees
              </div>
            </div>
          </div>
        </div>
        <StatTile label="Shops" value={k.shopsTotal} icon={<Store />} hint={`${k.shopsPending} pending`} />
        <StatTile label="Verified" value={k.shopsVerified} icon={<BadgeCheck />} tone="leaf" hint={`${Math.round((k.shopsVerified / Math.max(1, k.shopsTotal)) * 100)}%`} />
        <StatTile label="Opt-ins · 7 din" value={k.optIns7d} icon={<UserPlus />} tone="flame" spark={[12, 18, 15, 22, 26, 24, k.optIns7d]} />
        <StatTile label="Referral payouts" value={k.referralPayout} format={formatINR} icon={<Waypoints />} tone="saffron" />
      </div>

      {/* Needs attention */}
      <section>
        <SectionHeader title="Needs attention" eyebrow="Aaj ke kaam" className="mb-3" />
        <div className="grid grid-cols-1 gap-3 [&>*]:min-w-0 lg:grid-cols-3">
          {attention.map((a) => (
            <Link key={a.href} href={a.href} className="group flex items-center gap-3.5 rounded-[22px] border border-black/[0.05] bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]">
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-[14px]", a.tone)}>
                <a.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="tabular block text-[22px] leading-6 font-extrabold">{a.n}</span>
                <span className="text-[13px] text-ink-500">{a.label}</span>
              </span>
              <ChevronRight className="size-4 text-ink-300 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_1.3fr]">
        <section>
          <SectionHeader title="Verification queue" className="mb-3" action={<Link href="/admin/shops" className="text-[13px] font-bold text-indigo-600">Sab dekhein</Link>} />
          <ul className="divide-y divide-hairline overflow-hidden rounded-[22px] border border-black/[0.05] bg-surface shadow-soft">
            {pending.slice(0, 5).map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                <AlertCircle className="size-4 shrink-0 text-saffron-700" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{s.name}</span>
                  <span className="text-[12px] text-ink-500">
                    {s.verification.gstin ? "GSTIN diya" : "GST nahi"} · {s.verification.google ? "Google ✓" : "Google nahi"}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] text-ink-500">{timeAgo(s.createdAt)}</span>
              </li>
            ))}
            {pending.length === 0 && <li className="px-4 py-6 text-center text-[14px] text-ink-500">Sab clear ✓</li>}
          </ul>
        </section>
        <section>
          <SectionHeader title="Live activity" eyebrow="Sab roles ki harkat" className="mb-3" />
          <ul className="divide-y divide-hairline overflow-hidden rounded-[22px] border border-black/[0.05] bg-surface shadow-soft">
            {activity.slice(0, 10).map((e) => (
              <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                <span className={cn("mt-0.5 shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-bold", ACTOR_TONE[e.actor])}>{ACTOR_LABEL[e.actor]}</span>
                <span className="min-w-0 flex-1 text-[14px] text-ink-900">{e.text}</span>
                <span className="shrink-0 text-[12px] text-ink-500">{timeAgo(e.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
