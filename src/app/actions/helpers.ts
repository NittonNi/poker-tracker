import { createClient } from "@/lib/supabase/server";

/** Devuelve el cliente Supabase y el usuario, o lanza si no hay sesión. */
export async function getAuthed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, user };
}

export type ActionResult = { ok: true } | { ok: false; error: string };
