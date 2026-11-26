/**
 * Deterministic demo seed (IMPLEMENTATION_PLAN §3.5).
 * Same RNG seed → identical shops, offers, customers on every reset.
 * Only timestamps are anchored to `now` so "2 din pehle" stays truthful.
 */
import type { ImageKey } from "@/data/images";
import type {
  ActivityEvent,
  AgencyRequest,
  AgencyStatus,
  Customer,
  Distributor,
  Offer,
  QrOrder,
  QrOrderStatus,
  Reel,
  ReferralEntry,
  Shop,
  VerificationStatus,
} from "@/lib/types";
import { discountPct } from "@/lib/format";
import { createRng } from "./rng";
import { SEED_CATEGORIES, SEED_LOCATIONS, SEED_SUBCATEGORIES } from "./catalog";
import { REFERRAL_COMMISSION, TEMPLATE_BY_KEY, currentMonthKey, LOCAL_CREATORS } from "./agency-templates";

export const HERO_SHOP_ID = "shop-lsc";
const DAY = 86_400_000;
const HOUR = 3_600_000;

/* ─────────────────────────── Shop specs ─────────────────────────── */

interface OfferSpec {
  kind: "offer" | "product";
  title: string;
  sub: string;
  img: ImageKey;
  mrp?: number;
  price?: number;
  pct?: number;
  unit?: string;
  desc?: string;
  validDays?: number;
}

interface ShopSpec {
  id: string;
  prefix: string;
  name: string;
  owner: string;
  cat: string;
  subs: string[];
  area: string;
  address: string;
  landmark: string;
  hours: string;
  tagline: string;
  gst: boolean;
  google: boolean;
  status: VerificationStatus;
  plan: "free" | "pro";
  cover: ImageKey;
  followerBase: number;
  customers: number;
  distributor: string;
  ageDays: number;
  offers: OfferSpec[];
}

