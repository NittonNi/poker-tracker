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
          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
            <div className="border-b border-neutral-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-neutral-900">{name}</p>
              <p className="truncate text-xs text-neutral-500">{email}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-neutral-50"
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
