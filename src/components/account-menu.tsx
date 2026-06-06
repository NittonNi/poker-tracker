"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui";
import { signOut } from "@/app/actions/auth";

export function AccountMenu({
  name,
  email,
  avatarUrl,
}: {
  name: string;
  email: string;
  avatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Cuenta">
        <Avatar name={name} src={avatarUrl} size={36} />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-felt-900 shadow-2xl">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="truncate text-sm font-semibold text-white">{name}</p>
              <p className="truncate text-xs text-zinc-400">{email}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full px-4 py-3 text-left text-sm text-rose-300 hover:bg-white/5"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
