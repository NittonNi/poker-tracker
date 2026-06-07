"use server";

import { revalidatePath } from "next/cache";
import { getAuthed, type ActionResult } from "./helpers";

/** Guarda el nombre con el que la app te llama (perfil global). */
export async function setDisplayName(name: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthed();
  const clean = name?.trim();
  if (!clean) return { ok: false, error: "Escribe un nombre" };
  if (clean.length > 40) return { ok: false, error: "Nombre demasiado largo" };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: clean })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
