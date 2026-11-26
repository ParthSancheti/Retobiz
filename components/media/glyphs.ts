import {
  CakeSlice,
  Footprints,
  Gem,
  PenTool,
  Pill,
  PlugZap,
  Scissors,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Store,
  type LucideIcon,
} from "lucide-react";
import type { GlyphName, Wash } from "@/lib/types";

export const GLYPHS: Record<GlyphName, LucideIcon> = {
  "shopping-basket": ShoppingBasket,
  shirt: Shirt,
  footprints: Footprints,
  smartphone: Smartphone,
  "cake-slice": CakeSlice,
  pill: Pill,
  "plug-zap": PlugZap,
  scissors: Scissors,
  gem: Gem,
  "pen-tool": PenTool,
  store: Store,
};

export const WASH_BG: Record<Wash, string> = {
  mint: "bg-wash-mint",
  peach: "bg-wash-peach",
  sky: "bg-wash-sky",
  cream: "bg-wash-cream",
  lavender: "bg-wash-lavender",
};

export const WASHES: Wash[] = ["mint", "peach", "sky", "cream", "lavender"];
