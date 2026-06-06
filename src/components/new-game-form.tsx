"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ModalButton } from "@/components/dialog";
import { Avatar, buttonClass, inputClass, labelClass } from "@/components/ui";
import { createGame } from "@/app/actions/games";

type Player = { id: string; display_name: string; avatar_url: string | null };

export function NewGameForm({
  groupId,
  defaultRate,
  currency,
  players,
}: {
  groupId: string;
  defaultRate: number;
  currency: string;
  players: Player[];
}) {
  return (
    <ModalButton
      label="+ Nueva partida"
      title="Nueva partida"
      className={buttonClass("primary", "sm")}
    >
      {(close) => (
        <Form
          close={close}
          groupId={groupId}
          defaultRate={defaultRate}
          currency={currency}
          players={players}
        />
      )}
    </ModalButton>
  );
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function Form({
  close,
  groupId,
  defaultRate,
  currency,
  players,
}: {
  close: () => void;
  groupId: string;
  defaultRate: number;
  currency: string;
  players: Player[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [playedOn, setPlayedOn] = useState(todayISO());
  const [rate, setRate] = useState(String(defaultRate));
  const [buyIn, setBuyIn] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(players.map((p) => p.id)),
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createGame({
        groupId,
        name: name || `Partida ${formatShort(playedOn)}`,
        playedOn,
        rate: Number(rate),
        currency,
        playerIds: [...selected],
        buyInMoney: buyIn ? Number(buyIn) : 0,
      });
      if (res.ok) {
        close();
        router.push(`/partidas/${res.gameId}`);
      } else {
        setError(res.error);
      }
    });
  }

  if (players.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">
          Necesitas al menos un jugador activo en el grupo para crear una
          partida.
        </p>
        <button onClick={close} className={`${buttonClass("secondary")} w-full`}>
          Entendido
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Nombre (opcional)</label>
        <input
          className={inputClass}
          placeholder={`Partida ${formatShort(playedOn)}`}
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
          <label className={labelClass}>Fichas por {currency}</label>
          <input
            className={inputClass}
            type="number"
            inputMode="numeric"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>
          Buy-in inicial para todos (opcional)
        </label>
        <input
          className={inputClass}
          type="number"
          inputMode="decimal"
          placeholder={`Ej: 10 ${currency}`}
          value={buyIn}
          onChange={(e) => setBuyIn(e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>
          Jugadores ({selected.size}/{players.length})
        </label>
        <div className="max-h-56 space-y-1.5 overflow-y-auto no-scrollbar">
          {players.map((p) => {
            const on = selected.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                  on
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <Avatar name={p.display_name} src={p.avatar_url} size={32} />
                <span className="flex-1 font-medium text-white">
                  {p.display_name}
                </span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md text-xs ${
                    on ? "bg-emerald-500 text-felt-950" : "bg-white/10"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={close} className={`${buttonClass("secondary")} flex-1`}>
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={pending || selected.size === 0}
          className={`${buttonClass("primary")} flex-1`}
        >
          {pending ? "Creando…" : "Empezar"}
        </button>
      </div>
    </div>
  );
}

function formatShort(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}
