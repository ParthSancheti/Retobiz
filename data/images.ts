/**
 * Curated retail photo registry (DESIGN §4.1).
 * Every entry was picked from its Pexels photo page (license: free to use).
 * URLs follow the canonical pattern Pexels publishes in each page's og:image:
 *   https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg
 * Verify all URLs return 200 with:  npm run images:verify
 */

/** light = white-bg photo (multiply blend) · busy = full photo · cutout = transparent local 3D cutout */
export type ImageTone = "light" | "busy" | "cutout" | "photo";
export type Focal = "center" | "top" | "bottom";

interface RawImage {
  pexelsId?: number;
  /** Local file under /public (generated cutouts). Takes precedence over pexelsId. */
  file?: string;
  alt: string;
  tone: ImageTone;
  focal?: Focal;
}

/** Retobiz cutout set (ChatGPT-generated, sliced by scripts/slice-sprites.py). */
const c = (file: string, alt: string): RawImage => ({ file: `/images/${file}.webp`, alt, tone: "cutout" });

/** Photoreal 9:16 Reel / UGC frames (ChatGPT-generated, sliced by reelsrc/slice.py). */
const r = (file: string, alt: string, focal: Focal = "center"): RawImage => ({ file: `/images/${file}.webp`, alt, tone: "photo", focal });

