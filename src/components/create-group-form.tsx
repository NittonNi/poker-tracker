"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ModalButton } from "@/components/dialog";
import { buttonClass, inputClass, labelClass } from "@/components/ui";
import { createGroup } from "@/app/actions/groups";

export function CreateGroupForm({
  label,
  className,
}: {
  label?: React.ReactNode;
  className?: string;
} = {}) {
  return (
    <ModalButton
      label={label ?? "+ Nuevo grupo"}
      title="Nuevo grupo"
      className={className ?? buttonClass("primary", "sm")}
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
  const [buyin, setBuyin] = useState("10");
  const [chips, setChips] = useState("1000");

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createGroup({
        name,
        buyin: Number(buyin),
        buyinChips: Number(chips),
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
          <label className={labelClass}>Buy-in (€)</label>
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            min={0}
            value={buyin}
            onChange={(e) => setBuyin(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Fichas por buy-in</label>
          <input
            className={inputClass}
            type="number"
            inputMode="numeric"
            min={0}
            value={chips}
            onChange={(e) => setChips(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-neutral-400">
        Cada buy-in de {buyin || "?"} € = {chips || "?"} fichas. Es lo estándar
        del grupo; lo puedes cambiar en cada partida.
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
