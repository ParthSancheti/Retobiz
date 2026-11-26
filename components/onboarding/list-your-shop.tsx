"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BadgeCheck, MessageCircle, QrCode, Store, TrendingUp } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { ButtonLink } from "@/components/ui/button";
import { RetailImage } from "@/components/media/retail-image";
import { formatINR } from "@/lib/format";
import { PRO_PRICE_YEARLY } from "@/data/agency-templates";

/** Simple, honest estimator: followers × repeat visits × avg bill × margin. */
export function estimate(walkins: number, bill: number) {
  const followers = Math.round(walkins * 30 * 0.18); // ~18% of walk-ins scan the counter QR
  const repeatVisits = Math.round(followers * 0.35); // 35% come back once a month from a WhatsApp offer
  const extraSales = repeatVisits * bill;
  const profit = Math.round(extraSales * 0.22); // ~22% retail margin
  return { followers, repeatVisits, extraSales, profit };
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; fmt: (n: number) => string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between text-[14px]">
        <span className="font-semibold text-ink-900">{label}</span>
        <b className="tabular text-[18px] text-ink-900">{fmt(value)}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-flame-500" />
    </label>
  );
}

export function ListYourShop() {
  const [walkins, setWalkins] = useState(40);
  const [bill, setBill] = useState(800);
  const e = estimate(walkins, bill);
  const roi = Math.round((e.profit * 12) / PRO_PRICE_YEARLY);

  return (
    <div className="min-h-dvh bg-bazaar">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-4 lg:px-8">
        <Link href="/" aria-label="Retobiz home">
          <BrandLockup size="md" withTagline />
        </Link>
        <Link href="/" className="text-[14px] font-semibold text-ink-700 hover:text-ink-900">
          Buyer ho? Dukaanein dekhein
        </Link>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 pb-16 lg:px-8">
        <section className="grid items-center gap-8 pt-4 lg:grid-cols-[1.1fr_1fr] lg:pt-10">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[12px] font-bold text-flame-600 shadow-1">
              <Store className="size-3.5" /> Free listing · 2 minute
            </span>
            <h1 className="mt-4 text-[34px] leading-[38px] font-extrabold tracking-[-0.03em] text-ink-900 lg:text-[52px] lg:leading-[56px]">
              Aapki dukaan, ab har phone mein.
            </h1>
            <p className="mt-4 max-w-[520px] text-[16px] leading-6 text-ink-700">
              Online storefront, counter ka QR standee aur WhatsApp par apne customers — sab ek jagah. Jo grahak ek baar aaya, woh baar baar aayega.
            </p>
            <ul className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { icon: QrCode, t: "QR se followers", s: "Scan → WhatsApp opt-in" },
                { icon: MessageCircle, t: "WhatsApp offers", s: "Ek click broadcast" },
                { icon: BadgeCheck, t: "Verified badge", s: "GST / Google se bharosa" },
              ].map((f) => (
                <li key={f.t} className="rounded-lg bg-white/70 p-3">
                  <f.icon className="size-5 text-flame-600" />
                  <div className="mt-2 text-[14px] font-bold">{f.t}</div>
                  <div className="text-[12.5px] text-ink-500">{f.s}</div>
                </li>
              ))}
            </ul>
            <ButtonLink href="/list-your-shop/onboard" variant="primary-flame" size="lg" className="mt-7" iconRight={<ArrowRight className="size-4" />}>
              Apni Dukaan List Karein — Free
            </ButtonLink>
          </div>

          {/* Profit estimator */}
          <div className="relative rounded-3xl bg-white p-5 shadow-2 lg:p-7">
            <RetailImage imageKey="promo-new-shops" size="card" alt="" className="pointer-events-none absolute -top-14 -right-4 hidden size-36 bg-transparent lg:block" />
            <div className="flex items-center gap-2 text-[12px] font-bold tracking-[0.08em] text-ink-500 uppercase">
              <TrendingUp className="size-4 text-leaf-600" /> Profit estimator
            </div>
            <div className="mt-5 flex flex-col gap-5">
              <Slider label="Roz kitne grahak aate hain?" value={walkins} min={10} max={200} step={5} onChange={setWalkins} fmt={(n) => `${n}`} />
              <Slider label="Average bill" value={bill} min={100} max={5000} step={50} onChange={setBill} fmt={formatINR} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-canvas p-3">
                <div className="text-[12px] text-ink-500">Naye WhatsApp followers / mahina</div>
                <div className="tabular mt-1 text-[22px] font-extrabold">{e.followers}</div>
              </div>
              <div className="rounded-lg bg-canvas p-3">
                <div className="text-[12px] text-ink-500">Offer se wapas aane wale</div>
                <div className="tabular mt-1 text-[22px] font-extrabold">{e.repeatVisits}</div>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-leaf-500 p-4 text-white">
              <div className="text-[13px] font-semibold opacity-90">Har mahine extra munafa (andaaza)</div>
              <div className="tabular mt-1 text-[34px] leading-none font-extrabold tracking-[-0.02em]">{formatINR(e.profit)}</div>
              <div className="mt-2 text-[13px] opacity-90">
                {formatINR(e.extraSales)} extra bikri · Pro ka kharcha {roi > 1 ? <b>{roi}x</b> : "bhi"} wapas
              </div>
            </div>
            <p className="mt-3 text-[11.5px] leading-4 text-ink-500">Andaaza: 18% grahak QR scan karte hain, unmein se 35% mahine mein ek baar offer dekh kar wapas aate hain, 22% margin.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
