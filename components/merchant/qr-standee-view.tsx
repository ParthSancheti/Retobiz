"use client";
import { useRef, useState, useSyncExternalStore } from "react";
import { Download, Package, Printer, Truck } from "lucide-react";
import { toPng } from "html-to-image";
import { useStore } from "@/store";
import { toast } from "@/store/ui";
import { Hydrated } from "@/components/shell/hydrated";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { QrSvg } from "@/components/buyer/vip-pass";
import { BrandLockup } from "@/components/brand/brand-lockup";
import type { Lang, QrOrderStatus, Shop, StandeeStyle } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card, Field, inputCls, PageHead, PageSkeleton, Stepper, useActiveShop } from "./common";

export const STANDEE_COPY: Record<Lang, { headline: string; scan: string; perks: string[]; label: string }> = {
  en: { headline: "Scan & become a VIP member", scan: "Scan with your phone camera", perks: ["New offers on WhatsApp", "VIP-only discounts", "No app needed"], label: "English" },
  hi: { headline: "स्कैन करें, वीआईपी मेंबर बनें", scan: "फ़ोन के कैमरे से स्कैन करें", perks: ["नए ऑफ़र WhatsApp पर", "सिर्फ़ मेंबर्स को डिस्काउंट", "कोई ऐप नहीं चाहिए"], label: "हिंदी" },
  mr: { headline: "स्कॅन करा, व्हीआयपी मेंबर व्हा", scan: "फोनच्या कॅमेराने स्कॅन करा", perks: ["नवीन ऑफर्स WhatsApp वर", "फक्त मेंबर्ससाठी सूट", "ॲपची गरज नाही"], label: "मराठी" },
};

const STYLE_CLS: Record<StandeeStyle, { card: string; qrBox: string; dark: string; accent: string; tone: "ink" | "white" }> = {
  classic: { card: "bg-white text-ink-900", qrBox: "bg-white ring-4 ring-indigo-600", dark: "#252F86", accent: "bg-indigo-600 text-white", tone: "ink" },
  festive: { card: "bg-gradient-to-b from-saffron-400 via-saffron-400 to-flame-500 text-ink-900", qrBox: "bg-white", dark: "#12141A", accent: "bg-ink-900 text-saffron-400", tone: "ink" },
  bold: { card: "bg-ink-900 text-white", qrBox: "bg-white", dark: "#12141A", accent: "bg-flame-500 text-white", tone: "white" },
};

const ORDER_FLOW: QrOrderStatus[] = ["placed", "printed", "dispatched", "delivered"];
const ORDER_LABEL = ["Order", "Print", "Dispatch", "Delivered"];

const subscribeNoop = () => () => {};
function useOrigin() {
  return useSyncExternalStore(subscribeNoop, () => window.location.origin, () => "https://retobiz.in");
}

export function QrStandeeView() {
  return (
    <Hydrated fallback={<PageSkeleton />}>
      <Content />
    </Hydrated>
  );
}

