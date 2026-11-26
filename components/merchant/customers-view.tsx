"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Download, Megaphone, Search, UserPlus } from "lucide-react";
import { useStore } from "@/store";
import { toast } from "@/store/ui";
import { Hydrated } from "@/components/shell/hydrated";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import { LiveFlash } from "@/components/ui/misc";
import { MOBILE_RE, maskMobile, timeAgo } from "@/lib/format";
import type { CustomerSource } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Card, Field, initials, inputCls, PageHead, PageSkeleton, useActiveShop } from "./common";

const SOURCES: { value: CustomerSource | "all"; label: string }[] = [
  { value: "all", label: "Sab" },
  { value: "qr", label: "QR scan" },
  { value: "follow", label: "Online follow" },
  { value: "manual", label: "Manual" },
];
const SOURCE_LABEL: Record<CustomerSource, string> = { qr: "QR scan", follow: "Follow", manual: "Manual" };

export function CustomersView() {
  return (
    <Hydrated fallback={<PageSkeleton />}>
      <Content />
    </Hydrated>
  );
}

function Content() {
  const router = useRouter();
  const { shop } = useActiveShop();
  const customers = useStore((s) => s.customers);
  const [q, setQ] = useState("");
  const [src, setSrc] = useState<CustomerSource | "all">("all");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const all = useMemo(
    () =>
      Object.values(customers)
        .filter((c) => c.shopId === shop?.id)
        .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt)),
    [customers, shop?.id],
  );
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((c) => (src === "all" || c.source === src) && (!needle || c.name.toLowerCase().includes(needle) || c.mobile.includes(needle)));
  }, [all, q, src]);

  if (!shop) return <PageSkeleton />;
  const allSel = list.length > 0 && list.every((c) => sel.has(c.id));
  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const exportCsv = () => {
    const rows = (sel.size ? list.filter((c) => sel.has(c.id)) : list).map((c) => [c.name, `+91${c.mobile}`, SOURCE_LABEL[c.source], c.passId, c.optInWhatsApp ? "yes" : "no", c.joinedAt.slice(0, 10)]);
    const csv = [["Name", "Mobile", "Source", "Pass ID", "WhatsApp opt-in", "Joined"], ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${shop.slug}-customers.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ message: `${rows.length} customers CSV mein export hue`, tone: "success" });
  };

  return (
    <div>
      <PageHead
        eyebrow="Customers (CRM)"
        title={
          <>
            <LiveFlash watch={all.length}>
              <span className="tabular">{all.length}</span>
            </LiveFlash>{" "}
            WhatsApp customers
          </>
        }
        sub="Har QR scan aur follow yahan aata hai — inhe seedha offers bhejiye."
        action={
          <>
            <Button variant="secondary" icon={<UserPlus className="size-4" />} onClick={() => setAdding(true)}>
              Add
            </Button>
            <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportCsv}>
              CSV
            </Button>
            <Button
              variant="whatsapp"
              icon={<Megaphone className="size-4" />}
              onClick={() => router.push(sel.size ? `/merchant/broadcast?to=${[...sel].join(",")}` : "/merchant/broadcast")}
            >
              {sel.size ? `${sel.size} ko message` : "Broadcast"}
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1 lg:max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-300" />
          <input className={cn(inputCls, "pl-9")} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Naam ya number se dhoondhein" />
        </label>
        <div className="flex gap-2 overflow-x-auto">
          {SOURCES.map((s) => (
            <FilterChip key={s.value} selected={src === s.value} onClick={() => setSrc(s.value)}>
              {s.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-hairline bg-canvas px-4 py-2.5 text-[12px] font-bold tracking-[0.04em] text-ink-500 uppercase">
          <input
            type="checkbox"
            aria-label="Sab select karein"
            checked={allSel}
            onChange={() => setSel(allSel ? new Set() : new Set(list.map((c) => c.id)))}
            className="size-4 accent-indigo-600"
          />
          <span className="flex-1">{sel.size ? `${sel.size} selected` : `${list.length} customers`}</span>
          <span className="hidden w-28 lg:block">Source</span>
          <span className="w-16 text-right">Joined</span>
        </div>
        <ul className="divide-y divide-hairline" data-testid="crm-list">
          {list.map((c) => (
            <li key={c.id} className={cn("flex items-center gap-3 px-4 py-3", sel.has(c.id) && "bg-indigo-50/60")}>
              <input type="checkbox" aria-label={`Select ${c.name}`} checked={sel.has(c.id)} onChange={() => toggle(c.id)} className="size-4 accent-indigo-600" />
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-[13px] font-bold text-leaf-700">{initials(c.name)}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-ink-900">{c.name}</div>
                <div className="tabular text-[12px] text-ink-500">
                  {maskMobile(c.mobile)} <span className="lg:hidden">· {SOURCE_LABEL[c.source]}</span>
                  <span className="hidden lg:inline">· {c.passId}</span>
                </div>
              </div>
              <span className="hidden w-28 lg:block">
                <span className={cn("rounded-full px-2 py-0.5 text-[12px] font-semibold", c.source === "qr" ? "bg-saffron-50 text-saffron-700" : c.source === "follow" ? "bg-leaf-50 text-leaf-700" : "bg-sunk text-ink-700")}>
                  {SOURCE_LABEL[c.source]}
                </span>
              </span>
              <span className="w-20 shrink-0 text-right text-[12px] leading-4 text-ink-500">{timeAgo(c.joinedAt)}</span>
            </li>
          ))}
          {list.length === 0 && <li className="px-4 py-8 text-center text-[14px] text-ink-500">Koi customer nahi mila.</li>}
        </ul>
      </Card>

      <AddCustomerSheet open={adding} onClose={() => setAdding(false)} shopId={shop.id} />
    </div>
  );
}

function AddCustomerSheet({ open, onClose, shopId }: { open: boolean; onClose: () => void; shopId: string }) {
  const add = useStore((s) => s.addCustomer);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const ok = name.trim().length >= 2 && MOBILE_RE.test(mobile);
  return (
    <Sheet open={open} onClose={onClose} title="Customer add karein" description="Counter par aaye regular customers ko bhi list mein jodiye.">
      <div className="flex flex-col gap-4">
        <Field label="Naam">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jaise: Sunita Pawar" />
        </Field>
        <Field label="WhatsApp number">
          <input className={inputCls} inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} placeholder="98XXXXXXXX" />
        </Field>
        <Button
          variant="primary-indigo"
          size="lg"
          full
          disabled={!ok}
          onClick={() => {
            add(shopId, { name: name.trim(), mobile });
            toast({ message: `${name.trim()} add ho gaye`, tone: "success" });
            setName("");
            setMobile("");
            onClose();
          }}
        >
          Add karein
        </Button>
      </div>
    </Sheet>
  );
}
