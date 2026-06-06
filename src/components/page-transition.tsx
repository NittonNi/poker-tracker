"use client";

import { usePathname } from "next/navigation";

/**
 * Reproduce una animación de entrada suave cada vez que cambia la ruta.
 * El `key` por pathname fuerza el re-montaje y reinicia la animación CSS.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-page">
      {children}
    </div>
  );
}
