"use client";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Camera, Check, Sparkles } from "lucide-react";
import { useStore, FREE_OFFER_LIMIT } from "@/store";
import type { ImageKey } from "@/data/images";
import type { Offer, OfferKind } from "@/lib/types";
import { toast } from "@/store/ui";
import { Hydrated } from "@/components/shell/hydrated";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { RetailImage } from "@/components/media/retail-image";
import { OfferCard } from "@/components/buyer/offer-card";
import { discountPct } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card, Field, inputCls, PageHead, PageSkeleton, useActiveShop } from "./common";
import { PaywallSheet } from "./paywall-sheet";

/** Photo suggestions per category — merchants can also upload their own. */
export const CATEGORY_PHOTOS: Record<string, ImageKey[]> = {
  "cat-saree": ["p-paithani", "p-bridal-saree", "p-nauvari", "p-cotton-saree", "p-kurti-set", "p-kids-lehenga", "p-mens-kurta"],
  "cat-mithai": ["p-kaju-katli", "p-ladoo-box", "p-jalebi", "p-mithai-box", "p-bread"],
  "cat-kirana": ["p-kirana-combo", "p-whole-spices", "p-masala-pack", "p-dal-rice"],
  "cat-footwear": ["p-kolhapuri", "p-handbag", "p-black-sandals"],
  "cat-mobile": ["p-phone-covers", "p-tempered-glass", "p-power-bank"],
  "cat-hardware": ["p-led-pack", "p-tool-kit"],
  "cat-jewel": ["p-kundan-set", "p-bangles"],
  "cat-stationery": ["p-school-kit", "p-notebooks"],
  "cat-medical": ["p-medicine-strips"],
  "cat-salon": ["p-facial-kit"],
};

const VALIDITY = [
  { value: "3", label: "3 din" },
  { value: "7", label: "7 din" },
  { value: "15", label: "15 din" },
];

export function OfferComposer() {
  return (
    <Hydrated fallback={<PageSkeleton />}>
      <Composer />
    </Hydrated>
  );
}

/** Resize a picked photo to ≤ 640px JPEG so localStorage stays small. */
async function shrinkImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  const scale = Math.min(1, 640 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.78);
}

