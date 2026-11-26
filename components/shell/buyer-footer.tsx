import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Store } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { ButtonLink } from "@/components/ui/button";

const FOOTER_DISCOVER = [
  { label: "Home Marketplace", href: "/" },
  { label: "Aaj ke Live Offers", href: "/offers" },
  { label: "Explore Verified Shops", href: "/search?tab=shops" },
  { label: "My VIP Passes", href: "/passes" },
];

const FOOTER_CATEGORIES = [
  { label: "Kirana & General Store", href: "/category/kirana" },
  { label: "Saree & Readymade", href: "/category/saree-readymade" },
  { label: "Mithai & Bakery", href: "/category/bakery-mithai" },
  { label: "Footwear & Bags", href: "/category/footwear-bags" },
  { label: "Mobile & Repair", href: "/category/mobile-repair" },
];

const FOOTER_HUBS = [
  "Akurdi · Nigdi · Pradhikaran",
  "Chinchwad · Pimpri · Ravet",
  "Nashik · College Road",
  "Malegaon Market",
];

export function BuyerFooter() {
  return (
    <footer className="relative mt-14 overflow-hidden rounded-t-[32px] bg-[#181411] text-white">
      {/* Subtle warm marigold glow at top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,198,41,0.16),transparent)]"
      />

      <div className="relative mx-auto max-w-[1280px] px-5 pt-9 pb-32 lg:px-8 lg:pt-12 lg:pb-12">
        {/* Partner Merchant Showcase Card */}
        <div className="mb-10 flex flex-col justify-between gap-5 rounded-[26px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl lg:flex-row lg:items-center lg:p-7">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-saffron-400/15 px-3 py-1 text-[11px] font-bold tracking-[0.06em] text-saffron-400 uppercase">
              <Store className="size-3.5" /> For Shop Owners
            </span>
            <h2 className="mt-2.5 font-display text-[22px] leading-[28px] font-extrabold tracking-[-0.02em] text-white lg:text-[26px]">
              Aapki bhi neighbourhood dukaan hai?
            </h2>
            <p className="mt-1.5 text-[14px] leading-[20px] text-white/70">
              2 minute mein apna digital showroom shuru karein. Direct WhatsApp inquiries &amp; VIP repeat customers — zero commission.
            </p>
          </div>
          <ButtonLink
            href="/list-your-shop"
            variant="primary-flame"
            size="lg"
            iconRight={<ArrowRight className="size-4" />}
            className="shrink-0 rounded-full shadow-[0_10px_28px_-6px_rgba(255,90,44,0.65)]"
          >
            Apni Dukaan List Karein
          </ButtonLink>
        </div>

        {/* Structured Sitemap Grid */}
        <div className="grid grid-cols-2 gap-8 border-b border-white/10 pb-9 lg:grid-cols-12">
          <div className="col-span-2 lg:col-span-4">
            <BrandLockup size="md" tone="white" withTagline />
            <p className="mt-3 max-w-xs text-[13.5px] leading-[20px] text-white/65">
              Neighbourhood discovery built for Bharat&apos;s trusted local showrooms, kiranas, mithai houses, and boutiques.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/80">
              <ShieldCheck className="size-4 text-leaf-500" /> Verified local businesses · Zero spam
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-[11.5px] font-bold tracking-[0.08em] text-white/50 uppercase">Discover</h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {FOOTER_DISCOVER.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[13.5px] font-medium text-white/80 transition-colors hover:text-saffron-400">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-[11.5px] font-bold tracking-[0.08em] text-white/50 uppercase">Categories</h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {FOOTER_CATEGORIES.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[13.5px] font-medium text-white/80 transition-colors hover:text-saffron-400">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-3">
            <h3 className="text-[11.5px] font-bold tracking-[0.08em] text-white/50 uppercase">Active Bazaar Hubs</h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {FOOTER_HUBS.map((hub) => (
                <li key={hub} className="flex items-center gap-2 text-[13px] text-white/70">
                  <MapPin className="size-3.5 shrink-0 text-flame-500" />
                  <span>{hub}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom signature bar */}
        <div className="flex flex-col gap-2 pt-6 text-[12px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Retobiz · Made for Bharat ki dukaanein</span>
          <span className="text-white/40">Pune (PCMC) · Nashik · Malegaon</span>
        </div>
      </div>
    </footer>
  );
}
