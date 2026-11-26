import type { Lang } from "@/lib/types";

/** VIP pass + standee copy (DESIGN §8 — full EN/HI/MR only inside pass & standee). */
export const PASS_COPY: Record<
  Lang,
  { title: string; memberOf: (shop: string) => string; member: string; since: string; perks: string; show: string; label: string }
> = {
  en: {
    title: "VIP Member Pass",
    memberOf: (shop) => `You're now a VIP member of ${shop}`,
    member: "Member",
    since: "Member since",
    perks: "Offers & new stock straight to your WhatsApp",
    show: "Show this pass at the counter",
    label: "English",
  },
  hi: {
    title: "वीआईपी मेंबर पास",
    memberOf: (shop) => `अब आप ${shop} के वीआईपी मेंबर हैं`,
    member: "मेंबर",
    since: "मेंबर बने",
    perks: "ऑफ़र और नया स्टॉक सीधे आपके WhatsApp पर",
    show: "काउंटर पर यह पास दिखाएँ",
    label: "हिंदी",
  },
  mr: {
    title: "व्हीआयपी मेंबर पास",
    memberOf: (shop) => `तुम्ही आता ${shop} चे व्हीआयपी मेंबर आहात`,
    member: "मेंबर",
    since: "मेंबर झाले",
    perks: "ऑफर्स आणि नवीन स्टॉक थेट तुमच्या WhatsApp वर",
    show: "काउंटरवर हा पास दाखवा",
    label: "मराठी",
  },
};

export const LANGS: Lang[] = ["en", "hi", "mr"];
