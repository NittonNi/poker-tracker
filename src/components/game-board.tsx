"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Badge,
  Card,
  buttonClass,
  inputClass,
  labelClass,
} from "@/components/ui";
import { Modal, ModalButton } from "@/components/dialog";
import {
  formatDate,
  formatMoney,
  formatPoints,
  formatSignedMoney,
  balanceColor,
} from "@/lib/format";
import {
  computeBalances,
  computeSettlements,
  moneyToPoints,
  settlementMismatch,
  totalChipsInPlay,
  totalFinalChips,
  type TxInput,
} from "@/lib/poker";
import { addBuyIn, addTransfer, deleteTransaction } from "@/app/actions/transactions";
import {
  closeGame,
  reopenGame,
  setFinalChips as saveFinalChips,
} from "@/app/actions/games";
import { setSettlementPaid } from "@/app/actions/settlements";
import { GameSettings } from "@/components/game-settings";

type Game = {
  id: string;
  groupId: string;
  name: string;
  playedOn: string;
  status: "open" | "closed";
  rate: number;
  currency: string;
};
type PlayerInfo = {
  playerId: string;
  name: string;
  avatarUrl: string | null;
  finalChips: number | null;
};
type Tx = {
  id: string;
  type: "buy_in" | "transfer" | "adjustment";
  playerId: string;
  counterpartyId: string | null;
  money: number;
  points: number;
  note: string | null;
  createdAt: string;
};
type Settlement = {
  id: string;
  from: string;
  to: string;
  amount: number;
  isPaid: boolean;
};

