"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { BadgeCheck, Check, X } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/store";
import { formatCompactIN, formatINR, timeAgo } from "@/lib/format";
import { spring } from "@/lib/motion";
import { RetailImage } from "@/components/media/retail-image";
import { FollowSheet } from "./follow-sheet";
import type { Reel } from "@/lib/types";
import { isUgcReel, shopHandle } from "./reel-card";

const FRAME_MS = 5000;

/** Mount once per buyer layout. Opens when `?reel=<id>` is present (DESIGN §5.6). */
export function ReelViewerHost() {
  return (
    <Suspense fallback={null}>
      <Host />
    </Suspense>
  );
}

function Host() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const reelId = params.get("reel");
  const reels = useStore((s) => s.reels);
  const order = useMemo(() => Object.values(reels).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => r.id), [reels]);

  const setReel = (id: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("reel", id);
    else next.delete("reel");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const reel = reelId ? reels[reelId] : undefined;
  return createPortalSafe(
    <AnimatePresence>
      {reel && (
        <Viewer
          key="viewer"
          reel={reel}
          onClose={() => setReel(null)}
          onNext={() => {
            const i = order.indexOf(reel.id);
            setReel(order[i + 1] ?? null);
          }}
          onPrev={() => {
            const i = order.indexOf(reel.id);
            if (i > 0) setReel(order[i - 1]);
          }}
        />
      )}
    </AnimatePresence>,
  );
}

function createPortalSafe(node: React.ReactNode) {
  return typeof document === "undefined" ? null : createPortal(node, document.body);
}

