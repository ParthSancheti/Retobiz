"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, MoreHorizontal, Play } from "lucide-react";
import { RetailImage } from "@/components/media/retail-image";
import { TPL_LOOK } from "@/components/merchant/studio-view";
import { useStore } from "@/store";
import { toast } from "@/store/ui";
import { Hydrated } from "@/components/shell/hydrated";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, inputCls, PageHead, PageSkeleton } from "@/components/merchant/common";
import { LOCAL_CREATORS, TEMPLATE_BY_KEY } from "@/data/agency-templates";
import type { AgencyRequest, AgencyStatus } from "@/lib/types";
import { formatINR, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

const COLS: { key: AgencyStatus; label: string; tone: string }[] = [
  { key: "new", label: "New", tone: "bg-indigo-500" },
  { key: "creator_assigned", label: "Creator Assigned", tone: "bg-saffron-500" },
  { key: "in_review", label: "In Review", tone: "bg-flame-500" },
  { key: "delivered", label: "Delivered", tone: "bg-leaf-500" },
];

export function AgencyKanban() {
  return (
    <Hydrated fallback={<PageSkeleton />}>
      <Content />
    </Hydrated>
  );
}

type Pending = { req: AgencyRequest; to: AgencyStatus } | null;

function Content() {
  const requests = useStore((s) => s.agencyRequests);
  const shops = useStore((s) => s.shops);
  const move = useStore((s) => s.moveAgencyRequest);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<AgencyStatus | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const byCol = useMemo(() => {
    const m: Record<AgencyStatus, AgencyRequest[]> = { new: [], creator_assigned: [], in_review: [], delivered: [] };
    Object.values(requests)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .forEach((r) => m[r.status].push(r));
    return m;
  }, [requests]);

  const request = (req: AgencyRequest, to: AgencyStatus) => {
    if (req.status === to) return;
    if (to === "creator_assigned" || to === "delivered") setPending({ req, to });
    else {
      move(req.id, to);
      toast({ message: `${TEMPLATE_BY_KEY[req.templateKey].name} → ${COLS.find((c) => c.key === to)!.label}`, tone: "success" });
    }
  };

  return (
    <div>
      <PageHead eyebrow="Agency Fulfillment" title="Kanban" sub="Card ko drag karein ya ‘Move to’ se aage badhaiye. Delivered = merchant ke storefront par naya reel." />
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {COLS.map((col) => (
          <section
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col.key);
            }}
            onDragLeave={() => setOver((o) => (o === col.key ? null : o))}
            onDrop={() => {
              const r = dragId ? requests[dragId] : undefined;
              setOver(null);
              setDragId(null);
              if (r) request(r, col.key);
            }}
            className={cn("flex w-[284px] shrink-0 snap-start flex-col rounded-[22px] bg-[#ECEFF5]/80 p-3.5 transition-colors lg:w-auto", over === col.key && "bg-indigo-50 ring-2 ring-indigo-500/40")}
            aria-label={col.label}
          >
            <header className="mb-3 flex items-center gap-2 px-1 pt-0.5">
              <span className={cn("size-2.5 rounded-full ring-4 ring-white", col.tone)} />
              <span className="text-[14px] font-bold">{col.label}</span>
              <span className="tabular ml-auto rounded-full bg-white px-2.5 py-0.5 text-[12px] font-bold text-ink-700 shadow-1">{byCol[col.key].length}</span>
            </header>
            <div className="flex min-h-24 flex-col gap-2.5">
              {byCol[col.key].map((r) => {
                const t = TEMPLATE_BY_KEY[r.templateKey];
                const shop = shops[r.shopId];
                return (
                  <motion.article
                    key={r.id}
                    layout
                    layoutId={r.id}
                    transition={spring.snappy}
                    draggable
                    onDragStart={() => setDragId(r.id)}
                    onDragEnd={() => setDragId(null)}
                    whileHover={{ y: -2 }}
                    className={cn("cursor-grab rounded-[18px] border border-black/[0.04] bg-white p-2.5 shadow-soft active:cursor-grabbing", dragId === r.id && "opacity-50")}
                  >
                    <div className="flex gap-3">
                      <div className="relative h-[72px] w-[54px] shrink-0 overflow-hidden rounded-[12px] bg-ink-900">
                        <RetailImage imageKey={TPL_LOOK[r.templateKey]?.img} mode="cover" size="thumb" alt="" className="absolute inset-0 h-full w-full bg-ink-900" />
                        {TPL_LOOK[r.templateKey]?.video && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                            <Play className="ml-0.5 size-3.5 fill-white text-white" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[13.5px] leading-[18px] font-bold">{t.name}</div>
                          <span className="tabular shrink-0 rounded-full bg-canvas px-2 py-0.5 text-[11px] font-bold">{r.pricing.paidWith === "credit" ? "Credit" : formatINR(r.pricing.charged)}</span>
                        </div>
                        <div className="mt-0.5 truncate text-[12px] text-ink-500">{shop?.name}</div>
                        <p className="mt-1 line-clamp-1 text-[12px] text-ink-700">{r.brief.goal}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-black/[0.05] pt-2.5">
                      {r.creator ? (
                        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-canvas py-0.5 pr-2.5 pl-0.5">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-saffron-400 to-flame-500 text-[9px] font-extrabold text-white">
                            {r.creator.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)}
                          </span>
                          <span className="truncate text-[11.5px] font-semibold text-ink-700">{r.creator.handle}</span>
                        </span>
                      ) : (
                        <span className="text-[11.5px] text-ink-500">{timeAgo(r.createdAt)}</span>
                      )}
                      <MoveMenu current={r.status} onPick={(to) => request(r, to)} />
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <MoveSheet pending={pending} onClose={() => setPending(null)} />
    </div>
  );
}

const NEXT_LABEL: Record<AgencyStatus, string> = { new: "New", creator_assigned: "Assign", in_review: "Review", delivered: "Deliver" };

function MoveMenu({ current, onPick }: { current: AgencyStatus; onPick: (to: AgencyStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [open]);
  const idx = COLS.findIndex((c) => c.key === current);
  const next = COLS[idx + 1];
  return (
    <div ref={ref} className="relative flex shrink-0 items-center gap-1">
      {next && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => onPick(next.key)}
          className="inline-flex h-7 items-center gap-1 rounded-full bg-ink-900 px-2.5 text-[11.5px] font-bold text-white"
        >
          {NEXT_LABEL[next.key]} <ArrowRight className="size-3" />
        </motion.button>
      )}
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        aria-label="Move to"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex size-7 items-center justify-center rounded-full bg-canvas text-ink-700 hover:bg-sunk"
      >
        <MoreHorizontal className="size-4" />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={spring.snappy}
            className="absolute right-0 bottom-9 z-20 w-48 origin-bottom-right rounded-[16px] border border-black/[0.06] bg-white p-1.5 shadow-lift"
          >
            <li className="px-2.5 pt-1 pb-1.5 text-[11px] font-semibold tracking-[0.06em] text-ink-500 uppercase">Move to</li>
            {COLS.filter((c) => c.key !== current).map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onPick(c.key);
                  }}
                  className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[13px] font-semibold hover:bg-canvas"
                >
                  <span className={cn("size-2 rounded-full", c.tone)} />
                  {c.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function MoveSheet({ pending, onClose }: { pending: Pending; onClose: () => void }) {
  const move = useStore((s) => s.moveAgencyRequest);
  const [creator, setCreator] = useState(0);
  const [caption, setCaption] = useState("");
  const req = pending?.req;
  const t = req ? TEMPLATE_BY_KEY[req.templateKey] : null;
  const isDeliver = pending?.to === "delivered";

  const confirm = () => {
    if (!req || !pending) return;
    move(req.id, pending.to, isDeliver ? { deliverableCaption: caption || req.brief.goal } : { creator: LOCAL_CREATORS[creator] });
    toast({ message: isDeliver ? "Delivered — merchant ke storefront par reel live" : `${LOCAL_CREATORS[creator].name} assign hue`, tone: "success" });
    setCaption("");
    onClose();
  };

  return (
    <Sheet open={!!pending} onClose={onClose} title={isDeliver ? "Deliverable bhejein" : "Creator assign karein"} description={t ? `${t.name} · ${req?.brief.goal}` : undefined}>
      {isDeliver ? (
        <div className="flex flex-col gap-4">
          <Field label="Reel caption" hint="Yeh buyer ko storefront ke Reels mein dikhega">
            <input className={inputCls} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={req?.brief.goal} maxLength={80} />
          </Field>
          <Button variant="primary-indigo" size="lg" full onClick={confirm}>
            Delivered mark karein
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {LOCAL_CREATORS.map((c, i) => (
            <label key={c.handle} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3", creator === i ? "border-indigo-500 bg-indigo-50" : "border-hairline")}>
              <input type="radio" name="creator" checked={creator === i} onChange={() => setCreator(i)} className="accent-indigo-600" />
              <span className="flex-1">
                <span className="block text-[14px] font-semibold">{c.name}</span>
                <span className="text-[12px] text-ink-500">{c.handle}</span>
              </span>
            </label>
          ))}
          <Button variant="primary-indigo" size="lg" full className="mt-2" onClick={confirm}>
            Assign karein
          </Button>
        </div>
      )}
    </Sheet>
  );
}
