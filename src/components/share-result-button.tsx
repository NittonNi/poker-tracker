"use client";

import { useState } from "react";
import { Share2, Check, Loader2 } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { formatMoney, formatSignedMoney, initials } from "@/lib/format";

type Standing = { name: string; balance: number };
type Payment = { from: string; to: string; amount: number };

const SANS =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const C = {
  bg: "#ffffff",
  ink: "#0a0a0a",
  sub: "#525252",
  muted: "#a3a3a3",
  border: "#e5e5e5",
  surface: "#fafafa",
  pos: "#059669",
  neg: "#dc2626",
  gold: "#fbbf24",
  goldBg: "#fffbeb",
  goldBorder: "#fcd34d",
};

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

/* ------------------------- Dibujo (canvas) -------------------------- */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

function amountColor(v: number) {
  return v > 0.001 ? C.pos : v < -0.001 ? C.neg : C.muted;
}

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  name: string,
  gold: boolean,
) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = gold ? C.gold : C.ink;
  ctx.fill();
  ctx.fillStyle = gold ? C.ink : "#ffffff";
  ctx.font = `700 ${Math.round(r * 0.8)}px ${SANS}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials(name), cx, cy + 2);
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
  const PAD = 64;
  const podium = standings.slice(0, 3);
  const rest = standings.slice(3);

  // --- altura dinámica ---
  const baseline = 900;
  const boteTop = baseline + 40;
  const boteH = 120;
  let y = boteTop + boteH + 44;
  const restH = rest.length > 0 ? 52 + rest.length * 54 : 0;
  const paysH = payments.length > 0 ? 52 + payments.length * 54 : 56;
  const H = Math.round(y + restH + paysH + 96);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");

  // fondo
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // --- cabecera: chip + wordmark ---
  ctx.fillStyle = C.ink;
  roundRect(ctx, PAD, 52, 64, 64, 18);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 38px ${SANS}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("♠", PAD + 32, 86);
  ctx.textAlign = "left";
  ctx.fillStyle = C.sub;
  ctx.font = `700 28px ${SANS}`;
  ctx.fillText("Poker Home Tracker", PAD + 84, 86);

  // título + fecha
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.ink;
  ctx.font = `800 60px ${SANS}`;
  ctx.fillText(truncate(ctx, gameName, W - PAD * 2), PAD, 200);
  if (dateText) {
    ctx.fillStyle = C.muted;
    ctx.font = `500 30px ${SANS}`;
    ctx.fillText(dateText, PAD, 246);
  }

  // --- podio ---
  // columnas: izquierda (2º), centro (1º), derecha (3º)
  const colW = 300;
  const gap = 18;
  const startX = (W - (colW * 3 + gap * 2)) / 2;
  const centerX = [
    startX + colW + gap + colW / 2, // centro (1º)
    startX + colW / 2, // izquierda (2º)
    startX + colW * 2 + gap * 2 + colW / 2, // derecha (3º)
  ];
  const pedH = [300, 215, 165]; // 1º, 2º, 3º
  const medals = ["🥇", "🥈", "🥉"];

  podium.forEach((s, i) => {
    const cx = centerX[i];
    const h = pedH[i];
    const top = baseline - h;
    const gold = i === 0;
    const half = colW / 2 - 6;

    // pedestal
    ctx.fillStyle = gold ? C.goldBg : C.surface;
    roundRect(ctx, cx - half, top, half * 2, h, 22);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = gold ? C.goldBorder : C.border;
    roundRect(ctx, cx - half, top, half * 2, h, 22);
    ctx.stroke();

    // avatar por encima del pedestal
    const r = gold ? 76 : 60;
    const avY = top - r - 16;
    drawAvatar(ctx, cx, avY, r, s.name, gold);

    // medalla (badge) sobre el avatar
    ctx.font = `${gold ? 56 : 46}px ${SANS}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(medals[i], cx + r * 0.72, avY - r * 0.62);

    // nombre (dentro del pedestal, arriba)
    ctx.fillStyle = C.ink;
    ctx.font = `700 ${gold ? 36 : 30}px ${SANS}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(truncate(ctx, s.name, half * 2 - 24), cx, top + (gold ? 64 : 56));

    // premio / resultado (centrado en el pedestal)
    ctx.fillStyle = amountColor(s.balance);
    ctx.font = `800 ${gold ? 48 : 38}px ${SANS}`;
    ctx.fillText(
      formatSignedMoney(s.balance, currency),
      cx,
      top + (gold ? 150 : 124),
    );
  });

  // --- caja del bote ---
  ctx.fillStyle = C.surface;
  roundRect(ctx, PAD, boteTop, W - PAD * 2, boteH, 24);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = C.border;
  roundRect(ctx, PAD, boteTop, W - PAD * 2, boteH, 24);
  ctx.stroke();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = C.sub;
  ctx.font = `600 30px ${SANS}`;
  ctx.fillText("BOTE TOTAL", PAD + 36, boteTop + boteH / 2);
  ctx.textAlign = "right";
  ctx.fillStyle = C.ink;
  ctx.font = `800 52px ${SANS}`;
  ctx.fillText(formatMoney(pot, currency), W - PAD - 36, boteTop + boteH / 2 + 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // --- resto del ranking ---
  let yy = boteTop + boteH + 44;
  if (rest.length > 0) {
    ctx.fillStyle = C.muted;
    ctx.font = `700 24px ${SANS}`;
    ctx.fillText("CLASIFICACIÓN", PAD, yy + 8);
    yy += 52;
    ctx.textBaseline = "middle";
    rest.forEach((s, i) => {
      ctx.fillStyle = C.sub;
      ctx.font = `700 30px ${SANS}`;
      ctx.fillText(`${i + 4}.`, PAD, yy + 27);
      ctx.fillStyle = C.ink;
      ctx.font = `600 32px ${SANS}`;
      ctx.fillText(truncate(ctx, s.name, W - PAD * 2 - 320), PAD + 64, yy + 27);
      ctx.fillStyle = amountColor(s.balance);
      ctx.font = `700 34px ${SANS}`;
      ctx.textAlign = "right";
      ctx.fillText(formatSignedMoney(s.balance, currency), W - PAD, yy + 27);
      ctx.textAlign = "left";
      yy += 54;
    });
    ctx.textBaseline = "alphabetic";
  }

  // --- pagos ---
  if (payments.length > 0) {
    ctx.fillStyle = C.muted;
    ctx.font = `700 24px ${SANS}`;
    ctx.fillText("PAGOS", PAD, yy + 8);
    yy += 52;
    ctx.textBaseline = "middle";
    payments.forEach((p) => {
      ctx.fillStyle = C.ink;
      ctx.font = `500 30px ${SANS}`;
      ctx.fillText(
        truncate(ctx, `${p.from}  →  ${p.to}`, W - PAD * 2 - 240),
        PAD,
        yy + 27,
      );
      ctx.font = `700 32px ${SANS}`;
      ctx.textAlign = "right";
      ctx.fillText(formatMoney(p.amount, currency), W - PAD, yy + 27);
      ctx.textAlign = "left";
      yy += 54;
    });
    ctx.textBaseline = "alphabetic";
  } else {
    ctx.fillStyle = C.pos;
    ctx.font = `600 30px ${SANS}`;
    ctx.fillText("Todo cuadrado, nadie debe nada 🎉", PAD, yy + 30);
  }

  // pie
  ctx.fillStyle = C.muted;
  ctx.font = `500 24px ${SANS}`;
  ctx.fillText("Generado con Poker Home Tracker", PAD, H - 40);

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
    ),
  );
}
