"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { ModalButton } from "@/components/dialog";
import { buttonClass, inputClass, labelClass } from "@/components/ui";
import {
  deleteGroup,
  renameGroup,
  updateGroupSettings,
} from "@/app/actions/groups";

type Group = {
  id: string;
  name: string;
  default_buyin: number;
  default_rate: number;
};

export function GroupSettings({ group }: { group: Group }) {
  return (
    <ModalButton
      label={<Settings size={18} />}
      title="Ajustes del grupo"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
    >
      {(close) => <Form close={close} group={group} />}
    </ModalButton>
  );
}

function Form({ close, group }: { close: () => void; group: Group }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(group.name);
  const [buyin, setBuyin] = useState(String(group.default_buyin));
  const [chips, setChips] = useState(
    String(Math.round(group.default_buyin * group.default_rate)),
  );

  function save() {
    setError(null);
    startTransition(async () => {
      const r1 = await renameGroup(group.id, name);
      if (!r1.ok) return setError(r1.error);
      const r2 = await updateGroupSettings(group.id, {
        buyin: Number(buyin),
        buyinChips: Number(chips),
      });
      if (!r2.ok) return setError(r2.error);
      router.refresh();
      close();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteGroup(group.id);
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
      <p className="-mt-1 text-xs text-neutral-400">
        1 buy-in = {buyin || "?"} € = {chips || "?"} fichas.
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
            Eliminar grupo
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-neutral-600">
              ¿Seguro? Se borrarán todas las partidas y el historial del grupo.
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