export function Standee({ shop, lang, style, origin, className }: { shop: Shop; lang: Lang; style: StandeeStyle; origin: string; className?: string }) {
  const c = STANDEE_COPY[lang];
  const s = STYLE_CLS[style];
  return (
    <div className={cn("relative flex aspect-[1/1.414] w-full flex-col items-center overflow-hidden rounded-2xl p-[7%] text-center", s.card, className)}>
      {style === "festive" && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-around">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="block size-4 -translate-y-1/2 rounded-full bg-flame-600 ring-4 ring-saffron-100/60" />
          ))}
        </div>
      )}
      <BrandLockup size="sm" tone={s.tone} />
      <div className="mt-[6%] text-[22px] leading-tight font-extrabold tracking-[-0.02em]">{shop.name}</div>
      <div className={cn("mt-[4%] rounded-full px-4 py-1.5 text-[13px] font-bold", s.accent)} lang={lang}>
        {c.headline}
      </div>
      <div className={cn("mt-[6%] aspect-square w-[58%] rounded-2xl p-[4%]", s.qrBox)}>
        <QrSvg value={`${origin}/q/${shop.qrCode}`} dark={s.dark} className="size-full" />
      </div>
      <div className="mt-2 text-[12px] font-semibold opacity-80" lang={lang}>
        {c.scan}
      </div>
      <ul className="mt-auto flex w-full justify-center gap-1.5 pt-3" lang={lang}>
        {c.perks.map((p) => (
          <li key={p} className={cn("rounded-md px-2 py-1 text-[10.5px] leading-tight font-semibold", style === "bold" ? "bg-white/10" : "bg-black/5")}>
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex w-full items-center justify-between text-[10px] font-semibold opacity-70">
        <span className="tabular">{shop.qrCode}</span>
        <span lang="mr">व्यवसाय तुमचा, प्लॅटफॉर्म आमचा</span>
      </div>
    </div>
  );
}

function Content() {
  const { shop } = useActiveShop();
  const orders = useStore((s) => s.qrOrders);
  const origin = useOrigin();
  const ref = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<Lang>("mr");
  const [style, setStyle] = useState<StandeeStyle>("festive");
  const [ordering, setOrdering] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!shop) return <PageSkeleton />;
  const mine = Object.values(orders)
    .filter((o) => o.shopId === shop.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const download = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const url = await toPng(ref.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${shop.slug}-standee-${lang}.png`;
      a.click();
      toast({ message: "Standee PNG download ho gaya — print karwa sakte hain", tone: "success" });
    } catch {
      toast({ message: "Download nahi ho paaya, dobara try karein", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHead eyebrow="QR Standee Studio" title="Counter ke liye QR standee" sub="Customer scan karega → shutter khulega → seedha aapka WhatsApp follower." />
      <div className="grid grid-cols-1 gap-6 [&>*]:min-w-0 lg:grid-cols-[380px_1fr]">
        <div className="mx-auto w-full max-w-[360px]">
          <div ref={ref} className="rounded-2xl">
            <Standee shop={shop} lang={lang} style={style} origin={origin} className="shadow-2" />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-4 p-4 lg:p-5">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold">Bhasha</span>
              <Segmented
                id="standee-lang"
                className="self-start"
                value={lang}
                onChange={setLang}
                options={(["en", "hi", "mr"] as Lang[]).map((l) => ({ value: l, label: STANDEE_COPY[l].label }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold">Style</span>
              <Segmented
                id="standee-style"
                className="self-start"
                value={style}
                onChange={setStyle}
                options={[
                  { value: "festive", label: "Festive" },
                  { value: "classic", label: "Classic" },
                  { value: "bold", label: "Bold" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2 border-t border-hairline pt-4 md:flex-row md:flex-wrap">
              <Button variant="secondary" icon={<Download className="size-4" />} loading={busy} onClick={download}>
                PNG download
              </Button>
              <Button variant="primary-flame" icon={<Package className="size-4" />} onClick={() => setOrdering(true)}>
                Printed standee mangwayein · ₹49
              </Button>
            </div>
            <a href={`/q/${shop.qrCode}`} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1.5 text-[13px] font-bold text-indigo-600">
              Demo: QR scan naye tab mein kholein ↗
            </a>
            <p className="text-[12px] text-ink-500">₹49 mein acrylic stand + print, 3–4 din mein ghar tak. Demo mein payment nahi.</p>
          </Card>

          <section>
            <h2 className="mb-2 text-[16px] font-bold">Mere orders</h2>
            {mine.length === 0 ? (
              <Card className="p-5 text-[14px] text-ink-500">Abhi koi order nahi.</Card>
            ) : (
              <div className="flex flex-col gap-3">
                {mine.map((o) => (
                  <Card key={o.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[14px] font-bold">
                        {o.status === "dispatched" || o.status === "delivered" ? <Truck className="size-4 text-leaf-600" /> : <Printer className="size-4 text-ink-500" />}
                        Standee · {STANDEE_COPY[o.design.lang].label} · {o.design.style}
                      </div>
                      <span className="tabular text-[13px] font-bold">₹{o.amount}</span>
                    </div>
                    <Stepper className="mt-3" steps={ORDER_LABEL} current={ORDER_FLOW.indexOf(o.status)} />
                    <div className="mt-2 flex justify-between text-[12px] text-ink-500">
                      <span>{o.trackingId ? `Tracking ${o.trackingId}` : "Retobiz team print kar rahi hai"}</span>
                      <span>{timeAgo(o.createdAt)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      <OrderSheet open={ordering} onClose={() => setOrdering(false)} shop={shop} lang={lang} style={style} />
    </div>
  );
}

function OrderSheet({ open, onClose, shop, lang, style }: { open: boolean; onClose: () => void; shop: Shop; lang: Lang; style: StandeeStyle }) {
  const place = useStore((s) => s.placeQrOrder);
  const [address, setAddress] = useState(`${shop.name}, ${shop.address}`);
  return (
    <Sheet open={open} onClose={onClose} title="Standee order · ₹49" description={`${STANDEE_COPY[lang].label} · ${style} design · cash on delivery (demo)`}>
      <div className="flex flex-col gap-4">
        <Field label="Delivery address">
          <textarea className={cn(inputCls, "h-24 py-2")} value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <div className="flex items-center justify-between rounded-lg bg-canvas px-4 py-3 text-[14px]">
          <span>Acrylic standee + print + delivery</span>
          <b className="tabular text-[18px]">₹49</b>
        </div>
        <Button
          variant="primary-flame"
          size="lg"
          full
          disabled={address.trim().length < 10}
          onClick={() => {
            place(shop.id, { lang, style, headline: STANDEE_COPY[lang].headline }, address.trim());
            toast({ message: "Order place ho gaya — Retobiz team print karegi", tone: "success" });
            onClose();
          }}
        >
          Order karein · ₹49
        </Button>
      </div>
    </Sheet>
  );
}
