"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ModalButton } from "@/components/dialog";
import { buttonClass, inputClass, labelClass } from "@/components/ui";
import { addPlayer } from "@/app/actions/players";

export function AddPlayerForm({ groupId }: { groupId: string }) {
  return (
    <ModalButton
      label="+ Añadir"
      title="Añadir jugador"
      className={buttonClass("primary", "sm")}
    >
      {(close) => <Form close={close} groupId={groupId} />}
    </ModalButton>
  );
}

function Form({ close, groupId }: { close: () => void; groupId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await addPlayer(groupId, name);
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
        <label className={labelClass}>Nombre del jugador</label>
        <input
          className={inputClass}
          placeholder="Ej: Marcos"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
        <p className="mt-1.5 text-xs text-zinc-500">
          Puedes añadir invitados que no tengan cuenta. Cuentan igual en las
          partidas y la liquidación.
        </p>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="flex gap-2">
        <button onClick={close} className={`${buttonClass("secondary")} flex-1`}>
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={pending}
          className={`${buttonClass("primary")} flex-1`}
        >
          {pending ? "Añadiendo…" : "Añadir"}
        </button>
      </div>
    </div>
  );
}
