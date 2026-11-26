"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Truck } from "lucide-react";
import { useStore } from "@/store";
import { toast } from "@/store/ui";
import { Hydrated } from "@/components/shell/hydrated";
import { FilterChip } from "@/components/ui/chip";
import { Card, PageHead, PageSkeleton, Stepper } from "@/components/merchant/common";
import { STANDEE_COPY } from "@/components/merchant/qr-standee-view";
import type { QrOrderStatus } from "@/lib/types";
import { formatINR, timeAgo } from "@/lib/format";

const FLOW: QrOrderStatus[] = ["placed", "printed", "dispatched", "delivered"];
const LABEL: Record<QrOrderStatus, string> = { placed: "Placed", printed: "Printed", dispatched: "Dispatched", delivered: "Delivered" };
const NEXT_CTA: Partial<Record<QrOrderStatus, string>> = { placed: "Print ho gaya", printed: "Dispatch karein", dispatched: "Delivered" };

export function QrOrdersView() {
  return (
    <Hydrated fallback={<PageSkeleton />}>
      <Content />
    </Hydrated>
  );
}

function Content() {
  const orders = useStore((s) => s.qrOrders);
  const shops = useStore((s) => s.shops);
  const advance = useStore((s) => s.advanceQrOrder);
  const [f, setF] = useState<QrOrderStatus | "all">("all");
  const all = useMemo(() => Object.values(orders).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [orders]);
  const list = f === "all" ? all : all.filter((o) => o.status === f);

  return (
    <div>
      <PageHead
        eyebrow="₹49 QR Standees"
        title="Dispatch tracker"
        sub={
          <>
            <b className="tabular text-ink-900">{all.length}</b> orders · <b className="tabular text-ink-900">{formatINR(all.length * 49)}</b> collected (COD demo)
          </>
        }
      />
      <div className="mb-3 flex gap-2 overflow-x-auto">
        <FilterChip selected={f === "all"} onClick={() => setF("all")}>
          Sab · {all.length}
        </FilterChip>
        {FLOW.map((s) => (
          <FilterChip key={s} selected={f === s} onClick={() => setF(s)}>
            {LABEL[s]} · {all.filter((o) => o.status === s).length}
          </FilterChip>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {list.map((o) => {
          const shop = shops[o.shopId];
          const cta = NEXT_CTA[o.status];
          return (
            <Card key={o.id} className="min-w-0 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-bold">{shop?.name}</div>
                  <div className="mt-0.5 truncate text-[12.5px] text-ink-500">
                    {STANDEE_COPY[o.design.lang].label} · <span className="capitalize">{o.design.style}</span> · {o.address}
                  </div>
                </div>
                <span className="tabular shrink-0 text-[14px] font-bold">₹{o.amount}</span>
              </div>
              <Stepper className="mt-4" steps={FLOW.map((s) => LABEL[s])} current={FLOW.indexOf(o.status)} />
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-[12px] text-ink-500">
                  {o.trackingId && <Truck className="size-3.5" />}
                  {o.trackingId ?? timeAgo(o.createdAt)}
                </span>
                {cta ? (
                  <button
                    type="button"
                    onClick={() => {
                      advance(o.id);
                      toast({ message: `${shop?.name}: ${cta}`, tone: "success" });
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink-900 px-3 text-[13px] font-bold text-white"
                  >
                    {cta} <ArrowRight className="size-3.5" />
                  </button>
                ) : (
                  <span className="text-[13px] font-bold text-leaf-700">✓ Pahunch gaya</span>
                )}
              </div>
            </Card>
          );
        })}
        {list.length === 0 && <Card className="p-6 text-center text-[14px] text-ink-500 lg:col-span-2">Is filter mein koi order nahi.</Card>}
      </div>
    </div>
  );
}
