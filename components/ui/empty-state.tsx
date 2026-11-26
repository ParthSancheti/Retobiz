import type { ReactNode } from "react";
import type { GlyphName, Wash } from "@/lib/types";
import { cn } from "@/lib/cn";
import { GLYPHS, WASH_BG } from "@/components/media/glyphs";

/** Pastel tile + glyph + one sentence + one action (DESIGN §7). */
export function EmptyState({
  glyph = "store",
  wash = "cream",
  title,
  body,
  action,
  className,
}: {
  glyph?: GlyphName;
  wash?: Wash;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const Icon = GLYPHS[glyph];
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      <div className={cn("relative flex size-24 items-center justify-center rounded-lg", WASH_BG[wash])}>
        <Icon className="size-10 text-ink-700" strokeWidth={1.75} aria-hidden />
        <span aria-hidden className="shadow-ground absolute -bottom-2 h-2.5 w-16" />
      </div>
      <h3 className="mt-5 text-[17px] leading-6 font-bold">{title}</h3>
      {body && <p className="mt-1.5 max-w-[34ch] text-[14px] leading-5 text-ink-500">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