const SHOPS: ShopSpec[] = [
  {
    id: HERO_SHOP_ID, prefix: "LSC", name: "Laxmi Saree & Readymade Centre", owner: "Suresh Patil",
    cat: "cat-saree", subs: ["paithani-silk", "cotton-sarees", "kurtis-sets", "kids-wear", "mens-readymade"],
    area: "area-akurdi", address: "Shop 4, Sai Plaza, Akurdi Railway Station Road", landmark: "Sambhaji Chowk ke paas",
    hours: "Mon–Sat · 10 am–9:30 pm", tagline: "Yeola ki asli Paithani, Akurdi mein",
    gst: true, google: true, status: "approved", plan: "free", cover: "cat-saree",
    followerBase: 1182, customers: 38, distributor: "dist-gd", ageDays: 64,
    offers: [
      { kind: "offer", title: "Lagna Season Sale — Flat 20% off on all silk sarees", sub: "paithani-silk", img: "p-bridal-saree", pct: 20, validDays: 9, desc: "Paithani, Kanchi-style aur semi-silk — sab par. Blouse stitching 7 din mein." },
      { kind: "product", title: "Yeola Paithani Silk Saree", sub: "paithani-silk", img: "p-paithani", mrp: 7999, price: 6450 },
      { kind: "product", title: "Kanchi-style Pure Silk Saree", sub: "paithani-silk", img: "cat-saree", mrp: 5499, price: 4299 },
      { kind: "product", title: "Semi-Paithani Border Saree", sub: "paithani-silk", img: "p-nauvari", mrp: 3299, price: 2499 },
      { kind: "product", title: "Nauvari Ready-to-wear Saree", sub: "paithani-silk", img: "p-nauvari", mrp: 2999, price: 2399 },
      { kind: "product", title: "Cotton Handloom Saree — daily wear", sub: "cotton-sarees", img: "p-cotton-saree", mrp: 1599, price: 1299 },
      { kind: "product", title: "Festive Kurti Set (3 pc)", sub: "kurtis-sets", img: "p-kurti-set", mrp: 1199, price: 899 },
      { kind: "product", title: "Cotton Straight Kurti", sub: "kurtis-sets", img: "p-kurti-set", mrp: 699, price: 549 },
      { kind: "product", title: "Kids Lehenga Choli (2–8 yrs)", sub: "kids-wear", img: "p-kids-lehenga", mrp: 1499, price: 1099 },
      { kind: "product", title: "Men's Cotton Kurta Pyjama", sub: "mens-readymade", img: "p-mens-kurta", mrp: 1299, price: 999 },
      { kind: "product", title: "Bridal Silk Saree + Blouse Stitching", sub: "paithani-silk", img: "p-bridal-saree", mrp: 9999, price: 8499 },
    ],
  },
  {
    id: "shop-sgk", prefix: "SGK", name: "Shree Ganesh Kirana", owner: "Ganesh Kale",
    cat: "cat-kirana", subs: ["staples-grains", "masale", "kirana-combos", "household"],
    area: "area-akurdi", address: "Plot 12, Gurudwara Road, Akurdi", landmark: "Akurdi Gurudwara ke saamne",
    hours: "Daily · 7 am–10 pm", tagline: "Ghar ka saara saaman, ek hi dukaan mein",
    gst: true, google: true, status: "approved", plan: "pro", cover: "cat-kirana",
    followerBase: 2140, customers: 40, distributor: "dist-gd", ageDays: 120,
    offers: [
      { kind: "offer", title: "Monthly Kirana Combo — 15 items", sub: "kirana-combos", img: "p-kirana-combo", mrp: 1049, price: 899, validDays: 20, desc: "Atta 5kg, toor dal, chawal, tel, chai patti aur 10 aur zaroori cheezein." },
      { kind: "offer", title: "Masala Mahotsav — 25% off on all masale", sub: "masale", img: "p-masala-pack", pct: 25, validDays: 6 },
      { kind: "product", title: "Whole Garam Masala Pack (200 g)", sub: "masale", img: "p-whole-spices", mrp: 180, price: 149 },
      { kind: "product", title: "Toor Dal 1 kg + Basmati 1 kg", sub: "staples-grains", img: "p-dal-rice", mrp: 330, price: 289 },
    ],
  },
  {
    id: "shop-pfb", prefix: "PFB", name: "Patil Footwear & Bags", owner: "Rahul Patil",
    cat: "cat-footwear", subs: ["kolhapuri-chappals", "ladies-sandals", "bags"],
    area: "area-nigdi", address: "Shop 9, Bhakti Shakti Chowk Market, Nigdi", landmark: "Bhakti Shakti Chowk",
    hours: "Mon–Sat · 10 am–9 pm", tagline: "Asli Kolhapuri, seedha karigar se",
    gst: true, google: false, status: "approved", plan: "free", cover: "cat-footwear",
    followerBase: 640, customers: 22, distributor: "dist-gd", ageDays: 48,
    offers: [
      { kind: "offer", title: "Doosri jodi par 20% off — sandals & chappals", sub: "kolhapuri-chappals", img: "cat-footwear", pct: 20, validDays: 12 },
      { kind: "product", title: "Men's Leather Kolhapuri Chappal", sub: "kolhapuri-chappals", img: "p-kolhapuri", mrp: 499, price: 399 },
      { kind: "product", title: "Women's Black Strap Sandals", sub: "ladies-sandals", img: "p-black-sandals", mrp: 899, price: 649 },
      { kind: "product", title: "Ladies Leather Handbag", sub: "bags", img: "p-handbag", mrp: 1499, price: 1099 },
    ],
  },
  {
    id: "shop-osm", prefix: "OSM", name: "Om Sai Mobile Point", owner: "Imran Shaikh",
    cat: "cat-mobile", subs: ["mobile-accessories", "screen-guards", "mobile-repair-service", "power-banks"],
    area: "area-pimpri", address: "Shop 21, Pimpri Market, near Shagun Chowk", landmark: "Shagun Chowk",
    hours: "Daily · 10 am–10 pm", tagline: "Repair 1 ghante mein, warna chai free",
    gst: true, google: true, status: "approved", plan: "pro", cover: "cat-mobile",
    followerBase: 1530, customers: 30, distributor: "dist-gd", ageDays: 90,
    offers: [
      { kind: "offer", title: "Tempered glass + fitting — sirf ₹199", sub: "screen-guards", img: "p-tempered-glass", mrp: 299, price: 199, validDays: 15 },
      { kind: "offer", title: "Back covers — koi bhi 2 sirf ₹249", sub: "mobile-accessories", img: "p-phone-covers", mrp: 398, price: 249, validDays: 10 },
      { kind: "product", title: "Power Bank 10000 mAh", sub: "power-banks", img: "p-power-bank", mrp: 1299, price: 899 },
      { kind: "product", title: "Battery replacement (most models)", sub: "mobile-repair-service", img: "cat-mobile", mrp: 999, price: 799 },
    ],
  },
  {
    id: "shop-msb", prefix: "MSB", name: "Mauli Sweets & Bakery", owner: "Dattatray Pawar",
    cat: "cat-mithai", subs: ["mithai", "festive-boxes", "bakery"],
    area: "area-chinchwad", address: "Chapekar Chowk, Chinchwad Gaon", landmark: "Chapekar Chowk",
    hours: "Daily · 7 am–10:30 pm", tagline: "Shuddh ghee ki mithai, roz taazi",
    gst: true, google: true, status: "approved", plan: "pro", cover: "cat-mithai",
    followerBase: 2860, customers: 36, distributor: "dist-gd", ageDays: 150,
    offers: [
      { kind: "offer", title: "Kaju Katli ₹520/kg — Diwali rate continued", sub: "mithai", img: "p-kaju-katli", mrp: 640, price: 520, unit: "/kg", validDays: 5 },
      { kind: "offer", title: "Sunday Jalebi Special — 15% off", sub: "mithai", img: "p-jalebi", pct: 15, validDays: 4 },
      { kind: "product", title: "Motichoor Ladoo (500 g)", sub: "mithai", img: "p-ladoo-box", mrp: 320, price: 280 },
      { kind: "product", title: "Assorted Mithai Box (1 kg)", sub: "festive-boxes", img: "p-mithai-box", mrp: 650, price: 560 },
      { kind: "product", title: "Fresh Bread Loaf", sub: "bakery", img: "p-bread", mrp: 45, price: 40 },
    ],
  },
  {
    id: "shop-jmg", prefix: "JMG", name: "Jain Medical & General", owner: "Vikas Jain",
    cat: "cat-medical", subs: ["medicines", "wellness", "health-devices"],
    area: "area-akurdi", address: "Shop 2, Khandoba Chowk, Akurdi", landmark: "Khandoba Mandir ke paas",
    hours: "Daily · 8 am–11 pm", tagline: "Raat 11 baje tak khula",
    gst: true, google: false, status: "approved", plan: "free", cover: "cat-medical",
    followerBase: 910, customers: 26, distributor: "dist-gd", ageDays: 75,
    offers: [
      { kind: "offer", title: "Monthly medicines par flat 18% off (₹500+)", sub: "medicines", img: "cat-medical", pct: 18, validDays: 25 },
      { kind: "product", title: "Vitamin D3 + B12 strip combo", sub: "wellness", img: "p-medicine-strips", mrp: 290, price: 245 },
    ],
  },
  {
    id: "shop-she", prefix: "SHE", name: "Siddhivinayak Hardware & Electricals", owner: "Prakash Mhatre",
    cat: "cat-hardware", subs: ["lighting", "tools", "electrical-fittings"],
    area: "area-ravet", address: "Mukai Chowk, Ravet", landmark: "Mukai Chowk",
    hours: "Mon–Sat · 9 am–8:30 pm", tagline: "Electrician bhi milega, saaman bhi",
    gst: true, google: true, status: "approved", plan: "free", cover: "cat-hardware",
    followerBase: 420, customers: 14, distributor: "dist-gd", ageDays: 40,
    offers: [
      { kind: "offer", title: "9W LED bulb 3-pack — ₹299", sub: "lighting", img: "p-led-pack", mrp: 420, price: 299, validDays: 14 },
      { kind: "product", title: "Electrician Tool Kit (pliers + tester + screwdriver)", sub: "tools", img: "p-tool-kit", mrp: 699, price: 549 },
      { kind: "product", title: "Modular switch fitting (per point)", sub: "electrical-fittings", img: "cat-hardware", price: 149 },
    ],
  },
  {
    id: "shop-gse", prefix: "GSE", name: "Godavari Saree Emporium", owner: "Meena Deshpande",
    cat: "cat-saree", subs: ["paithani-silk", "cotton-sarees", "kurtis-sets"],
    area: "area-panchavati", address: "Ganga Ghat Road, Panchavati", landmark: "Ramkund ke paas",
    hours: "Daily · 10 am–9 pm", tagline: "Nashik ki Paithani parampara",
    gst: true, google: true, status: "approved", plan: "free", cover: "p-paithani",
    followerBase: 1340, customers: 28, distributor: "dist-st", ageDays: 110,
    offers: [
      { kind: "offer", title: "Paithani Utsav — up to 30% off", sub: "paithani-silk", img: "p-paithani", pct: 30, validDays: 11 },
      { kind: "product", title: "Cotton Saree — pack of 2", sub: "cotton-sarees", img: "p-cotton-saree", mrp: 1899, price: 1499 },
      { kind: "product", title: "Silk Dupatta", sub: "kurtis-sets", img: "p-kurti-set", mrp: 799, price: 599 },
    ],
  },
  {
    id: "shop-nmc", prefix: "NMC", name: "Nashik Mobile Care", owner: "Akash Wagh",
    cat: "cat-mobile", subs: ["screen-guards", "mobile-repair-service"],
    area: "area-college-road", address: "Shop 6, Thatte Nagar, College Road", landmark: "BYK College ke saamne",
    hours: "Mon–Sat · 10:30 am–9 pm", tagline: "Students ke liye special rate",
    gst: false, google: false, status: "pending", plan: "free", cover: "cat-mobile",
    followerBase: 210, customers: 10, distributor: "dist-st", ageDays: 6,
    offers: [
      { kind: "offer", title: "Free phone check-up + 10% off repair", sub: "mobile-repair-service", img: "cat-mobile", pct: 10, validDays: 18 },
      { kind: "product", title: "Tempered Glass (all models)", sub: "screen-guards", img: "p-tempered-glass", mrp: 299, price: 149 },
    ],
  },
  {
    id: "shop-glp", prefix: "GLP", name: "Glamour Ladies Parlour", owner: "Kavita Shinde",
    cat: "cat-salon", subs: ["facial-skin", "bridal-makeup", "threading-waxing"],
    area: "area-cidco", address: "Pawan Nagar, Cidco", landmark: "Pawan Nagar bus stop",
    hours: "Tue–Sun · 10 am–8 pm", tagline: "Bridal booking open — lagna season",
    gst: false, google: true, status: "approved", plan: "free", cover: "cat-salon",
    followerBase: 780, customers: 24, distributor: "dist-st", ageDays: 70,
    offers: [
      { kind: "offer", title: "Fruit Facial ₹499 (regular ₹799)", sub: "facial-skin", img: "p-facial-kit", mrp: 799, price: 499, validDays: 8 },
      { kind: "product", title: "Bridal Makeup Trial", sub: "bridal-makeup", img: "cat-salon", mrp: 2499, price: 1999 },
      { kind: "product", title: "Threading + Upper Lip", sub: "threading-waxing", img: "cat-salon", mrp: 80, price: 60 },
    ],
  },
  {
    id: "shop-mij", prefix: "MIJ", name: "Mahalaxmi Imitation Jewellers", owner: "Sunita Sonawane",
    cat: "cat-jewel", subs: ["earrings", "necklace-sets", "bangles"],
    area: "area-college-road", address: "Canada Corner, College Road", landmark: "Canada Corner",
    hours: "Daily · 11 am–9:30 pm", tagline: "Shaadi ka look, budget mein",
    gst: true, google: true, status: "approved", plan: "pro", cover: "cat-jewel",
    followerBase: 1960, customers: 32, distributor: "dist-st", ageDays: 95,
    offers: [
      { kind: "offer", title: "Kundan earring set — ₹449", sub: "earrings", img: "p-kundan-set", mrp: 699, price: 449, validDays: 10 },
      { kind: "offer", title: "Bridal bangle set — 25% off", sub: "bangles", img: "p-bangles", pct: 25, validDays: 16 },
      { kind: "product", title: "Kundan Necklace Set", sub: "necklace-sets", img: "cat-jewel", mrp: 1899, price: 1299 },
      { kind: "product", title: "Glass Bangles (1 dozen)", sub: "bangles", img: "p-bangles", mrp: 199, price: 149 },
    ],
  },
  {
    id: "shop-vsg", prefix: "VSG", name: "Vidya Stationery & Gifts", owner: "Nitin Bachhav",
    cat: "cat-stationery", subs: ["school-supplies", "notebooks", "gifts-wrapping"],
    area: "area-malegaon-camp", address: "Camp Road, near Sardar Chowk, Malegaon Camp", landmark: "Sardar Chowk",
    hours: "Mon–Sat · 9 am–9 pm", tagline: "School se office tak, sab kuch",
    gst: false, google: false, status: "approved", plan: "free", cover: "cat-stationery",
    followerBase: 260, customers: 12, distributor: "dist-na", ageDays: 30,
    offers: [
      { kind: "offer", title: "Back-to-School Kit — ₹349 (₹480)", sub: "school-supplies", img: "p-school-kit", mrp: 480, price: 349, validDays: 20 },
      { kind: "product", title: "Long Notebook — pack of 6", sub: "notebooks", img: "p-notebooks", mrp: 240, price: 199 },
      { kind: "product", title: "Gift wrapping + greeting card", sub: "gifts-wrapping", img: "cat-stationery", price: 50 },
    ],
  },
  {
    id: "shop-anr", prefix: "ANR", name: "Al-Noor Readymade", owner: "Shakeel Ansari",
    cat: "cat-saree", subs: ["mens-readymade", "kids-wear"],
    area: "area-malegaon-camp", address: "Mohammad Ali Road, Malegaon", landmark: "Kidwai Road naka",
    hours: "Daily · 10 am–10 pm", tagline: "Malegaon ka power-loom, seedha aapke liye",
    gst: false, google: false, status: "pending", plan: "free", cover: "p-mens-kurta",
    followerBase: 340, customers: 16, distributor: "dist-na", ageDays: 4,
    offers: [
      { kind: "offer", title: "Shaadi season kurta sale — 20% off", sub: "mens-readymade", img: "p-mens-kurta", pct: 20, validDays: 14 },
      { kind: "product", title: "Men's Pathani Suit", sub: "mens-readymade", img: "p-mens-kurta", mrp: 1799, price: 1399 },
    ],
  },
  {
    id: "shop-bfw", prefix: "BFW", name: "Bismillah Footwear", owner: "Arif Momin",
    cat: "cat-footwear", subs: ["kolhapuri-chappals", "kids-footwear"],
    area: "area-sangameshwar", address: "Sangameshwar Main Road, Malegaon", landmark: "Sangameshwar Mandir chowk",
    hours: "Daily · 10 am–9:30 pm", tagline: "Tikau chappal, sahi daam",
    gst: false, google: false, status: "pending", plan: "free", cover: "p-kolhapuri",
    followerBase: 150, customers: 9, distributor: "dist-na", ageDays: 3,
    offers: [
      { kind: "offer", title: "Leather chappal — sirf ₹399", sub: "kolhapuri-chappals", img: "p-kolhapuri", mrp: 549, price: 399, validDays: 21 },
      { kind: "product", title: "Kids Sandals (3–10 yrs)", sub: "kids-footwear", img: "cat-footwear", mrp: 399, price: 299 },
    ],
  },
  {
    id: "shop-skr", prefix: "SKR", name: "Saraf Kirana Stores", owner: "Ramesh Saraf",
    cat: "cat-kirana", subs: ["staples-grains", "masale", "kirana-combos"],
    area: "area-sangameshwar", address: "Satana Naka, Malegaon", landmark: "Satana Naka",
    hours: "Daily · 7 am–9:30 pm", tagline: "Wholesale rate par retail",
    gst: false, google: false, status: "approved", plan: "free", cover: "cat-kirana",
    followerBase: 380, customers: 14, distributor: "dist-na", ageDays: 25,
    offers: [
      { kind: "offer", title: "Chawal + Dal + Tel combo — ₹749", sub: "kirana-combos", img: "p-kirana-combo", mrp: 860, price: 749, validDays: 9 },
      { kind: "product", title: "Whole spices pack (250 g)", sub: "masale", img: "p-whole-spices", mrp: 210, price: 179 },
    ],
  },
];

