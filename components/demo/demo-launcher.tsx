"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, LayoutDashboard, QrCode, RotateCcw, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { useStore } from "@/store";
import { toast } from "@/store/ui";
import { HERO_SHOP_ID } from "@/data/seed";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { RetailImage } from "@/components/media/retail-image";
import type { ImageKey } from "@/data/images";
import { spring, stagger } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Journey = {
  n: number;
  title: string;
  pitch: string;
  roles: ("Buyer" | "Shop Owner" | "Admin")[];
  pin: boolean;
  img: ImageKey;
  steps: string[];
  primary: { href: string; label: string; newTab?: boolean };
  links: { href: string; label: string }[];
};

const JOURNEYS: Journey[] = [
  {
    n: 1,
    title: "QR walk-in",
    pitch: "Counter ka QR → WhatsApp follower, live in CRM.",
    roles: ["Buyer", "Shop Owner"],
    pin: true,
    img: "reel-paithani-owner",
    steps: ["Scan standee → shutter lifts", "Follow → VIP Pass (मराठी)", "Owner CRM +1, live alert", "Broadcast → buyer inbox"],
    primary: { href: "/q/LSC-AKD-001", label: "Open QR in new tab", newTab: true },
    links: [
      { href: "/merchant/customers", label: "CRM" },
      { href: "/merchant/broadcast", label: "Broadcast" },
      { href: "/passes", label: "Buyer inbox" },
    ],
  },
  {
    n: 2,
    title: "New shopkeeper",
    pitch: "2-minute signup to a verified, searchable storefront.",
    roles: ["Shop Owner", "Admin", "Buyer"],
    pin: false,
    img: "studio-shop-tour",
    steps: ["Profit estimator", "3-step onboarding · Demo fill", "Admin: approve + GST", "Buyer: Verified in search"],
    primary: { href: "/list-your-shop", label: "Start estimator" },
    links: [
      { href: "/admin/shops?f=pending", label: "Verify queue" },
      { href: "/search?tab=shops&v=1", label: "Verified search" },
    ],
  },
  {
    n: 3,
    title: "Freemium → Pro",
    pitch: "The ₹999/yr moment, with zero form loss.",
    roles: ["Shop Owner", "Admin"],
    pin: true,
    img: "reel-ugc-creator",
    steps: ["Owner Mode storefront", "+ Naya Offer → paywall", "Pro lein → auto-publish", "Ledger: pro_upgrade ₹200"],
    primary: { href: "/merchant/offers/new", label: "Post 2nd offer" },
    links: [
      { href: "/shop/laxmi-saree-readymade-centre-akurdi?as=owner", label: "Owner mode" },
      { href: "/admin/referrals", label: "Ledger" },
    ],
  },
  {
    n: 4,
    title: "Agency-in-a-box",
    pitch: "A brief becomes a real reel on the storefront.",
    roles: ["Shop Owner", "Admin", "Buyer"],
    pin: true,
    img: "studio-diwali-mithai",
    steps: ["Studio: ₹199 vs Included in Pro", "Festival poster brief", "Kanban → Delivered", "Reel live on storefront"],
    primary: { href: "/merchant/studio", label: "Open Studio" },
    links: [
      { href: "/admin/fulfillment", label: "Kanban" },
      { href: "/shop/laxmi-saree-readymade-centre-akurdi", label: "Storefront" },
    ],
  },
  {
    n: 5,
    title: "Standee + masters",
    pitch: "₹49 standee dispatch, and catalog changes that ripple everywhere.",
    roles: ["Shop Owner", "Admin", "Buyer"],
    pin: true,
    img: "reel-kirana-festive",
    steps: ["Design मराठी standee → ₹49", "Admin: print → dispatch", "Add “Smartwatch Straps”", "Live in buyer filter + upload"],
    primary: { href: "/merchant/qr-standee", label: "Design standee" },
    links: [
      { href: "/admin/qr-orders", label: "Dispatch" },
      { href: "/admin/masters/categories", label: "Masters" },
    ],
  },
];

