"use server";

import { revalidatePath } from "next/cache";
import { getAuthed } from "./helpers";
import { createGame, setFinalChips, closeGame } from "./games";

/**
 * Crea un grupo de ejemplo con jugadores y una partida ya cerrada,
 * para que un usuario nuevo vea la app "viva" (bote, podio, liquidación).
 */
export async function createDemoGroup(): Promise<
  { ok: true; groupId: string } | { ok: false; error: string }
> {
  const { supabase, user } = await getAuthed();

  const { data: groupId, error } = await supabase.rpc("create_group", {
    p_name: "Partidas de ejemplo 🎲",
    p_currency: "€",
    p_rate: 100,
  });
  if (error || !groupId)
    return { ok: false, error: error?.message ?? "No se pudo crear" };

  // Jugadores invitados de ejemplo
  const { data: guests, error: gErr } = await supabase
    .from("players")
    .insert([
      { group_id: groupId, display_name: "Marcos" },
      { group_id: groupId, display_name: "Ana" },
      { group_id: groupId, display_name: "Leo" },
    ])
    .select("id");
  if (gErr || !guests || guests.length < 3)
    return { ok: false, error: gErr?.message ?? "Error creando jugadores" };

  // Tu jugador (lo crea create_group)
  const { data: owner } = await supabase
    .from("players")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();
  if (!owner) return { ok: true, groupId }; // grupo creado aunque falle el resto

  const playerIds = [owner.id, guests[0].id, guests[1].id, guests[2].id];
  const today = new Date().toISOString().slice(0, 10);

  const res = await createGame({
    groupId,
    name: "Noche de ejemplo",
    playedOn: today,
    buyin: 10,
    buyinChips: 1000,
    playerIds,
    applyInitialBuyIn: true,
  });
  if (!res.ok) return { ok: true, groupId };

  // Fichas finales que cuadran (total 4.000 fichas = 40 €)
  const finals: [string, number][] = [
    [owner.id, 2200], // tú ganas (+12 €)
    [guests[0].id, 1200], // Marcos (+2 €)
    [guests[1].id, 600], // Ana (−4 €)
    [guests[2].id, 0], // Leo (−10 €)
  ];
  for (const [pid, chips] of finals) {
    await setFinalChips(res.gameId, pid, chips);
  }
  await closeGame(res.gameId);

  revalidatePath("/grupos");
  return { ok: true, groupId };
}
