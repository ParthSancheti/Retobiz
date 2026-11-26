import { cn } from "@/lib/cn";
import type { Lang } from "@/lib/types";

/** Heritage tagline in each standee language (DESIGN §4.6). */
export const TAGLINE: Record<Lang, string> = {
  mr: "व्यवसाय तुमचा, प्लॅटफॉर्म आमचा",
  hi: "व्यवसाय आपका, प्लेटफ़ॉर्म हमारा",
  en: "Your business, our platform",
};

const SIZE = {
  sm: { mark: 22, word: "text-[19px]", tag: "text-[11px]" },
  md: { mark: 28, word: "text-[24px]", tag: "text-[12px]" },
  lg: { mark: 40, word: "text-[34px]", tag: "text-[14px]" },
} as const;

/**
 * Retobiz lockup: scalloped shop-awning glyph (indigo / flame / saffron stripes)
 * + "retobiz" wordmark (Jakarta 800). Only hand-authored brand art in the app.
 */
export function BrandLockup({
  size = "sm",
  withTagline = false,
  taglineLang = "mr",
  tone = "ink",
  className,
}: {
  size?: keyof typeof SIZE;
  withTagline?: boolean;
  taglineLang?: Lang;
  tone?: "ink" | "white";
  className?: string;
}) {
  const s = SIZE[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark size={s.mark} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display font-extrabold tracking-[-0.03em]",
            s.word,
            tone === "ink" ? "text-ink-900" : "text-white",
          )}
        >
          retobiz
        </span>
        {withTagline && (
          <span
            lang={taglineLang}
            className={cn(
              "mt-1 font-medium whitespace-nowrap",
              taglineLang === "en" ? "font-sans" : "font-deva",
              s.tag,
              tone === "ink" ? "text-ink-500" : "text-white/70",
            )}
          >
            {TAGLINE[taglineLang]}
          </span>
        )}
      </span>
    </span>
  );
}

export function BrandMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={cn("shrink-0", className)}>
      {/* shop body */}
      <rect x="5" y="15" width="22" height="13" rx="2.5" fill="#12141A" />
      <rect x="13" y="19.5" width="6" height="8.5" rx="1" fill="#FFC629" />
      {/* awning: 3 stripes */}
      <path d="M3 7.5C3 5.567 4.567 4 6.5 4H12.33V12.5C12.33 14.33 10.85 15.8 9.02 15.8H6.3C4.48 15.8 3 14.32 3 12.5V7.5Z" fill="#2F3BA8" />
      <path d="M12.33 4H19.67V12.5C19.67 14.33 18.19 15.8 16.37 15.8H15.63C13.81 15.8 12.33 14.33 12.33 12.5V4Z" fill="#FF5A2C" />
      <path d="M19.67 4H25.5C27.433 4 29 5.567 29 7.5V12.5C29 14.32 27.52 15.8 25.7 15.8H22.98C21.15 15.8 19.67 14.33 19.67 12.5V4Z" fill="#FFC629" />
    </svg>
  );
}
