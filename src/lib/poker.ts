/**
 * Lógica de negocio del tracker de poker.
 *
 * Todo aquí son funciones PURAS (sin side effects) para poder testearlas
 * de forma aislada. Reproducen exactamente el cálculo de la vista
 * `game_balances` de Supabase, de modo que la previsualización en cliente
 * y el cálculo en servidor siempre coinciden.
 *
 * Modelo de dinero <-> puntos:
 *   - `rate` = puntos por 1 unidad de moneda (ej. 1 € = 100 puntos -> rate = 100).
 *   - dinero -> puntos: money * rate
 *   - puntos -> dinero: points / rate
 *
 * Movimientos (ledger):
 *   - buy_in   : el jugador paga dinero a la mesa/bote y recibe puntos.
 *   - transfer : recompra ENTRE jugadores. `playerId` = comprador (paga dinero,
 *                recibe puntos); `counterpartyId` = vendedor (recibe dinero,
 *                entrega puntos).
 *   - adjustment: ajuste manual (se trata como un buy_in con signo libre).
 *
 * Balance de liquidación de un jugador:
 *   balance = fichas_finales / rate - dinero_neto_invertido
 *   balance > 0  => le tienen que pagar (ganó)
 *   balance < 0  => debe pagar (perdió)
 * La suma de todos los balances de una partida cuadrada es 0.
 */

export type TxType = "buy_in" | "transfer" | "adjustment";

export interface TxInput {
  type: TxType;
  playerId: string;
  counterpartyId?: string | null;
  /** dinero del movimiento (amount_money) */
  money: number;
  /** puntos del movimiento (amount_points) */
  points: number;
}

export interface PlayerBalance {
  playerId: string;
  buyinMoney: number;
  buyinPoints: number;
  transferBuyMoney: number;
  transferBuyPoints: number;
  transferSellMoney: number;
  transferSellPoints: number;
  /** fichas adquiridas según el ledger (compras + transferencias compradas - vendidas) */
  chipsLedger: number;
  /** dinero neto salido de su bolsillo */
  netMoneyIn: number;
  /** fichas finales contadas (null mientras no se cierran) */
  finalChips: number | null;
  /** balance de liquidación (en dinero) */
  balance: number;
}

export interface Payment {
  from: string;
  to: string;
  amount: number;
}

/** Redondea a 2 decimales evitando errores de coma flotante. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Convierte dinero a puntos según el rate (puntos por unidad de moneda). */
export function moneyToPoints(money: number, rate: number): number {
  if (!isFinite(rate) || rate <= 0) return 0;
  return Math.round(money * rate);
}

/** Convierte puntos a dinero según el rate. */
export function pointsToMoney(points: number, rate: number): number {
  if (!isFinite(rate) || rate <= 0) return 0;
  return round2(points / rate);
}

function blank(playerId: string): PlayerBalance {
  return {
    playerId,
    buyinMoney: 0,
    buyinPoints: 0,
    transferBuyMoney: 0,
    transferBuyPoints: 0,
    transferSellMoney: 0,
    transferSellPoints: 0,
    chipsLedger: 0,
    netMoneyIn: 0,
    finalChips: null,
    balance: 0,
  };
}

export interface ComputeBalancesParams {
  playerIds: string[];
  transactions: TxInput[];
  /** fichas finales por jugador; undefined o null = sin contar */
  finalChips: Record<string, number | null | undefined>;
  rate: number;
}

/**
 * Calcula los balances de todos los jugadores de una partida.
 * Mismo cálculo que la vista `game_balances` de la base de datos.
 */
export function computeBalances({
  playerIds,
  transactions,
  finalChips,
  rate,
}: ComputeBalancesParams): PlayerBalance[] {
  const map = new Map<string, PlayerBalance>();
  for (const id of playerIds) map.set(id, blank(id));

  // garantiza que cualquier jugador referenciado por una transacción exista
  const ensure = (id: string) => {
    let p = map.get(id);
    if (!p) {
      p = blank(id);
      map.set(id, p);
    }
    return p;
  };

  for (const tx of transactions) {
    const p = ensure(tx.playerId);
    if (tx.type === "buy_in" || tx.type === "adjustment") {
      p.buyinMoney += tx.money;
      p.buyinPoints += tx.points;
    } else if (tx.type === "transfer") {
      p.transferBuyMoney += tx.money;
      p.transferBuyPoints += tx.points;
      if (tx.counterpartyId) {
        const c = ensure(tx.counterpartyId);
        c.transferSellMoney += tx.money;
        c.transferSellPoints += tx.points;
      }
    }
  }

  for (const p of map.values()) {
    p.chipsLedger = round2(
      p.buyinPoints + p.transferBuyPoints - p.transferSellPoints,
    );
    p.netMoneyIn = round2(
      p.buyinMoney + p.transferBuyMoney - p.transferSellMoney,
    );
    const fc = finalChips[p.playerId];
    p.finalChips = fc === undefined || fc === null ? null : fc;
    p.balance = round2((p.finalChips ?? 0) / (rate > 0 ? rate : 1) - p.netMoneyIn);
  }

  return [...map.values()];
}

/** Total de fichas en juego según el ledger (debe igualar a las fichas finales sumadas). */
export function totalChipsInPlay(balances: PlayerBalance[]): number {
  return round2(balances.reduce((s, b) => s + b.chipsLedger, 0));
}

/** Total de fichas finales contadas. */
export function totalFinalChips(balances: PlayerBalance[]): number {
  return round2(balances.reduce((s, b) => s + (b.finalChips ?? 0), 0));
}

/**
 * Descuadre de la liquidación: suma de balances (debería ser ~0).
 * Si no es 0 es que las fichas finales no cuadran con el dinero en juego.
 */
export function settlementMismatch(
  balances: { balance: number }[],
): number {
  return round2(balances.reduce((s, b) => s + b.balance, 0));
}

/**
 * Calcula quién paga a quién minimizando el nº de pagos (algoritmo greedy:
 * se empareja el mayor deudor con el mayor acreedor sucesivamente).
 *
 * @param balances lista de { playerId, balance }. balance>0 cobra, balance<0 paga.
 * @param epsilon  tolerancia para considerar un balance como cero.
 */
export function computeSettlements(
  balances: { playerId: string; balance: number }[],
  epsilon = 0.01,
): Payment[] {
  const creditors = balances
    .filter((b) => b.balance > epsilon)
    .map((b) => ({ id: b.playerId, amt: round2(b.balance) }))
    .sort((a, b) => b.amt - a.amt);
  const debtors = balances
    .filter((b) => b.balance < -epsilon)
    .map((b) => ({ id: b.playerId, amt: round2(-b.balance) }))
    .sort((a, b) => b.amt - a.amt);

  const payments: Payment[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = round2(Math.min(debtors[i].amt, creditors[j].amt));
    if (pay > 0) {
      payments.push({ from: debtors[i].id, to: creditors[j].id, amount: pay });
    }
    debtors[i].amt = round2(debtors[i].amt - pay);
    creditors[j].amt = round2(creditors[j].amt - pay);
    if (debtors[i].amt <= epsilon) i++;
    if (creditors[j].amt <= epsilon) j++;
  }
  return payments;
}
