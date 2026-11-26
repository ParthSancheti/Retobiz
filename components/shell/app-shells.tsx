"use client";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useStore } from "@/store";
import { useHydrated } from "@/store/sync";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { ProBadge, VerifiedBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/misc";
import { ShopMonogram } from "@/components/buyer/shop-card";
import { DockedRoleSwitcher, HeaderRoleSwitcher } from "./role-switcher";
import { ADMIN_NAV, BottomNav, MERCHANT_NAV, MERCHANT_SIDEBAR, ScrollTabs, Sidebar } from "./nav";

function ShopIdentity({ compact }: { compact?: boolean }) {
  const shop = useStore((s) => s.shops[s.activeMerchantShopId]);
  const category = useStore((s) => s.categories.find((c) => c.id === s.shops[s.activeMerchantShopId]?.categoryId));
  const hydrated = useHydrated();
  if (!hydrated || !shop)
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="size-10" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ShopMonogram shop={shop} wash={category?.wash ?? "cream"} size={compact ? 36 : 40} />
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <span className={cn("text-[14px] font-bold text-ink-900", compact ? "line-clamp-2 leading-[17px]" : "truncate leading-5")}>{shop.name}</span>
          {shop.isVerified && <VerifiedBadge compact />}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          {shop.plan === "pro" ? <ProBadge className="h-5 text-[10px]" /> : <span className="text-[12px] font-semibold text-ink-500">Free plan</span>}
        </div>
      </div>
    </div>
  );
}

export function MerchantShell({ children }: { children: ReactNode }) {
  const slug = useStore((s) => s.shops[s.activeMerchantShopId]?.slug);
  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar
        items={MERCHANT_SIDEBAR}
        id="merchant"
        header={
          <div className="px-6 pt-7 pb-5">
            <Link href="/merchant" aria-label="Merchant home" className="inline-block">
              <BrandLockup size="md" withTagline />
            </Link>
          </div>
        }
        footer={
          <div className="flex flex-col gap-3 border-t border-black/[0.05] p-3">
            <div className="flex items-center gap-2 rounded-[18px] bg-canvas p-2.5">
              <div className="min-w-0 flex-1">
                <ShopIdentity compact />
              </div>
              {slug && (
                <Link
                  href={`/shop/${slug}?as=owner`}
                  aria-label="Meri Dukaan dekhein"
                  title="Meri Dukaan dekhein"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-indigo-600 shadow-1 transition hover:bg-indigo-50 active:scale-95"
                >
                  <ExternalLink className="size-4" />
                </Link>
              )}
            </div>
            <DockedRoleSwitcher />
          </div>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-hairline bg-surface/95 px-4 backdrop-blur lg:hidden">
          <ShopIdentity compact />
          <HeaderRoleSwitcher />
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-5 pb-28 lg:px-6 lg:pt-10 lg:pb-12">{children}</main>
      </div>
      <BottomNav items={MERCHANT_NAV} id="merchant" />
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar
        items={ADMIN_NAV}
        id="admin"
        header={
          <div className="flex items-center gap-2.5 px-6 pt-7 pb-5">
            <BrandLockup size="md" />
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] text-white uppercase">Ops</span>
          </div>
        }
        footer={
          <div className="flex flex-col gap-3 border-t border-black/[0.05] p-3">
            <div className="flex items-center gap-3 rounded-[18px] bg-canvas p-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-indigo-600 text-[13px] font-bold text-white">RO</span>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-bold text-ink-900">Retobiz Ops</div>
                <div className="text-[12px] text-ink-500">Pune · Nashik · Malegaon</div>
              </div>
            </div>
            <DockedRoleSwitcher />
          </div>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-hairline bg-surface/95 px-4 pt-3 backdrop-blur lg:hidden">
          <div className="mb-3 flex items-center gap-2">
            <BrandLockup size="sm" />
            <span className="rounded-sm bg-ink-900 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.06em] text-white uppercase">Ops</span>
            <span className="ml-auto">
              <HeaderRoleSwitcher />
            </span>
          </div>
          <ScrollTabs items={ADMIN_NAV} />
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-5 pb-28 lg:px-6 lg:pt-10 lg:pb-12">{children}</main>
      </div>
    </div>
  );
}