const RAW = {
  // ── Photoreal reel & UGC frames ──
  "reel-paithani-owner": r("reels/reel-paithani-owner", "Boutique owner holding up a red and gold Paithani saree", "top"),
  "reel-ugc-creator": r("reels/reel-ugc-creator", "Creator filming a review on a gimbal inside an apparel store", "top"),
  "reel-mithai-counter": r("reels/reel-mithai-counter", "Jalebi and kaju katli plated at a mithai counter"),
  "reel-mobile-unbox": r("reels/reel-mobile-unbox", "Creator unboxing phone covers at a mobile shop counter"),
  "reel-kirana-festive": r("reels/reel-kirana-festive", "Shopkeeper with a grocery combo basket in a marigold-decorated aisle"),
  "reel-kundan-hands": r("reels/reel-kundan-hands", "Mehendi hands showcasing a bridal kundan set"),
  "studio-shop-tour": r("studio/studio-shop-tour", "Shopkeeper welcoming viewers into a footwear and bags shop", "top"),
  "studio-review-card": r("studio/studio-review-card", "Happy customer showing a five-star review with the shopkeeper", "top"),
  "studio-diwali-mithai": r("studio/studio-diwali-mithai", "Diwali-lit sweet shop entrance with a mithai gift box"),

  // ── Cutouts: categories & promos ──
  "cat-kirana": c("cat-kirana", "Atta sack, dal and chilli bowls, ghee jar"),
  "cat-saree": c("cat-saree", "Folded Paithani silk sarees"),
  "cat-footwear": c("cat-footwear", "Kolhapuri chappals and handbag"),
  "cat-mobile": c("cat-mobile", "Smartphones with screen guard and back cover"),
  "cat-mithai": c("cat-mithai", "Tray of kaju katli, ladoo and jalebi"),
  "cat-medical": c("cat-medical", "Medicine box, tablet strips and thermometer"),
  "cat-hardware": c("cat-hardware", "Pliers, screwdriver, wire and LED bulbs"),
  "cat-salon": c("cat-salon", "Hair dryer, brush, face pack and nail polish"),
  "cat-jewel": c("cat-jewel", "Kundan necklace and jhumka set"),
  "cat-stationery": c("cat-stationery", "Notebooks, pencils and gift box"),
  "promo-hot-deals": c("promo-hot-deals", "Gold rupee coin with a price-drop arrow"),
  "promo-new-shops": c("promo-new-shops", "Miniature kirana shopfront with awning"),

  // ── Cutouts: products ──
  "p-paithani": c("p-paithani", "Folded green Yeola Paithani silk saree"),
  "p-cotton-saree": c("p-cotton-saree", "Folded blue cotton handloom saree with bangles"),
  "p-kurti-set": c("p-kurti-set", "Folded 3-piece kurti set"),
  "p-kids-lehenga": c("p-kids-lehenga", "Kids lehenga choli on a hanger"),
  "p-mens-kurta": c("p-mens-kurta", "Men's cotton kurta pyjama set"),
  "p-nauvari": c("p-nauvari", "Green Nauvari saree with nath"),
  "p-kaju-katli": c("p-kaju-katli", "Kaju katli on a tray"),
  "p-ladoo-box": c("p-ladoo-box", "Box of motichoor ladoos"),
  "p-jalebi": c("p-jalebi", "Plate of fresh jalebi"),
  "p-mithai-box": c("p-mithai-box", "Assorted mithai gift box"),
  "p-kirana-combo": c("p-kirana-combo", "Monthly kirana combo"),
  "p-whole-spices": c("p-whole-spices", "Whole spices in bowls"),
  "p-kolhapuri": c("p-kolhapuri", "Leather Kolhapuri chappals"),
  "p-handbag": c("p-handbag", "Ladies leather handbag"),
  "p-phone-covers": c("p-phone-covers", "Colourful phone back covers"),
  "p-tempered-glass": c("p-tempered-glass", "Tempered glass screen guard"),
  "p-led-pack": c("p-led-pack", "Pack of LED bulbs"),
  "p-power-bank": c("p-power-bank", "Power bank with cable"),
  "p-kundan-set": c("p-kundan-set", "Kundan earring set"),
  "p-bangles": c("p-bangles", "Stack of red and gold bangles"),
  "p-school-kit": c("p-school-kit", "Back-to-school stationery kit"),
  "p-notebooks": c("p-notebooks", "Pack of long notebooks"),
  "p-medicine-strips": c("p-medicine-strips", "Medicine strips and vitamin bottle"),
  "p-facial-kit": c("p-facial-kit", "Fruit facial kit"),
  "p-tool-kit": c("p-tool-kit", "Electrician tool kit"),
  "p-bridal-saree": c("p-bridal-saree", "Red bridal silk saree"),
  "p-black-sandals": c("p-black-sandals", "Black strap sandals"),
  "p-bread": c("p-bread", "Fresh pav and bread loaf"),
  "p-masala-pack": c("p-masala-pack", "Pouches of masala"),
  "p-dal-rice": c("p-dal-rice", "Rice and dal sacks"),

  // ── Saree & Readymade ──
  "saree-silk-stack": { pexelsId: 10317106, alt: "Stack of Kanchipuram silk sarees with zari borders", tone: "busy" },
  "saree-silk-pattern": { pexelsId: 10317113, alt: "Close-up of a silk saree's woven pattern", tone: "busy" },
  "fabric-readymade": { pexelsId: 10317127, alt: "Colourful folded silk fabrics on display", tone: "busy" },
  "saree-bangles": { pexelsId: 5447529, alt: "Traditional saree with golden bangles", tone: "busy" },
  "reel-saree-lavender": { pexelsId: 35108864, alt: "Woman in a lavender silk saree", tone: "busy", focal: "top" },

  // ── Kirana & General Store ──
  "kirana-spices-wood": { pexelsId: 30296301, alt: "Indian spices arranged on a wooden table", tone: "busy" },
  "kirana-spice-sacks": { pexelsId: 15741144, alt: "Market stall with spices and grains in sacks", tone: "busy" },
  "kirana-whole-spices": { pexelsId: 8747536, alt: "Cinnamon, cloves, cardamom and peppercorns on a board", tone: "busy" },
  "kirana-pantry-jars": { pexelsId: 618491, alt: "Glass jars of pulses, grains and dry goods", tone: "busy" },

  // ── Footwear & Bags ──
  "footwear-buckle-sandals": { pexelsId: 31451006, alt: "Colourful leather buckle sandals", tone: "busy" },
  "footwear-black-sandals": { pexelsId: 31129841, alt: "Black leather sandals with buckle straps", tone: "light" },
  "footwear-handmade": { pexelsId: 40978791, alt: "Assorted handmade sandals and slippers", tone: "busy" },
  "bags-leather-shelf": { pexelsId: 9327162, alt: "Leather handbags on a white shelf", tone: "light" },

  // ── Bakery & Mithai ──
  "mithai-kaju-katli": { pexelsId: 10514163, alt: "Plate of kaju katli", tone: "busy" },
  "mithai-shop-display": { pexelsId: 38524183, alt: "Assorted Indian sweets in a shop display", tone: "busy" },
  "mithai-jalebi": { pexelsId: 39193443, alt: "Freshly made jalebi", tone: "busy" },
  "mithai-ladoo": { pexelsId: 40000005, alt: "Ladoos garnished with saffron and nuts", tone: "busy" },
  "bakery-loaves": { pexelsId: 1383908, alt: "Freshly baked bread loaves", tone: "busy" },

  // ── Medical & Chemist ──
  "medical-blister-packs": { pexelsId: 9742736, alt: "Tablets and capsules in blister packs", tone: "busy" },

  // ── Mobile & Repair ──
  "mobile-back-covers": { pexelsId: 33158446, alt: "Assorted smartphone back covers", tone: "busy" },
  "mobile-gadgets": { pexelsId: 5208784, alt: "Smartphone with power bank and selfie stick", tone: "light" },

  // ── Hardware & Electricals ──
  "hardware-tools-wires": { pexelsId: 6349405, alt: "Pliers, screwdriver and wire connectors", tone: "light" },
  "hardware-bulb-socket": { pexelsId: 5853952, alt: "Light bulb, socket and screwdriver", tone: "busy" },

  // ── Salon & Parlour ──
  "salon-interior": { pexelsId: 13068377, alt: "Beauty salon counter with cosmetics", tone: "busy" },
  "salon-facial": { pexelsId: 33607393, alt: "Skincare facial treatment at a salon", tone: "busy", focal: "top" },

  // ── Jewellers & Imitation ──
  "jewel-kundan-set": { pexelsId: 33154729, alt: "Kundan necklace and earrings set", tone: "busy" },
  "jewel-bangles": { pexelsId: 9808451, alt: "Red and gold bridal bangles", tone: "busy" },

  // ── Stationery & Gifts ──
  "stationery-flatlay": { pexelsId: 7718794, alt: "Notebooks, ruler and stationery essentials", tone: "light" },
  "stationery-notebook": { pexelsId: 5594317, alt: "Notebook and pen on a yellow background", tone: "busy" },

  // ── Bazaar scenes (covers & reels) ──
  "bazaar-street": { pexelsId: 29911351, alt: "Busy Indian street market with shops and shoppers", tone: "busy" },
  "bazaar-wholesale": { pexelsId: 20753380, alt: "Colourful stalls in an Indian wholesale market", tone: "busy" },
} as const satisfies Record<string, RawImage>;

