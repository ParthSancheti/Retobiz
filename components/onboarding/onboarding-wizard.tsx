"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Store, Zap } from "lucide-react";
import { useStore } from "@/store";
import { toast } from "@/store/ui";
import { Hydrated } from "@/components/shell/hydrated";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/chip";
import { RetailImage } from "@/components/media/retail-image";
import { Field, inputCls, PageSkeleton } from "@/components/merchant/common";
import { GSTIN_RE, MOBILE_RE } from "@/lib/format";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

const STEPS = ["Dukaan", "Location", "Bharosa"];

export function OnboardingWizard() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[720px] items-center justify-between px-4">
          <Link href="/list-your-shop" className="flex items-center gap-1.5 text-[14px] font-semibold text-ink-700">
            <ArrowLeft className="size-4" /> Wapas
          </Link>
          <BrandLockup size="sm" />
        </div>
      </header>
      <main className="mx-auto max-w-[720px] px-4 py-6 lg:py-10">
        <Hydrated fallback={<PageSkeleton />}>
          <Wizard />
        </Hydrated>
      </main>
    </div>
  );
}

function Wizard() {
  const router = useRouter();
  const categories = useStore((s) => s.categories);
  const subCategories = useStore((s) => s.subCategories);
  const locations = useStore((s) => s.locations);
  const distributors = useStore((s) => s.distributors);
  const create = useStore((s) => s.createShopFromOnboarding);
  const cities = useMemo(() => locations.filter((l) => l.level === "city"), [locations]);
  const activeCats = useMemo(() => categories.filter((c) => c.active).sort((a, b) => a.order - b.order), [categories]);

  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);
  const [f, setF] = useState({
    name: "",
    ownerName: "",
    phone: "",
    categoryId: "",
    subCategoryIds: [] as string[],
    cityId: "city-pune",
    areaId: "",
    address: "",
    landmark: "",
    gstin: "",
    google: false,
    referral: "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const areas = locations.filter((l) => l.level === "area" && l.parentId === f.cityId);
  const subs = subCategories.filter((s) => s.categoryId === f.categoryId && s.active);
  const dist = distributors.find((d) => d.code.toLowerCase() === f.referral.trim().toLowerCase());

  const errs = [
    {
      name: f.name.trim().length < 3 && "Dukaan ka naam likhiye",
      ownerName: f.ownerName.trim().length < 2 && "Apna naam likhiye",
      phone: !MOBILE_RE.test(f.phone) && "10 digit mobile number",
      categoryId: !f.categoryId && "Category chuniye",
    },
    {
      areaId: !f.areaId && "Area chuniye",
      address: f.address.trim().length < 8 && "Poora address likhiye",
    },
    {
      gstin: f.gstin && !GSTIN_RE.test(f.gstin.toUpperCase()) && "GSTIN sahi format mein nahi hai",
      referral: f.referral && !dist && "Yeh distributor code nahi mila",
    },
  ];
  const stepOk = Object.values(errs[step]).every((v) => !v);
  const e = touched ? (errs[step] as unknown as Record<string, string | false>) : {};

  const next = () => {
    setTouched(true);
    if (!stepOk) return;
    setTouched(false);
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    const shop = create({
      name: f.name,
      ownerName: f.ownerName,
      phone: f.phone,
      categoryId: f.categoryId,
      subCategoryIds: f.subCategoryIds.length ? f.subCategoryIds : subs.slice(0, 2).map((s) => s.id),
      areaId: f.areaId,
      address: f.address,
      landmark: f.landmark,
      gstin: f.gstin ? f.gstin.toUpperCase() : undefined,
      google: f.google,
      referralCode: dist?.id,
    });
    toast({ message: `${shop.name} live ho gayi! Verification 24 ghante mein.`, tone: "success" });
    router.push(`/shop/${shop.slug}?as=owner&src=qr`);
  };

  return (
    <div>
      {/* Progress */}
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold", i < step ? "bg-leaf-500 text-white" : i === step ? "bg-ink-900 text-white" : "bg-sunk text-ink-500")}>
              {i < step ? <Check className="size-4" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn("text-[13px] font-semibold", i === step ? "text-ink-900" : "text-ink-500")}>{s}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-hairline" />}
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={() => {
          setF((x) => ({
            ...x,
            name: "Shree Balaji Footwear",
            ownerName: "Ramesh Shinde",
            phone: "9822012345",
            categoryId: "cat-footwear",
            subCategoryIds: subCategories.filter((s) => s.categoryId === "cat-footwear").slice(0, 2).map((s) => s.id),
            cityId: "city-pune",
            areaId: "area-nigdi",
            address: "Shop 7, Bhakti Shakti Chowk, Nigdi",
            landmark: "Bhakti Shakti garden ke saamne",
            gstin: "27AAPFS1234K1Z5",
            google: true,
            referral: "GD-PUN",
          }));
          setTouched(false);
        }}
        className="mb-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-indigo-500 px-3 text-[12px] font-bold text-indigo-600 hover:bg-indigo-50"
      >
        <Zap className="size-3.5" /> Demo fill
      </button>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={spring.snappy} className="rounded-2xl border border-hairline bg-surface p-4 lg:p-6">
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <h1 className="text-[22px] font-bold">Dukaan ke baare mein bataiye</h1>
              <Field label="Dukaan ka naam" error={e.name}>
                <input className={inputCls} value={f.name} onChange={(ev) => set("name", ev.target.value)} placeholder="Jaise: Shree Balaji Footwear" />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Aapka naam" error={e.ownerName}>
                  <input className={inputCls} value={f.ownerName} onChange={(ev) => set("ownerName", ev.target.value)} placeholder="Jaise: Ramesh Shinde" />
                </Field>
                <Field label="Mobile (WhatsApp)" error={e.phone}>
                  <input className={inputCls} inputMode="numeric" maxLength={10} value={f.phone} onChange={(ev) => set("phone", ev.target.value.replace(/\D/g, ""))} placeholder="98XXXXXXXX" />
                </Field>
              </div>
              <div>
                <div className="mb-2 text-[13px] font-semibold">Category</div>
                <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                  {activeCats.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setF((x) => ({ ...x, categoryId: c.id, subCategoryIds: [] }))}
                      aria-pressed={f.categoryId === c.id}
                      className={cn("flex flex-col items-center gap-1 rounded-lg border p-2 text-center text-[12px] leading-4 font-semibold transition", f.categoryId === c.id ? "border-indigo-500 bg-indigo-50" : "border-hairline hover:bg-canvas")}
                    >
                      <span className="relative size-12">{c.imageKey && <RetailImage imageKey={c.imageKey} size="thumb" alt="" className="size-full bg-transparent" />}</span>
                      {c.name.split(" & ")[0]}
                    </button>
                  ))}
                </div>
                {e.categoryId && <span className="mt-1 block text-[12px] font-medium text-danger-600">{e.categoryId}</span>}
              </div>
              {subs.length > 0 && (
                <div>
                  <div className="mb-2 text-[13px] font-semibold">Kya kya milta hai?</div>
                  <div className="flex flex-wrap gap-2">
                    {subs.map((s) => (
                      <FilterChip
                        key={s.id}
                        selected={f.subCategoryIds.includes(s.id)}
                        onClick={() => set("subCategoryIds", f.subCategoryIds.includes(s.id) ? f.subCategoryIds.filter((x) => x !== s.id) : [...f.subCategoryIds, s.id])}
                      >
                        {s.name}
                      </FilterChip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h1 className="text-[22px] font-bold">Dukaan kahan hai?</h1>
              <div className="flex flex-wrap gap-2">
                {cities.map((c) => (
                  <FilterChip key={c.id} selected={f.cityId === c.id} onClick={() => setF((x) => ({ ...x, cityId: c.id, areaId: "" }))}>
                    {c.name}
                  </FilterChip>
                ))}
              </div>
              <Field label="Area" error={e.areaId}>
                <select className={inputCls} value={f.areaId} onChange={(ev) => set("areaId", ev.target.value)}>
                  <option value="">Area chuniye</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Address" error={e.address}>
                <input className={inputCls} value={f.address} onChange={(ev) => set("address", ev.target.value)} placeholder="Shop no., building, road" />
              </Field>
              <Field label="Landmark (optional)" hint="Buyers ko raasta dhoondhne mein madad">
                <input className={inputCls} value={f.landmark} onChange={(ev) => set("landmark", ev.target.value)} placeholder="Jaise: Bus stand ke saamne" />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h1 className="text-[22px] font-bold">Bharosa badhaiye</h1>
              <p className="-mt-2 text-[14px] text-ink-500">GST ya Google Business se Verified badge milta hai — buyers verified dukaanein pehle chunte hain. Optional hai.</p>
              <Field label="GSTIN (optional)" error={e.gstin}>
                <input className={cn(inputCls, "uppercase")} maxLength={15} value={f.gstin} onChange={(ev) => set("gstin", ev.target.value)} placeholder="27ABCDE1234F1Z5" />
              </Field>
              <label className="flex items-center gap-3 rounded-lg border border-hairline p-3">
                <input type="checkbox" checked={f.google} onChange={(ev) => set("google", ev.target.checked)} className="size-5 accent-indigo-600" />
                <span className="text-[14px]">
                  <b>Google Business Profile hai</b>
                  <span className="block text-[12.5px] text-ink-500">Team 24 ghante mein check karegi</span>
                </span>
              </label>
              <Field label="Distributor referral code (optional)" error={e.referral} hint={dist ? `✓ ${dist.name}, ${dist.city}` : "Jaise: GD-PUN"}>
                <input className={cn(inputCls, "uppercase")} value={f.referral} onChange={(ev) => set("referral", ev.target.value)} placeholder="GD-PUN" />
              </Field>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-hairline pt-4">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
              Peeche
            </Button>
            <Button variant={step === 2 ? "primary-flame" : "ink"} size="lg" onClick={next} icon={step === 2 ? <Store className="size-4" /> : undefined}>
              {step === 2 ? "Dukaan live karein" : "Aage"}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
