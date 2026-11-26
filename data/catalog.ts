import type { Category, Location, SubCategory } from "@/lib/types";

export const SEED_CATEGORIES: Category[] = [
  { id: "cat-kirana", slug: "kirana", name: "Kirana & General Store", nameHi: "किराना", wash: "mint", imageKey: "cat-kirana", glyph: "shopping-basket", order: 1, active: true },
  { id: "cat-saree", slug: "saree-readymade", name: "Saree & Readymade", nameHi: "साड़ी", wash: "lavender", imageKey: "cat-saree", glyph: "shirt", order: 2, active: true },
  { id: "cat-footwear", slug: "footwear-bags", name: "Footwear & Bags", nameHi: "चप्पल-जूते", wash: "peach", imageKey: "cat-footwear", glyph: "footprints", order: 3, active: true },
  { id: "cat-mobile", slug: "mobile-repair", name: "Mobile & Repair", nameHi: "मोबाइल", wash: "sky", imageKey: "cat-mobile", glyph: "smartphone", order: 4, active: true },
  { id: "cat-mithai", slug: "bakery-mithai", name: "Bakery & Mithai", nameHi: "मिठाई", wash: "peach", imageKey: "cat-mithai", glyph: "cake-slice", order: 5, active: true },
  { id: "cat-medical", slug: "medical-chemist", name: "Medical & Chemist", nameHi: "मेडिकल", wash: "mint", imageKey: "cat-medical", glyph: "pill", order: 6, active: true },
  { id: "cat-hardware", slug: "hardware-electricals", name: "Hardware & Electricals", nameHi: "हार्डवेयर", wash: "sky", imageKey: "cat-hardware", glyph: "plug-zap", order: 7, active: true },
  { id: "cat-salon", slug: "salon-parlour", name: "Salon & Parlour", nameHi: "पार्लर", wash: "lavender", imageKey: "cat-salon", glyph: "scissors", order: 8, active: true },
  { id: "cat-jewel", slug: "jewellers-imitation", name: "Jewellers & Imitation", nameHi: "ज्वेलरी", wash: "cream", imageKey: "cat-jewel", glyph: "gem", order: 9, active: true },
  { id: "cat-stationery", slug: "stationery-gifts", name: "Stationery & Gifts", nameHi: "स्टेशनरी", wash: "cream", imageKey: "cat-stationery", glyph: "pen-tool", order: 10, active: true },
];

const sub = (categoryId: string, slug: string, name: string): SubCategory => ({
  id: `sub-${slug}`,
  categoryId,
  slug,
  name,
  active: true,
});

export const SEED_SUBCATEGORIES: SubCategory[] = [
  sub("cat-kirana", "staples-grains", "Staples & Grains"),
  sub("cat-kirana", "masale", "Masale & Spices"),
  sub("cat-kirana", "kirana-combos", "Monthly Combos"),
  sub("cat-kirana", "household", "Household Needs"),

  sub("cat-saree", "paithani-silk", "Paithani & Silk Sarees"),
  sub("cat-saree", "cotton-sarees", "Cotton Sarees"),
  sub("cat-saree", "kurtis-sets", "Kurtis & Sets"),
  sub("cat-saree", "kids-wear", "Kids Wear"),
  sub("cat-saree", "mens-readymade", "Men's Readymade"),

  sub("cat-footwear", "kolhapuri-chappals", "Kolhapuri & Chappals"),
  sub("cat-footwear", "ladies-sandals", "Ladies Sandals"),
  sub("cat-footwear", "kids-footwear", "Kids Footwear"),
  sub("cat-footwear", "bags", "Handbags & School Bags"),

  sub("cat-mobile", "mobile-accessories", "Covers & Accessories"),
  sub("cat-mobile", "screen-guards", "Screen Guards"),
  sub("cat-mobile", "mobile-repair-service", "Repair & Service"),
  sub("cat-mobile", "power-banks", "Power Banks & Chargers"),

  sub("cat-mithai", "mithai", "Mithai"),
  sub("cat-mithai", "festive-boxes", "Festive Gift Boxes"),
  sub("cat-mithai", "bakery", "Bakery & Pav"),

  sub("cat-medical", "medicines", "Medicines"),
  sub("cat-medical", "wellness", "Wellness & Vitamins"),
  sub("cat-medical", "health-devices", "Health Devices"),

  sub("cat-hardware", "lighting", "LED & Lighting"),
  sub("cat-hardware", "tools", "Tools"),
  sub("cat-hardware", "electrical-fittings", "Switches & Fittings"),

  sub("cat-salon", "facial-skin", "Facial & Skin"),
  sub("cat-salon", "bridal-makeup", "Bridal & Party Makeup"),
  sub("cat-salon", "threading-waxing", "Threading & Waxing"),

  sub("cat-jewel", "earrings", "Earrings & Jhumkas"),
  sub("cat-jewel", "necklace-sets", "Necklace Sets"),
  sub("cat-jewel", "bangles", "Bangles"),

  sub("cat-stationery", "school-supplies", "School Supplies"),
  sub("cat-stationery", "notebooks", "Notebooks & Registers"),
  sub("cat-stationery", "gifts-wrapping", "Gifts & Wrapping"),
];

export const SEED_LOCATIONS: Location[] = [
  { id: "st-mh", level: "state", name: "Maharashtra" },

  { id: "dist-pune", level: "district", name: "Pune", parentId: "st-mh" },
  { id: "dist-nashik", level: "district", name: "Nashik", parentId: "st-mh" },

  { id: "city-pune", level: "city", name: "Pune (PCMC)", parentId: "dist-pune" },
  { id: "city-nashik", level: "city", name: "Nashik", parentId: "dist-nashik" },
  { id: "city-malegaon", level: "city", name: "Malegaon", parentId: "dist-nashik" },

  { id: "area-akurdi", level: "area", name: "Akurdi", parentId: "city-pune", lat: 18.6474, lng: 73.7654 },
  { id: "area-nigdi", level: "area", name: "Nigdi", parentId: "city-pune", lat: 18.6573, lng: 73.7726 },
  { id: "area-pimpri", level: "area", name: "Pimpri", parentId: "city-pune", lat: 18.6279, lng: 73.8009 },
  { id: "area-chinchwad", level: "area", name: "Chinchwad", parentId: "city-pune", lat: 18.6446, lng: 73.792 },
  { id: "area-ravet", level: "area", name: "Ravet", parentId: "city-pune", lat: 18.646, lng: 73.744 },

  { id: "area-college-road", level: "area", name: "College Road", parentId: "city-nashik", lat: 20.004, lng: 73.764 },
  { id: "area-panchavati", level: "area", name: "Panchavati", parentId: "city-nashik", lat: 20.013, lng: 73.793 },
  { id: "area-cidco", level: "area", name: "Cidco", parentId: "city-nashik", lat: 19.979, lng: 73.798 },

  { id: "area-malegaon-camp", level: "area", name: "Malegaon Camp", parentId: "city-malegaon", lat: 20.553, lng: 74.531 },
  { id: "area-sangameshwar", level: "area", name: "Sangameshwar", parentId: "city-malegaon", lat: 20.565, lng: 74.52 },
];

export const DEFAULT_BUYER_AREA_ID = "area-akurdi";
