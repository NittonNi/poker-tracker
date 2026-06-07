"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings, Check } from "lucide-react";
import { ModalButton } from "@/components/dialog";
import { buttonClass, inputClass, labelClass } from "@/components/ui";
import {
  deleteGroup,
  leaveGroup,
  renameGroup,
  updateGroupSettings,
} from "@/app/actions/groups";

type Group = {
  id: string;
  name: string;
  default_buyin: number;
  default_rate: number;
  default_cash_mode: boolean;
};

export function GroupSettings({
  group,
  isOwner,
}: {
  group: Group;
  isOwner: boolean;
}) {
  return (
    <ModalButton
      label={<Settings size={18} />}
      title="Ajustes del grupo"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
    >
      {(close) => <Form close={close} group={group} isOwner={isOwner} />}
    </ModalButton>
  );
}

function Form({
  close,
  group,
  isOwner,
}: {
  close: () => void;
  group: Group;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(group.name);
  const [cashMode, setCashMode] = useState(group.default_cash_mode);
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
        cashMode,
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

  function leave() {
    startTransition(async () => {
      await leaveGroup(group.id);
    });
  }

  return (
    <div className="space-y-4">
      {!isOwner && (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-600">
          Eres miembro. Solo el admin del grupo puede cambiar los ajustes.
        </p>
      )}
      {isOwner && (
        <>
      <div>
        <label className={labelClass}>Nombre</label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={() => setCashMode((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left"
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-md ${
            cashMode
              ? "bg-neutral-900 text-white"
              : "border border-neutral-300 bg-white"
          }`}
        >
          {cashMode && <Check size={13} strokeWidth={3} />}
        </span>
        <span className="text-sm text-neutral-700">
          Jugar directamente en € (sin fichas)
        </span>
      </button>

      <div className={cashMode ? "" : "grid grid-cols-2 gap-3"}>
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
        {!cashMode && (
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
        )}
      </div>
      <p className="-mt-1 text-xs text-neutral-400">
        {cashMode
          ? `Sin fichas: se juega en € (con céntimos). Afecta a las partidas nuevas.`
          : `1 buy-in = ${buyin || "?"} € = ${chips || "?"} fichas. Afecta a las partidas nuevas.`}
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
        </>
      )}

      <div className="border-t border-neutral-200 pt-4">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-red-600 hover:text-red-700"
          >
            {isOwner ? "Eliminar grupo" : "Salir del grupo"}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-neutral-600">
              {isOwner
                ? "¿Seguro? Se borrarán todas las partidas y el historial del grupo para todos."
                : "Saldrás del grupo. El historial se conserva para el resto; podrás volver con un enlace de invitación."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className={`${buttonClass("secondary", "sm")} flex-1`}
              >
                No
              </button>
              <button
                onClick={isOwner ? remove : leave}
                disabled={pending}
                className={`${buttonClass("danger", "sm")} flex-1`}
              >
                {isOwner ? "Sí, eliminar" : "Sí, salir"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
