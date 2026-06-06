import { initials as toInitials } from "@/lib/format";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ----------------------------- Botones ----------------------------- */
type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-emerald-500 text-felt-950 hover:bg-emerald-400 active:bg-emerald-600 font-semibold shadow-lg shadow-emerald-900/40",
  secondary:
    "bg-white/10 text-white hover:bg-white/15 active:bg-white/20 border border-white/10",
  ghost: "text-zinc-300 hover:bg-white/10 active:bg-white/15",
  danger:
    "bg-rose-500/90 text-white hover:bg-rose-500 active:bg-rose-600 font-semibold",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg gap-1.5",
  md: "h-11 px-4 text-[15px] rounded-xl gap-2",
  lg: "h-13 px-5 text-base rounded-2xl gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return cn(
    "inline-flex items-center justify-center transition-colors select-none disabled:opacity-50 disabled:pointer-events-none",
    variantClasses[variant],
    sizeClasses[size],
  );
}

/* ----------------------------- Inputs ------------------------------ */
export const inputClass =
  "w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-[15px] text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20";

export const labelClass = "block text-sm font-medium text-zinc-300 mb-1.5";

/* ----------------------------- Tarjetas ---------------------------- */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------ Badge ------------------------------ */
export function Badge({
  children,
  color = "zinc",
}: {
  children: React.ReactNode;
  color?: "zinc" | "emerald" | "amber" | "rose";
}) {
  const colors = {
    zinc: "bg-white/10 text-zinc-300",
    emerald: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
    rose: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[color],
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------ Avatar ----------------------------- */
export function Avatar({
  name,
  src,
  size = 40,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover ring-1 ring-white/15"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/80 to-emerald-700 font-semibold text-felt-950 ring-1 ring-white/15"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {toInitials(name)}
    </div>
  );
}

/* --------------------------- Encabezado ---------------------------- */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* --------------------------- Estado vacío -------------------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-4xl">{icon}</div>}
      <p className="font-semibold text-white">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-zinc-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------ Stat ------------------------------- */
export function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className={cn("mt-0.5 text-lg font-bold tabular-nums", valueClassName)}>
        {value}
      </div>
    </div>
  );
}
