"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Avatar, Badge, Card, buttonClass, inputClass } from "@/components/ui";
import {
  deletePlayer,
  renamePlayer,
  setPlayerActive,
} from "@/app/actions/players";

type Player = {
  id: string;
  display_name: string;
  is_active: boolean;
  avatar_url: string | null;
  user_id: string | null;
};

export function PlayerRow({
  player,
  groupId,
}: {
  player: Player;
  groupId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(player.display_name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Error");
      else router.refresh();
    });
  }

  return (
    <li>
      <Card className="p-3">
        <div className="flex items-center gap-3">
          <Avatar name={player.display_name} src={player.avatar_url} size={40} />
          {editing ? (
            <input
              className={`${inputClass} h-9 flex-1`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          ) : (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-neutral-900">
                  {player.display_name}
                </span>
                {player.user_id && <Badge color="emerald">Cuenta</Badge>}
                {!player.is_active && <Badge color="zinc">Inactivo</Badge>}
              </div>
            </div>
          )}

          {editing ? (
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setEditing(false);
                  setName(player.display_name);
                }}
                className={buttonClass("ghost", "sm")}
              >
                Cancelar
              </button>
              <button
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    const r = await renamePlayer(player.id, groupId, name);
                    if (r.ok) setEditing(false);
                    return r;
                  })
                }
                className={buttonClass("primary", "sm")}
              >
                Guardar
              </button>
            </div>
          ) : (
            <Menu
              player={player}
              pending={pending}
              onRename={() => setEditing(true)}
              onToggleActive={() =>
                run(() =>
                  setPlayerActive(player.id, groupId, !player.is_active),
                )
              }
              onDelete={() => setConfirmDelete(true)}
            />
          )}
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {confirmDelete && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-neutral-700">
              ¿Borrar a {player.display_name}? Se eliminará también su historial.
              Si solo deja de jugar, mejor márcalo como inactivo.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className={`${buttonClass("secondary", "sm")} flex-1`}
              >
                Cancelar
              </button>
              <button
                disabled={pending}
                onClick={() => run(() => deletePlayer(player.id, groupId))}
                className={`${buttonClass("danger", "sm")} flex-1`}
              >
                Borrar
              </button>
            </div>
          </div>
        )}
      </Card>
    </li>
  );
}

function Menu({
  player,
  pending,
  onRename,
  onToggleActive,
  onDelete,
}: {
  player: Player;
  pending: boolean;
  onRename: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        aria-label="Opciones"
        disabled={pending}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
            <button
              onClick={() => {
                setOpen(false);
                onRename();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Renombrar
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onToggleActive();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
            >
              {player.is_active ? "Marcar inactivo" : "Reactivar"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-neutral-50"
            >
              Borrar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