function Viewer({ reel, onClose, onNext, onPrev }: { reel: Reel; onClose: () => void; onNext: () => void; onPrev: () => void }) {
  const shop = useStore((s) => s.shops[reel.shopId]);
  const offer = useStore((s) => (reel.offerId ? s.offers[reel.offerId] : undefined));
  const category = useStore((s) => s.categories.find((c) => c.id === s.shops[reel.shopId]?.categoryId));
  const following = useStore((s) => s.buyerPassIds.some((id) => s.customers[id]?.shopId === reel.shopId));
  const trackReelView = useStore((s) => s.trackReelView);
  const reduce = useReducedMotion();
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const progress = useMotionValue(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);

  // Count a view once per open.
  useEffect(() => {
    trackReelView(reel.id);
  }, [reel.id, trackReelView]);

  // Reset when the reel changes (frame state is keyed by reel via parent key change on id).
  const [reelId, setReelId] = useState(reel.id);
  if (reelId !== reel.id) {
    setReelId(reel.id);
    setFrame(0);
  }

  useEffect(() => {
    progress.set(0);
  }, [frame, reel.id, progress]);

  useAnimationFrame((_, delta) => {
    if (paused || followOpen) return;
    const p = progress.get() + delta / FRAME_MS;
    if (p >= 1) {
      progress.set(0);
      if (frame < reel.frames.length - 1) setFrame((f) => f + 1);
      else onNext();
    } else progress.set(p);
  });

  const next = () => (frame < reel.frames.length - 1 ? setFrame(frame + 1) : onNext());
  const prev = () => (frame > 0 ? setFrame(frame - 1) : onPrev());

  // Body lock + keys.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  });


  const onPointerDown = () => {
    held.current = false;
    holdTimer.current = setTimeout(() => {
      held.current = true;
      setPaused(true);
    }, 180);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (held.current) {
      setPaused(false);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    if (x < 0.33) prev();
    else if (x > 0.66) next();
  };

  if (!shop) return null;
  const words = reel.caption.split(" ");
  const current = reel.frames[frame];

  return (
    <motion.div
      className="fixed inset-0 z-[66] flex items-center justify-center bg-ink-900/80 lg:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`${shop.name} reel`}
    >
      <motion.div
        initial={{ scale: reduce ? 1 : 0.96, y: reduce ? 0 : 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: reduce ? 1 : 0.97, opacity: 0 }}
        transition={spring.default}
        className="relative h-dvh w-full overflow-hidden bg-ink-900 lg:aspect-[9/16] lg:h-[min(746px,92dvh)] lg:w-auto lg:rounded-xl"
      >
        {/* Frames with Ken-Burns driven by progress (pauses with it) */}
        <div className="absolute inset-0 touch-none select-none" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => setPaused(false)}>
          <AnimatePresence initial={false}>
            <motion.div key={`${reel.id}-${frame}`} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.3 }}>
              <KenBurns progress={progress} still={!!reduce} dir={frame % 2 === 0 ? 1 : -1}>
                <RetailImage imageKey={current?.imageKey} mode="cover" size="reel" wash={category?.wash ?? "lavender"} priority className="h-full w-full bg-ink-900" />
              </KenBurns>
            </motion.div>
          </AnimatePresence>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(18_20_26/0.55)_0%,rgb(18_20_26/0)_22%,rgb(18_20_26/0)_48%,rgb(18_20_26/0.85)_100%)]" />
        </div>

        {/* Story progress */}
        <div className="pointer-events-none absolute inset-x-3 top-[max(env(safe-area-inset-top),12px)] flex gap-1">
          {reel.frames.map((_, i) => (
            <div key={i} className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/35">
              {i < frame ? <div className="h-full w-full bg-white" /> : i === frame ? <ProgressFill progress={progress} /> : null}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute inset-x-3 top-[calc(max(env(safe-area-inset-top),12px)+12px)] flex items-center gap-2.5 text-white">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-saffron-400 to-flame-500 text-[12px] font-extrabold text-white ring-2 ring-white">
            {shop.name.replace(/&/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-[14px] font-bold">
              <span className="truncate">{shop.name}</span>
              {shop.isVerified && <BadgeCheck className="size-4 shrink-0 fill-white text-indigo-600" strokeWidth={2} />}
            </div>
            <div className="truncate text-[12px] text-white/75">
              <span className={`mr-1.5 rounded-full px-1.5 py-[1px] text-[9.5px] font-extrabold tracking-[0.08em] text-white ${isUgcReel(reel) ? "bg-flame-500" : "bg-white/25"}`}>{isUgcReel(reel) ? "UGC" : "REEL"}</span>
              {shopHandle(shop)} · {timeAgo(reel.createdAt)} · {formatCompactIN(reel.views)} views{paused && " · Paused"}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Band karein" className="flex size-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25">
            <X className="size-5" />
          </button>
        </div>

        {/* Kinetic caption */}
        <div className="pointer-events-none absolute inset-x-4 bottom-[calc(max(env(safe-area-inset-bottom),16px)+76px)] text-white">
          <motion.p key={`${reel.id}-${frame}-cap`} className="font-display text-[28px] leading-[32px] font-extrabold tracking-[-0.02em] lg:text-[30px] lg:leading-[34px]" animate={{ opacity: paused ? 0.8 : 1 }}>
            {words.map((w, i) => (
              <motion.span key={i} className="mr-[0.25em] inline-block" initial={{ y: reduce ? 0 : 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring.snappy, delay: reduce ? 0 : i * 0.04 }}>
                {w}
              </motion.span>
            ))}
          </motion.p>
          {offer && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 text-ink-900">
              {offer.price != null && <span className="tabular text-[17px] font-extrabold">{formatINR(offer.price)}</span>}
              {offer.mrp && offer.price != null && <span className="tabular text-[12px] text-ink-500 line-through">{formatINR(offer.mrp)}</span>}
              {offer.discountPct && <span className="tabular rounded-sm bg-flame-500 px-1.5 py-0.5 text-[11px] font-extrabold text-white">{offer.discountPct}% OFF</span>}
            </div>
          )}
        </div>

        {/* Sticky CTA pill */}
        <div className="absolute inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] flex gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => setFollowOpen(true)}
            className="h-[52px] flex-1 rounded-full bg-flame-500 text-[15px] font-bold text-white shadow-2 hover:bg-flame-600"
          >
            {offer ? "Offer Claim Karein" : "Offers WhatsApp pe paayein"}
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => !following && setFollowOpen(true)}
            className="inline-flex h-[52px] items-center gap-1.5 rounded-full border border-white/70 px-5 text-[15px] font-bold text-white backdrop-blur-sm"
          >
            {following ? (
              <>
                <Check className="size-4" strokeWidth={2.5} /> Following
              </>
            ) : (
              "Follow"
            )}
          </motion.button>
        </div>
      </motion.div>
      <FollowSheet key={reel.shopId} shop={shop} open={followOpen} onClose={() => setFollowOpen(false)} />
    </motion.div>
  );
}

function ProgressFill({ progress }: { progress: MotionValue<number> }) {
  const scaleX = useTransform(progress, (p) => p);
  return <motion.div className="h-full w-full origin-left bg-white" style={{ scaleX }} />;
}

function KenBurns({ progress, still, dir, children }: { progress: MotionValue<number>; still: boolean; dir: 1 | -1; children: React.ReactNode }) {
  const scale = useTransform(progress, (p) => (still ? 1 : 1 + 0.08 * p));
  const x = useTransform(progress, (p) => (still ? "0%" : `${dir * -3 * p}%`));
  return (
    <motion.div className="absolute inset-0" style={{ scale, x }}>
      {children}
    </motion.div>
  );
}
