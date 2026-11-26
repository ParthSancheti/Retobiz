"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarDays, Clock, Play, Sparkles, Wand2 } from "lucide-react";
import { spring } from "@/lib/motion";
import { useStore } from "@/store";
import { toast } from "@/store/ui";
import { Hydrated } from "@/components/shell/hydrated";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { RetailImage } from "@/components/media/retail-image";
import { AGENCY_TEMPLATES, PRO_MONTHLY_CREDITS, TEMPLATE_BY_KEY, currentMonthKey, proPrice, resolveAgencyPrice, type AgencyTemplate } from "@/data/agency-templates";
import type { ImageKey } from "@/data/images";
import type { AgencyStatus, Lang } from "@/lib/types";
import { formatINR, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card, Field, inputCls, PageHead, PageSkeleton, Stepper, useActiveShop } from "./common";

export const TPL_LOOK: Record<string, { img: ImageKey; badge: string; video: boolean }> = {
  "ai-promo-reel": { img: "reel-paithani-owner", badge: "AI REEL", video: true },
  "ugc-video": { img: "reel-ugc-creator", badge: "UGC", video: true },
  "brand-collab": { img: "reel-kundan-hands", badge: "COLLAB", video: true },
  "festival-poster": { img: "studio-diwali-mithai", badge: "POSTER", video: false },
  "shop-tour-reel": { img: "studio-shop-tour", badge: "REEL", video: true },
  "whatsapp-banner": { img: "reel-mobile-unbox", badge: "BANNER", video: false },
  "google-review-card": { img: "studio-review-card", badge: "REVIEW", video: false },
};

const STATUS_STEPS: AgencyStatus[] = ["new", "creator_assigned", "in_review", "delivered"];
const STATUS_LABEL = ["Request mili", "Creator assigned", "Review", "Delivered"];

const DAYS = ["Som", "Mangal", "Budh", "Guru", "Shukra", "Shani", "Ravi"];
/** Weekly AI planner: a light rule-based plan per category (demo "AI"). */
function weeklyPlan(categoryId: string, offerTitle?: string): { idea: string; tpl: AgencyTemplate["key"] }[] {
  const hook = offerTitle ? `“${offerTitle}”` : "naya stock";
  const base: { idea: string; tpl: AgencyTemplate["key"] }[] = [
    { idea: `${hook} ka 15-sec reel`, tpl: "ai-promo-reel" },
    { idea: "Counter par Google review card lagayein", tpl: "google-review-card" },
    { idea: "WhatsApp flash banner — sirf aaj ka deal", tpl: "whatsapp-banner" },
    { idea: "Dukaan ka tour reel — naye customers ke liye", tpl: "shop-tour-reel" },
    { idea: "Weekend festival poster status ke liye", tpl: "festival-poster" },
    { idea: "Local creator se honest review shoot", tpl: "ugc-video" },
    { idea: "Aaram ka din — followers ko thank-you message", tpl: "whatsapp-banner" },
  ];
  if (categoryId === "cat-saree") base[5] = { idea: "Bridal season: creator ke saath draping video", tpl: "ugc-video" };
  if (categoryId === "cat-mithai") base[4] = { idea: "Festival mithai box poster", tpl: "festival-poster" };
  return base;
}

export function StudioView() {
  return (
    <Hydrated fallback={<PageSkeleton />}>
      <Content />
    </Hydrated>
  );
}

