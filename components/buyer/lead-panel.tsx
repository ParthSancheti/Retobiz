"use client";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import type { Shop } from "@/lib/types";
import { useStore } from "@/store";
import { toast } from "@/store/ui";
import { MOBILE_RE } from "@/lib/format";
import { Button } from "@/components/ui/button";

/** Justdial-style "Get the list of top X" capture → opts into the top 3 matching shops at once. */
export function LeadPanel({ title, shops }: { title: string; shops: Shop[] }) {
  const buyer = useStore((s) => s.buyer);
  const followShop = useStore((s) => s.followShop);
  const [name, setName] = useState(buyer?.name ?? "");
  const [mobile, setMobile] = useState(buyer?.mobile ?? "");
  const [err, setErr] = useState("");
  const top = shops.slice(0, 3);
  if (top.length === 0) return null;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || !MOBILE_RE.test(mobile)) return setErr("Naam aur 10-digit WhatsApp number daalein");
    setErr("");
    top.forEach((s) => followShop(s.id, { name, mobile, source: "follow" }));
    toast({ message: `${top.length} dukaanon ki list + offers WhatsApp par aa rahe hain`, tone: "success", action: { label: "Passes", href: "/passes" } });
  };
  return (
    <form onSubmit={submit} className="mt-4 rounded-2xl bg-[linear-gradient(160deg,#EAF8EF,#CFF0DB)] p-4">
      <div className="text-[15px] leading-5 font-extrabold text-ink-900">{title}</div>
      <p className="mt-1 text-[12px] text-ink-700">Top {top.length} dukaanon ke number + aaj ke offers, seedha WhatsApp par. Free.</p>
      <ul className="mt-2 space-y-0.5 text-[12px] font-semibold text-leaf-700">
        {top.map((s) => (
          <li key={s.id} className="truncate">✓ {s.name}</li>
        ))}
      </ul>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aapka naam" className="mt-3 h-10 w-full rounded-lg border border-leaf-500/30 bg-white px-3 text-[14px] outline-none focus:border-leaf-600" />
      <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="WhatsApp number" className="tabular mt-2 h-10 w-full rounded-lg border border-leaf-500/30 bg-white px-3 text-[14px] outline-none focus:border-leaf-600" />
      {err && <p className="mt-1.5 text-[11.5px] font-semibold text-danger-600">{err}</p>}
      <Button type="submit" variant="whatsapp" size="md" full className="mt-3" icon={<MessageCircle className="size-4" />}>
        List WhatsApp par bhejo
      </Button>
    </form>
  );
}
