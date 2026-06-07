"use client";

import { useState } from "react";
import { Share2, Check, Loader2 } from "lucide-react";
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
  const [state, setState] = useState<"idle" | "working" | "done">("idle");

  async function onShare() {
    setState("working");
    try {
      const blob = await renderCard({
        gameName,
        dateText,
        currency,
        pot,
        standings,
        payments,
      });
      const file = new File([blob], "resultado-poker.png", {
        type: "image/png",
      });

      const canShareFiles =
        typeof navigator !== "undefined" &&
        !!navigator.canShare &&
        navigator.canShare({ files: [file] });

      if (canShareFiles) {
        await navigator.share({ files: [file], title: gameName });
      } else {
        // Sin compartir con archivos (p. ej. ordenador): descarga la imagen.
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "resultado-poker.png";
        a.click();
        URL.revokeObjectURL(url);
        setState("done");
        setTimeout(() => setState("idle"), 1800);
        return;
      }
    } catch {
      /* cancelado o error */
    }
    setState("idle");
  }

  return (
    <button
      onClick={onShare}
      disabled={state === "working"}
      className={`${buttonClass("primary")} ${className ?? ""}`}
    >
      {state === "working" ? (
        <Loader2 size={16} className="animate-spin" />
      ) : state === "done" ? (
        <Check size={16} />
      ) : (
        <Share2 size={16} />
      )}
      {state === "working"
        ? "Generando…"
        : state === "done"
          ? "Descargada"
          : "Compartir resultado"}
    </button>
  );
}

/* ------------------- Dibujo de la tarjeta (canvas) ------------------ */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncate(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

async function renderCard({
  gameName,
  dateText,
  currency,
  pot,
  standings,
  payments,
}: {
  gameName: string;
  dateText: string;
  currency: string;
  pot: number;
  standings: Standing[];
  payments: Payment[];
}): Promise<Blob> {
  const W = 1080;
  const PAD = 72;
  const rowH = 86;
  const payRowH = 56;
  const sans =
    "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const headerH = 360;
  const ranksH = standings.length * rowH;
  const paysBlockH =
    payments.length > 0 ? 84 + payments.length * payRowH : 96;
  const footerH = 96;
  const H = Math.round(headerH + ranksH + 48 + paysBlockH + footerH);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");

  // Fondo tapete
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0c4a37");
  bg.addColorStop(1, "#06190f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 60, 60, W / 2, 60, W);
  glow.addColorStop(0, "rgba(16,185,129,0.22)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Marca
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#6ee7b7";
  ctx.font = `700 30px ${sans}`;
  ctx.fillText("♠ POKER HOME TRACKER", PAD, 96);

  // Título
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 64px ${sans}`;
  ctx.fillText(truncate(ctx, gameName, W - PAD * 2), PAD, 176);

  // Fecha
  if (dateText) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `500 30px ${sans}`;
    ctx.fillText(dateText, PAD, 222);
  }

  // Bote (caja)
  const boxY = 258;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, PAD, boxY, W - PAD * 2, 76, 18);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `600 28px ${sans}`;
  ctx.fillText("BOTE", PAD + 28, boxY + 48);
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 40px ${sans}`;
  ctx.textAlign = "right";
  ctx.fillText(formatMoney(pot, currency), W - PAD - 28, boxY + 50);
  ctx.textAlign = "left";

  // Ranking
  const medals = ["🥇", "🥈", "🥉"];
  let y = headerH;
  standings.forEach((s, i) => {
    const winner = i === 0 && s.balance > 0.001;
    ctx.fillStyle = winner ? "rgba(251,191,36,0.14)" : "rgba(255,255,255,0.05)";
    roundRect(ctx, PAD, y, W - PAD * 2, rowH - 14, 16);
    ctx.fill();

    const cy = y + (rowH - 14) / 2;
    ctx.textBaseline = "middle";
    // posición
    ctx.font = `700 38px ${sans}`;
    ctx.fillStyle = "#ffffff";
    if (i < 3) {
      ctx.fillText(medals[i], PAD + 24, cy + 2);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(String(i + 1), PAD + 34, cy);
    }
    // nombre
    ctx.fillStyle = winner ? "#fcd34d" : "#ffffff";
    ctx.font = `700 38px ${sans}`;
    ctx.fillText(truncate(ctx, s.name, W - PAD * 2 - 360), PAD + 104, cy);
    // importe
    ctx.fillStyle =
      s.balance > 0.001
        ? "#34d399"
        : s.balance < -0.001
          ? "#f87171"
          : "rgba(255,255,255,0.6)";
    ctx.font = `800 40px ${sans}`;
    ctx.textAlign = "right";
    ctx.fillText(formatSignedMoney(s.balance, currency), W - PAD - 28, cy);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    y += rowH;
  });

  // Pagos
  y += 24;
  ctx.fillStyle = "#6ee7b7";
  ctx.font = `700 30px ${sans}`;
  ctx.fillText(payments.length > 0 ? "PAGOS" : "", PAD, y + 28);
  if (payments.length === 0) {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = `600 32px ${sans}`;
    ctx.fillText("Todo cuadrado, nadie debe nada 🎉", PAD, y + 30);
    y += 60;
  } else {
    y += 64;
    ctx.textBaseline = "middle";
    payments.forEach((p) => {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = `500 32px ${sans}`;
      const left = truncate(
        ctx,
        `${p.from}  →  ${p.to}`,
        W - PAD * 2 - 240,
      );
      ctx.fillText(left, PAD, y + payRowH / 2);
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 34px ${sans}`;
      ctx.textAlign = "right";
      ctx.fillText(formatMoney(p.amount, currency), W - PAD, y + payRowH / 2);
      ctx.textAlign = "left";
      y += payRowH;
    });
    ctx.textBaseline = "alphabetic";
  }

  // Pie
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = `500 26px ${sans}`;
  ctx.fillText("Generado con Poker Home Tracker", PAD, H - 44);

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
    ),
  );
}