function Composer() {
  const router = useRouter();
  const { shop, category } = useActiveShop();
  const offers = useStore((s) => s.offers);
  const subCategories = useStore((s) => s.subCategories);
  const createOffer = useStore((s) => s.createOffer);
  const fileRef = useRef<HTMLInputElement>(null);

  const subs = useMemo(() => subCategories.filter((s) => s.categoryId === shop?.categoryId && s.active), [subCategories, shop?.categoryId]);
  const photos = CATEGORY_PHOTOS[shop?.categoryId ?? ""] ?? ["promo-hot-deals"];

  const [kind, setKind] = useState<OfferKind>("offer");
  const [title, setTitle] = useState("");
  const [mrp, setMrp] = useState("");
  const [price, setPrice] = useState("");
  const [subId, setSubId] = useState("");
  const [imageKey, setImageKey] = useState<ImageKey>(photos[0]);
  const [customImage, setCustomImage] = useState<string | undefined>();
  const [validity, setValidity] = useState("7");
  const [touched, setTouched] = useState(false);
  const [paywall, setPaywall] = useState(false);
  // Demo clock is fixed per render; computed lazily so prerender stays pure.
  const [nowMs] = useState(() => Date.now());

  if (!shop) return <PageSkeleton />;

  const liveOffers = Object.values(offers).filter((o) => o.shopId === shop.id && o.kind === "offer" && o.status === "live").length;
  const atLimit = shop.plan === "free" && kind === "offer" && liveOffers >= FREE_OFFER_LIMIT;
  const mrpN = Number(mrp) || undefined;
  const priceN = Number(price) || undefined;
  const pct = discountPct(mrpN, priceN);
  const effSub = subId || subs[0]?.id || "";

  const errors = {
    title: (title.trim().length < 4 && "Kam se kam 4 akshar likhiye") as string | false,
    price: (!priceN && "Price daaliye") as string | false,
    mrp: (mrpN !== undefined && priceN !== undefined && mrpN < priceN ? "MRP price se kam nahi ho sakta" : false) as string | false,
  };
  const valid = !errors.title && !errors.price && !errors.mrp;

  const preview: Offer = {
    id: "preview",
    shopId: shop.id,
    kind,
    title: title.trim() || (kind === "offer" ? "Aapka offer yahan dikhega" : "Product ka naam"),
    categoryId: shop.categoryId,
    subCategoryId: effSub,
    mrp: mrpN,
    price: priceN,
    discountPct: pct,
    imageKey,
    customImage,
    validTill: kind === "offer" ? new Date(nowMs + Number(validity) * 86400000).toISOString() : undefined,
    status: "live",
    clicks: 0,
    createdAt: new Date(nowMs).toISOString(),
  };

  const submit = (afterUpgrade = false) => {
    setTouched(true);
    if (!valid) return;
    if (atLimit && !afterUpgrade) {
      setPaywall(true);
      return;
    }
    const res = createOffer({
      shopId: shop.id,
      kind,
      title,
      categoryId: shop.categoryId,
      subCategoryId: effSub,
      mrp: mrpN,
      price: priceN,
      imageKey,
      customImage,
      validTill: preview.validTill,
    });
    if (!res.ok) {
      setPaywall(true);
      return;
    }
    toast({ message: kind === "offer" ? "Offer live ho gaya — buyers ko Home par dikh raha hai" : "Product showroom mein add ho gaya", tone: "success", action: { label: "Dekhein", href: `/shop/${shop.slug}?offer=${res.offer.id}` } });
    router.push("/merchant/offers");
  };

  return (
    <div>
      <PageHead eyebrow="Offers & Products" title={kind === "offer" ? "Naya Offer daalein" : "Showroom mein product daalein"} sub="Photo, price aur validity — 30 second ka kaam. Right side mein buyer ko jaisa dikhega waisa preview." />
      <div className="grid grid-cols-1 gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_340px]">
        <Card className="flex flex-col gap-5 p-4 lg:p-6">
          <Segmented
            id="offer-kind"
            className="self-start"
            value={kind}
            onChange={setKind}
            options={[
              { value: "offer", label: "Offer / Deal" },
              { value: "product", label: "Showroom product" },
            ]}
          />

          {atLimit && (
            <div className="flex items-start gap-3 rounded-lg bg-saffron-50 px-4 py-3 text-[13.5px] text-ink-900">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-saffron-700" />
              <span>
                <b>
                  {liveOffers}/{FREE_OFFER_LIMIT} Free Offer Active.
                </b>{" "}
                Doosra offer live karne par Pro (₹999/saal) ka option aayega. Showroom products free hain.
              </span>
            </div>
          )}

          <div>
            <div className="mb-2 text-[13px] font-semibold">Photo</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={cn("flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-[11px] font-semibold", customImage ? "border-indigo-500 text-indigo-600" : "border-hairline text-ink-500")}
              >
                <Camera className="size-5" /> {customImage ? "Badlein" : "Apni photo"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setCustomImage(await shrinkImage(f));
                }}
              />
              {photos.map((k) => {
                const on = !customImage && imageKey === k;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-label={`Photo ${k}`}
                    aria-pressed={on}
                    onClick={() => {
                      setCustomImage(undefined);
                      setImageKey(k);
                    }}
                    className={cn("relative size-20 shrink-0 overflow-hidden rounded-lg bg-wash-cream ring-2 transition", on ? "ring-indigo-500" : "ring-transparent")}
                  >
                    <RetailImage imageKey={k} size="thumb" alt="" className="size-full bg-transparent" />
                    {on && (
                      <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label={kind === "offer" ? "Offer ka title" : "Product ka naam"} error={touched && errors.title}>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "offer" ? "Jaise: Diwali Paithani Sale — Flat 20% off" : "Jaise: Yeola Paithani Silk Saree"} maxLength={70} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="MRP (₹)" hint="Optional" error={touched && errors.mrp}>
              <input className={inputCls} inputMode="numeric" value={mrp} onChange={(e) => setMrp(e.target.value.replace(/\D/g, ""))} placeholder="7999" />
            </Field>
            <Field label="Aapka price (₹)" error={touched && errors.price} hint={pct ? `${pct}% off dikhega` : undefined}>
              <input className={inputCls} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder="6450" />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 [&>*]:min-w-0 lg:grid-cols-2">
            <Field label="Sub-category">
              <select className={inputCls} value={effSub} onChange={(e) => setSubId(e.target.value)}>
                {subs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            {kind === "offer" && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold">Kitne din chalega?</span>
                <Segmented id="validity" value={validity} onChange={setValidity} options={VALIDITY} />
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-hairline pt-4 lg:flex-row lg:justify-end">
            <Button variant="ghost" onClick={() => router.push("/merchant/offers")}>
              Cancel
            </Button>
            <Button variant={atLimit ? "ink" : "primary-indigo"} size="lg" onClick={() => submit()} icon={atLimit ? <Sparkles className="size-4" /> : undefined}>
              {kind === "offer" ? (atLimit ? "Live karein · Pro chahiye" : "Offer live karein") : "Showroom mein daalein"}
            </Button>
          </div>
        </Card>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="mb-2 text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">Live preview · buyer ko aisa dikhega</div>
          <div className="pointer-events-none rounded-2xl bg-bazaar p-4" aria-hidden>
            <div className="mx-auto max-w-[220px]">
              <OfferCard offer={preview} shop={shop} category={category} />
            </div>
          </div>
        </div>
      </div>
      <PaywallSheet open={paywall} onClose={() => setPaywall(false)} shopId={shop.id} onUpgraded={() => setTimeout(() => submit(true), 50)} />
    </div>
  );
}
