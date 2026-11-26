"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { CheckCheck, Send, Users } from "lucide-react";
import { useStore } from "@/store";
import { toast } from "@/store/ui";
import { Hydrated } from "@/components/shell/hydrated";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/chip";
import { formatINR, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card, initials, inputCls, PageHead, PageSkeleton, useActiveShop } from "./common";

type Audience = "all" | "qr" | "recent" | "picked";

export function BroadcastView() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Hydrated fallback={<PageSkeleton />}>
        <Content />
      </Hydrated>
    </Suspense>
  );
}

function Content() {
  const params = useSearchParams();
  const picked = useMemo(() => (params.get("to") ?? "").split(",").filter(Boolean), [params]);
  const { shop } = useActiveShop();
  const customers = useStore((s) => s.customers);
  const offers = useStore((s) => s.offers);
  const broadcasts = useStore((s) => s.broadcasts);
  const send = useStore((s) => s.sendBroadcast);

  const mine = useMemo(() => Object.values(customers).filter((c) => c.shopId === shop?.id && c.optInWhatsApp), [customers, shop?.id]);
  const liveOffer = useMemo(
    () =>
      Object.values(offers)
        .filter((o) => o.shopId === shop?.id && o.status === "live")
        .sort((a, b) => (a.kind === b.kind ? b.createdAt.localeCompare(a.createdAt) : a.kind === "offer" ? -1 : 1))[0],
    [offers, shop?.id],
  );
  const history = useMemo(
    () =>
      Object.values(broadcasts)
        .filter((b) => b.shopId === shop?.id)
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt)),
    [broadcasts, shop?.id],
  );

  const templates = useMemo(() => {
    const deal = liveOffer ? `${liveOffer.title}${liveOffer.price ? ` — sirf ${formatINR(liveOffer.price)}` : ""}` : "naye stock par special daam";
    return [
      { key: "offer", label: "Naya offer", text: `Namaste {name} ji 🙏\n{shop} mein aapke liye: ${deal}.\nIs hafte dukaan aaiye, VIP pass dikhaiye!` },
      { key: "stock", label: "Naya stock", text: `{name} ji, {shop} mein naya stock aa gaya hai ✨\nPehle dekhne ke liye aaj hi aaiye.` },
      { key: "festival", label: "Tyohaar", text: `{name} ji, tyohaar ki shubhkamnayein! 🪔\n{shop} mein festival offers shuru — VIP members ko extra discount.` },
      { key: "thanks", label: "Thank you", text: `{name} ji, {shop} par bharosa karne ke liye dhanyavaad 🙏\nAapka VIP pass har visit par kaam aayega.` },
    ];
  }, [liveOffer]);

  const [audience, setAudience] = useState<Audience>(picked.length ? "picked" : "all");
  const [tpl, setTpl] = useState("offer");
  const [msg, setMsg] = useState<string | null>(null);
  const [weekAgo] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString());
  const text = msg ?? templates.find((t) => t.key === tpl)!.text;

  if (!shop) return <PageSkeleton />;

  const recipients =
    audience === "picked" ? mine.filter((c) => picked.includes(c.id)) : audience === "qr" ? mine.filter((c) => c.source === "qr") : audience === "recent" ? mine.filter((c) => c.joinedAt > weekAgo) : mine;
  const sample = recipients[0]?.name.split(" ")[0] ?? "Priya";
  const rendered = text.replaceAll("{name}", sample).replaceAll("{shop}", shop.name);

  const audiences: { value: Audience; label: string; n: number }[] = [
    { value: "all", label: "Sab customers", n: mine.length },
    { value: "qr", label: "QR walk-ins", n: mine.filter((c) => c.source === "qr").length },
    { value: "recent", label: "Is hafte jude", n: mine.filter((c) => c.joinedAt > weekAgo).length },
    ...(picked.length ? [{ value: "picked" as const, label: "Selected", n: mine.filter((c) => picked.includes(c.id)).length }] : []),
  ];

  const go = () => {
    if (!recipients.length || text.trim().length < 10) return;
    send(shop.id, recipients.map((c) => c.id), text, tpl);
    toast({ message: `${recipients.length} customers ko WhatsApp bhej diya`, tone: "success" });
    setMsg(null);
  };

  return (
    <div>
      <PageHead eyebrow="WhatsApp Broadcast" title="Customers ko message bhejein" sub="Sirf opt-in customers ko jaata hai. {name} aur {shop} apne aap bhar jaate hain." />
      <div className="grid grid-cols-1 gap-6 [&>*]:min-w-0 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <Card className="p-4 lg:p-5">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
              <Users className="size-4" /> Kisko bhejein?
            </div>
            <div className="flex flex-wrap gap-2">
              {audiences.map((a) => (
                <FilterChip key={a.value} selected={audience === a.value} onClick={() => setAudience(a.value)}>
                  {a.label} · <span className="tabular">{a.n}</span>
                </FilterChip>
              ))}
            </div>
          </Card>
          <Card className="p-4 lg:p-5">
            <div className="mb-2 text-[13px] font-semibold">Template</div>
            <div className="mb-3 flex flex-wrap gap-2">
              {templates.map((t) => (
                <FilterChip
                  key={t.key}
                  selected={tpl === t.key}
                  onClick={() => {
                    setTpl(t.key);
                    setMsg(null);
                  }}
                >
                  {t.label}
                </FilterChip>
              ))}
            </div>
            <textarea className={cn(inputCls, "h-36 py-2.5 leading-6")} value={text} onChange={(e) => setMsg(e.target.value)} maxLength={500} />
            <div className="mt-1 text-right text-[12px] text-ink-500">
              <span className="tabular">{text.length}</span>/500
            </div>
            <Button variant="whatsapp" size="lg" full className="mt-3" icon={<Send className="size-4" />} disabled={!recipients.length} onClick={go}>
              {recipients.length} customers ko bhejein
            </Button>
          </Card>

          {history.length > 0 && (
            <section>
              <h2 className="mb-2 text-[16px] font-bold">Pichhle broadcasts</h2>
              <Card className="divide-y divide-hairline">
                {history.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-start gap-3 px-4 py-3">
                    <CheckCheck className="mt-0.5 size-4 shrink-0 text-[#34B7F1]" />
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 text-[14px]">{b.message.split("\n")[0].replaceAll("{name}", "…").replaceAll("{shop}", shop.name)}</div>
                      <div className="text-[12px] text-ink-500">
                        {b.recipientIds.length} log · {timeAgo(b.sentAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="mb-2 text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase">Preview · {sample} ke phone par</div>
          <PhoneBezel shopName={shop.name} text={rendered} />
        </div>
      </div>
    </div>
  );
}

/** Stylised WhatsApp chat in a phone frame (no real branding assets). */
export function PhoneBezel({ shopName, text }: { shopName: string; text: string }) {
  return (
    <div className="mx-auto w-[280px] rounded-[40px] bg-ink-900 p-2.5 shadow-2">
      <div className="overflow-hidden rounded-[32px] bg-[#efe7dd]">
        <div className="flex items-center gap-2.5 bg-[#075e54] px-4 pt-6 pb-3 text-white">
          <span className="flex size-8 items-center justify-center rounded-full bg-white/20 text-[12px] font-bold">{initials(shopName)}</span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{shopName}</div>
            <div className="text-[11px] opacity-75">Business account</div>
          </div>
        </div>
        <div className="flex min-h-[340px] flex-col justify-end gap-2 p-3">
          <span className="mx-auto rounded-md bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-ink-500">AAJ</span>
          <div className="relative max-w-[92%] rounded-lg rounded-tl-none bg-white px-3 py-2 text-[13px] leading-[18px] whitespace-pre-line text-ink-900 shadow-1">
            {text}
            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-ink-500">
              abhi <CheckCheck className="size-3.5 text-[#34B7F1]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
