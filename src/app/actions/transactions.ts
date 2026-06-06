"use server";

import { revalidatePath } from "next/cache";
import { getAuthed, type ActionResult } from "./helpers";
import { moneyToPoints } from "@/lib/poker";

async function gameRate(
  supabase: Awaited<ReturnType<typeof getAuthed>>["supabase"],
  gameId: string,
) {
  const { data } = await supabase
    .from("games")
    .select("rate, status")
    .eq("id", gameId)
    .single();
  return data;
}

/** Buy-in / recompra a la mesa (bote): el jugador paga dinero y recibe puntos. */
export async function addBuyIn(input: {
  gameId: string;
  playerId: string;
  money: number;
  note?: string;
}): Promise<ActionResult> {
  const { supabase, user } = await getAuthed();
  const game = await gameRate(supabase, input.gameId);
  if (!game) return { ok: false, error: "Partida no encontrada" };
  if (game.status === "closed")
    return { ok: false, error: "La partida está cerrada" };
  const money = Number(input.money);
  if (!isFinite(money) || money <= 0)
    return { ok: false, error: "Importe inválido" };

  const { error } = await supabase.from("transactions").insert({
    game_id: input.gameId,
    type: "buy_in",
    player_id: input.playerId,
    amount_money: money,
    amount_points: moneyToPoints(money, Number(game.rate)),
    note: input.note?.trim() || null,
    created_by: user.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/partidas/${input.gameId}`);
  return { ok: true };
}

/** Recompra ENTRE jugadores: el comprador paga al vendedor y recibe sus fichas. */
export async function addTransfer(input: {
  gameId: string;
  buyerId: string;
  sellerId: string;
  money: number;
  note?: string;
}): Promise<ActionResult> {
  const { supabase, user } = await getAuthed();
  if (input.buyerId === input.sellerId)
    return { ok: false, error: "Comprador y vendedor no pueden ser el mismo" };
  const game = await gameRate(supabase, input.gameId);
  if (!game) return { ok: false, error: "Partida no encontrada" };
  if (game.status === "closed")
    return { ok: false, error: "La partida está cerrada" };
  const money = Number(input.money);
  if (!isFinite(money) || money <= 0)
    return { ok: false, error: "Importe inválido" };

  const { error } = await supabase.from("transactions").insert({
    game_id: input.gameId,
    type: "transfer",
    player_id: input.buyerId,
    counterparty_player_id: input.sellerId,
    amount_money: money,
    amount_points: moneyToPoints(money, Number(game.rate)),
    note: input.note?.trim() || null,
    created_by: user.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/partidas/${input.gameId}`);
  return { ok: true };
}

export async function deleteTransaction(
  transactionId: string,
  gameId: string,
): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/partidas/${gameId}`);
  return { ok: true };
}
