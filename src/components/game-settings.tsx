"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { ModalButton } from "@/components/dialog";
import { buttonClass, inputClass, labelClass } from "@/components/ui";
import { deleteGame, updateGame } from "@/app/actions/games";

type Game = {
  id: string;
  groupId: string;
  name: string;
  playedOn: string;
  status: "open" | "closed";
  rate: number;
};

export function GameSettings({ game }: { game: Game }) {
  return (
    <ModalButton
      label={<Settings size={18} />}
      title="Ajustes de la partida"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
    >
      {(close) => <Form close={close} game={game} />}
    </ModalButton>
  );
}

function Form({ close, game }: { close: () => void; game: Game }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(game.name);
  const [playedOn, setPlayedOn] = useState(game.playedOn);
  const [rate, setRate] = useState(String(game.rate));

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateGame(game.id, {
        name,
        playedOn,
        rate: Number(rate),
      });
      if (!res.ok) return setError(res.error);
      router.refresh();
      close();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteGame(game.id, game.groupId);
      router.push(`/grupos/${game.groupId}`);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Nombre</label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Fecha</label>
          <input
            className={inputClass}
            type="date"
            value={playedOn}
            onChange={(e) => setPlayedOn(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Fichas por unidad</label>
          <input
            className={inputClass}
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-neutral-400">
        Cambiar el cambio de fichas recalcula los balances con los movimientos ya
        registrados.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button onClick={close} className={`${buttonClass("secondary")} flex-1`}>
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={pending}
          className={`${buttonClass("primary")} flex-1`}
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>

      <div className="border-t border-neutral-200 pt-4">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Eliminar partida
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-neutral-600">
              ¿Seguro? Se borrarán todos sus movimientos y la liquidación.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className={`${buttonClass("secondary", "sm")} flex-1`}
              >
                No
              </button>
              <button
                onClick={remove}
                disabled={pending}
                className={`${buttonClass("danger", "sm")} flex-1`}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
