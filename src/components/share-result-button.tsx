"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { formatMoney, formatSignedMoney } from "@/lib/format";

type Standing = { name: string; balance: number };
type Payment = { from: string; to: string; amount: number };

export function ShareResultButton({
  gameName,
  dateText,
  currency,
  pot,
  standings,
  payments,
  className,
}: {
  gameName: string;
  dateText: string;
  currency: string;
  pot: number;
  standings: Standing[];
  payments: Payment[];
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function buildText() {
    const lines: string[] = [];
    lines.push(`🃏 ${gameName}${dateText ? ` · ${dateText}` : ""}`);
    lines.push(`Bote: ${formatMoney(pot, currency)}`);
    lines.push("");
    lines.push("Resultados:");
    for (const s of standings) {
      const icon = s.balance > 0.001 ? "🟢" : s.balance < -0.001 ? "🔴" : "⚪";
      lines.push(`${icon} ${s.name}: ${formatSignedMoney(s.balance, currency)}`);
    }
    if (payments.length > 0) {
      lines.push("");
      lines.push("Pagos:");
      for (const p of payments) {
        lines.push(`• ${p.from} → ${p.to}: ${formatMoney(p.amount, currency)}`);
      }
    } else {
      lines.push("");
      lines.push("Todo cuadrado, nadie debe nada 🎉");
    }
    return lines.join("\n");
  }

  async function share() {
    const text = buildText();
    if (navigator.share) {
      try {
        await navigator.share({ title: gameName, text });
      } catch {
        /* cancelado */
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {
        /* nada */
      }
    }
  }

  return (
    <button onClick={share} className={`${buttonClass("primary")} ${className ?? ""}`}>
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Copiado" : "Compartir resultado"}
    </button>
  );
}