export type ImageKey = keyof typeof RAW;

export interface RetailImageMeta {
  key: ImageKey;
  pexelsId?: number;
  file?: string;
  alt: string;
  tone: ImageTone;
  focal: Focal;
}

export const IMAGES: Record<ImageKey, RetailImageMeta> = Object.fromEntries(
  (Object.entries(RAW) as [ImageKey, RawImage][]).map(([key, v]) => [
    key,
    { key, pexelsId: v.pexelsId, file: v.file, alt: v.alt, tone: v.tone, focal: v.focal ?? "center" },
  ]),
) as Record<ImageKey, RetailImageMeta>;

export const IMAGE_KEYS = Object.keys(RAW) as ImageKey[];

export type ImageSize = "thumb" | "card" | "cover" | "reel";
const WIDTH: Record<ImageSize, number> = { thumb: 240, card: 600, cover: 1280, reel: 1080 };

/** Optional offline mode: `npm run images:cache` writes /public/img/{id}.jpg and flips this flag. */
export const USE_LOCAL_IMAGES = false;

export function imageUrl(key: ImageKey, size: ImageSize = "card"): string {
  const { pexelsId, file } = IMAGES[key];
  if (file) return file;
  if (!pexelsId) return "";
  if (USE_LOCAL_IMAGES) return `/img/${pexelsId}.jpg`;
  const w = WIDTH[size];
  const crop = size === "reel" ? `&h=${Math.round(w * (16 / 9))}&fit=crop` : "";
  return `https://images.pexels.com/photos/${pexelsId}/pexels-photo-${pexelsId}.jpeg?auto=compress&cs=tinysrgb&w=${w}${crop}`;
}

export function isImageKey(k: string | undefined): k is ImageKey {
  return !!k && k in RAW;
}

/** Real photo used when a reel is created for a shop in this category. */
export const CATEGORY_REEL_PHOTO: Record<string, ImageKey> = {
  "cat-saree": "reel-paithani-owner",
  "cat-mithai": "reel-mithai-counter",
  "cat-mobile": "reel-mobile-unbox",
  "cat-kirana": "reel-kirana-festive",
  "cat-jewel": "reel-kundan-hands",
  "cat-footwear": "studio-shop-tour",
};
export const DEFAULT_REEL_PHOTO: ImageKey = "reel-ugc-creator";
