"use client";
/* eslint-disable @next/next/no-img-element -- local/remote photos are pre-sized; next/image runs unoptimized anyway */
import { useCallback, useEffect, useRef, useState } from "react";
import { IMAGES, imageUrl, isImageKey, type ImageKey, type ImageSize } from "@/data/images";
import type { GlyphName, Wash } from "@/lib/types";
import { cn } from "@/lib/cn";
import { WASH_BG } from "./glyphs";

const REMOTE_TIMEOUT_MS = 8000;
type LoadState = "loading" | "loaded" | "failed";

/**
 * Resilient photo renderer:
 * - Local /images/*.webp & *.png assets render eagerly without a premature lazy-scroll timeout
 *   so below-the-fold cards never turn into blank striped placeholders before scrolling.
 * - Remote URLs start their fallback timer ONLY once near/inside the viewport (IntersectionObserver).
 */
export function RetailImage({
  imageKey,
  src: srcOverride,
  size = "card",
  mode = "framed",
  wash = "cream",
  fallbackLabel,
  fallbackLang,
  alt,
  className,
  imgClassName,
  priority,
  zoom,
}: {
  imageKey?: ImageKey;
  /** Merchant-uploaded data URL; takes precedence over imageKey. */
  src?: string;
  size?: ImageSize;
  mode?: "framed" | "cover";
  wash?: Wash;
  glyph?: GlyphName;
  fallbackLabel?: string;
  fallbackLang?: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /** Hover-lift hook: parent can scale the inner photo via group-hover. */
  zoom?: boolean;
}) {
  const validKey = imageKey && isImageKey(imageKey) ? imageKey : undefined;
  const meta = validKey ? IMAGES[validKey] : undefined;
  const src = srcOverride ?? (validKey ? imageUrl(validKey, size) : undefined);
  const isLocal = !!src && (src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:"));

  const [result, setResult] = useState<{ src?: string; state: LoadState }>({ src, state: "loading" });
  const state: LoadState = !src ? "failed" : result.src === src ? result.state : "loading";
  const settle = useCallback((s: LoadState) => setResult((r) => (r.src === src && r.state !== "loading" ? r : { src, state: s })), [src]);

  const boxRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(Boolean(priority || isLocal));

  useEffect(() => {
    if (priority || isLocal || !boxRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNearViewport(true);
          io.disconnect();
        }
      },
      { rootMargin: "450px 0px" },
    );
    io.observe(boxRef.current);
    return () => io.disconnect();
  }, [priority, isLocal]);

  // Timeout applies ONLY for remote URLs once near/in the viewport.
  useEffect(() => {
    if (!src || isLocal || !nearViewport) return;
    const t = setTimeout(() => setResult((r) => (r.src === src && r.state !== "loading" ? r : { src, state: "failed" })), REMOTE_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [src, isLocal, nearViewport]);

  // Catch images that finished loading before hydration attached onLoad.
  const imgRef = useCallback(
    (el: HTMLImageElement | null) => {
      if (el?.complete) settle(el.naturalWidth > 0 ? "loaded" : "failed");
    },
    [settle],
  );

  const label = alt ?? meta?.alt ?? fallbackLabel ?? "";
  const focal = meta?.focal ?? "center";
  const objectPos = focal === "top" ? "object-top" : focal === "bottom" ? "object-bottom" : "object-center";
  const light = !srcOverride && meta?.tone === "light";
  const isCutout = !srcOverride && meta?.tone === "cutout";
  const loadingAttr = priority || isLocal ? "eager" : "lazy";

  if (state === "failed") return <PastelFallback wash={wash} label={fallbackLabel} lang={fallbackLang} className={className} />;

  return (
    <div ref={boxRef} className={cn("relative overflow-hidden", WASH_BG[wash], className)}>
      {state === "loading" && <div aria-hidden className="skeleton absolute inset-0 rounded-[inherit] bg-transparent" />}
      {isCutout ? (
        <>
          <div aria-hidden className="shadow-ground pointer-events-none absolute bottom-[5%] left-[18%] h-[9%] w-[64%] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-95 group-hover:opacity-75" />
          <img
            ref={imgRef}
            src={src}
            alt={label}
            loading={loadingAttr}
            decoding="async"
            draggable={false}
            onLoad={() => settle("loaded")}
            onError={() => settle("failed")}
            className={cn(
              "absolute inset-[7%] bottom-[9%] h-[84%] w-[86%] object-contain transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
              zoom && "group-hover:scale-[1.04]",
              state === "loaded" ? "opacity-100" : "opacity-0",
              imgClassName,
            )}
          />
        </>
      ) : mode === "framed" ? (
        <div className="absolute inset-[9%] bottom-[11%]">
          <div
            className={cn(
              "relative h-full w-full overflow-hidden rounded-md transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
              !light && "border-2 border-white shadow-1",
              zoom && "group-hover:scale-[1.04]",
            )}
          >
            <img
              ref={imgRef}
              src={src}
              alt={label}
              loading={loadingAttr}
              decoding="async"
              draggable={false}
              onLoad={() => settle("loaded")}
              onError={() => settle("failed")}
              className={cn(
                "h-full w-full object-cover transition-opacity duration-300",
                objectPos,
                light && "mix-blend-multiply",
                state === "loaded" ? "opacity-100" : "opacity-0",
                imgClassName,
              )}
            />
          </div>
          {/* ground shadow */}
          <div aria-hidden className="shadow-ground pointer-events-none absolute -bottom-[9%] left-[15%] h-[10%] w-[70%] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-95 group-hover:opacity-75" />
        </div>
      ) : (
        <img
          ref={imgRef}
          src={src}
          alt={label}
          loading={loadingAttr}
          decoding="async"
          draggable={false}
          onLoad={() => settle("loaded")}
          onError={() => settle("failed")}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
            zoom && "group-hover:scale-[1.04]",
            objectPos,
            state === "loaded" ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      )}
    </div>
  );
}

/**
 * Intentional typographic fallback (DESIGN §4.1, revised §12): category wash + soft
 * diagonal weave + bold label. No icon-in-circle — it reads as a designed tile.
 */
export function PastelFallback({
  wash = "cream",
  label,
  lang,
  className,
}: {
  wash?: Wash;
  glyph?: GlyphName;
  label?: string;
  lang?: string;
  className?: string;
}) {
  return (
    <div className={cn("@container relative overflow-hidden", WASH_BG[wash], className)} role="img" aria-label={label}>
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(135deg,rgb(255_255_255/0.55)_0_2px,transparent_2px_12px)]"
      />
      <div aria-hidden className="absolute -right-[18%] -bottom-[22%] aspect-square w-[70%] rounded-full bg-white/45" />
      {label && (
        <span
          lang={lang}
          className={cn(
            "absolute inset-x-[9%] bottom-[9%] line-clamp-3 leading-[1.05] font-extrabold tracking-[-0.02em] text-ink-900/85",
            lang === "hi" || lang === "mr" ? "font-deva text-[clamp(14px,17cqi,40px)]" : "font-display text-[clamp(12px,11cqi,30px)]",
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
