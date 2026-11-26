"use client";
import Link from "next/link";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/cn";
import { RetailImage } from "@/components/media/retail-image";

/**
 * Category discovery card:
 * - "card" (default): bigger horizontal/spacious tile with large pastel icon frame + legible title & Hindi sublabel.
 * - "tile": square top-cutout tile for wider desktop grids.
 */
export function CategoryTile({
  category,
  href,
  layout = "card",
}: {
  category: Category;
  href?: string;
  layout?: "card" | "tile";
}) {
  if (layout === "tile") {
    return (
      <Link
        href={href ?? `/category/${category.slug}`}
        className="group flex flex-col items-center gap-2 rounded-[20px] outline-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 active:scale-[0.98]"
      >
        <RetailImage
          imageKey={category.imageKey}
          size="thumb"
          wash={category.wash}
          alt=""
          zoom
          className="aspect-square w-full rounded-[20px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] transition-shadow duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:shadow-[0_14px_34px_-10px_rgba(18,20,26,0.12)] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-indigo-500"
        />
        <span className="text-center leading-none">
          <span className="line-clamp-2 block text-[13px] leading-[16px] font-bold text-ink-900 lg:text-[14px] lg:leading-[17px]">{category.name}</span>
          {category.nameHi && (
            <span lang="hi" className="mt-0.5 block font-deva text-[11.5px] font-medium text-ink-500">
              {category.nameHi}
            </span>
          )}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href ?? `/category/${category.slug}`}
      className={cn(
        "group flex h-full items-center gap-2.5 rounded-[20px] border border-black/[0.06] bg-white p-2.5 shadow-[0_2px_10px_-4px_rgba(18,20,26,0.06)] outline-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-black/[0.12] hover:shadow-[0_12px_28px_-10px_rgba(18,20,26,0.12)] active:scale-[0.98] lg:flex-col lg:items-center lg:gap-2.5 lg:p-3.5",
      )}
    >
      <RetailImage
        imageKey={category.imageKey}
        size="thumb"
        wash={category.wash}
        alt=""
        priority
        zoom
        className="size-12 shrink-0 rounded-[14px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] lg:size-20 lg:rounded-[18px]"
      />
      <span className="min-w-0 flex-1 text-left leading-none lg:flex-none lg:text-center">
        <span className="line-clamp-2 block text-[12.5px] leading-[15.5px] font-bold text-ink-900 lg:text-[14px] lg:leading-[18px]">
          {category.name}
        </span>
        {category.nameHi && (
          <span lang="hi" className="mt-0.5 block font-deva text-[11px] font-medium text-ink-500">
            {category.nameHi}
          </span>
        )}
      </span>
    </Link>
  );
}
