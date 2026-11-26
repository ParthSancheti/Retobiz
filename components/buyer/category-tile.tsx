"use client";
import Link from "next/link";
import type { Category } from "@/lib/types";
import { RetailImage } from "@/components/media/retail-image";

/** Instamart-style tile: big glossy cutout filling a pastel tile, bold label + local-script name. */
export function CategoryTile({ category, href }: { category: Category; href?: string }) {
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