const GSTIN: Record<string, string> = {
  "shop-lsc": "27AQLPP4821K1Z6",
  "shop-sgk": "27BKGPK7310M1Z2",
  "shop-pfb": "27CRAPP5521H1ZQ",
  "shop-osm": "27DIMPS9034A1Z8",
  "shop-msb": "27EDPPP2276B1Z1",
  "shop-jmg": "27FVJPJ6643C1Z4",
  "shop-she": "27GPMPM1189D1Z9",
  "shop-gse": "27HMDPD3307E1Z3",
  "shop-mij": "27JSSPS8812F1Z7",
};

const AREA_CODE: Record<string, string> = {
  "area-akurdi": "AKD", "area-nigdi": "NGD", "area-pimpri": "PMP", "area-chinchwad": "CWD", "area-ravet": "RVT",
  "area-college-road": "CLR", "area-panchavati": "PCV", "area-cidco": "CDC",
  "area-malegaon-camp": "MLC", "area-sangameshwar": "SGM",
};

/* ─────────────────────────── Names ─────────────────────────── */

const FIRST = [
  "Priya", "Snehal", "Aarti", "Rutuja", "Pooja", "Sayali", "Neha", "Vaishali", "Manisha", "Komal", "Ashwini", "Shraddha",
  "Rohit", "Amol", "Sachin", "Vishal", "Swapnil", "Nikhil", "Mahesh", "Kiran", "Tushar", "Sagar", "Yogesh", "Akshay",
  "Ayesha", "Farhan", "Sana", "Imran", "Zoya", "Salman", "Rukhsar", "Aamir",
  "Anjali", "Ritu", "Deepak", "Manoj", "Sunita", "Rekha",
];
const LAST = [
  "Patil", "Jadhav", "Pawar", "Shinde", "Kulkarni", "Deshmukh", "More", "Gaikwad", "Bhosale", "Chavan", "Kale", "Wagh",
  "Shaikh", "Ansari", "Momin", "Khan", "Sharma", "Gupta", "Joshi", "Sonawane", "Ahire", "Nikam", "Thakare", "Borse",
];
const PREFIXES = ["98", "97", "96", "95", "93", "90", "88", "87", "86", "80", "77", "70"];

