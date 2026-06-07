"use client";

import { useState, useTransition } from "react";
import { Bug, Lightbulb, MessageCircle, Check } from "lucide-react";
import { buttonClass, labelClass } from "@/components/ui";
import { submitFeedback } from "@/app/actions/feedback";

type Kind = "idea" | "bug" | "general";

const KINDS: { id: Kind; label: string; icon: typeof Bug }[] = [
  { id: "idea", label: "Sugerencia", icon: Lightbulb },
  { id: "bug", label: "Fallo", icon: Bug },
  { id: "general", label: "Otro", icon: MessageCircle },
];

export function FeedbackForm() {
  const [kind, setKind] = useState<Kind>("idea");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function submit() {
    setError(null);
    if (!message.trim()) return setError("Escribe tu mensaje");
    start(async () => {
      const res = await submitFeedback({
        kind,
        message,
        page:
          typeof window !== "undefined" ? window.location.pathname : undefined,
      });
      if (res.ok) {
        setDone(true);
        setMessage("");
      } else {
        setError(res.error);
      }
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check size={28} />
        </div>
        <p className="mt-4 text-lg font-semibold text-neutral-900">
          ¡Gracias! 🙌
        </p>
        <p className="mt-1 max-w-xs text-sm text-neutral-600">
          Hemos recibido tu mensaje. Cada idea ayuda a mejorar la app.
        </p>
        <button
          onClick={() => setDone(false)}
          className={`${buttonClass("secondary")} mt-6`}
        >
          Enviar otro
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>¿Qué nos quieres contar?</label>
        <div className="grid grid-cols-3 gap-2">
          {KINDS.map((k) => {
            const on = kind === k.id;
            const Icon = k.icon;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-sm font-medium transition ${
                  on
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <Icon size={20} />
                {k.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelClass}>Tu mensaje</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          maxLength={4000}
          autoFocus
          placeholder={
            kind === "bug"
              ? "¿Qué ha fallado? ¿Qué estabas haciendo?"
              : kind === "idea"
                ? "Cuéntanos tu idea o qué echas en falta…"
                : "Escribe aquí lo que quieras contarnos…"
          }
          className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={pending || !message.trim()}
        className={`${buttonClass("primary")} w-full`}
      >
        {pending ? "Enviando…" : "Enviar"}
      </button>

      <p className="text-center text-xs text-neutral-400">
        Se enviará junto a tu correo para poder responderte si hace falta.
      </p>
    </div>
  );
}
