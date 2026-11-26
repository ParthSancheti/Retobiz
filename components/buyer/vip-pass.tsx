"use client";
import { motion } from "motion/react";
import { BadgeCheck, MessageCircle } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import type { Customer, Lang, Shop } from "@/lib/types";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";
import { LANGS, PASS_COPY } from "@/data/translations";
import { BrandMark } from "@/components/brand/brand-lockup";

/** Real scannable QR as inline SVG (encodes the pass id + shop QR code). */
export function QrSvg({ value, className, dark = "#12141A" }: { value: string; className?: string; dark?: string }) {
  const [svg, setSvg] = useState<string>("");
  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark, light: "#0000" } }).then((s) => alive && setSvg(s));
    return () => {
      alive = false;
    };
  }, [value, dark]);
  return <span aria-label="QR code" role="img" className={cn("block [&>svg]:h-full [&>svg]:w-full", className)} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/**
 * Digital VIP Member Pass (DESIGN §8 / PLAN §4 A5): saffron card, shop, member,
 * pass no., join date, QR, EN/HI/MR toggle.
 */
export function VipPass({
  customer,
  shop,
  lang,
  onLang,
  className,
  compact,
}: {
  customer: Customer;
  shop: Shop;
  lang: Lang;
  onLang?: (l: Lang) => void;
  className?: string;
  compact?: boolean;
}) {
  const t = PASS_COPY[lang];
  const joined = new Date(customer.joinedAt).toLocaleDateString(lang === "en" ? "en-IN" : lang === "hi" ? "hi-IN" : "mr-IN", { day: "numeric", month: "short", year: "numeric" });
  const deva = lang !== "en";
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#FFD54A_0%,#FFB020_55%,#FF8A3D_100%)] p-4 text-ink-900 shadow-2", className)}>
      {/* guilloché-ish rings */}
      <div aria-hidden className="absolute -top-16 -right-16 size-48 rounded-full border-[14px] border-white/20" />
      <div aria-hidden className="absolute -bottom-20 -left-10 size-44 rounded-full border-[10px] border-white/15" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div lang={lang} className={cn("text-[11px] font-extrabold tracking-[0.1em] uppercase", deva && "font-deva tracking-normal")}>
            {t.title}
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className="truncate font-display text-[19px] leading-6 font-extrabold tracking-[-0.01em]">{shop.name}</span>
            {shop.isVerified && <BadgeCheck className="size-4 shrink-0 fill-indigo-600 text-white" strokeWidth={2} />}
          </div>
        </div>
        <BrandMark size={26} className="shrink-0 rounded-md bg-white/80 p-0.5" />
      </div>

      <div className="relative mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div lang={lang} className={cn("text-[11px] font-semibold text-ink-900/70", deva && "font-deva")}>
            {t.member}
          </div>
          <div className="truncate text-[18px] leading-6 font-extrabold">{customer.name}</div>
          <div className="tabular mt-2 inline-flex items-center rounded-md bg-ink-900 px-2 py-1 font-mono text-[13px] font-bold tracking-[0.08em] text-saffron-400">
            {customer.passId}
          </div>
          <div lang={lang} className={cn("mt-2 text-[11.5px] font-medium text-ink-900/75", deva && "font-deva")}>
            {t.since} · {joined}
          </div>
        </div>
        <div className="shrink-0 rounded-xl bg-white p-2 shadow-1">
          <QrSvg value={`RETOBIZ:${shop.qrCode}:${customer.passId}`} className={compact ? "size-[72px]" : "size-[92px]"} />
        </div>
      </div>

      {!compact && (
        <div lang={lang} className={cn("relative mt-3 flex items-center gap-1.5 rounded-lg bg-white/55 px-2.5 py-2 text-[12px] font-semibold", deva && "font-deva")}>
          <MessageCircle className="size-4 shrink-0 text-leaf-700" strokeWidth={2.25} />
          {t.perks}
        </div>
      )}

      {onLang && (
        <div className="relative mt-3 flex gap-1 rounded-full bg-ink-900/10 p-1">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onLang(l)}
              lang={l}
              className={cn("relative h-7 flex-1 rounded-full text-[12px] font-bold", l !== "en" && "font-deva", l === lang ? "text-ink-900" : "text-ink-900/60")}
            >
              {l === lang && <motion.span layoutId={`pass-lang-${customer.id}`} transition={spring.pill} className="absolute inset-0 rounded-full bg-white shadow-1" />}
              <span className="relative">{PASS_COPY[l].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
