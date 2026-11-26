"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SectionHeader } from "@/components/ui/misc";

/**
 * Horizontal snap rail (DESIGN §6.2): bleeds to the screen edge on mobile so the
 * next card peeks; desktop gets prev/next buttons.
 */
export function Rail({
  title,
  eyebrow,
  action,
  children,
  itemClassName,
  className,
  id,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  children: ReactNode[];
  itemClassName?: string;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const nudge = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section aria-labelledby={id} className={className}>
      <SectionHeader
        title={<span id={id}>{title}</span>}
        eyebrow={eyebrow}
        className="mb-3"
        action={
          <div className="flex items-center gap-1">
            {action}
            <button type="button" onClick={() => nudge(-1)} aria-label="Peeche" className="hidden size-9 items-center justify-center rounded-full border border-hairline bg-surface hover:border-hairline-strong lg:inline-flex">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" onClick={() => nudge(1)} aria-label="Aage" className="hidden size-9 items-center justify-center rounded-full border border-hairline bg-surface hover:border-hairline-strong lg:inline-flex">
              <ChevronRight className="size-4" />
            </button>
          </div>
        }
      />
      <ul ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 items-stretch gap-3 overflow-x-auto px-4 pt-2 pb-5 lg:-mx-1 lg:scroll-px-1 lg:px-1">
        {children.map((child, i) => (
          <li key={i} className={cn("flex shrink-0 snap-start", itemClassName)}>
            {child}
          </li>
        ))}
      </ul>
    </section>
  );
}
