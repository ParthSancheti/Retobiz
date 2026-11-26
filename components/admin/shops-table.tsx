"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { useStore } from "@/store";
import { toast } from "@/store/ui";
import { Hydrated } from "@/components/shell/hydrated";
import { FilterChip } from "@/components/ui/chip";
import { ProBadge, VerifiedBadge } from "@/components/ui/badge";
import { ShopMonogram } from "@/components/buyer/shop-card";
import { Card, inputCls, PageHead, PageSkeleton } from "@/components/merchant/common";
import type { Shop, VerificationStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

type F = "all" | VerificationStatus | "verified";
const FILTERS: { value: F; label: string }[] = [
  { value: "all", label: "Sab" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "approved", label: "Approved" },
  { value: "suspended", label: "Suspended" },
];

export function ShopsTable() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Hydrated fallback={<PageSkeleton />}>
        <Content />
      </Hydrated>
    </Suspense>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", on ? "bg-leaf-500" : "bg-ink-300/50")}
    >
      <span className={cn("absolute top-0.5 left-0 size-5 rounded-full bg-white shadow-1 transition-transform", on ? "translate-x-[18px]" : "translate-x-0.5")} />
    </button>
  );
}

const STATUS_TONE: Record<VerificationStatus, string> = {
  pending: "bg-saffron-50 text-saffron-700",
  approved: "bg-leaf-50 text-leaf-700",
  rejected: "bg-danger-50 text-danger-600",
  suspended: "bg-sunk text-ink-700",
};

function Content() {
  const params = useSearchParams();
  const shops = useStore((s) => s.shops);
  const order = useStore((s) => s.shopOrder);
  const categories = useStore((s) => s.categories);
  const locations = useStore((s) => s.locations);
  const setVerification = useStore((s) => s.setVerification);
  const [f, setF] = useState<F>((params.get("f") as F) ?? "all");
  const [q, setQ] = useState("");

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const locById = useMemo(() => Object.fromEntries(locations.map((l) => [l.id, l])), [locations]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return order
      .map((id) => shops[id])
      .filter(Boolean)
      .filter((s) => (f === "all" ? true : f === "verified" ? s.isVerified : s.verification.status === f))
      .filter((s) => !needle || s.name.toLowerCase().includes(needle) || s.ownerName.toLowerCase().includes(needle) || s.qrCode.toLowerCase().includes(needle));
  }, [order, shops, f, q]);

  const patch = (s: Shop, p: Partial<Shop["verification"]>, msg: string) => {
    setVerification(s.id, p);
    toast({ message: `${s.name}: ${msg}`, tone: "success" });
  };

  return (
    <div>
      <PageHead eyebrow="Shop Verification" title="Dukaanein" sub="Approve + (GST ya Google) = Verified badge. Badlav turant buyer search mein dikhta hai." />
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1 lg:max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-300" />
          <input className={cn(inputCls, "pl-9")} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Shop, owner ya QR code" />
        </label>
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((x) => (
            <FilterChip key={x.value} selected={f === x.value} onClick={() => setF(x.value)}>
              {x.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[1fr_120px_70px_70px_210px] items-center gap-3 border-b border-hairline bg-canvas px-4 py-2.5 text-[12px] font-bold tracking-[0.04em] text-ink-500 uppercase lg:grid">
          <span>Shop</span>
          <span>Status</span>
          <span className="text-center">GST</span>
          <span className="text-center">Google</span>
          <span className="text-right">Action</span>
        </div>
        <ul className="divide-y divide-hairline">
          {list.map((s) => {
            const cat = catById[s.categoryId];
            const st = s.verification.status;
            return (
              <li key={s.id} className="grid grid-cols-1 gap-3 px-4 py-3 lg:grid-cols-[1fr_120px_70px_70px_210px] lg:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <ShopMonogram shop={s} wash={cat?.wash ?? "cream"} size={40} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-semibold">{s.name}</span>
                      {s.isVerified && <VerifiedBadge compact />}
                      {s.plan === "pro" && <ProBadge className="h-5 text-[10px]" />}
                    </div>
                    <div className="truncate text-[12px] text-ink-500">
                      {s.ownerName} · {locById[s.areaId]?.name} · <span className="tabular">{s.verification.gstin ?? s.qrCode}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 lg:contents">
                  <span className={cn("inline-flex h-6 w-fit items-center rounded-full px-2.5 text-[12px] font-bold capitalize", STATUS_TONE[st])}>{st}</span>
                  <span className="flex items-center gap-2 lg:justify-center">
                    <span className="text-[12px] text-ink-500 lg:hidden">GST</span>
                    <Toggle on={s.verification.gst} label={`GST ${s.name}`} onChange={() => patch(s, { gst: !s.verification.gst }, s.verification.gst ? "GST hata" : "GST verified")} />
                  </span>
                  <span className="flex items-center gap-2 lg:justify-center">
                    <span className="text-[12px] text-ink-500 lg:hidden">Google</span>
                    <Toggle on={s.verification.google} label={`Google ${s.name}`} onChange={() => patch(s, { google: !s.verification.google }, s.verification.google ? "Google hata" : "Google verified")} />
                  </span>
                </div>
                <div className="flex items-center gap-2 lg:justify-end">
                  {st !== "approved" ? (
                    <button type="button" onClick={() => patch(s, { status: "approved" }, "approved")} className="h-8 rounded-full bg-indigo-600 px-3 text-[13px] font-bold text-white">
                      Approve
                    </button>
                  ) : (
                    <button type="button" onClick={() => patch(s, { status: "suspended" }, "suspended")} className="h-8 rounded-full border border-hairline px-3 text-[13px] font-semibold text-ink-700 hover:bg-sunk">
                      Suspend
                    </button>
                  )}
                  {st === "pending" && (
                    <button type="button" onClick={() => patch(s, { status: "rejected" }, "rejected")} className="h-8 rounded-full px-3 text-[13px] font-semibold text-danger-600 hover:bg-danger-50">
                      Reject
                    </button>
                  )}
                  <Link href={`/shop/${s.slug}`} aria-label={`${s.name} storefront`} className="flex size-8 items-center justify-center rounded-full text-ink-500 hover:bg-sunk">
                    <ExternalLink className="size-4" />
                  </Link>
                </div>
              </li>
            );
          })}
          {list.length === 0 && <li className="px-4 py-8 text-center text-[14px] text-ink-500">Koi shop nahi mili.</li>}
        </ul>
      </Card>
    </div>
  );
}
