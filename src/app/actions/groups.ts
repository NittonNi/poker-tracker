"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthed, type ActionResult } from "./helpers";

export async function createGroup(input: {
  name: string;
  currency: string;
  rate: number;
}): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const name = input.name?.trim();
  if (!name) return { ok: false, error: "Pon un nombre al grupo" };
  const rate = Number(input.rate);
  if (!isFinite(rate) || rate <= 0)
    return { ok: false, error: "El cambio de fichas debe ser mayor que 0" };

  const { error } = await supabase.rpc("create_group", {
    p_name: name,
    p_currency: input.currency || "€",
    p_rate: rate,
  });
  if (error) return { ok: false, error: error.message };

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
  input: { currency: string; default_rate: number },
): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const { error } = await supabase
    .from("groups")
    .update({
      currency: input.currency || "€",
      default_rate: input.default_rate,
    })
    .eq("id", groupId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/grupos/${groupId}`);
  return { ok: true };
}

export async function deleteGroup(groupId: string): Promise<void> {
  const { supabase } = await getAuthed();
  await supabase.from("groups").delete().eq("id", groupId);
  revalidatePath("/grupos");
  redirect("/grupos");
}
