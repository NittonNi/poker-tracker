"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { buttonClass, inputClass, labelClass } from "@/components/ui";
import { updateProfile } from "@/app/actions/profile";

export function ProfileForm({
  initialName,
  initialPhone,
}: {
  initialName: string;
  initialPhone: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function submit() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await updateProfile({ displayName: name, phone });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Tu nombre</label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Tu nombre"
        />
        <p className="mt-1.5 text-xs text-neutral-400">
          Con el que te llama la app. En cada grupo puedes usar otro distinto.
        </p>
      </div>

      <div>
        <label className={labelClass}>Teléfono para Bizum (opcional)</label>
        <input
          className={inputClass}
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="6XX XXX XXX"
        />
        <p className="mt-1.5 text-xs text-neutral-400">
          Si lo pones, cuando alguien te deba dinero podrá pagarte por Bizum más
          fácil. Solo lo ve la gente de tus grupos.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={pending || !name.trim()}
        className={`${buttonClass("primary")} w-full`}
      >
        {saved ? <Check size={16} /> : null}
        {pending ? "Guardando…" : saved ? "Guardado" : "Guardar"}
      </button>
    </div>
  );
}
