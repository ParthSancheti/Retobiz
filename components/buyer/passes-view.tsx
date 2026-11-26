"use client";
import Link from "next/link";
import { CheckCheck, Heart, MessageCircle, Ticket } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useStore } from "@/store";
import { Hydrated } from "@/components/shell/hydrated";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader, Skeleton } from "@/components/ui/misc";
import { timeAgo } from "@/lib/format";
import { VipPass } from "./vip-pass";
import { OfferCard } from "./offer-card";
import { ShopMonogram } from "./shop-card";
import { useLookups } from "./hooks";

export function PassesView() {
  return (
    <Hydrated fallback={<div className="grid gap-4 pt-6 md:grid-cols-2"><Skeleton className="h-[260px] rounded-2xl" /><Skeleton className="h-[260px] rounded-2xl" /></div>}>
      <Passes />
    </Hydrated>
  );
}

function Passes() {
  const passIds = useStore((s) => s.buyerPassIds);
  const customers = useStore((s) => s.customers);
  const shops = useStore((s) => s.shops);
  const offers = useStore((s) => s.offers);
  const inbox = useStore((s) => s.inbox);
  const saved = useStore((s) => s.savedOfferIds);
  const buyer = useStore((s) => s.buyer);
  const setPassLang = useStore((s) => s.setPassLang);
  const markInboxRead = useStore((s) => s.markInboxRead);
  const { catById } = useLookups();

  const passes = useMemo(() => passIds.map((id) => customers[id]).filter(Boolean).reverse(), [passIds, customers]);
  const savedOffers = useMemo(() => saved.map((id) => offers[id]).filter((o) => o && o.status === "live" && shops[o.shopId]), [saved, offers, shops]);
  const unread = inbox.filter((m) => !m.read).length;

  useEffect(() => {
    if (!unread) return;
    const t = setTimeout(markInboxRead, 2500);
    return () => clearTimeout(t);
  }, [unread, markInboxRead]);

  return (
    <div className="flex flex-col gap-10 pt-5 pb-8 lg:pt-8">
      <div>
        <h1 className="text-[26px] leading-[32px] font-extrabold tracking-[-0.02em] lg:text-[34px] lg:leading-[40px]">Mere VIP Passes</h1>
        <p className="mt-1 text-[14px] text-ink-500">{buyer ? `Namaste ${buyer.name.split(" ")[0]} — ` : ""}counter par pass dikhaiye, offers WhatsApp par aate rahenge.</p>
      </div>

      {passes.length === 0 ? (
        <div className="rounded-3xl bg-canvas">
          <EmptyState
            wash="cream"
            glyph="gem"
            title="Abhi koi pass nahi"
            body="Kisi bhi dukaan par “Follow & WhatsApp pe Offers Paayein” dabaiye — VIP pass turant milega."
            action={<ButtonLink href="/" variant="primary-flame" icon={<Ticket className="size-4" />}>Dukaanein dekhein</ButtonLink>}
          />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {passes.map((c) => (
            <div key={c.id}>
              <VipPass customer={c} shop={shops[c.shopId]} lang={c.passLang} onLang={(l) => setPassLang(c.id, l)} />
              <Link href={`/shop/${shops[c.shopId].slug}`} className="mt-2 inline-block text-[13px] font-bold text-indigo-600">
                Dukaan kholein →
              </Link>
            </div>
          ))}
        </div>
      )}

      <section>
        <SectionHeader
          eyebrow="Simulated WhatsApp"
          title={
            <span className="inline-flex items-center gap-2">
              Dukaanon ke messages {unread > 0 && <span className="tabular rounded-full bg-leaf-500 px-2 text-[12px] font-bold text-white">{unread} naye</span>}
            </span>
          }
          className="mb-3"
        />
        {inbox.length === 0 ? (
          <p className="rounded-2xl bg-canvas px-4 py-5 text-[14px] text-ink-500">
            Jab koi dukaan WhatsApp broadcast bhejegi, woh yahan dikhega. (Demo: Shop Owner → WhatsApp Broadcast se bhej kar dekhiye.)
          </p>
        ) : (
          <ul className="flex max-w-[640px] flex-col gap-3 rounded-3xl bg-[#EFEAE2] p-3 lg:p-4">
            {inbox.map((m) => {
              const shop = shops[m.shopId];
              return (
                <li key={m.id} className="flex items-end gap-2">
                  {shop && <ShopMonogram shop={shop} wash={catById[shop.categoryId]?.wash ?? "cream"} size={32} className="rounded-full" />}
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 shadow-1">
                    <div className="text-[12px] font-bold text-leaf-700">{shop?.name}</div>
                    <p className="mt-0.5 text-[14px] leading-5 whitespace-pre-line text-ink-900">{m.text}</p>
                    <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-ink-500">
                      {timeAgo(m.at)} <CheckCheck className="size-3.5 text-indigo-500" />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <SectionHeader eyebrow="Heart kiye hue" title={<span className="inline-flex items-center gap-2">Saved offers <Heart className="size-5 fill-flame-500 text-flame-500" /></span>} className="mb-4" />
        {savedOffers.length === 0 ? (
          <p className="rounded-2xl bg-canvas px-4 py-5 text-[14px] text-ink-500">
            Kisi bhi offer card par <Heart className="inline size-4" /> dabaiye — yahan save ho jayega.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {savedOffers.map((o) => (
              <OfferCard key={o.id} offer={o} shop={shops[o.shopId]} category={catById[o.categoryId]} />
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center gap-2 rounded-2xl bg-leaf-50 p-4 text-[13px] text-leaf-700">
        <MessageCircle className="size-5 shrink-0" /> Aapka number sirf un dukaanon ke saath hai jinhe aapne follow kiya. Kabhi bhi STOP likh kar band karein.
      </div>
    </div>
  );
}
