"use client";
import { useMemo } from "react";
import { useStore } from "@/store";
import { Hydrated } from "@/components/shell/hydrated";
import { Card, PageHead, PageSkeleton } from "@/components/merchant/common";
import { REFERRAL_COMMISSION } from "@/data/agency-templates";
import type { ReferralEvent } from "@/lib/types";
import { formatINR, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

const EVENT_LABEL: Record<ReferralEvent, string> = { signup: "Signup", verified: "Verified", pro_upgrade: "Pro upgrade", standee_order: "Standee order" };
const EVENT_TONE: Record<ReferralEvent, string> = {
  signup: "bg-sunk text-ink-700",
  verified: "bg-indigo-50 text-indigo-700",
  pro_upgrade: "bg-saffron-100 text-saffron-700",
  standee_order: "bg-flame-50 text-flame-700",
};

export function ReferralsView() {
  return (
    <Hydrated fallback={<PageSkeleton />}>
      <Content />
    </Hydrated>
  );
}

function Content() {
  const distributors = useStore((s) => s.distributors);
  const entries = useStore((s) => s.referralEntries);
  const shops = useStore((s) => s.shops);
  const totals = useMemo(
    () =>
      distributors.map((d) => {
        const mine = entries.filter((e) => e.distributorId === d.id);
        return { d, shops: new Set(mine.map((e) => e.shopId)).size, total: mine.reduce((a, e) => a + e.commission, 0), pro: mine.filter((e) => e.event === "pro_upgrade").length };
      }),
    [distributors, entries],
  );
  const distById = useMemo(() => Object.fromEntries(distributors.map((d) => [d.id, d])), [distributors]);

  return (
    <div>
      <PageHead eyebrow="Distributor network" title="Referral ledger" sub="Distributors dukaanein laate hain aur har milestone par commission kamaate hain." />
      <div className="mb-6 grid gap-3 lg:grid-cols-3">
        {totals.map(({ d, shops: n, total, pro }) => (
          <Card key={d.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-bold">{d.name}</div>
              <span className="tabular rounded-full bg-sunk px-2 py-0.5 text-[11px] font-bold text-ink-700">{d.code}</span>
            </div>
            <div className="text-[12.5px] text-ink-500">{d.city}</div>
            <div className="tabular mt-3 text-[26px] leading-none font-extrabold">{formatINR(total)}</div>
            <div className="mt-1 text-[12.5px] text-ink-500">
              {n} shops · {pro} Pro
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-[12px]">
        {(Object.keys(REFERRAL_COMMISSION) as ReferralEvent[]).map((k) => (
          <span key={k} className={cn("rounded-full px-2.5 py-1 font-semibold", EVENT_TONE[k])}>
            {EVENT_LABEL[k]} · ₹{REFERRAL_COMMISSION[k]}
          </span>
        ))}
      </div>

      <Card className="overflow-hidden">
        <ul className="divide-y divide-hairline">
          {entries.slice(0, 40).map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-4 py-3">
              <span className={cn("w-28 shrink-0 rounded-full px-2 py-0.5 text-center text-[12px] font-bold", EVENT_TONE[e.event])}>{EVENT_LABEL[e.event]}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{shops[e.shopId]?.name ?? "—"}</span>
                <span className="text-[12px] text-ink-500">{distById[e.distributorId]?.name}</span>
              </span>
              <span className="tabular w-16 shrink-0 text-right text-[14px] font-bold">+₹{e.commission}</span>
              <span className="hidden w-24 shrink-0 text-right text-[12px] text-ink-500 sm:block">{timeAgo(e.at)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
