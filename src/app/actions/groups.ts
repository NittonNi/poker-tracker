"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthed, type ActionResult } from "./helpers";

export async function createGroup(input: {
  name: string;
  /** buy-in estándar en € */
  buyin: number;
  /** fichas que se reciben por ese buy-in */
  buyinChips: number;
}): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const name = input.name?.trim();
  if (!name) return { ok: false, error: "Pon un nombre al grupo" };
  const buyin = Number(input.buyin);
  const chips = Number(input.buyinChips);
  if (!isFinite(buyin) || buyin <= 0)
    return { ok: false, error: "El buy-in debe ser mayor que 0 €" };
  if (!isFinite(chips) || chips <= 0)
    return { ok: false, error: "Las fichas del buy-in deben ser mayor que 0" };
  const rate = chips / buyin; // fichas por €

  const { data: groupId, error } = await supabase.rpc("create_group", {
    p_name: name,
    p_currency: "€",
    p_rate: rate,
  });
  if (error) return { ok: false, error: error.message };

  if (groupId) {
    await supabase
      .from("groups")
      .update({ default_buyin: buyin })
      .eq("id", groupId);
  }

  revalidatePath("/grupos");
  return { ok: true };
}

export async function renameGroup(
  groupId: string,
  name: string,
): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const trimmed = name?.trim();
  if (!trimmed) return { ok: false, error: "Nombre vacío" };
  const { error } = await supabase
    .from("groups")
    .update({ name: trimmed })
    .eq("id", groupId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/grupos/${groupId}`);
  revalidatePath("/grupos");
  return { ok: true };
}

export async function updateGroupSettings(
  groupId: string,
  input: { buyin: number; buyinChips: number },
): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const buyin = Number(input.buyin);
  const chips = Number(input.buyinChips);
  if (!isFinite(buyin) || buyin <= 0)
    return { ok: false, error: "El buy-in debe ser mayor que 0 €" };
  if (!isFinite(chips) || chips <= 0)
    return { ok: false, error: "Las fichas del buy-in deben ser mayor que 0" };
  const { error } = await supabase
    .from("groups")
    .update({
      default_buyin: buyin,
      default_rate: chips / buyin,
    })
    .eq("id", groupId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/grupos/${groupId}`);
  return { ok: true };
}

/** Une al usuario actual a un grupo a partir del código de invitación. */
export async function joinGroupByCode(
  code: string,
): Promise<{ ok: true; groupId: string } | { ok: false; error: string }> {
  const { supabase } = await getAuthed();
  const { data, error } = await supabase.rpc("join_group_by_code", {
    p_code: code,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/grupos");
  return { ok: true, groupId: data as string };
}

/** Regenera el código de invitación (invalida los enlaces antiguos). */
export async function regenerateInviteCode(
  groupId: string,
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const { supabase } = await getAuthed();
  const code = crypto.randomUUID().replace(/-/g, "");
  const { error } = await supabase
    .from("groups")
    .update({ invite_code: code })
    .eq("id", groupId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/grupos/${groupId}`);
  return { ok: true, code };
}

/** El usuario se sale del grupo (conserva el historial para los demás). */
export async function leaveGroup(groupId: string): Promise<void> {
  const { supabase, user } = await getAuthed();
  await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);
  revalidatePath("/grupos");
  redirect("/grupos");
}

export async function deleteGroup(groupId: string): Promise<void> {
  const { supabase } = await getAuthed();
  await supabase.from("groups").delete().eq("id", groupId);
  revalidatePath("/grupos");
  redirect("/grupos");
}
