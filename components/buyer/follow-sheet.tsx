"use client";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, MessageCircle, Store, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button, ButtonLink } from "@/components/ui/button";
import { useStore } from "@/store";
import type { Customer, CustomerSource, Lang, Shop } from "@/lib/types";
import { MOBILE_RE } from "@/lib/format";
import { spring } from "@/lib/motion";
import { VipPass } from "./vip-pass";

/**
 * Single QR / Follow opt-in (PLAN §4 A5): Name + Mobile + consent → spring morph
 * into the Digital VIP Member Pass (EN/HI/MR) with one restrained confetti burst.
 * Syncs live into the merchant CRM via followShop().
 */
export function FollowSheet({
  shop,
  open,
  onClose,
  source = "follow",
  offerTitle,
}: {
  shop: Shop | null;
  open: boolean;
  onClose: () => void;
  source?: CustomerSource;
  offerTitle?: string;
}) {
  const buyer = useStore((s) => s.buyer);
  const followShop = useStore((s) => s.followShop);
  const setPassLang = useStore((s) => s.setPassLang);
  const customers = useStore((s) => s.customers);
  const [name, setName] = useState(buyer?.name ?? "");
  const [mobile, setMobile] = useState(buyer?.mobile ?? "");
  const [consent, setConsent] = useState(true);
  const [touched, setTouched] = useState(false);
  const [passId, setPassId] = useState<string | null>(null);
  const [alreadyRes, setAlready] = useState(false);

  const nameOk = name.trim().length >= 2;
  const mobileOk = MOBILE_RE.test(mobile);
  const buyerPassIds = useStore((s) => s.buyerPassIds);
  // Repeat tap on an already-followed shop → reopen the existing pass, never the form.
  const existingId = shop ? buyerPassIds.find((id) => customers[id]?.shopId === shop.id) : undefined;
  const effectiveId = passId ?? existingId ?? null;
  const isRepeat = !passId && !!existingId;
  const already = alreadyRes || isRepeat;
  const customer: Customer | undefined = effectiveId ? customers[effectiveId] : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!shop || !nameOk || !mobileOk || !consent) return;
    const res = followShop(shop.id, { name, mobile, source });
    setAlready(res.alreadyMember);
    setPassId(res.customer.id);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={customer ? (already ? "Aap pehle se member hain" : "Ho gaya! Aap VIP member hain") : "Follow & WhatsApp pe Offers Paayein"}
      description={
        customer
          ? `${shop?.name} ke naye offers ab seedha aapke WhatsApp par aayenge.`
          : offerTitle
            ? `“${offerTitle}” claim karne ke liye ${shop?.name} ko follow karein.`
            : shop
              ? `${shop.name} ke naye offers aur stock seedha aapke WhatsApp par.`
              : undefined
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {!customer ? (
          <motion.form
            key="form"
            onSubmit={submit}
            className="flex flex-col gap-4 pt-1"
            noValidate
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={spring.default}
          >
            <Field label="Aapka naam" error={touched && !nameOk ? "Naam likhein" : undefined}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Jaise: Priya Kulkarni"
                className="h-12 w-full rounded-lg border border-hairline bg-surface px-3.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-300 focus:border-2 focus:border-indigo-500"
              />
            </Field>
            <Field label="WhatsApp number" error={touched && !mobileOk ? "10 digit ka sahi mobile number daalein" : undefined}>
              <div className="flex h-12 items-center rounded-lg border border-hairline bg-surface focus-within:border-2 focus-within:border-indigo-500">
                <span className="tabular border-r border-hairline px-3 text-[15px] font-semibold text-ink-700">+91</span>
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98XXXXXXXX"
                  className="tabular h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-ink-900 outline-none placeholder:text-ink-300"
                />
              </div>
            </Field>
            <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-[18px] text-ink-700">
              <button
                type="button"
                role="checkbox"
                aria-checked={consent}
                onClick={() => setConsent((c) => !c)}
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${consent ? "border-leaf-500 bg-leaf-500 text-white" : "border-hairline-strong bg-surface"}`}
              >
                {consent && <Check className="size-3.5" strokeWidth={3} />}
              </button>
              <span>
                Haan, mujhe {shop?.name ?? "is dukaan"} se WhatsApp par offers chahiye. Kabhi bhi <b>STOP</b> likh kar band kar sakte hain.
                {touched && !consent && <span className="mt-1 block font-semibold text-danger-600">Offers paane ke liye haan zaroori hai</span>}
              </span>
            </label>
            <Button type="submit" variant="whatsapp" size="lg" full icon={<MessageCircle className="size-5" strokeWidth={2} />}>
              Follow Karein · VIP Pass Paayein
            </Button>
            <p className="text-center text-[11.5px] text-ink-500">Free hai · Koi app download nahi · Number sirf is dukaan ke saath share hoga</p>
          </motion.form>
        ) : (
          <motion.div
            key="pass"
            initial={{ opacity: 0, scale: 0.9, y: 20, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            transition={{ ...spring.default, delay: 0.05 }}
            className="relative flex flex-col gap-4 pt-1"
          >
            {!already && <Confetti />}
            <VipPass customer={customer} shop={shop!} lang={customer.passLang} onLang={(l: Lang) => setPassLang(customer.id, l)} />
            <div className="grid grid-cols-2 gap-2.5">
              <ButtonLink href="/passes" variant="secondary" size="lg" icon={<Ticket className="size-4" />} onClick={onClose}>
                Mere Passes
              </ButtonLink>
              <ButtonLink href="/" variant="primary-flame" size="lg" icon={<Store className="size-4" />} onClick={onClose}>
                Aur dukaanein
              </ButtonLink>
            </div>
            <Link href="/passes" onClick={onClose} className="text-center text-[12px] font-semibold text-ink-500 underline-offset-2 hover:underline">
              Home screen par add karein — pass offline bhi dikhega
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

/** One restrained confetti burst (DESIGN §5.3: allowed once on VIP pass creation). */
function Confetti() {
  const reduce = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        x: (Math.sin(i * 12.9898) * 43758.5453) % 1,
        r: ((i * 47) % 360) - 180,
        c: ["#FF5A2C", "#FFC629", "#1FAA59", "#3B49C4", "#FF8AC8"][i % 5],
        d: 0.02 * (i % 8),
      })),
    [],
  );
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-4 z-10 h-0">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-0 left-1/2 h-2.5 w-1.5 rounded-[1px]"
          style={{ background: p.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x * 360, y: [0, -90 - (i % 5) * 18, 260], opacity: [1, 1, 0], rotate: p.r * 3 }}
          transition={{ duration: 1.3, delay: p.d, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink-900">{label}</span>
      {children}
      {error && <span className="text-[12px] font-medium text-danger-600">{error}</span>}
    </label>
  );
}
