"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonClass, inputClass } from "@/components/ui";
import { setDisplayName } from "@/app/actions/profile";

/** Se muestra la primera vez (cuando aún no has elegido nombre). */
export function NameSetup({ suggestion }: { suggestion?: string }) {
  const router = useRouter();
  const [name, setName] = useState(suggestion ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!name.trim()) return setError("Escribe un nombre");
    start(async () => {
      const res = await setDisplayName(name);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-white to-neutral-100 px-6">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-900 text-3xl text-white shadow-lg">
          👋
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight text-neutral-900">
          ¿Cómo te llamas?
        </h1>
        <p className="mt-2 text-center text-balance text-neutral-500">
          Es el nombre con el que te verá la app y tus amigos. Luego podrás
          cambiarlo o usar uno distinto en cada grupo.
        </p>

        <div className="mt-6">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Tu nombre"
            maxLength={40}
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={submit}
            disabled={pending || !name.trim()}
            className={`${buttonClass("primary", "lg")} mt-4 w-full`}
          >
            {pending ? "Guardando…" : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