function Content() {
  const { shop } = useActiveShop();
  const offers = useStore((s) => s.offers);
  const requests = useStore((s) => s.agencyRequests);
  const [picked, setPicked] = useState<AgencyTemplate | null>(null);

  const myOffers = useMemo(() => Object.values(offers).filter((o) => o.shopId === shop?.id && o.status === "live"), [offers, shop?.id]);
  const mine = useMemo(
    () =>
      Object.values(requests)
        .filter((r) => r.shopId === shop?.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [requests, shop?.id],
  );
  const [todayIdx] = useState(() => (new Date().getDay() + 6) % 7);

  if (!shop) return <PageSkeleton />;
  const pro = shop.plan === "pro";
  const used = shop.agencyCredits.month === currentMonthKey() ? shop.agencyCredits.used : 0;
  const plan = weeklyPlan(shop.categoryId, myOffers.find((o) => o.kind === "offer")?.title);

  return (
    <div>
      <PageHead
        eyebrow="Marketing Studio · Agency-in-a-box"
        title="Is hafte kya post karein?"
        sub="Retobiz creators aapke liye reel, poster aur banner banate hain — aap sirf brief dijiye."
        action={
          pro ? (
            <span className="inline-flex h-10 items-center gap-2 rounded-full bg-ink-900 px-4 text-[13px] font-bold text-white">
              <Sparkles className="size-4 text-saffron-400" /> {Math.max(0, PRO_MONTHLY_CREDITS - used)}/{PRO_MONTHLY_CREDITS} credits bache
            </span>
          ) : (
            <Link href="/merchant/plan" className="inline-flex h-10 items-center gap-2 rounded-full bg-saffron-100 px-4 text-[13px] font-bold text-saffron-700">
              <Sparkles className="size-4" /> Pro: {PRO_MONTHLY_CREDITS} free credits/mahina + 40% off
            </Link>
          )
        }
      />

      {/* Weekly planner */}
      <Card className="mb-8 p-4 lg:p-5">
        <div className="mb-3 flex items-center gap-2 text-[15px] font-bold">
          <CalendarDays className="size-5 text-indigo-600" /> Weekly AI planner
          <span className="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">Aapki category ke hisaab se</span>
        </div>
        <ol className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-7 lg:px-0">
          {plan.map((p, i) => (
            <li key={DAYS[i]} className={cn("flex w-[180px] shrink-0 snap-start flex-col rounded-[18px] border p-3.5 lg:w-auto", i === todayIdx ? "border-indigo-500 bg-indigo-50" : "border-hairline bg-canvas")}>
              <div className="flex items-center justify-between text-[11px] font-bold tracking-[0.06em] text-ink-500 uppercase">
                {DAYS[i]}
                {i === todayIdx && <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] text-white">Aaj</span>}
              </div>
              <p className="mt-1.5 flex-1 text-[13px] leading-[18px] font-semibold text-ink-900">{p.idea}</p>
              <button type="button" onClick={() => setPicked(TEMPLATE_BY_KEY[p.tpl])} className="mt-2 inline-flex items-center gap-1 self-start text-[12px] font-bold text-indigo-600">
                <Wand2 className="size-3.5" /> Banwayein
              </button>
            </li>
          ))}
        </ol>
      </Card>

      <h2 className="mb-3 text-[18px] font-bold">Templates</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {AGENCY_TEMPLATES.map((t) => {
          const look = TPL_LOOK[t.key];
          const price = resolveAgencyPrice(t.listPrice, shop.plan, used);
          return (
            <motion.button
              key={t.key}
              type="button"
              onClick={() => setPicked(t)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={spring.gentle}
              className="group flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-black/[0.05] bg-surface text-left shadow-soft transition-shadow duration-300 hover:shadow-lift"
            >
              <div className="relative m-2 mb-0 aspect-[4/3] overflow-hidden rounded-[18px] bg-ink-900">
                <RetailImage imageKey={look.img} mode="cover" size="card" alt="" className="absolute inset-0 h-full w-full bg-ink-900" imgClassName="transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]" />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(10_12_20/0.4)_0%,rgb(10_12_20/0)_35%,rgb(10_12_20/0)_55%,rgb(10_12_20/0.7)_100%)]" />
                <span className={cn("absolute top-3 left-3 rounded-full px-2 py-[3px] text-[10px] font-extrabold tracking-[0.08em] text-white", look.badge === "UGC" ? "bg-flame-500" : "bg-white/20 backdrop-blur-md")}>{look.badge}</span>
                {look.video && (
                  <span className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur-md transition-transform group-hover:scale-110">
                    <Play className="ml-0.5 size-3.5 fill-white text-white" />
                  </span>
                )}
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                  <Clock className="size-3" /> {t.turnaround}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4 pt-3.5">
                <div className="text-[17px] font-bold tracking-[-0.01em]">{t.name}</div>
                <p className="mt-1 flex-1 text-[13px] leading-[18px] text-ink-500">{t.blurb}</p>
                <div className="mt-3 flex items-center gap-2">
                  {pro ? (
                    price.paidWith === "credit" ? (
                      <>
                        <span className="rounded-full bg-leaf-50 px-2.5 py-1 text-[13px] font-bold text-leaf-700">1 credit · ₹0</span>
                        <s className="tabular text-[12px] text-ink-300">{formatINR(t.listPrice)}</s>
                      </>
                    ) : (
                      <>
                        <span className="tabular text-[16px] font-extrabold">{formatINR(proPrice(t.listPrice))}</span>
                        <s className="tabular text-[12px] text-ink-300">{formatINR(t.listPrice)}</s>
                        <span className="text-[12px] font-bold text-leaf-700">40% off</span>
                      </>
                    )
                  ) : (
                    <>
                      <span className="tabular text-[16px] font-extrabold">{formatINR(t.listPrice)}</span>
                      <span className="truncate text-[11.5px] font-semibold text-saffron-700">Included in Pro</span>
                    </>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
        <motion.button
          type="button"
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={spring.gentle}
          onClick={() => setPicked(TEMPLATE_BY_KEY["ugc-video"])}
          className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-indigo-500/30 bg-indigo-50/50 p-6 text-center transition-colors hover:bg-indigo-50"
        >
          <span className="flex size-12 items-center justify-center rounded-[16px] bg-white text-indigo-600 shadow-soft">
            <Wand2 className="size-6" />
          </span>
          <span className="text-[17px] font-bold">Kuch aur chahiye?</span>
          <span className="text-[13px] leading-[18px] text-ink-500">Apna idea likhiye — Studio team creator match karegi.</span>
        </motion.button>
      </div>

      <h2 className="mt-10 mb-3 text-[18px] font-bold">Meri requests</h2>
      {mine.length === 0 ? (
        <Card className="p-6 text-center text-[14px] text-ink-500">Abhi koi request nahi — upar se ek template chuniye.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 [&>*]:min-w-0 lg:grid-cols-2">
          {mine.map((r) => {
            const t = TEMPLATE_BY_KEY[r.templateKey];
            const idx = STATUS_STEPS.indexOf(r.status);
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-bold">{t.name}</div>
                    <div className="mt-0.5 truncate text-[13px] text-ink-500">{r.brief.goal}</div>
                  </div>
                  <span className="tabular shrink-0 text-[13px] font-bold">{r.pricing.paidWith === "credit" ? "1 credit" : formatINR(r.pricing.charged)}</span>
                </div>
                <Stepper className="mt-4" steps={STATUS_LABEL} current={idx} />
                <div className="mt-3 flex items-center justify-between text-[12px] text-ink-500">
                  <span>{r.creator ? `${r.creator.name} · ${r.creator.handle}` : "Creator assign ho raha hai"}</span>
                  <span>{timeAgo(r.createdAt)}</span>
                </div>
                {r.status === "delivered" && (
                  <Link href={`/shop/${shop.slug}`} className="mt-3 inline-flex text-[13px] font-bold text-indigo-600">
                    Storefront par reel dekhein →
                  </Link>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <RequestSheet template={picked} onClose={() => setPicked(null)} offers={myOffers.map((o) => ({ id: o.id, title: o.title }))} />
    </div>
  );
}

function RequestSheet({ template, onClose, offers }: { template: AgencyTemplate | null; onClose: () => void; offers: { id: string; title: string }[] }) {
  const { shop } = useActiveShop();
  const submit = useStore((s) => s.submitAgencyRequest);
  const [goal, setGoal] = useState("");
  const [offerId, setOfferId] = useState("");
  const [lang, setLang] = useState<Lang>("mr");
  const [notes, setNotes] = useState("");
  if (!shop) return null;
  const used = shop.agencyCredits.month === currentMonthKey() ? shop.agencyCredits.used : 0;
  const price = template ? resolveAgencyPrice(template.listPrice, shop.plan, used) : null;
  const ok = goal.trim().length >= 6;

  const send = () => {
    if (!template || !ok) return;
    submit(shop.id, template.key, { goal: goal.trim(), offerId: offerId || undefined, language: lang, notes: notes.trim() || undefined });
    toast({ message: `${template.name} request bhej di — creator 2 ghante mein contact karega`, tone: "success" });
    setGoal("");
    setNotes("");
    onClose();
  };

  return (
    <Sheet open={!!template} onClose={onClose} title={template?.name} description={template?.blurb}>
      <div className="flex flex-col gap-4">
        <Field label="Goal kya hai?" hint="Jaise: Diwali sale ke liye zyada walk-ins">
          <input className={inputCls} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Is hafte bridal sarees ki enquiry badhani hai" />
        </Field>
        {offers.length > 0 && (
          <Field label="Kis offer/product ke liye?">
            <select className={inputCls} value={offerId} onChange={(e) => setOfferId(e.target.value)}>
              <option value="">Poori dukaan</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Bhasha</span>
          <Segmented
            id="studio-lang"
            className="self-start"
            value={lang}
            onChange={setLang}
            options={[
              { value: "mr", label: "मराठी" },
              { value: "hi", label: "हिंदी" },
              { value: "en", label: "English" },
            ]}
          />
        </div>
        <Field label="Notes (optional)">
          <textarea className={cn(inputCls, "h-20 py-2")} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Shop ka timing, music pasand, etc." />
        </Field>
        {template && price && (
          <div className="flex items-center justify-between rounded-lg bg-canvas px-4 py-3">
            <span className="text-[13px] text-ink-500">{price.paidWith === "credit" ? "Pro credit se" : price.paidWith === "pro_discount" ? "Pro 40% off" : "Add-on price"}</span>
            <span className="tabular text-[18px] font-extrabold">{price.paidWith === "credit" ? "₹0 · 1 credit" : formatINR(price.charged)}</span>
          </div>
        )}
        <Button variant="primary-indigo" size="lg" full disabled={!ok} onClick={send}>
          Request bhejein
        </Button>
      </div>
    </Sheet>
  );
}
