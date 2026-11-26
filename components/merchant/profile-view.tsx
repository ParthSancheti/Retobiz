"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, ShieldCheck } from "lucide-react";
import { useStore } from "@/store";
import { toast } from "@/store/ui";
import { Hydrated } from "@/components/shell/hydrated";
import { Button } from "@/components/ui/button";
import { RetailImage } from "@/components/media/retail-image";
import { GoogleBadge, GstBadge, VerifiedBadge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";
import { Card, Field, inputCls, PageHead, PageSkeleton, useActiveShop } from "./common";

export function ProfileView() {
  return (
    <Hydrated fallback={<PageSkeleton />}>
      <Keyed />
    </Hydrated>
  );
}

function Keyed() {
  const id = useStore((s) => s.activeMerchantShopId);
  return <ProfileForm key={id} />;
}

function ProfileForm() {
  const { shop } = useActiveShop();
  const offers = useStore((s) => s.offers);
  const updateShop = useStore((s) => s.updateShop);
  const setFeatured = useStore((s) => s.setFeaturedItems);
  const [form, setForm] = useState(() => ({
    name: shop?.name ?? "",
    tagline: shop?.tagline ?? "",
    hours: shop?.hours ?? "",
    address: shop?.address ?? "",
    landmark: shop?.landmark ?? "",
  }));
  const featured = useMemo(() => (shop ? shop.featuredItemIds.map((id) => offers[id]).filter(Boolean) : []), [shop, offers]);

  if (!shop) return <PageSkeleton />;
  const dirty = (Object.keys(form) as (keyof typeof form)[]).some((k) => (shop[k] ?? "") !== form[k]);

  const move = (i: number, d: -1 | 1) => {
    const ids = [...shop.featuredItemIds];
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setFeatured(shop.id, ids);
  };

  return (
    <div>
      <PageHead
        eyebrow="Storefront Profile"
        title="Dukaan ki jaankari"
        sub="Jo yahan likhenge, wahi buyers ko storefront par dikhega."
        action={
          <Link href={`/shop/${shop.slug}?as=owner`} className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline px-4 text-[14px] font-semibold text-indigo-600 hover:bg-indigo-50">
            <ExternalLink className="size-4" /> Storefront dekhein
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_360px]">
        <Card className="flex flex-col gap-4 p-4 lg:p-6">
          <Field label="Dukaan ka naam">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Tagline" hint="Ek line jo dukaan ki khasiyat bataye">
            <input className={inputCls} value={form.tagline} maxLength={60} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Jaise: Yeola ki asli Paithani, Akurdi mein" />
          </Field>
          <Field label="Timings">
            <input className={inputCls} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
          </Field>
          <Field label="Address">
            <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Landmark" hint="Buyers isi se raasta dhoondhte hain">
            <input className={inputCls} value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} placeholder="Jaise: Sambhaji Chowk ke paas" />
          </Field>
          <div className="flex justify-end border-t border-hairline pt-4">
            <Button
              variant="primary-indigo"
              disabled={!dirty || form.name.trim().length < 3}
              onClick={() => {
                updateShop(shop.id, { ...form, landmark: form.landmark || undefined, tagline: form.tagline || undefined });
                toast({ message: "Profile save ho gaya — storefront par live", tone: "success" });
              }}
            >
              Save karein
            </Button>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-[15px] font-bold">
              <ShieldCheck className="size-5 text-indigo-600" /> Verification
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {shop.isVerified && <VerifiedBadge />}
              {shop.verification.gst && <GstBadge />}
              {shop.verification.google && <GoogleBadge />}
            </div>
            <p className="mt-2 text-[13px] text-ink-500">
              Status: <b className="text-ink-900 capitalize">{shop.verification.status === "approved" ? "Approved" : shop.verification.status === "pending" ? "Review mein (24 ghante)" : shop.verification.status}</b>
              {shop.verification.gstin && (
                <>
                  {" "}
                  · GSTIN <span className="tabular">{shop.verification.gstin}</span>
                </>
              )}
            </p>
          </Card>

          <Card className="p-4">
            <div className="text-[15px] font-bold">Top 10 showroom order</div>
            <p className="mt-0.5 text-[13px] text-ink-500">Upar wale items storefront par pehle dikhte hain.</p>
            <ol className="mt-3 flex flex-col gap-1.5">
              {featured.map((o, i) => (
                <li key={o.id} className="flex items-center gap-2.5 rounded-md bg-canvas p-1.5 pr-1">
                  <span className="tabular w-5 text-center text-[12px] font-bold text-ink-500">{i + 1}</span>
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-wash-cream">
                    <RetailImage imageKey={o.imageKey} src={o.customImage} size="thumb" alt="" className="size-full bg-transparent" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{o.title}</span>
                    {o.price ? <span className="tabular text-[12px] text-ink-500">{formatINR(o.price)}</span> : null}
                  </span>
                  <button type="button" aria-label="Upar" disabled={i === 0} onClick={() => move(i, -1)} className="flex size-8 items-center justify-center rounded-full hover:bg-surface disabled:opacity-30">
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" aria-label="Neeche" disabled={i === featured.length - 1} onClick={() => move(i, 1)} className="flex size-8 items-center justify-center rounded-full hover:bg-surface disabled:opacity-30">
                    <ArrowDown className="size-4" />
                  </button>
                </li>
              ))}
              {featured.length === 0 && <li className="text-[13px] text-ink-500">Abhi koi showroom product nahi.</li>}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
