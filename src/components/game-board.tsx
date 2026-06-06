"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Check,
  X,
  ArrowLeftRight,
  Coins,
  Trash2,
  SlidersHorizontal,
  UserPlus,
} from "lucide-react";
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
import {
  addBuyIn,
  addTransfer,
  addAdjustment,
  deleteTransaction,
} from "@/app/actions/transactions";
import {
  closeGame,
  reopenGame,
  addPlayerToGame,
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
  buyin: number;
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

type RosterPlayer = { playerId: string; name: string; avatarUrl: string | null };

export function GameBoard({
  game,
  players,
  roster,
  transactions,
  settlements,
}: {
  game: Game;
  players: PlayerInfo[];
  roster: RosterPlayer[];
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
  const buyInsCount = transactions.filter((t) => t.type === "buy_in").length;

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onFinalChange(playerId: string, value: string) {
    // Sin negativos: un jugador no puede acabar con fichas negativas.
    const clean = value.replace(/-/g, "");
    setFinalChips((prev) => ({ ...prev, [playerId]: clean }));
  }
  function onFinalBlur(playerId: string) {
    const v = finalChips[playerId];
    const num = v === "" ? null : Math.max(0, Number(v));
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
            <h1 className="truncate text-2xl font-bold text-neutral-900">
              {game.name}
            </h1>
            {isOpen ? (
              <Badge color="emerald">En juego</Badge>
            ) : (
              <Badge color="zinc">Cerrada</Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-neutral-500">
            {formatDate(game.playedOn)} · Buy-in {formatMoney(game.buyin, currency)} ={" "}
            {formatPoints(Math.round(game.buyin * rate))} fichas
          </p>
        </div>
        <GameSettings game={game} />
      </div>

      {/* Resumen / bote */}
      <Card className="p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Bote en la mesa
            </div>
            <div className="mt-0.5 text-3xl font-bold tabular-nums text-neutral-900">
              {formatMoney(totalMoney, currency)}
            </div>
          </div>
          <div className="shrink-0 text-right text-sm text-neutral-500">
            <div>
              {players.length} jugador{players.length === 1 ? "" : "es"}
            </div>
            <div>
              {buyInsCount} buy-in{buyInsCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniStat label="Fichas en juego" value={formatPoints(chipsInPlay)} />
          <MiniStat
            label="Fichas contadas"
            value={formatPoints(chipsCounted)}
            valueClass={
              allCounted && Math.abs(chipsInPlay - chipsCounted) > 0.5
                ? "text-amber-600"
                : undefined
            }
          />
        </div>
      </Card>

      {/* Jugadores */}
      <div className="space-y-2">
        {players.map((p) => {
          const b = balById[p.playerId];
          return (
            <Card key={p.playerId} className="p-3">
              <div className="flex items-center gap-3">
                <Avatar name={p.name} src={p.avatarUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-neutral-900">
                    {p.name}
                  </div>
                  <div className="text-xs text-neutral-500">
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
                  <div className="text-[11px] text-neutral-400">balance</div>
                </div>
              </div>

              {isOpen && (
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-xs text-neutral-500">Fichas finales</label>
                  <input
                    className={`${inputClass} h-9 flex-1`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    value={finalChips[p.playerId] ?? ""}
                    onChange={(e) => onFinalChange(p.playerId, e.target.value)}
                    onBlur={() => onFinalBlur(p.playerId)}
                  />
                  <BuyInButton
                    gameId={game.id}
                    player={p}
                    rate={rate}
                    buyin={game.buyin}
                    currency={currency}
                    compact
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Añadir jugador a la mesa (si entra alguien a mitad) */}
      {isOpen && roster.length > 0 && (
        <AddToTableButton gameId={game.id} roster={roster} />
      )}

      {/* Acciones de recompra */}
      {isOpen && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <BuyInButton
              gameId={game.id}
              players={players}
              rate={rate}
              buyin={game.buyin}
              currency={currency}
            />
            <TransferButton
              gameId={game.id}
              players={players}
              rate={rate}
              currency={currency}
            />
          </div>
          <AdjustmentButton
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
        <Card className="p-4 text-center text-sm text-neutral-500">
          Todo cuadrado: nadie debe nada 🎉
        </Card>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Barra inferior fija */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto w-full max-w-lg px-4 py-3">
          {isOpen ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 text-sm">
                {!allCounted ? (
                  <span className="text-neutral-500">
                    Cuenta las fichas finales de todos para liquidar.
                  </span>
                ) : Math.abs(mismatch) > 0.05 ? (
                  <span className="text-amber-600">
                    Descuadre de {formatMoney(Math.abs(mismatch), currency)}.
                    Revisa los recuentos.
                  </span>
                ) : preview.length === 0 ? (
                  <span className="text-emerald-600">
                    Todo cuadra · nadie debe nada
                  </span>
                ) : (
                  <span className="text-emerald-600">
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
              <span className="flex-1 text-sm text-neutral-500">
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
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
      <div className="text-[11px] text-neutral-500">{label}</div>
      <div className={`mt-0.5 text-sm font-bold tabular-nums ${valueClass ?? "text-neutral-900"}`}>
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
  buyin,
  currency,
  compact,
}: {
  gameId: string;
  player?: PlayerInfo;
  players?: PlayerInfo[];
  rate: number;
  buyin: number;
  currency: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState(player?.playerId ?? "");
  const [money, setMoney] = useState(String(buyin));

  const list = players ?? (player ? [player] : []);
  const points = money ? moneyToPoints(Number(money), rate) : 0;

  function submit() {
    setError(null);
    if (!playerId) return setError("Elige un jugador");
    startTransition(async () => {
      const res = await addBuyIn({ gameId, playerId, money: Number(money) });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else setError(res.error);
    });
  }

  // Botón compacto por jugador: un toque = buy-in estándar (sin modal).
  if (compact && player) {
    return (
      <button
        onClick={() =>
          startTransition(async () => {
            const res = await addBuyIn({
              gameId,
              playerId: player.playerId,
              money: buyin,
            });
            if (res.ok) router.refresh();
          })
        }
        disabled={pending}
        className="flex h-9 shrink-0 items-center gap-1 rounded-lg bg-neutral-900 px-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
        aria-label={`Buy-in de ${formatMoney(buyin, currency)}`}
        title={`Buy-in de ${formatMoney(buyin, currency)}`}
      >
        <Plus size={16} />
        {formatMoney(buyin, currency)}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          setPlayerId(player?.playerId ?? "");
          setMoney(String(buyin));
          setError(null);
          setOpen(true);
        }}
        className={buttonClass("primary")}
        aria-label="Buy-in"
      >
        Buy-in / recompra
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
            <p className="text-sm text-neutral-600">
              Jugador: <span className="font-semibold">{player.name}</span>
            </p>
          )}
          <div>
            <label className={labelClass}>Importe ({currency})</label>
            <input
              className={inputClass}
              type="number"
              inputMode="decimal"
              min={0}
              placeholder={String(buyin)}
              value={money}
              onChange={(e) => setMoney(e.target.value)}
              autoFocus
            />
            <p className="mt-1.5 text-xs text-neutral-400">
              = {formatPoints(points)} fichas · estándar {formatMoney(buyin, currency)}
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
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
      <p className="text-sm text-neutral-500">
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
        <p className="mt-1.5 text-xs text-neutral-400">
          = {formatPoints(points)} fichas que pasan del vendedor al comprador
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
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

/* --------------------- Añadir jugador a la mesa --------------------- */
function AddToTableButton({
  gameId,
  roster,
}: {
  gameId: string;
  roster: RosterPlayer[];
}) {
  const router = useRouter();
  return (
    <ModalButton
      label={
        <>
          <UserPlus size={16} />
          Añadir jugador a la mesa
        </>
      }
      title="Añadir a la mesa"
      className={`${buttonClass("secondary", "sm")} w-full`}
    >
      {(close) => (
        <AddToTableList
          close={close}
          gameId={gameId}
          roster={roster}
          onDone={() => router.refresh()}
        />
      )}
    </ModalButton>
  );
}

function AddToTableList({
  close,
  gameId,
  roster,
  onDone,
}: {
  close: () => void;
  gameId: string;
  roster: RosterPlayer[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add(playerId: string) {
    setError(null);
    startTransition(async () => {
      const res = await addPlayerToGame(gameId, playerId);
      if (res.ok) {
        close();
        onDone();
      } else setError(res.error);
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-500">
        Elige a quién sentar en la mesa. Entra sin fichas; hazle un buy-in
        después.
      </p>
      <div className="max-h-64 space-y-1.5 overflow-y-auto no-scrollbar">
        {roster.map((p) => (
          <button
            key={p.playerId}
            onClick={() => add(p.playerId)}
            disabled={pending}
            className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            <Avatar name={p.name} src={p.avatarUrl} size={32} />
            <span className="flex-1 font-medium text-neutral-900">{p.name}</span>
            <Plus size={16} className="text-neutral-400" />
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/* ----------------------- Ajuste manual (cuadrar) -------------------- */
function AdjustmentButton({
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
      label={
        <>
          <SlidersHorizontal size={16} />
          Ajuste manual
        </>
      }
      title="Ajuste manual"
      className={`${buttonClass("ghost", "sm")} w-full`}
    >
      {(close) => (
        <AdjustmentForm
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

function AdjustmentForm({
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
  const [playerId, setPlayerId] = useState("");
  const [money, setMoney] = useState("");
  const moneyNum = money ? Number(money) : 0;
  const points = moneyNum ? moneyToPoints(moneyNum, rate) : 0;

  function submit() {
    setError(null);
    if (!playerId) return setError("Elige un jugador");
    if (!moneyNum) return setError("El importe no puede ser 0");
    startTransition(async () => {
      const res = await addAdjustment({ gameId, playerId, money: moneyNum });
      if (res.ok) {
        close();
        onDone();
      } else setError(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        Corrige un descuadre: suma (importe positivo) o resta (importe negativo)
        dinero y fichas a un jugador. Útil si se olvidó un buy-in o el recuento
        no cuadra.
      </p>
      <div>
        <label className={labelClass}>Jugador</label>
        <select
          className={inputClass}
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
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
        <label className={labelClass}>Importe ({currency})</label>
        <input
          className={inputClass}
          type="number"
          inputMode="decimal"
          placeholder="Ej: 5 ó -5"
          value={money}
          onChange={(e) => setMoney(e.target.value)}
          autoFocus
        />
        <p className="mt-1.5 text-xs text-neutral-400">
          = {formatPoints(points)} fichas {moneyNum < 0 ? "menos" : "más"}
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={close} className={`${buttonClass("secondary")} flex-1`}>
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={pending || !money}
          className={`${buttonClass("primary")} flex-1`}
        >
          {pending ? "Guardando…" : "Aplicar ajuste"}
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
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <Card className="p-4 text-center text-sm text-neutral-500">
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
      <h2 className="mb-2 text-sm font-semibold text-neutral-500">
        Movimientos ({transactions.length})
      </h2>
      <Card className="divide-y divide-neutral-100">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-3 py-2.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                t.type === "transfer"
                  ? "bg-neutral-100 text-neutral-600"
                  : t.type === "adjustment"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {t.type === "transfer" ? (
                <ArrowLeftRight size={15} />
              ) : t.type === "adjustment" ? (
                <SlidersHorizontal size={15} />
              ) : (
                <Coins size={15} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-neutral-900">
                {t.type === "transfer"
                  ? `${nameById[t.playerId] ?? "?"} compró a ${nameById[t.counterpartyId ?? ""] ?? "?"}`
                  : t.type === "adjustment"
                    ? `${nameById[t.playerId] ?? "?"} · ajuste`
                    : `${nameById[t.playerId] ?? "?"} · buy-in`}
              </div>
              <div className="text-xs text-neutral-400">
                {formatMoney(t.money, currency)} · {formatPoints(t.points)} fichas
              </div>
            </div>
            {canDelete &&
              (confirmId === t.id ? (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => {
                      del(t.id);
                      setConfirmId(null);
                    }}
                    disabled={pending}
                    className="flex h-8 items-center rounded-lg bg-red-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-red-500"
                  >
                    Borrar
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                    aria-label="Cancelar"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(t.id)}
                  disabled={pending}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Borrar movimiento"
                >
                  <Trash2 size={16} />
                </button>
              ))}
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
      <h2 className="mb-2 text-sm font-semibold text-neutral-500">
        Quién paga a quién
      </h2>
      <Card className="divide-y divide-neutral-100">
        {settlements.map((s) => (
          <button
            key={s.id}
            onClick={() => toggle(s)}
            disabled={pending}
            className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-neutral-50"
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-md ${
                s.isPaid
                  ? "bg-emerald-600 text-white"
                  : "border border-neutral-300 bg-white"
              }`}
            >
              {s.isPaid && <Check size={14} strokeWidth={3} />}
            </span>
            <div className="flex-1 text-sm">
              <span className="font-semibold text-neutral-900">
                {nameById[s.from] ?? "?"}
              </span>{" "}
              <span className="text-neutral-500">paga a</span>{" "}
              <span className="font-semibold text-neutral-900">
                {nameById[s.to] ?? "?"}
              </span>
            </div>
            <span
              className={`font-bold tabular-nums ${s.isPaid ? "text-neutral-400 line-through" : "text-emerald-600"}`}
            >
              {formatMoney(s.amount, currency)}
            </span>
          </button>
        ))}
      </Card>
      <p className="mt-2 text-xs text-neutral-400">
        Toca cada línea para marcarla como pagada.
      </p>
    </div>
  );
}
