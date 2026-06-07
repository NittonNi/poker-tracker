import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** Botón de "volver" claro y fácil de tocar en móvil. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-3 inline-flex h-9 items-center gap-0.5 rounded-lg border border-neutral-200 bg-white py-1 pl-1.5 pr-3 text-sm font-medium text-neutral-600 shadow-sm transition duration-150 ease-out hover:bg-neutral-50 hover:text-neutral-900 active:scale-[0.97]"
    >
      <ChevronLeft size={18} className="shrink-0" />
      <span className="max-w-[60vw] truncate">{label}</span>
    </Link>
  );
}