/* ─────────────────────────── Builder ─────────────────────────── */

export interface SeedData {
  seededAt: string;
  categories: typeof SEED_CATEGORIES;
  subCategories: typeof SEED_SUBCATEGORIES;
  locations: typeof SEED_LOCATIONS;
  shops: Record<string, Shop>;
  shopOrder: string[];
  offers: Record<string, Offer>;
  reels: Record<string, Reel>;
  customers: Record<string, Customer>;
  agencyRequests: Record<string, AgencyRequest>;
  qrOrders: Record<string, QrOrder>;
  distributors: Distributor[];
  referralEntries: ReferralEntry[];
  activity: ActivityEvent[];
}

export function buildSeed(nowMs: number): SeedData {
  const rng = createRng(20261125);
  const iso = (offsetMs: number) => new Date(nowMs - offsetMs).toISOString();
  const future = (days: number) => new Date(nowMs + days * DAY).toISOString();
  const monthKey = currentMonthKey(new Date(nowMs));
  const areaById = Object.fromEntries(SEED_LOCATIONS.map((l) => [l.id, l]));

  const shops: Record<string, Shop> = {};
  const offers: Record<string, Offer> = {};
  const customers: Record<string, Customer> = {};
  const shopOrder: string[] = [];

  for (const s of SHOPS) {
    const area = areaById[s.area];
    const jitter = () => (rng.next() - 0.5) * 0.008;
    const shopOffers: Offer[] = s.offers.map((o, i) => {
      const id = `${s.id}-o${i + 1}`;
      const pct = o.pct ?? discountPct(o.mrp, o.price);
      return {
        id,
        shopId: s.id,
        kind: o.kind,
        title: o.title,
        description: o.desc,
        categoryId: s.cat,
        subCategoryId: `sub-${o.sub}`,
        mrp: o.mrp,
        price: o.price,
        discountPct: pct,
        unit: o.unit,
        imageKey: o.img,
        validTill: o.kind === "offer" ? future(o.validDays ?? 14) : undefined,
        status: "live",
        clicks: rng.int(o.kind === "offer" ? 40 : 6, o.kind === "offer" ? 220 : 60),
        createdAt: iso(rng.int(1, Math.min(s.ageDays, 20)) * DAY + rng.int(0, 20) * HOUR),
      };
    });
    shopOffers.forEach((o) => (offers[o.id] = o));

    // CRM customers (QR / follow opt-ins)
    const followerIds: string[] = [];
    for (let c = 0; c < s.customers; c++) {
      const id = `${s.id}-c${c + 1}`;
      const name = `${rng.pick(FIRST)} ${rng.pick(LAST)}`;
      const mobile = `${rng.pick(PREFIXES)}${String(rng.int(10000000, 99999999))}`;
      const source = rng.chance(0.62) ? "qr" : rng.chance(0.8) ? "follow" : "manual";
      customers[id] = {
        id,
        shopId: s.id,
        name,
        mobile,
        source,
        optInWhatsApp: source !== "manual" || rng.chance(0.5),
        passId: `${s.prefix}-${String(c + 1).padStart(4, "0")}`,
        passLang: rng.chance(0.55) ? "mr" : rng.chance(0.5) ? "hi" : "en",
        joinedAt: iso(rng.int(0, Math.min(s.ageDays, 60)) * DAY + rng.int(0, 23) * HOUR),
        tags: rng.chance(0.25) ? ["Regular"] : rng.chance(0.2) ? ["Wedding season"] : [],
      };
      if (source !== "manual") followerIds.push(id);
    }

    const views = Math.round(s.followerBase * (0.05 + rng.next() * 0.05));
    const isVerified = s.status === "approved" && (s.gst || s.google);
    shops[s.id] = {
      id: s.id,
      slug: slugify(`${s.name} ${area.name}`),
      qrCode: `${s.prefix}-${AREA_CODE[s.area]}-001`,
      name: s.name,
      ownerName: s.owner,
      phone: `9${String(rng.int(100000000, 999999999))}`,
      categoryId: s.cat,
      subCategoryIds: s.subs.map((x) => `sub-${x}`),
      areaId: s.area,
      address: s.address,
      landmark: s.landmark,
      geo: { lat: (area.lat ?? 0) + jitter(), lng: (area.lng ?? 0) + jitter() },
      hours: s.hours,
      tagline: s.tagline,
      verification: { gst: s.gst, gstin: GSTIN[s.id], google: s.google, status: s.status },
      isVerified,
      plan: s.plan,
      agencyCredits: { month: monthKey, used: s.plan === "pro" ? rng.int(0, 1) : 0 },
      coverImageKey: s.cover,
      followerIds,
      featuredItemIds: shopOffers.filter((o) => o.kind === "product").slice(0, 10).map((o) => o.id),
      referralCode: s.distributor,
      followerBase: s.followerBase,
      rating: Math.round((4.1 + rng.next() * 0.75) * 10) / 10,
      ratingCount: Math.round(s.followerBase * (0.06 + rng.next() * 0.08)),
      stats: {
        views7d: s.id === HERO_SHOP_ID ? 51 : views,
        offerClicks7d: rng.int(12, 90),
        qrScans7d: rng.int(4, 40),
      },
      createdAt: iso(s.ageDays * DAY),
    };
    shopOrder.push(s.id);
  }

  /* Reels — hero shop + Pro shops (DESIGN §5.6) */
  const reelSpecs: { shop: string; caption: string; frames: ImageKey[]; offer?: number; ageH: number }[] = [
    { shop: HERO_SHOP_ID, caption: "Lagna season ki Paithani collection aa gayi", frames: ["reel-paithani-owner", "reel-ugc-creator"], offer: 1, ageH: 30 },
    { shop: HERO_SHOP_ID, caption: "₹549 se kurtis — naya stock", frames: ["reel-ugc-creator", "reel-paithani-owner"], ageH: 96 },
    { shop: "shop-sgk", caption: "Mahine ka saaman, ek combo mein", frames: ["reel-kirana-festive"], offer: 1, ageH: 52 },
    { shop: "shop-sgk", caption: "Taaza pisa hua garam masala", frames: ["reel-kirana-festive"], ageH: 140 },
    { shop: "shop-osm", caption: "Screen guard fitting — 5 minute mein", frames: ["reel-mobile-unbox"], offer: 1, ageH: 20 },
    { shop: "shop-osm", caption: "Naye back covers — 2 sirf ₹249", frames: ["reel-mobile-unbox"], offer: 2, ageH: 110 },
    { shop: "shop-msb", caption: "Kaju katli ₹520/kg — aaj bhi", frames: ["reel-mithai-counter"], offer: 1, ageH: 12 },
    { shop: "shop-msb", caption: "Garma-garam Sunday jalebi", frames: ["reel-mithai-counter"], offer: 2, ageH: 75 },
    { shop: "shop-mij", caption: "Shaadi ke liye kundan sets", frames: ["reel-kundan-hands"], offer: 1, ageH: 44 },
    { shop: "shop-mij", caption: "Chudiyon ka naya rang", frames: ["reel-kundan-hands"], offer: 2, ageH: 160 },
  ];
  const reels: Record<string, Reel> = {};
  reelSpecs.forEach((r, i) => {
    const id = `reel-${i + 1}`;
    reels[id] = {
      id,
      shopId: r.shop,
      caption: r.caption,
      offerId: r.offer ? `${r.shop}-o${r.offer}` : undefined,
      frames: r.frames.map((imageKey) => ({ imageKey })),
      views: rng.int(180, 2600),
      createdAt: iso(r.ageH * HOUR),
    };
  });

  /* Agency requests across the Kanban */
  const agencySpecs: { shop: string; key: AgencyRequest["templateKey"]; status: AgencyStatus; ageH: number; goal: string }[] = [
    { shop: "shop-msb", key: "festival-poster", status: "delivered", ageH: 200, goal: "Diwali kaju katli rate ka poster" },
    { shop: "shop-osm", key: "ai-promo-reel", status: "in_review", ageH: 40, goal: "Screen guard offer ki reel" },
    { shop: "shop-sgk", key: "whatsapp-banner", status: "creator_assigned", ageH: 18, goal: "Monthly combo flash banner" },
    { shop: "shop-pfb", key: "google-review-card", status: "creator_assigned", ageH: 26, goal: "Counter par Google review card" },
    { shop: "shop-mij", key: "ugc-video", status: "new", ageH: 5, goal: "Bridal set par creator review" },
    { shop: "shop-gse", key: "shop-tour-reel", status: "new", ageH: 2, goal: "Paithani section ka shop tour" },
  ];
  const order: AgencyStatus[] = ["new", "creator_assigned", "in_review", "delivered"];
  const agencyRequests: Record<string, AgencyRequest> = {};
  agencySpecs.forEach((a, i) => {
    const id = `agr-${i + 1}`;
    const plan = shops[a.shop].plan;
    const list = TEMPLATE_BY_KEY[a.key].listPrice;
    const pricing =
      plan === "pro"
        ? { listPrice: list, charged: 0, paidWith: "credit" as const }
        : { listPrice: list, charged: list, paidWith: "addon" as const };
    const idx = order.indexOf(a.status);
    agencyRequests[id] = {
      id,
      shopId: a.shop,
      templateKey: a.key,
      brief: { goal: a.goal, language: "mr", offerId: `${a.shop}-o1` },
      pricing,
      status: a.status,
      creator: idx >= 1 ? LOCAL_CREATORS[i % LOCAL_CREATORS.length] : undefined,
      deliverable: a.status === "delivered" ? { caption: "Diwali special — Kaju Katli ₹520/kg", frames: ["reel-mithai-counter"] } : undefined,
      history: order.slice(0, idx + 1).map((st, k) => ({ status: st, at: iso((a.ageH - k * Math.max(1, a.ageH / 6)) * HOUR) })),
      createdAt: iso(a.ageH * HOUR),
    };
  });

  /* ₹49 QR standee orders */
  const qrSpecs: { shop: string; status: QrOrderStatus; ageH: number; lang: "en" | "hi" | "mr" }[] = [
    { shop: "shop-sgk", status: "delivered", ageH: 190, lang: "mr" },
    { shop: "shop-pfb", status: "dispatched", ageH: 70, lang: "mr" },
    { shop: "shop-glp", status: "printed", ageH: 30, lang: "hi" },
    { shop: "shop-jmg", status: "placed", ageH: 8, lang: "en" },
    { shop: "shop-gse", status: "placed", ageH: 3, lang: "mr" },
  ];
  const qrOrder: QrOrderStatus[] = ["placed", "printed", "dispatched", "delivered"];
  const qrOrders: Record<string, QrOrder> = {};
  qrSpecs.forEach((q, i) => {
    const id = `qro-${i + 1}`;
    const idx = qrOrder.indexOf(q.status);
    qrOrders[id] = {
      id,
      shopId: q.shop,
      design: { lang: q.lang, style: "classic", headline: "Scan karein, offers paayein" },
      amount: 49,
      address: `${shops[q.shop].address}, ${areaById[shops[q.shop].areaId].name}`,
      paymentMode: "cod_demo",
      status: q.status,
      trackingId: idx >= 2 ? `RBZ${String(482100 + i * 37)}` : undefined,
      history: qrOrder.slice(0, idx + 1).map((st, k) => ({ status: st, at: iso((q.ageH - k * 20) * HOUR) })),
      createdAt: iso(q.ageH * HOUR),
    };
  });

  /* Distributors & referral ledger */
  const distributors: Distributor[] = [
    { id: "dist-gd", name: "Ganesh Distributors", city: "Pimpri, Pune", code: "GD-PUN" },
    { id: "dist-st", name: "Sai Trade Links", city: "Nashik", code: "ST-NSK" },
    { id: "dist-na", name: "Noor Agencies", city: "Malegaon", code: "NA-MLG" },
  ];
  const referralEntries: ReferralEntry[] = [];
  const addRef = (shopId: string, event: ReferralEntry["event"], ageH: number) =>
    referralEntries.push({
      id: `ref-${referralEntries.length + 1}`,
      distributorId: shops[shopId].referralCode!,
      shopId,
      event,
      commission: REFERRAL_COMMISSION[event],
      at: iso(ageH * HOUR),
    });
  ["shop-lsc", "shop-pfb", "shop-jmg", "shop-she", "shop-gse", "shop-glp", "shop-nmc", "shop-anr", "shop-bfw"].forEach((id) =>
    addRef(id, "signup", (SHOPS.find((s) => s.id === id)!.ageDays) * 24),
  );
  ["shop-lsc", "shop-pfb", "shop-gse", "shop-glp"].forEach((id) =>
    addRef(id, "verified", (SHOPS.find((s) => s.id === id)!.ageDays - 2) * 24),
  );
  addRef("shop-osm", "pro_upgrade", 60 * 24);
  addRef("shop-mij", "pro_upgrade", 50 * 24);
  addRef("shop-pfb", "standee_order", 70);
  addRef("shop-gse", "standee_order", 3);

  /* Recent activity feed */
  const act = (ageMin: number, actor: ActivityEvent["actor"], type: ActivityEvent["type"], shopId: string | undefined, text: string): ActivityEvent => ({
    id: `act-seed-${ageMin}`,
    at: iso(ageMin * 60_000),
    actor,
    type,
    shopId,
    text,
  });
  const activity: ActivityEvent[] = [
    act(4, "buyer", "follow", "shop-lsc", "Priya Kulkarni ne Laxmi Saree Centre ko follow kiya (QR)"),
    act(22, "merchant", "agency_requested", "shop-gse", "Godavari Saree Emporium ne Shop Tour Reel request kiya"),
    act(48, "buyer", "qr_scan", "shop-msb", "Mauli Sweets ka QR standee scan hua"),
    act(95, "admin", "agency_moved", "shop-osm", "AI Promo Reel (Om Sai Mobile) → In Review"),
    act(180, "merchant", "qr_ordered", "shop-gse", "Godavari Saree Emporium ne ₹49 standee order kiya"),
    act(240, "merchant", "shop_created", "shop-bfw", "Bismillah Footwear ne Retobiz join kiya — verification pending"),
    act(300, "merchant", "agency_requested", "shop-mij", "Mahalaxmi Jewellers ne UGC Video request kiya"),
    act(420, "buyer", "follow", "shop-sgk", "Amol Jadhav ne Shree Ganesh Kirana ko follow kiya"),
  ];

  return {
    seededAt: new Date(nowMs).toISOString(),
    categories: SEED_CATEGORIES,
    subCategories: SEED_SUBCATEGORIES,
    locations: SEED_LOCATIONS,
    shops,
    shopOrder,
    offers,
    reels,
    customers,
    agencyRequests,
    qrOrders,
    distributors,
    referralEntries,
    activity,
  };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Fixed anchor for the server-rendered first paint (client re-seeds with Date.now()). */
export const SSR_SEED_ANCHOR = Date.parse("2026-11-25T10:00:00+05:30");
