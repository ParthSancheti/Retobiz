"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { BadgeCheck, Check, MessageCircle, Navigation, Phone, Star } from "lucide-react";
import { useState } from "react";
import type { Category, Shop } from "@/lib/types";
import { cn } from "@/lib/cn";
import { formatCompactIN, formatDistance } from "@/lib/format";
import { spring } from "@/lib/motion";
import { followerCount } from "@/store/selectors";
import { useStore } from "@/store";
import { useUiStore } from "@/store/ui";
import { LiveFlash } from "@/components/ui/misc";
import { RetailImage } from "@/components/media/retail-image";

/** Deep colours for the deal panel, per category wash (cutout sits on top). */
const PANEL: Record<Category["wash"], string> = {
  mint: "bg-[linear-gradient(135deg,#DDF5E7_0%,#B9EBCF_100%)]",
  peach: "bg-[linear-gradient(135deg,#FFE7D6_0%,#FFC9A8_100%)]",
  sky: "bg-[linear-gradient(135deg,#E1EDFF_0%,#BCD5FF_100%)]",
  cream: "bg-[linear-gradient(135deg,#FFF3CF_0%,#FFE08A_100%)]",
  lavender: "bg-[linear-gradient(135deg,#EFE6FF_0%,#D7C4FF_100%)]",
};

/**
 * Store card — uniform height, crisp Verified + discount + rating alignment,
 * GPU-smooth Apple hover lift, and aligned WhatsApp Offers / Number / Directions actions.
 */
export function ShopCoverCard({
  shop,
  category,
  areaName,
  distanceKm,
  topDeal,
  liveOffers,
  className,
}: {
  shop: Shop;
  category?: Category;
  areaName: string;
  distanceKm?: number;
  topDeal?: string;
  liveOffers: number;
  /** Kept for API compatibility; follow now opens the shared claim sheet. */
  onFollow?: () => void;
  className?: string;
}) {
  const followers = followerCount(shop);
  const following = useStore((s) => s.buyerPassIds.some((id) => s.customers[id]?.shopId === shop.id));
  const openClaim = useUiStore((s) => s.openClaim);
  const [showPhone, setShowPhone] = useState(false);
  const wash = category?.wash ?? "cream";

  return (
    <article
      className={cn(
        "group flex h-full flex-col justify-between overflow-hidden rounded-[24px] border border-black/[0.06] bg-surface shadow-[0_1px_2px_rgba(18,20,26,0.04)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_14px_34px_-10px_rgba(18,20,26,0.12)] active:scale-[0.98]",
        className,
      )}
    >
      <Link href={`/shop/${shop.slug}?src=card`} className={cn("relative m-2.5 mb-0 flex aspect-[16/8] overflow-hidden rounded-[18px]", PANEL[wash])}>
        <div className="relative z-10 flex w-[56%] flex-col justify-between p-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {shop.isVerified && (
              <span className="inline-flex h-[22px] items-center gap-1 rounded-md bg-white px-2 text-[10.5px] font-bold text-indigo-600 shadow-1">
                <BadgeCheck className="size-3.5 fill-indigo-500 text-white" strokeWidth={2} /> Verified
              </span>
            )}
            {distanceKm != null && (
              <span className="tabular inline-flex h-[22px] items-center rounded-md bg-ink-900/80 px-2 text-[10.5px] font-bold text-white">
                {formatDistance(distanceKm)}
              </span>
            )}
          </div>
          <div>
            {topDeal ? (
              <>
                <div className="text-[10px] font-bold tracking-[0.08em] text-ink-900/60 uppercase">Aaj ka deal</div>
                <div className="line-clamp-1 font-display text-[20px] leading-[22px] font-extrabold tracking-[-0.02em] text-ink-900">{topDeal}</div>
              </>
            ) : (
              <div className="line-clamp-1 font-display text-[17px] leading-5 font-extrabold text-ink-900">Naya stock aaya</div>
            )}
          </div>
        </div>
        <RetailImage
          imageKey={shop.coverImageKey}
          mode="cover"
          size="card"
          wash={wash}
          zoom
          alt=""
          className="absolute inset-y-0 right-0 w-[50%] bg-transparent"
        />
      </Link>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-start justify-between gap-2.5">
            <Link href={`/shop/${shop.slug}?src=card`} className="min-w-0 flex-1">
              <h3 className="truncate text-[16px] leading-[22px] font-bold text-ink-900 transition-colors hover:text-indigo-700">{shop.name}</h3>
              <p className="mt-0.5 truncate text-[12.5px] text-ink-500">
                {category?.name} · {areaName}
              </p>
            </Link>
            {shop.rating != null && (
              <span className="tabular inline-flex h-6 shrink-0 items-center gap-0.5 rounded-md bg-leaf-600 px-2 text-[12px] font-extrabold text-white">
                {shop.rating.toFixed(1)} <Star className="size-3 fill-white" strokeWidth={0} />
              </span>
            )}
          </div>

          <div className="mt-2.5 flex min-h-[24px] flex-wrap items-center gap-1.5 text-[11.5px]">
            <span className="font-semibold text-ink-700">
              <LiveFlash watch={followers}>
                <span className="tabular">{formatCompactIN(followers)}</span>
              </LiveFlash>{" "}
              followers
            </span>
            {shop.ratingCount ? <span className="text-ink-500">· {shop.ratingCount} ratings</span> : null}
            {liveOffers > 0 && <span className="rounded-md bg-flame-50 px-1.5 py-0.5 font-bold text-flame-700">{liveOffers} offer{liveOffers > 1 ? "s" : ""} live</span>}
            {shop.verification.gst && <span className="rounded-md bg-sunk px-1.5 py-0.5 font-semibold text-ink-700">GST</span>}
          </div>
        </div>

        {/* Justdial-style action row — uniformly pinned to bottom */}
        <div className="mt-4 grid grid-cols-[1.45fr_1fr_auto] items-center gap-2 border-t border-black/[0.05] pt-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            transition={spring.snappy}
            onClick={() => !following && openClaim(shop.id)}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-[12.5px] font-bold whitespace-nowrap transition-colors",
              following ? "bg-leaf-50 text-leaf-700" : "bg-leaf-500 text-white hover:bg-leaf-600",
            )}
          >
            {following ? <Check className="size-4 shrink-0" strokeWidth={2.5} /> : <MessageCircle className="size-4 shrink-0" strokeWidth={2.25} />}
            <span>{following ? "Following" : "WhatsApp Offers"}</span>
          </motion.button>
          {showPhone ? (
            <a href={`tel:+91${shop.phone}`} className="tabular inline-flex h-9 items-center justify-center rounded-full border border-leaf-500 px-2 text-[12px] font-bold whitespace-nowrap text-leaf-700">
              {shop.phone.slice(0, 5)} {shop.phone.slice(5)}
            </a>
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              transition={spring.snappy}
              onClick={() => setShowPhone(true)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-hairline-strong px-2.5 text-[12.5px] font-bold whitespace-nowrap text-ink-900 transition-colors hover:border-ink-900"
            >
              <Phone className="size-3.5 shrink-0" strokeWidth={2.25} /> Number
            </motion.button>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${shop.geo.lat},${shop.geo.lng}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`${shop.name} tak raasta`}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-hairline-strong text-indigo-600 transition-colors hover:border-indigo-500"
          >
            <Navigation className="size-4" strokeWidth={2.25} />
          </a>
        </div>
      </div>
    </article>
  );
}
