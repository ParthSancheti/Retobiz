"use client";
/* eslint-disable @next/next/no-img-element -- remote photos are pre-sized via query params; next/image runs unoptimized anyway */
import { useCallback, useEffect, useState } from "react";
import { IMAGES, imageUrl, type ImageKey, type ImageSize } from "@/data/images";
import type { GlyphName, Wash } from "@/lib/types";
import { cn } from "@/lib/cn";
import { WASH_BG } from "./glyphs";

const TIMEOUT_MS = 6000;
type LoadState = "loading" | "loaded" | "failed";

/**
 * The only way photos render (DESIGN §4.1):
 * pastel skeleton → photo → Pastel Fallback on error or 6s timeout.
 *
 * mode "framed": photo inset in the wash with the cutout treatment (§4.3)
 * mode "cover":  photo fills the box (covers, reels, banners)
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
  const meta = imageKey ? IMAGES[imageKey] : undefined;
  const src = srcOverride ?? (imageKey ? imageUrl(imageKey, size) : undefined);
  // Load result is keyed by src, so a new src naturally starts in "loading" (no effect-driven reset).
  const [result, setResult] = useState<{ src?: string; state: LoadState }>({ src, state: "loading" });
  const state: LoadState = !src ? "failed" : result.src === src ? result.state : "loading";
  const settle = useCallback((s: LoadState) => setResult((r) => (r.src === src && r.state !== "loading" ? r : { src, state: s })), [src]);

  // 6s timeout → fallback (setState happens in the timer callback).
  useEffect(() => {
    if (!src) return;
    const t = setTimeout(() => setResult((r) => (r.src === src && r.state !== "loading" ? r : { src, state: "failed" })), TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [src]);

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

  if (state === "failed") return <PastelFallback wash={wash} label={fallbackLabel} lang={fallbackLang} className={className} />;

  return (
    <div className={cn("relative overflow-hidden", WASH_BG[wash], className)}>
      {state === "loading" && <div aria-hidden className="skeleton absolute inset-0 rounded-[inherit] bg-transparent" />}
      {isCutout ? (
        <>
          <div aria-hidden className="shadow-ground pointer-events-none absolute bottom-[5%] left-[18%] h-[9%] w-[64%] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-95 group-hover:opacity-75" />
          <img
            ref={imgRef}
            src={src}
            alt={label}
            loading={priority ? "eager" : "lazy"}
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
              loading={priority ? "eager" : "lazy"}
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
          loading={priority ? "eager" : "lazy"}
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
