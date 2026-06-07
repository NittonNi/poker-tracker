"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Check, Send, ChevronDown } from "lucide-react";
import { Card, cn } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { setSettlementPaid } from "@/app/actions/settlements";

export type DebtItem = {
  settlementId: string;
  gameId: string;
  dir: "in" | "out"; // in = me deben, out = yo debo
  name: string;
  groupName: string;
  amount: number;
};

export function PendingDebts({ items }: { items: DebtItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (items.length === 0) return null;

  const owedToMe = items
    .filter((d) => d.dir === "in")
    .reduce((s, d) => s + d.amount, 0);
  const iOwe = items
    .filter((d) => d.dir === "out")
    .reduce((s, d) => s + d.amount, 0);

  function markPaid(d: DebtItem) {
    startTransition(async () => {
      await setSettlementPaid(d.settlementId, d.gameId, true);
      router.refresh();
    });
  }

  async function remind(d: DebtItem) {
    const text =
      d.dir === "in"
        ? `Ey 🃏 me debes ${formatMoney(d.amount)} de "${d.groupName}". ¿Me lo pasas?`
        : `Te debo ${formatMoney(d.amount)} de "${d.groupName}", ¿te lo paso? 🃏`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        /* cancelado */
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        /* nada */
      }
    }
  }

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50"
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs text-neutral-500">Te deben</div>
            <div className="text-lg font-bold tabular-nums text-emerald-600">
              {formatMoney(owedToMe)}
            </div>
          </div>
          <div className="h-8 w-px bg-neutral-200" />
          <div>
            <div className="text-xs text-neutral-500">Debes</div>
            <div className="text-lg font-bold tabular-nums text-red-600">
              {formatMoney(iOwe)}
            </div>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-neutral-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="divide-y divide-neutral-100 border-t border-neutral-100">
          {items.map((d) => (
            <div key={d.settlementId} className="flex items-center gap-3 px-4 py-2.5">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  d.dir === "in"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700",
                )}
              >
                {d.dir === "in" ? (
                  <ArrowDownLeft size={15} />
                ) : (
                  <ArrowUpRight size={15} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-neutral-900">
                  {d.dir === "in" ? (
                    <>
                      <span className="font-semibold">{d.name}</span> te debe
                    </>
                  ) : (
                    <>
                      Debes a <span className="font-semibold">{d.name}</span>
                    </>
                  )}
                </div>
                <div className="truncate text-xs text-neutral-400">
                  {d.groupName}
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-bold tabular-nums",
                  d.dir === "in" ? "text-emerald-600" : "text-red-600",
                )}
              >
                {formatMoney(d.amount)}
              </span>
              <button
                onClick={() => remind(d)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Recordar"
                title="Recordar por mensaje"
              >
                <Send size={15} />
              </button>
              <button
                onClick={() => markPaid(d)}
                disabled={pending}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                aria-label="Marcar saldada"
                title="Marcar como saldada"
              >
                <Check size={16} />
              </button>
            </div>
          ))}
          <p className="px-4 py-2 text-xs text-neutral-400">
            Toca ✓ cuando esté pagada, o el avión para recordar por mensaje.
          </p>
        </div>
      )}
    </Card>
  );
}
