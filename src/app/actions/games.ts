"use server";

import { revalidatePath } from "next/cache";
import { getAuthed, type ActionResult } from "./helpers";
import type { TablesUpdate } from "@/lib/database.types";
import {
  computeBalances,
  computeSettlements,
  moneyToPoints,
  round2,
  type TxInput,
} from "@/lib/poker";

export async function createGame(input: {
  groupId: string;
  name: string;
  playedOn: string;
  /** buy-in estándar en € */
  buyin: number;
  /** fichas que se reciben por ese buy-in (ignorado en modo euros) */
  buyinChips: number;
  playerIds: string[];
  /** si true, registra un buy-in estándar a todos los jugadores al crear */
  applyInitialBuyIn?: boolean;
  /** modo euros: sin fichas, se juega en € (admite decimales) */
  cashMode?: boolean;
}): Promise<{ ok: true; gameId: string } | { ok: false; error: string }> {
  const { supabase, user } = await getAuthed();

  if (!input.playerIds?.length)
    return { ok: false, error: "Selecciona al menos un jugador" };
  const cashMode = !!input.cashMode;
  const buyin = Number(input.buyin);
  if (!isFinite(buyin) || buyin <= 0)
    return { ok: false, error: "El buy-in debe ser mayor que 0 €" };

  let rate = 1;
  if (!cashMode) {
    const chips = Number(input.buyinChips);
    if (!isFinite(chips) || chips <= 0)
      return { ok: false, error: "Las fichas del buy-in deben ser mayor que 0" };
    rate = chips / buyin; // fichas por €
  }

  const { data: game, error } = await supabase
    .from("games")
    .insert({
      group_id: input.groupId,
      name: input.name?.trim() || "Partida",
      played_on: input.playedOn,
      rate,
      buyin,
      cash_mode: cashMode,
      currency: "€",
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !game) return { ok: false, error: error?.message ?? "Error" };

  const { error: gpError } = await supabase.from("game_players").insert(
    input.playerIds.map((pid) => ({ game_id: game.id, player_id: pid })),
  );
  if (gpError) return { ok: false, error: gpError.message };

  // Buy-in inicial opcional: registra el buy-in estándar a todos.
  if (input.applyInitialBuyIn) {
    const points = cashMode ? round2(buyin) : moneyToPoints(buyin, rate);
    const { error: txError } = await supabase.from("transactions").insert(
      input.playerIds.map((pid) => ({
        game_id: game.id,
        type: "buy_in",
        player_id: pid,
        amount_money: buyin,
        amount_points: points,
        created_by: user.id,
      })),
    );
    if (txError) return { ok: false, error: txError.message };
  }

  revalidatePath(`/grupos/${input.groupId}`);
  return { ok: true, gameId: game.id };
}

export async function addPlayerToGame(
  gameId: string,
  playerId: string,
): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const { error } = await supabase
    .from("game_players")
    .insert({ game_id: gameId, player_id: playerId });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/partidas/${gameId}`);
  return { ok: true };
}

export async function removePlayerFromGame(
  gameId: string,
  playerId: string,
): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  // No permitir si tiene movimientos
  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("game_id", gameId)
    .or(`player_id.eq.${playerId},counterparty_player_id.eq.${playerId}`);
  if ((count ?? 0) > 0)
    return {
      ok: false,
      error: "No se puede quitar: el jugador ya tiene movimientos en la partida",
    };

  const { error } = await supabase
    .from("game_players")
    .delete()
    .eq("game_id", gameId)
    .eq("player_id", playerId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/partidas/${gameId}`);
  return { ok: true };
}

