"use client";
import Link from "next/link";
import { motion } from "motion/react";
import type { Category, Shop } from "@/lib/types";
import { cn } from "@/lib/cn";
import { formatCompactIN, formatDistance } from "@/lib/format";
import { spring, tap } from "@/lib/motion";
import { followerCount } from "@/store/selectors";
import { VerifiedBadge } from "@/components/ui/badge";
import { LiveFlash } from "@/components/ui/misc";
import { WASH_BG } from "@/components/media/glyphs";

export function ShopMonogram({ shop, wash, size = 48, className }: { shop: Shop; wash: Category["wash"]; size?: number; className?: string }) {
  const initials = shop.name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={cn("flex shrink-0 items-center justify-center rounded-md font-display font-extrabold text-ink-900", WASH_BG[wash], className)}
    >
      {initials}
    </span>
  );
}

/** Monogram + name + verified + area·distance + live offers + follow CTA (DESIGN §7). */
export function ShopCard({
  shop,
  category,
  areaName,
  distanceKm,
  liveOffers,
  onFollow,
}: {
  shop: Shop;
  category?: Category;
  areaName: string;
  distanceKm?: number;
  liveOffers: number;
  onFollow?: () => void;
}) {
  const followers = followerCount(shop);
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-hairline bg-surface p-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_14px_34px_-10px_rgba(18,20,26,0.12)] active:scale-[0.98]">
      <Link href={`/shop/${shop.slug}?src=card`} className="flex min-w-0 flex-1 items-center gap-3 rounded-md">
        <ShopMonogram shop={shop} wash={category?.wash ?? "cream"} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="truncate text-[15px] leading-5 font-bold">{shop.name}</h3>
            {shop.isVerified && <VerifiedBadge compact />}
          </div>
          <div className="mt-0.5 truncate text-[13px] text-ink-500">
            {category?.name} · {areaName}
            {distanceKm != null && <> · {formatDistance(distanceKm)}</>}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[12px] font-semibold">
            {liveOffers > 0 && <span className="text-flame-600">{liveOffers} offer{liveOffers > 1 ? "s" : ""}</span>}
            <span className="text-ink-500">
              <LiveFlash watch={followers}>
                <span className="tabular">{formatCompactIN(followers)}</span>
              </LiveFlash>{" "}
              followers
            </span>
          </div>
        </div>
      </Link>
      {onFollow && (
        <motion.button
          type="button"
          onClick={onFollow}
          whileTap={tap}
          transition={spring.snappy}
          className="h-9 shrink-0 rounded-full bg-leaf-50 px-3.5 text-[13px] font-bold text-leaf-700 hover:bg-leaf-100"
        >
          Follow
        </motion.button>
      )}
    </div>
  );
}