export function GameBoard({
  game,
  players,
  transactions,
  settlements,
}: {
  game: Game;
  players: PlayerInfo[];
  transactions: Tx[];
  settlements: Settlement[];
}) {
  const router = useRouter();
  const isOpen = game.status === "open";
  const { currency, rate } = game;

  const nameById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.playerId, p.name])),
    [players],
  );

  const [finalChips, setFinalChips] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      players.map((p) => [
        p.playerId,
        p.finalChips == null ? "" : String(p.finalChips),
      ]),
    ),
  );

  const finalChipsNum = useMemo(() => {
    const m: Record<string, number | null> = {};
    for (const p of players) {
      const v = finalChips[p.playerId];
      m[p.playerId] = v === "" || v === undefined ? null : Number(v);
    }
    return m;
  }, [players, finalChips]);

  const balances = useMemo(() => {
    const tx: TxInput[] = transactions.map((t) => ({
      type: t.type,
      playerId: t.playerId,
      counterpartyId: t.counterpartyId,
      money: t.money,
      points: t.points,
    }));
    return computeBalances({
      playerIds: players.map((p) => p.playerId),
      transactions: tx,
      finalChips: finalChipsNum,
      rate,
    });
  }, [players, transactions, finalChipsNum, rate]);

  const balById = useMemo(
    () => Object.fromEntries(balances.map((b) => [b.playerId, b])),
    [balances],
  );

  const allCounted = players.every((p) => finalChipsNum[p.playerId] != null);
  const mismatch = settlementMismatch(balances);
  const chipsInPlay = totalChipsInPlay(balances);
  const chipsCounted = totalFinalChips(balances);
  const preview = useMemo(
    () =>
      computeSettlements(
        balances.map((b) => ({ playerId: b.playerId, balance: b.balance })),
      ),
    [balances],
  );

  const totalMoney = balances.reduce((s, b) => s + b.buyinMoney, 0);

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onFinalChange(playerId: string, value: string) {
    setFinalChips((prev) => ({ ...prev, [playerId]: value }));
  }
  function onFinalBlur(playerId: string) {
    const v = finalChips[playerId];
    const num = v === "" ? null : Number(v);
    startTransition(async () => {
      await saveFinalChips(game.id, playerId, num);
    });
  }

  function doClose() {
    setError(null);
    startTransition(async () => {
      const res = await closeGame(game.id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }
  function doReopen() {
    startTransition(async () => {
      const res = await reopenGame(game.id);
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4 pb-28">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-bold text-white">
              {game.name}
            </h1>
            {isOpen ? (
              <Badge color="emerald">En juego</Badge>
            ) : (
              <Badge color="zinc">Cerrada</Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-zinc-400">
            {formatDate(game.playedOn)} · {formatPoints(rate)} fichas/{currency}
          </p>
        </div>
        <GameSettings game={game} />
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="En la mesa" value={formatMoney(totalMoney, currency)} />
        <MiniStat label="Fichas en juego" value={formatPoints(chipsInPlay)} />
        <MiniStat
          label="Fichas contadas"
          value={formatPoints(chipsCounted)}
          valueClass={
            allCounted && Math.abs(chipsInPlay - chipsCounted) > 0.5
              ? "text-amber-400"
              : undefined
          }
        />
      </div>

      {/* Jugadores */}
      <div className="space-y-2">
        {players.map((p) => {
          const b = balById[p.playerId];
          return (
            <Card key={p.playerId} className="p-3">
              <div className="flex items-center gap-3">
                <Avatar name={p.name} src={p.avatarUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-white">
                    {p.name}
                  </div>
                  <div className="text-xs text-zinc-400">
                    Invertido {formatMoney(b?.netMoneyIn ?? 0, currency)} ·{" "}
                    {formatPoints(b?.chipsLedger ?? 0)} fichas
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-bold tabular-nums ${balanceColor(b?.balance ?? 0)}`}
                  >
                    {finalChipsNum[p.playerId] == null && isOpen
                      ? "—"
                      : formatSignedMoney(b?.balance ?? 0, currency)}
                  </div>
                  <div className="text-[11px] text-zinc-500">balance</div>
                </div>
              </div>

              {isOpen && (
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-xs text-zinc-400">Fichas finales</label>
                  <input
                    className={`${inputClass} h-9 flex-1`}
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={finalChips[p.playerId] ?? ""}
                    onChange={(e) => onFinalChange(p.playerId, e.target.value)}
                    onBlur={() => onFinalBlur(p.playerId)}
                  />
                  <BuyInButton
                    gameId={game.id}
                    player={p}
                    rate={rate}
                    currency={currency}
                    compact
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Acciones de recompra */}
      {isOpen && (
        <div className="grid grid-cols-2 gap-2">
          <BuyInButton
            gameId={game.id}
            players={players}
            rate={rate}
            currency={currency}
          />
          <TransferButton
            gameId={game.id}
            players={players}
            rate={rate}
            currency={currency}
          />
        </div>
      )}

      {/* Movimientos */}
      <Movements
        transactions={transactions}
        nameById={nameById}
        currency={currency}
        gameId={game.id}
        canDelete={isOpen}
      />

      {/* Liquidación */}
      {!isOpen && settlements.length > 0 && (
        <SettlementList
          settlements={settlements}
          nameById={nameById}
          currency={currency}
          gameId={game.id}
        />
      )}
      {!isOpen && settlements.length === 0 && (
        <Card className="p-4 text-center text-sm text-zinc-400">
          Todo cuadrado: nadie debe nada 🎉
        </Card>
      )}

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      )}

      {/* Barra inferior fija */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-felt-950/90 backdrop-blur-md">
        <div className="mx-auto w-full max-w-lg px-4 py-3">
          {isOpen ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 text-sm">
                {!allCounted ? (
                  <span className="text-zinc-400">
                    Cuenta las fichas finales de todos para liquidar.
                  </span>
                ) : Math.abs(mismatch) > 0.05 ? (
                  <span className="text-amber-400">
                    Descuadre de {formatMoney(Math.abs(mismatch), currency)}.
                    Revisa los recuentos.
                  </span>
                ) : preview.length === 0 ? (
                  <span className="text-emerald-400">
                    Todo cuadra · nadie debe nada
                  </span>
                ) : (
                  <span className="text-emerald-400">
                    Todo cuadra · {preview.length} pago
                    {preview.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <button
                onClick={doClose}
                disabled={pending || !allCounted || Math.abs(mismatch) > 0.05}
                className={buttonClass("primary")}
              >
                Cerrar y liquidar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex-1 text-sm text-zinc-400">
                Partida cerrada
              </span>
              <button
                onClick={doReopen}
                disabled={pending}
                className={buttonClass("secondary")}
              >
                Reabrir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[11px] text-zinc-400">{label}</div>
      <div className={`mt-0.5 text-sm font-bold tabular-nums ${valueClass ?? "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

/* ----------------------- Buy-in / recompra mesa --------------------- */
function BuyInButton({
  gameId,
  player,
  players,
  rate,
  currency,
  compact,
}: {
  gameId: string;
  player?: PlayerInfo;
  players?: PlayerInfo[];
  rate: number;
  currency: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState(player?.playerId ?? "");
  const [money, setMoney] = useState("");

  const list = players ?? (player ? [player] : []);
  const points = money ? moneyToPoints(Number(money), rate) : 0;

  function submit() {
    setError(null);
    if (!playerId) return setError("Elige un jugador");
    startTransition(async () => {
      const res = await addBuyIn({ gameId, playerId, money: Number(money) });
      if (res.ok) {
        setMoney("");
        setOpen(false);
        router.refresh();
      } else setError(res.error);
    });
  }

  return (
    <>
      <button
        onClick={() => {
          setPlayerId(player?.playerId ?? "");
          setMoney("");
          setError(null);
          setOpen(true);
        }}
        className={
          compact
            ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/90 text-lg font-bold text-felt-950"
            : buttonClass("primary")
        }
        aria-label="Buy-in"
      >
        {compact ? "+" : "Buy-in / recompra"}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Buy-in / recompra a la mesa"
      >
        <div className="space-y-4">
          {!player && (
            <div>
              <label className={labelClass}>Jugador</label>
              <select
                className={inputClass}
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
              >
                <option value="">Elige…</option>
                {list.map((p) => (
                  <option key={p.playerId} value={p.playerId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {player && (
            <p className="text-sm text-zinc-300">
              Jugador: <span className="font-semibold">{player.name}</span>
            </p>
          )}
          <div>
            <label className={labelClass}>Importe ({currency})</label>
            <input
              className={inputClass}
              type="number"
              inputMode="decimal"
              placeholder="10"
              value={money}
              onChange={(e) => setMoney(e.target.value)}
              autoFocus
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              = {formatPoints(points)} fichas
            </p>
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className={`${buttonClass("secondary")} flex-1`}
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={pending || !money}
              className={`${buttonClass("primary")} flex-1`}
            >
              {pending ? "Guardando…" : "Añadir"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ----------------------- Recompra entre jugadores ------------------- */
function TransferButton({
  gameId,
  players,
  rate,
  currency,
}: {
  gameId: string;
  players: PlayerInfo[];
  rate: number;
  currency: string;
}) {
  const router = useRouter();
  return (
    <ModalButton
      label="Entre jugadores"
      title="Recompra entre jugadores"
      className={buttonClass("secondary")}
    >
      {(close) => (
        <TransferForm
          close={close}
          gameId={gameId}
          players={players}
          rate={rate}
          currency={currency}
          onDone={() => router.refresh()}
        />
      )}
    </ModalButton>
  );
}

function TransferForm({
  close,
  gameId,
  players,
  rate,
  currency,
  onDone,
}: {
  close: () => void;
  gameId: string;
  players: PlayerInfo[];
  rate: number;
  currency: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [buyerId, setBuyerId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [money, setMoney] = useState("");
  const points = money ? moneyToPoints(Number(money), rate) : 0;

  function submit() {
    setError(null);
    if (!buyerId || !sellerId) return setError("Elige comprador y vendedor");
    if (buyerId === sellerId)
      return setError("El comprador y el vendedor no pueden ser el mismo");
    startTransition(async () => {
      const res = await addTransfer({
        gameId,
        buyerId,
        sellerId,
        money: Number(money),
      });
      if (res.ok) {
        close();
        onDone();
      } else setError(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        El <b>comprador</b> paga dinero al <b>vendedor</b> y recibe sus fichas.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Comprador</label>
          <select
            className={inputClass}
            value={buyerId}
            onChange={(e) => setBuyerId(e.target.value)}
          >
            <option value="">Elige…</option>
            {players.map((p) => (
              <option key={p.playerId} value={p.playerId}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Vendedor</label>
          <select
            className={inputClass}
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
          >
            <option value="">Elige…</option>
            {players.map((p) => (
              <option key={p.playerId} value={p.playerId}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Importe ({currency})</label>
        <input
          className={inputClass}
          type="number"
          inputMode="decimal"
          placeholder="5"
          value={money}
          onChange={(e) => setMoney(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-zinc-500">
          = {formatPoints(points)} fichas que pasan del vendedor al comprador
        </p>
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <div className="flex gap-2">
        <button onClick={close} className={`${buttonClass("secondary")} flex-1`}>
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={pending || !money}
          className={`${buttonClass("primary")} flex-1`}
        >
          {pending ? "Guardando…" : "Registrar"}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- Movimientos -------------------------- */
function Movements({
  transactions,
  nameById,
  currency,
  gameId,
  canDelete,
}: {
  transactions: Tx[];
  nameById: Record<string, string>;
  currency: string;
  gameId: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (transactions.length === 0) {
    return (
      <Card className="p-4 text-center text-sm text-zinc-400">
        Sin movimientos todavía. Registra el primer buy-in.
      </Card>
    );
  }

  function del(id: string) {
    startTransition(async () => {
      await deleteTransaction(id, gameId);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-zinc-400">
        Movimientos ({transactions.length})
      </h2>
      <Card className="divide-y divide-white/5">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-3 py-2.5">
            <span className="text-lg">
              {t.type === "transfer" ? "🔁" : "💰"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-white">
                {t.type === "transfer"
                  ? `${nameById[t.playerId] ?? "?"} compró a ${nameById[t.counterpartyId ?? ""] ?? "?"}`
                  : `${nameById[t.playerId] ?? "?"} · buy-in`}
              </div>
              <div className="text-xs text-zinc-500">
                {formatMoney(t.money, currency)} · {formatPoints(t.points)} fichas
              </div>
            </div>
            {canDelete && (
              <button
                onClick={() => del(t.id)}
                disabled={pending}
                className="text-zinc-500 hover:text-rose-400"
                aria-label="Borrar movimiento"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ----------------------------- Liquidación -------------------------- */
function SettlementList({
  settlements,
  nameById,
  currency,
  gameId,
}: {
  settlements: Settlement[];
  nameById: Record<string, string>;
  currency: string;
  gameId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle(s: Settlement) {
    startTransition(async () => {
      await setSettlementPaid(s.id, gameId, !s.isPaid);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-zinc-400">
        Quién paga a quién
      </h2>
      <Card className="divide-y divide-white/5">
        {settlements.map((s) => (
          <button
            key={s.id}
            onClick={() => toggle(s)}
            disabled={pending}
            className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-white/[0.03]"
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-md text-xs ${
                s.isPaid ? "bg-emerald-500 text-felt-950" : "bg-white/10"
              }`}
            >
              {s.isPaid ? "✓" : ""}
            </span>
            <div className="flex-1 text-sm">
              <span className="font-semibold text-white">
                {nameById[s.from] ?? "?"}
              </span>{" "}
              <span className="text-zinc-400">paga a</span>{" "}
              <span className="font-semibold text-white">
                {nameById[s.to] ?? "?"}
              </span>
            </div>
            <span
              className={`font-bold tabular-nums ${s.isPaid ? "text-zinc-500 line-through" : "text-emerald-400"}`}
            >
              {formatMoney(s.amount, currency)}
            </span>
          </button>
        ))}
      </Card>
      <p className="mt-2 text-xs text-zinc-500">
        Toca cada línea para marcarla como pagada.
      </p>
    </div>
  );
}
