"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, MousePointerClick, Pause, Play, Plus, Sparkles } from "lucide-react";
import { useStore, FREE_OFFER_LIMIT } from "@/store";
import { Hydrated } from "@/components/shell/hydrated";
import { Segmented } from "@/components/ui/segmented";
import { ButtonLink } from "@/components/ui/button";
import { RetailImage } from "@/components/media/retail-image";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/store/ui";
import { daysLeft, formatINR } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { OfferKind } from "@/lib/types";
import { Card, PageHead, PageSkeleton, useActiveShop } from "./common";
import { PaywallSheet } from "./paywall-sheet";

export function OffersView() {
  return (
    <Hydrated fallback={<PageSkeleton />}>
      <Content />
    </Hydrated>
  );
}

function Content() {
  const { shop } = useActiveShop();
  const offers = useStore((s) => s.offers);
  const setOfferStatus = useStore((s) => s.setOfferStatus);
  const [tab, setTab] = useState<OfferKind>("offer");
  const [paywall, setPaywall] = useState(false);

  const list = useMemo(
    () =>
      Object.values(offers)
        .filter((o) => o.shopId === shop?.id && o.kind === tab)
        .sort((a, b) => (a.status === b.status ? b.createdAt.localeCompare(a.createdAt) : a.status === "live" ? -1 : 1)),
    [offers, shop?.id, tab],
  );
  if (!shop) return <PageSkeleton />;

  const liveOffers = Object.values(offers).filter((o) => o.shopId === shop.id && o.kind === "offer" && o.status === "live").length;
  const productCount = Object.values(offers).filter((o) => o.shopId === shop.id && o.kind === "product").length;

  const toggle = (id: string, live: boolean) => {
    if (!live && tab === "offer" && shop.plan === "free" && liveOffers >= FREE_OFFER_LIMIT) {
      setPaywall(true);
      return;
    }
    setOfferStatus(id, live ? "draft" : "live");
    toast({ message: live ? "Offer pause ho gaya" : "Offer phir se live", tone: "success" });
  };

  return (
    <div>
      <PageHead
        eyebrow="Offers & Products"
        title="Mere Offers"
        sub={
          shop.plan === "pro" ? (
            <>Pro plan · unlimited live offers</>
          ) : (
            <>
              <b className="tabular text-ink-900">
                {Math.min(liveOffers, FREE_OFFER_LIMIT)}/{FREE_OFFER_LIMIT}
              </b>{" "}
              Free Offer Active · showroom products unlimited
            </>
          )
        }
        action={
          <ButtonLink href="/merchant/offers/new" variant="primary-indigo" icon={<Plus className="size-4" />}>
            Naya Offer
          </ButtonLink>
        }
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <Segmented
          id="offers-tab"
          className="self-start"
          value={tab}
          onChange={setTab}
          options={[
            { value: "offer", label: `Offers (${Object.values(offers).filter((o) => o.shopId === shop.id && o.kind === "offer").length})` },
            { value: "product", label: `Showroom (${productCount})` },
          ]}
        />
        {shop.plan === "free" && (
          <Link href="/merchant/plan" className="hidden items-center gap-1 rounded-full bg-saffron-100 px-3 py-1.5 text-[12px] font-bold text-saffron-700 md:inline-flex">
            <Sparkles className="size-3.5" /> Unlimited offers · Pro
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState title="Abhi kuch nahi" body="Pehla offer daaliye — 30 second lagte hain." action={<ButtonLink href="/merchant/offers/new" variant="primary-indigo">+ Naya Offer</ButtonLink>} />
      ) : (
        <Card className="divide-y divide-hairline overflow-hidden">
          {list.map((o) => {
            const live = o.status === "live";
            const dl = daysLeft(o.validTill);
            return (
              <div key={o.id} className="flex items-center gap-3 p-3 lg:gap-4 lg:p-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-wash-cream lg:size-[72px]">
                  <RetailImage imageKey={o.imageKey} src={o.customImage} size="thumb" alt="" className="size-full bg-transparent" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[11px] font-bold", live ? "bg-leaf-50 text-leaf-700" : "bg-sunk text-ink-500")}>
                      {live ? "● Live" : o.status === "expired" ? "Expired" : "Paused"}
                    </span>
                    {o.kind === "offer" && dl !== undefined && live && <span className="text-[12px] text-ink-500">{dl <= 0 ? "Aaj khatam" : `${dl} din baaki`}</span>}
                  </div>
                  <div className="mt-1 truncate text-[15px] font-semibold text-ink-900">{o.title}</div>
                  <div className="mt-0.5 flex items-center gap-3 text-[12.5px] text-ink-500">
                    {o.price ? <b className="tabular text-ink-900">{formatINR(o.price)}</b> : null}
                    {o.discountPct ? <span className="font-semibold text-flame-600">{o.discountPct}% off</span> : null}
                    <span className="inline-flex items-center gap-1">
                      <MousePointerClick className="size-3.5" /> {o.clicks}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link href={`/shop/${shop.slug}?offer=${o.id}`} aria-label="Buyer view" className="flex size-9 items-center justify-center rounded-full text-ink-500 hover:bg-sunk">
                    <Eye className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggle(o.id, live)}
                    aria-label={live ? "Pause" : "Live karein"}
                    className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold", live ? "bg-sunk text-ink-700" : "bg-indigo-600 text-white")}
                  >
                    {live ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                    <span className="hidden sm:inline">{live ? "Pause" : "Live"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      )}
      <PaywallSheet open={paywall} onClose={() => setPaywall(false)} shopId={shop.id} />
    </div>
  );
}
