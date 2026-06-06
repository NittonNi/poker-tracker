"use server";

import { revalidatePath } from "next/cache";
import { getAuthed, type ActionResult } from "./helpers";

/** Añade un jugador invitado (sin cuenta) al grupo. */
export async function addPlayer(
  groupId: string,
  displayName: string,
): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const name = displayName?.trim();
  if (!name) return { ok: false, error: "Pon un nombre" };

  const { error } = await supabase.from("players").insert({
    group_id: groupId,
    display_name: name,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/grupos/${groupId}/jugadores`);
  revalidatePath(`/grupos/${groupId}`);
  return { ok: true };
}

export async function renamePlayer(
  playerId: string,
  groupId: string,
  displayName: string,
): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const name = displayName?.trim();
  if (!name) return { ok: false, error: "Nombre vacío" };
  const { error } = await supabase
    .from("players")
    .update({ display_name: name })
    .eq("id", playerId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/grupos/${groupId}/jugadores`);
  return { ok: true };
}

/** Activa/desactiva un jugador (para cuando alguien deja de jugar). */
export async function setPlayerActive(
  playerId: string,
  groupId: string,
  active: boolean,
): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const { error } = await supabase
    .from("players")
    .update({ is_active: active })
    .eq("id", playerId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/grupos/${groupId}/jugadores`);
  revalidatePath(`/grupos/${groupId}`);
  return { ok: true };
}

/** Borra un jugador por completo (incluye su historial). Usar con cuidado. */
export async function deletePlayer(
  playerId: string,
  groupId: string,
): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const { error } = await supabase.from("players").delete().eq("id", playerId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/grupos/${groupId}/jugadores`);
  revalidatePath(`/grupos/${groupId}`);
  return { ok: true };
}
