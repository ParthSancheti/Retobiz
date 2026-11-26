"use client";
import Link from "next/link";
import { Eye, Play } from "lucide-react";
import type { Category, Reel, Shop } from "@/lib/types";
import { formatCompactIN } from "@/lib/format";
import { RetailImage } from "@/components/media/retail-image";

const UGC_FRAMES = new Set(["reel-ugc-creator", "reel-mobile-unbox"]);

/** "@laxmisaree.akurdi" style handle for the shop's reel account. */
export function shopHandle(shop: Shop) {
  const words = shop.name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w && !["and", "the", "centre", "center", "stores", "store", "shop"].includes(w));
  const area = shop.slug.split("-").pop() ?? "";
  return `@${words.slice(0, 2).join("")}.${area}`;
}

export function isUgcReel(reel: Reel) {
  return UGC_FRAMES.has(String(reel.frames[0]?.imageKey));
}

/** 9:16 reel poster: real full-bleed photo, scrim, creator pill, REEL/UGC badge, play pill, caption. */
export function ReelCard({ reel, shop, category, href, size = "md" }: { reel: Reel; shop: Shop; category?: Category; href: string; size?: "md" | "lg" }) {
  const first = reel.frames[0];
  const ugc = isUgcReel(reel);
  return (
    <div className="group">
      <Link
        href={href}
        scroll={false}
        className={`relative block aspect-[9/16] overflow-hidden rounded-[24px] bg-ink-900 shadow-soft transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_14px_34px_-10px_rgba(18,20,26,0.12)] active:scale-[0.98] ${size === "lg" ? "w-[214px] lg:w-[236px]" : "w-[174px] lg:w-[200px]"}`}
      >
        <RetailImage
          imageKey={first?.imageKey}
          mode="cover"
          size="reel"
          wash={category?.wash ?? "lavender"}
          className="h-full w-full bg-ink-900"
          imgClassName="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(10_12_20/0.45)_0%,rgb(10_12_20/0)_24%,rgb(10_12_20/0)_50%,rgb(10_12_20/0.86)_100%)]" />
        <div className="absolute inset-x-2.5 top-2.5 flex items-center justify-between gap-1.5">
          <span className={`rounded-full px-2 py-[3px] text-[10px] font-extrabold tracking-[0.08em] text-white ${ugc ? "bg-flame-500" : "bg-white/20 backdrop-blur-md"}`}>{ugc ? "UGC" : "REEL"}</span>
          <span className="flex size-7 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur-md transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
            <Play className="ml-0.5 size-3.5 fill-white text-white" />
          </span>
        </div>
        <div className="absolute inset-x-2.5 bottom-2.5 text-white">
          <span className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-black/35 py-[3px] pr-2.5 pl-[3px] backdrop-blur-md">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-saffron-400 to-flame-500 text-[8.5px] font-extrabold text-white">
              {shop.name.replace(/&/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("")}
            </span>
            <span className="truncate text-[11px] font-semibold">{shopHandle(shop)}</span>
          </span>
          <p className="line-clamp-2 font-display text-[15px] leading-[19px] font-extrabold tracking-[-0.01em] lg:text-[16px] lg:leading-5">{reel.caption}</p>
          <span className="tabular mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-white/75">
            <Eye className="size-3" /> {formatCompactIN(reel.views)} views
          </span>
        </div>
      </Link>
    </div>
  );
}