export async function setFinalChips(
  gameId: string,
  playerId: string,
  chips: number | null,
): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const { error } = await supabase
    .from("game_players")
    .update({ final_chips: chips })
    .eq("game_id", gameId)
    .eq("player_id", playerId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/partidas/${gameId}`);
  return { ok: true };
}

export async function updateGame(
  gameId: string,
  input: {
    name?: string;
    playedOn?: string;
    buyin?: number;
    buyinChips?: number;
    notes?: string;
  },
): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const patch: TablesUpdate<"games"> = {};
  if (input.name !== undefined) patch.name = input.name.trim() || "Partida";
  if (input.playedOn !== undefined) patch.played_on = input.playedOn;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.buyin !== undefined && input.buyinChips !== undefined) {
    const buyin = Number(input.buyin);
    const chips = Number(input.buyinChips);
    if (!isFinite(buyin) || buyin <= 0)
      return { ok: false, error: "El buy-in debe ser mayor que 0 €" };
    if (!isFinite(chips) || chips <= 0)
      return { ok: false, error: "Las fichas del buy-in deben ser mayor que 0" };
    patch.buyin = buyin;
    patch.rate = chips / buyin;
  }
  const { error } = await supabase.from("games").update(patch).eq("id", gameId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/partidas/${gameId}`);
  return { ok: true };
}

/**
 * Cierra la partida: calcula los balances y la liquidación (quién paga a quién)
 * en el servidor y los guarda de forma atómica vía la RPC `close_game`.
 */
export async function closeGame(gameId: string): Promise<ActionResult> {
  const { supabase } = await getAuthed();

  const [{ data: game }, { data: gps }, { data: txs }] = await Promise.all([
    supabase.from("games").select("rate").eq("id", gameId).single(),
    supabase
      .from("game_players")
      .select("player_id, final_chips")
      .eq("game_id", gameId),
    supabase
      .from("transactions")
      .select("type, player_id, counterparty_player_id, amount_money, amount_points")
      .eq("game_id", gameId),
  ]);

  if (!game || !gps) return { ok: false, error: "No se encontró la partida" };

  const missing = gps.filter((g) => g.final_chips === null);
  if (missing.length > 0)
    return {
      ok: false,
      error: `Faltan fichas finales por contar en ${missing.length} jugador(es)`,
    };

  const transactions: TxInput[] = (txs ?? []).map((t) => ({
    type: t.type as TxInput["type"],
    playerId: t.player_id,
    counterpartyId: t.counterparty_player_id,
    money: Number(t.amount_money),
    points: Number(t.amount_points),
  }));
  const finalChips: Record<string, number | null> = {};
  for (const g of gps) finalChips[g.player_id] = g.final_chips;

  const balances = computeBalances({
    playerIds: gps.map((g) => g.player_id),
    transactions,
    finalChips,
    rate: Number(game.rate),
  });

  const mismatch = balances.reduce((s, b) => s + b.balance, 0);
  if (Math.abs(mismatch) > 0.05)
    return {
      ok: false,
      error: `Las fichas finales no cuadran con el dinero en juego (descuadre ${mismatch.toFixed(2)}). Revisa los recuentos.`,
    };

  const settlements = computeSettlements(
    balances.map((b) => ({ playerId: b.playerId, balance: b.balance })),
  ).map((p) => ({ from: p.from, to: p.to, amount: p.amount }));

  const { error } = await supabase.rpc("close_game", {
    p_game_id: gameId,
    p_settlements: settlements,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/partidas/${gameId}`);
  return { ok: true };
}

export async function reopenGame(gameId: string): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const { error } = await supabase.rpc("reopen_game", { p_game_id: gameId });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/partidas/${gameId}`);
  return { ok: true };
}

export async function deleteGame(
  gameId: string,
  groupId: string,
): Promise<void> {
  const { supabase, user } = await getAuthed();
  // Solo el dueño del grupo puede borrar partidas.
  const { data: g } = await supabase
    .from("groups")
    .select("created_by")
    .eq("id", groupId)
    .single();
  if (g?.created_by !== user.id) return;
  await supabase.from("games").delete().eq("id", gameId);
  revalidatePath(`/grupos/${groupId}`);
}
