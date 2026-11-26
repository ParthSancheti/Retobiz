"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, BadgeCheck, Check, Heart, Timer } from "lucide-react";
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
 * Consumer offer card — spacious editorial framing, clean typographic price hierarchy,
 * restrained single badge + inline claim pill (no cramped stacked pills or orange walls).
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
        "group relative flex h-full flex-col rounded-[26px] border border-black/[0.06] bg-white p-3.5 shadow-[0_2px_10px_-3px_rgba(18,20,26,0.06)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_18px_38px_-12px_rgba(18,20,26,0.14)] active:scale-[0.99]",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[20px]">
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
            className={cn(
              "w-full rounded-[20px]",
              size === "sm" ? "aspect-[4/3] md:aspect-[1/1.02]" : "aspect-[16/11] md:aspect-[1/1.02]",
            )}
          />
        </Link>

        {ribbon && (
          <span className="tabular pointer-events-none absolute top-3 left-3 inline-flex h-7 items-center rounded-full bg-flame-500 px-3 text-[12px] leading-none font-extrabold tracking-[0.02em] text-white shadow-[0_4px_12px_-3px_rgba(236,70,19,0.65)]">
            {ribbon}
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
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/90 shadow-soft backdrop-blur-md transition-colors hover:bg-white"
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span key={saved ? "on" : "off"} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={spring.snappy}>
              <Heart className={cn("size-4", saved ? "fill-flame-500 text-flame-500" : "text-ink-700")} strokeWidth={2.2} />
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="flex flex-1 flex-col px-0.5 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-2">
            {offer.price != null ? (
              <>
                <span className="tabular font-display text-[21px] leading-none font-extrabold tracking-[-0.02em] text-ink-900">
                  {formatINR(offer.price)}
                  {offer.unit && <span className="ml-0.5 font-sans text-[12px] font-semibold text-ink-500">{offer.unit}</span>}
                </span>
                {offer.mrp && offer.mrp > offer.price && (
                  <span className="tabular text-[13px] text-ink-400 line-through">{formatINR(offer.mrp)}</span>
                )}
              </>
            ) : (
              <span className="font-display text-[17px] leading-none font-extrabold text-flame-600">
                Flat {offer.discountPct}% off
              </span>
            )}
          </div>
          {left != null && left <= 7 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-wash-cream px-2.5 py-1 text-[11px] font-bold text-[#8A5600]">
              <Timer className="size-3" strokeWidth={2.25} />
              {left === 0 ? "Last day" : `${left}d left`}
            </span>
          )}
        </div>

        <h3 className="mt-2 line-clamp-2 font-display text-[16px] leading-[21px] font-bold tracking-[-0.01em] text-ink-900 md:text-[15.5px]">
          <Link href={href} onClick={() => trackOfferClick(offer.id)} className="transition-colors hover:text-flame-600">
            {offer.title}
          </Link>
        </h3>

        <div className="mt-auto flex items-center justify-between gap-2.5 border-t border-black/[0.05] pt-3">
          <Link href={href} onClick={() => trackOfferClick(offer.id)} className="flex min-w-0 flex-1 items-center gap-1.5 text-[12.5px] text-ink-600 hover:text-ink-900">
            {shop.isVerified && <BadgeCheck className="size-4 shrink-0 fill-indigo-500 text-white" strokeWidth={2} aria-label="Verified" />}
            <span className="truncate font-medium">{shop.name}</span>
            {distanceKm != null && <span className="tabular shrink-0 font-semibold text-ink-900">· {formatDistance(distanceKm)}</span>}
          </Link>

          <button
            type="button"
            onClick={() => openClaim(shop.id, offer.id)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-4 text-[12.5px] font-bold transition-all duration-200 active:scale-[0.96]",
              following
                ? "bg-leaf-50 text-leaf-700 ring-1 ring-leaf-500/30"
                : "bg-ink-900 text-white hover:bg-flame-600",
            )}
          >
            {following ? (
              <>
                <Check className="size-3.5" strokeWidth={2.5} /> Saved
              </>
            ) : (
              <>
                Claim <ArrowUpRight className="size-3.5" strokeWidth={2.2} />
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export function OfferCardSkeleton() {
  return (
    <div className="rounded-[26px] border border-black/[0.06] bg-white p-3.5 shadow-[0_1px_2px_rgba(18,20,26,0.04)]">
      <div className="skeleton aspect-[16/11] rounded-[20px] md:aspect-[1/1.02]" />
      <div className="space-y-2.5 pt-3.5">
        <div className="skeleton h-6 w-24 rounded-md" />
        <div className="skeleton h-4 rounded-sm" />
        <div className="flex items-center justify-between pt-2">
          <div className="skeleton h-3.5 w-28 rounded-sm" />
          <div className="skeleton h-9 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