const ROLE_TONE = { Buyer: "bg-flame-50 text-flame-700", "Shop Owner": "bg-indigo-50 text-indigo-700", Admin: "bg-sunk text-ink-700" } as const;

export function DemoLauncher() {
  const reset = useStore((s) => s.resetDemo);
  const setActive = useStore((s) => s.setActiveMerchant);
  const pin = (j: Journey) => j.pin && setActive(HERO_SHOP_ID);

  return (
    <div className="min-h-dvh bg-[#FBFAF7]">
      <div className="mx-auto max-w-[1240px] px-4 pt-8 pb-16 lg:px-10 lg:pt-12">
        <header className="flex items-center justify-between">
          <BrandLockup size="md" withTagline />
          <span className="hidden rounded-full border border-black/[0.06] bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-500 shadow-soft md:inline">Presenter mode · data sirf is browser mein</span>
        </header>

        <section className="mt-10 grid gap-8 lg:mt-16 lg:grid-cols-[1.15fr_1fr] lg:items-end">
          <div>
            <div className="text-[13px] font-bold tracking-[0.12em] text-flame-600 uppercase">Stakeholder demo</div>
            <h1 className="mt-3 text-[40px] leading-[42px] font-extrabold tracking-[-0.035em] text-ink-900 lg:text-[64px] lg:leading-[64px]">
              Ek dukaan.
              <br />
              <span className="text-ink-500">Teen screens.</span> Live.
            </h1>
            <p className="mt-5 max-w-[520px] text-[16px] leading-6 text-ink-700">
              Buyer, Shop Owner aur Admin ko alag tabs mein kholiye. Ek tab mein action — baaki do mein turant. Har journey card apni dukaan khud set karta hai.
            </p>
          </div>

          {/* Quick-launch dock */}
          <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#181F4B_0%,#2B3684_100%)] p-3 text-white shadow-lift ring-1 ring-white/15 ring-inset">
            <span aria-hidden className="pointer-events-none absolute -top-20 -right-16 size-60 rounded-full bg-indigo-400/25 blur-3xl" />
            <div className="relative px-3 pt-2 pb-3 text-[12px] font-semibold tracking-[0.08em] text-white/60 uppercase">Quick launch</div>
            <div className="relative grid grid-cols-2 gap-2">
              {[
                { href: "/", label: "Open Buyer", icon: ShoppingBag },
                { href: "/merchant", label: "Open Merchant", icon: Store },
                { href: "/admin", label: "Open Admin", icon: ShieldCheck },
              ].map((r) => (
                <motion.a
                  key={r.href}
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring.snappy}
                  onClick={() => setActive(HERO_SHOP_ID)}
                  className="flex h-[60px] items-center gap-3 rounded-[18px] bg-white/10 px-4 text-[15px] font-bold ring-1 ring-white/10 ring-inset hover:bg-white/15"
                >
                  <r.icon className="size-5 text-saffron-400" />
                  {r.label}
                  <ArrowUpRight className="ml-auto size-4 opacity-60" />
                </motion.a>
              ))}
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={spring.snappy}
                onClick={() => {
                  reset();
                  toast({ message: "Demo reset — fresh seed data", tone: "success" });
                }}
                className="flex h-[60px] items-center gap-3 rounded-[18px] bg-white px-4 text-[15px] font-bold text-ink-900"
              >
                <RotateCcw className="size-5 text-indigo-600" />
                Reset demo
              </motion.button>
            </div>
          </div>
        </section>

        <div className="mt-14 mb-5 flex items-end justify-between">
          <h2 className="text-[22px] font-extrabold tracking-[-0.02em] lg:text-[26px]">5 journeys</h2>
          <span className="flex items-center gap-1.5 text-[13px] text-ink-500">
            <LayoutDashboard className="size-4" /> Journey 1, 3, 4, 5 Laxmi Saree ko active shop banate hain
          </span>
        </div>

        <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {JOURNEYS.map((j) => (
            <motion.article
              key={j.n}
              variants={stagger.item}
              whileHover={{ y: -4 }}
              transition={spring.gentle}
              className={cn("group flex flex-col rounded-[24px] border border-black/[0.05] bg-white p-2 shadow-soft transition-shadow duration-300 hover:shadow-lift", j.n === 1 && "xl:row-span-1")}
            >
              <div className="relative h-36 overflow-hidden rounded-[18px] bg-ink-900">
                <RetailImage imageKey={j.img} mode="cover" size="card" alt="" className="absolute inset-0 h-full w-full bg-ink-900" imgClassName="object-[50%_22%] transition-transform duration-[900ms] group-hover:scale-[1.05]" />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgb(10_12_20/0.75)_0%,rgb(10_12_20/0.2)_70%)]" />
                <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
                  <span className="tabular flex size-9 items-center justify-center rounded-full bg-white/15 text-[15px] font-extrabold ring-1 ring-white/25 backdrop-blur-md">{j.n}</span>
                  <div>
                    <div className="text-[22px] leading-6 font-extrabold tracking-[-0.02em]">{j.title}</div>
                    <div className="mt-1 text-[13px] text-white/80">{j.pitch}</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col px-3 pt-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {j.roles.map((r) => (
                    <span key={r} className={cn("rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", ROLE_TONE[r])}>
                      {r}
                    </span>
                  ))}
                </div>
                <ol className="relative mt-4 flex-1 space-y-3 pl-6">
                  <span aria-hidden className="absolute top-1.5 bottom-1.5 left-[7px] w-px bg-hairline" />
                  {j.steps.map((s, i) => (
                    <li key={s} className="relative text-[14px] leading-5 text-ink-900">
                      <span className={cn("absolute top-1 -left-6 size-[15px] rounded-full border-[3px] bg-white", i === 0 ? "border-flame-500" : "border-ink-300")} />
                      {s}
                    </li>
                  ))}
                </ol>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {j.primary.newTab ? (
                    <a
                      href={j.primary.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => pin(j)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-flame-500 px-4 text-[13.5px] font-bold text-white shadow-[0_8px_18px_-8px_rgba(255,90,44,0.8)] transition active:scale-95"
                    >
                      <QrCode className="size-4" /> {j.primary.label}
                    </a>
                  ) : (
                    <Link href={j.primary.href} onClick={() => pin(j)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink-900 px-4 text-[13.5px] font-bold text-white transition active:scale-95">
                      {j.primary.label} <ArrowUpRight className="size-4" />
                    </Link>
                  )}
                  {j.links.map((l) => (
                    <Link key={l.href} href={l.href} onClick={() => pin(j)} className="inline-flex h-10 items-center rounded-full border border-black/[0.08] px-3.5 text-[13px] font-semibold text-ink-700 transition hover:bg-canvas active:scale-95">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
          <motion.aside variants={stagger.item} className="flex flex-col justify-between rounded-[24px] border border-dashed border-black/[0.1] bg-white/60 p-6">
            <div>
              <div className="text-[12px] font-bold tracking-[0.1em] text-ink-500 uppercase">Presenter tips</div>
              <ul className="mt-4 space-y-3 text-[14px] leading-5 text-ink-700">
                <li>
                  <b className="text-ink-900">Teen windows side-by-side</b> — Buyer phone size (390px), Merchant aur Admin desktop.
                </li>
                <li>
                  <b className="text-ink-900">Stakeholder ka phone</b> sync nahi hoga — QR ke liye &ldquo;Open QR in new tab&rdquo; use karein.
                </li>
                <li>
                  <b className="text-ink-900">Har demo se pehle</b> Reset dabaiye — sab seed data wapas.
                </li>
              </ul>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[13px] font-semibold text-ink-500">
              <span className="size-2 rounded-full bg-leaf-500" /> Live sync: same browser, any tab
            </div>
          </motion.aside>
        </motion.div>
      </div>
    </div>
  );
}
