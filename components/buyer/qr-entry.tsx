"use client";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useStore } from "@/store";
import { Hydrated } from "@/components/shell/hydrated";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

/** /q/[shopId] — counter standee QR. Resolves by QR code or id, then opens the storefront with the shutter forced. */
export function QrEntry() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-900 px-6 text-center text-white">
      <Suspense fallback={<Loading />}>
        <Hydrated fallback={<Loading />}>
          <Resolve />
        </Hydrated>
      </Suspense>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col items-center gap-4">
      <BrandLockup size="md" tone="white" withTagline />
      <p className="text-[14px] text-white/70">Dukaan khul rahi hai…</p>
    </div>
  );
}

function Resolve() {
  const { shopId } = useParams<{ shopId: string }>();
  const router = useRouter();
  const shop = useStore((s) => Object.values(s.shops).find((x) => x.qrCode.toLowerCase() === shopId?.toLowerCase() || x.id === shopId));
  useEffect(() => {
    if (shop) router.replace(`/shop/${shop.slug}?src=qr`);
  }, [shop, router]);
  if (shop) return <Loading />;
  return (
    <div className="rounded-2xl bg-white p-2 text-ink-900">
      <EmptyState wash="peach" title="Yeh QR code pehchana nahi gaya" body="Standee purana ho sakta hai. Aas-paas ki dukaanein dekhein?" action={<ButtonLink href="/" variant="primary-flame">Explore All Nearby Shops</ButtonLink>} />
    </div>
  );
}
