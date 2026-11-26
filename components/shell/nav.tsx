"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { motion } from "motion/react";
import {
  BadgePercent,
  Clapperboard,
  Home,
  LayoutDashboard,
  Megaphone,
  MapPin,
  Menu,
  QrCode,
  ReceiptIndianRupee,
  Search,
  ShieldCheck,
  Store,
  Tags,
  Ticket,
  Truck,
  Users,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match nested routes. */
  match?: (path: string) => boolean;
}

export const BUYER_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home, match: (p) => p === "/" },
  { href: "/search", label: "Search", icon: Search, match: (p) => p.startsWith("/search") || p.startsWith("/category") },
  { href: "/offers", label: "Offers", icon: BadgePercent },
  { href: "/passes", label: "My Passes", icon: Ticket },
];

export const MERCHANT_NAV: NavItem[] = [
  { href: "/merchant", label: "Home", icon: LayoutDashboard, match: (p) => p === "/merchant" },
  { href: "/merchant/offers", label: "Offers", icon: BadgePercent },
  { href: "/merchant/studio", label: "Studio", icon: Clapperboard },
  { href: "/merchant/customers", label: "Customers", icon: Users, match: (p) => p.startsWith("/merchant/customers") || p.startsWith("/merchant/broadcast") },
  { href: "/merchant/more", label: "More", icon: Menu, match: (p) => ["/merchant/more", "/merchant/qr-standee", "/merchant/profile", "/merchant/plan"].some((x) => p.startsWith(x)) },
];

export const MERCHANT_SIDEBAR: NavItem[] = [
  { href: "/merchant", label: "Home", icon: LayoutDashboard, match: (p) => p === "/merchant" },
  { href: "/merchant/offers", label: "Offers & Products", icon: BadgePercent },
  { href: "/merchant/studio", label: "Marketing Studio", icon: Clapperboard },
  { href: "/merchant/customers", label: "Customers (CRM)", icon: Users },
  { href: "/merchant/broadcast", label: "WhatsApp Broadcast", icon: Megaphone },
  { href: "/merchant/qr-standee", label: "QR Standee", icon: QrCode },
  { href: "/merchant/profile", label: "Storefront Profile", icon: Store },
  { href: "/merchant/plan", label: "Plan & Billing", icon: ReceiptIndianRupee },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, match: (p) => p === "/admin" },
  { href: "/admin/shops", label: "Shop Verification", icon: ShieldCheck },
  { href: "/admin/fulfillment", label: "Agency Kanban", icon: Clapperboard },
  { href: "/admin/qr-orders", label: "₹49 QR Orders", icon: Truck },
  { href: "/admin/masters/categories", label: "Category Master", icon: Tags },
  { href: "/admin/masters/locations", label: "Location Master", icon: MapPin },
  { href: "/admin/referrals", label: "Referrals", icon: Waypoints },
];

export function isActive(item: NavItem, path: string) {
  return item.match ? item.match(path) : path === item.href || path.startsWith(item.href + "/");
}

/** Thumb-zone bottom nav, 64px + safe area, layoutId pill (DESIGN §6.2). */
export function BottomNav(props: { items: NavItem[]; id: string }) {
  // usePathname must sit under Suspense on dynamic routes (Cache Components); fallback = no active pill.
  return (
    <Suspense fallback={<BottomNavView {...props} path={null} />}>
      <WithPath>{(path) => <BottomNavView {...props} path={path} />}</WithPath>
    </Suspense>
  );
}

function WithPath({ children }: { children: (path: string) => React.ReactNode }) {
  return <>{children(usePathname() ?? "/")}</>;
}

function BottomNavView({ items, id, path }: { items: NavItem[]; id: string; path: string | null }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-[560px] items-stretch justify-around px-2">
        {items.map((item) => {
          const active = path != null && isActive(item, path);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-1 flex-col items-center justify-center gap-1"
              >
                <span className="relative flex h-8 w-14 items-center justify-center">
                  {active && (
                    <motion.span layoutId={`bnav-${id}`} transition={spring.pill} className="absolute inset-0 rounded-full bg-indigo-50" />
                  )}
                  <Icon className={cn("relative size-[22px]", active ? "text-indigo-600" : "text-ink-500")} strokeWidth={active ? 2 : 1.75} />
                </span>
                <span className={cn("text-[11px] leading-none font-semibold", active ? "text-ink-900" : "text-ink-500")}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** 248px desktop sidebar for Merchant & Admin (DESIGN §6.3). */
type SidebarProps = { items: NavItem[]; id: string; header?: React.ReactNode; footer?: React.ReactNode };

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<SidebarView {...props} path={null} />}>
      <WithPath>{(path) => <SidebarView {...props} path={path} />}</WithPath>
    </Suspense>
  );
}

function SidebarView({ items, id, header, footer, path }: SidebarProps & { path: string | null }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[292px] shrink-0 p-4 lg:block">
      <div className="flex h-full flex-col overflow-hidden rounded-[26px] border border-black/[0.05] bg-white shadow-[0_8px_30px_rgba(18,20,26,0.06)]">
        {header}
        <nav aria-label="Sections" className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = path != null && isActive(item, path);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3.5 rounded-[16px] px-4 py-3 text-[15px] font-semibold transition-colors",
                      active ? "text-indigo-700" : "text-ink-700 hover:bg-canvas hover:text-ink-900",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId={`side-${id}`}
                        transition={spring.pill}
                        className="absolute inset-0 rounded-[16px] bg-indigo-50 ring-1 ring-indigo-500/15 ring-inset"
                      />
                    )}
                    <Icon className="relative size-[21px] transition-transform group-active:scale-90" strokeWidth={active ? 2.1 : 1.8} />
                    <span className="relative truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {footer}
      </div>
    </aside>
  );
}

/** Mobile horizontal section tabs (admin on small screens). */
export function ScrollTabs({ items }: { items: NavItem[] }) {
  return (
    <Suspense fallback={<ScrollTabsView items={items} path={null} />}>
      <WithPath>{(path) => <ScrollTabsView items={items} path={path} />}</WithPath>
    </Suspense>
  );
}

function ScrollTabsView({ items, path }: { items: NavItem[]; path: string | null }) {
  return (
    <nav aria-label="Sections" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
      {items.map((item) => {
        const active = path != null && isActive(item, path);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold whitespace-nowrap",
              active ? "border-ink-900 bg-ink-900 text-white" : "border-hairline bg-surface text-ink-700",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
