import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { initials as toInitials } from "@/lib/format";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ----------------------------- Botones ----------------------------- */
type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-950 font-medium shadow-sm",
  secondary:
    "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100",
  ghost: "text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200",
  danger:
    "bg-red-600 text-white hover:bg-red-500 active:bg-red-700 font-medium shadow-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg gap-1.5",
  md: "h-11 px-4 text-[15px] rounded-xl gap-2",
  lg: "h-13 px-5 text-base rounded-2xl gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return cn(
    "inline-flex items-center justify-center select-none outline-none transition duration-150 ease-out active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-neutral-900/20 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
    variantClasses[variant],
    sizeClasses[size],
  );
}

/* ----------------------------- Inputs ------------------------------ */
export const inputClass =
  "w-full h-11 rounded-xl border border-neutral-200 bg-white px-3.5 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";

export const labelClass = "block text-sm font-medium text-neutral-700 mb-1.5";

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
        "rounded-2xl border border-neutral-200 bg-white shadow-sm",
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
    zinc: "bg-neutral-100 text-neutral-600",
    emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    rose: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
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
        className="rounded-full object-cover ring-1 ring-neutral-200"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-neutral-900 font-semibold text-white"
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
        <h1 className="truncate text-2xl font-bold tracking-tight text-neutral-900">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
      {icon && <div className="mb-3 text-4xl">{icon}</div>}
      <p className="font-semibold text-neutral-900">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-neutral-500">{description}</p>
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
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className={cn("mt-0.5 text-lg font-bold tabular-nums text-neutral-900", valueClassName)}>
        {value}
      </div>
    </div>
  );
}
