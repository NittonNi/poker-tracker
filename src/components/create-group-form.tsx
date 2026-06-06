"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ModalButton } from "@/components/dialog";
import { buttonClass, inputClass, labelClass } from "@/components/ui";
import { createGroup } from "@/app/actions/groups";

export function CreateGroupForm() {
  return (
    <ModalButton
      label="+ Nuevo grupo"
      title="Nuevo grupo"
      className={buttonClass("primary", "sm")}
    >
      {(close) => <Form close={close} />}
    </ModalButton>
  );
}

function Form({ close }: { close: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("€");
  const [rate, setRate] = useState("100");

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createGroup({
        name,
        currency,
        rate: Number(rate),
      });
      if (res.ok) {
        router.refresh();
        close();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Nombre del grupo</label>
        <input
          className={inputClass}
          placeholder="Poker de los viernes"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Moneda</label>
          <input
            className={inputClass}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            maxLength={3}
          />
        </div>
        <div>
          <label className={labelClass}>Fichas por unidad</label>
          <input
            className={inputClass}
            type="number"
            inputMode="numeric"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-neutral-400">
        Ej: con 100 fichas por {currency || "€"}, un buy-in de 10 {currency || "€"}{" "}
        son 1.000 fichas. Lo puedes cambiar en cada partida.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={close}
          className={`${buttonClass("secondary")} flex-1`}
          type="button"
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={pending}
          className={`${buttonClass("primary")} flex-1`}
          type="button"
        >
          {pending ? "Creando…" : "Crear grupo"}
        </button>
      </div>
    </div>
  );
}
