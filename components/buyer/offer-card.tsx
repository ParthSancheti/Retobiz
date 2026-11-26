"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { BadgeCheck, Heart, Timer } from "lucide-react";
import type { Category, Offer, Shop } from "@/lib/types";
import { cn } from "@/lib/cn";
import { daysLeft, formatDistance, formatINR } from "@/lib/format";
import { spring } from "@/lib/motion";
import { useStore } from "@/store";
import { toast, useUiStore } from "@/store/ui";
import { RetailImage } from "@/components/media/retail-image";

/** "40% OFF" or "FLAT ₹300 OFF" — whichever reads bigger to a shopper. */
export function ribbonLabel(o: Offer): string | undefined {
  const saving = o.mrp && o.price ? o.mrp - o.price : 0;
  if (o.discountPct && o.discountPct >= 10) return `${o.discountPct}% OFF`;
  if (saving >= 100) return `FLAT ${formatINR(saving)} OFF`;
  if (o.discountPct) return `${o.discountPct}% OFF`;
  return undefined;
}

/**
 * Consumer offer card — unified rounded white container with nested image frame,
 * clean top-left discount badge, price/shop hierarchy, and aligned CLAIM action.
 */
export function OfferCard({
  offer,
  shop,
  category,
  distanceKm,
  size = "md",
  className,
  priority,
}: {
  offer: Offer;
  shop: Shop;
  category?: Category;
  distanceKm?: number;
  size?: "sm" | "md";
  className?: string;
  priority?: boolean;
}) {
  const saved = useStore((s) => s.savedOfferIds.includes(offer.id));
  const toggleSave = useStore((s) => s.toggleSaveOffer);
  const trackOfferClick = useStore((s) => s.trackOfferClick);
  const following = useStore((s) => s.buyerPassIds.some((id) => s.customers[id]?.shopId === shop.id));
  const openClaim = useUiStore((s) => s.openClaim);
  const ribbon = ribbonLabel(offer);
  const left = daysLeft(offer.validTill);
  const href = `/shop/${shop.slug}?offer=${offer.id}&src=card`;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-[22px] border border-black/[0.06] bg-white p-3 shadow-[0_1px_2px_rgba(18,20,26,0.04)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_14px_34px_-10px_rgba(18,20,26,0.12)] active:scale-[0.98]",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[16px]">
        <Link
          href={href}
          onClick={() => trackOfferClick(offer.id)}
          aria-label={`${offer.title} — ${shop.name}`}
          className="block w-full"
        >
          <RetailImage
            imageKey={offer.imageKey}
            src={offer.customImage}
            mode="cover"
            size="card"
            wash={category?.wash ?? "cream"}
            priority={priority}
            zoom
            className="aspect-[1/1.04] w-full rounded-[16px]"
          />
        </Link>

        {ribbon && (
          <span className="tabular pointer-events-none absolute top-2.5 left-2.5 inline-flex h-6 items-center rounded-full bg-flame-500 px-2.5 text-[11.5px] leading-none font-extrabold tracking-[0.01em] text-white shadow-[0_4px_10px_-4px_rgba(255,90,44,0.75)]">
            {ribbon}
          </span>
        )}

        {left != null && left <= 7 && (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex h-6 items-center gap-1 rounded-full bg-ink-900/80 px-2.5 text-[10.5px] font-bold text-saffron-400 backdrop-blur-md">
            <Timer className="size-3" strokeWidth={2.5} />
            {left === 0 ? "Aaj last din" : `${left} din baaki`}
          </span>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          transition={spring.snappy}
          onClick={() => {
            const now = toggleSave(offer.id);
            toast({ message: now ? "Offer save ho gaya" : "Saved se hataya", tone: now ? "success" : "default" });
          }}
          aria-pressed={saved}
          aria-label={saved ? "Saved se hatayein" : "Offer save karein"}
          className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-soft backdrop-blur-md transition-colors hover:bg-white"
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span key={saved ? "on" : "off"} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={spring.snappy}>
              <Heart className={cn("size-[15px]", saved ? "fill-flame-500 text-flame-500" : "text-ink-700")} strokeWidth={2.25} />
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {offer.price != null ? (
            <>
              <span className={cn("tabular inline-flex items-center rounded-[10px] bg-leaf-600 px-2 font-sans font-extrabold tracking-[-0.01em] text-white", size === "sm" ? "h-7 text-[15px]" : "h-7 text-[16px]")}>
                {formatINR(offer.price)}
                {offer.unit && <span className="ml-0.5 text-[11px] font-semibold text-white/80">{offer.unit}</span>}
              </span>
              {offer.mrp && offer.mrp > offer.price && <span className="tabular text-[12.5px] text-ink-500 line-through">{formatINR(offer.mrp)}</span>}
            </>
          ) : (
            <span className={cn("inline-flex items-center rounded-[10px] bg-flame-50 px-2 font-extrabold text-flame-700", size === "sm" ? "h-7 text-[13px]" : "h-7 text-[14px]")}>
              Flat {offer.discountPct}% off
            </span>
          )}
        </div>

        <h3 className={cn("mt-2 line-clamp-2 font-sans font-bold tracking-[-0.005em] text-ink-900", size === "sm" ? "text-[13.5px] leading-[18px]" : "text-[14.5px] leading-5")}>
          <Link href={href} onClick={() => trackOfferClick(offer.id)} className="transition-colors hover:text-indigo-700">
            {offer.title}
          </Link>
        </h3>

        <div className="mt-auto flex min-w-0 items-center gap-1 pt-2 text-[12px] text-ink-500">
          {shop.isVerified && <BadgeCheck className="size-3.5 shrink-0 fill-indigo-500 text-white" strokeWidth={2} aria-label="Verified" />}
          <span className="truncate">{shop.name}</span>
          {distanceKm != null && <span className="tabular shrink-0 font-semibold text-ink-700">· {formatDistance(distanceKm)}</span>}
        </div>

        <button
          type="button"
          onClick={() => openClaim(shop.id, offer.id)}
          className={cn(
            "mt-3 inline-flex h-9 w-full items-center justify-center rounded-[12px] border text-[12.5px] font-extrabold tracking-[0.03em] transition-all duration-200 active:scale-[0.98]",
            following
              ? "border-leaf-500/30 bg-leaf-50 text-leaf-700"
              : "border-flame-500/25 bg-flame-50 text-flame-600 hover:border-flame-500 hover:bg-flame-500 hover:text-white",
          )}
        >
          {following ? "✓ PAAYA" : "CLAIM"}
        </button>
      </div>
    </article>
  );
}

export function OfferCardSkeleton() {
  return (
    <div className="rounded-[22px] border border-black/[0.06] bg-white p-3 shadow-[0_1px_2px_rgba(18,20,26,0.04)]">
      <div className="skeleton aspect-[1/1.04] rounded-[16px]" />
      <div className="space-y-2 pt-3">
        <div className="skeleton h-6 w-20 rounded-md" />
        <div className="skeleton h-4 rounded-sm" />
        <div className="skeleton h-3 w-2/3 rounded-sm" />
        <div className="skeleton mt-3 h-9 w-full rounded-[12px]" />
      </div>
    </div>
  );
}
