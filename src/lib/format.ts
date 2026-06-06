/** Utilidades de formato en español (es-ES). */

const moneyFmt = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const intFmt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

/** Formatea un importe de dinero, ej. "12,50 €". */
export function formatMoney(n: number, currency = "€"): string {
  return `${moneyFmt.format(n ?? 0)} ${currency}`;
}

/** Igual que formatMoney pero con signo explícito (+/−) para balances. */
export function formatSignedMoney(n: number, currency = "€"): string {
  const v = n ?? 0;
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${moneyFmt.format(Math.abs(v))} ${currency}`;
}

/** Formatea puntos/fichas, ej. "1.500". */
export function formatPoints(n: number): string {
  return intFmt.format(n ?? 0);
}

/** Formatea una fecha ISO (yyyy-mm-dd o timestamp) en formato es-ES. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Color de tailwind según el signo de un balance. */
export function balanceColor(n: number): string {
  if (n > 0.001) return "text-emerald-400";
  if (n < -0.001) return "text-rose-400";
  return "text-zinc-400";
}

/** Iniciales para el avatar a partir de un nombre. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}
