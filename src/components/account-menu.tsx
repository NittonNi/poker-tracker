"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageSquarePlus, ShieldCheck, User } from "lucide-react";
import { Avatar } from "@/components/ui";
import { signOut } from "@/app/actions/auth";

export function AccountMenu({
  name,
  email,
  avatarUrl,
  isAdmin,
}: {
  name: string;
  email: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cierra al tocar fuera (robusto en móvil aunque el header tenga blur).
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Cuenta">
        <Avatar name={name} src={avatarUrl} size={36} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {name}
            </p>
            <p className="truncate text-xs text-neutral-500">{email}</p>
          </div>
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            <User size={16} />
            Mi perfil
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              <ShieldCheck size={16} />
              Panel de admin
            </Link>
          )}
          <Link
            href="/feedback"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            <MessageSquarePlus size={16} />
            Enviar feedback
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-neutral-50"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
