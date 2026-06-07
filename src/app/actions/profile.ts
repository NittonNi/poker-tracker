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

/** Actualiza nombre y/o teléfono (Bizum) del perfil. */
export async function updateProfile(input: {
  displayName: string;
  phone: string;
}): Promise<ActionResult> {
  const { supabase, user } = await getAuthed();
  const name = input.displayName?.trim();
  if (!name) return { ok: false, error: "Escribe un nombre" };
  if (name.length > 40) return { ok: false, error: "Nombre demasiado largo" };

  const phoneRaw = (input.phone ?? "").trim();
  // Solo dígitos, +, espacios; vacío = sin teléfono.
  if (phoneRaw && !/^[+\d][\d\s]{5,18}$/.test(phoneRaw))
    return { ok: false, error: "Teléfono no válido" };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name, phone: phoneRaw || null })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  revalidatePath("/grupos");
  return { ok: true };
}
