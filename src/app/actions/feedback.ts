"use server";

import { getAuthed, type ActionResult } from "./helpers";

export async function submitFeedback(input: {
  kind: "bug" | "idea" | "general";
  message: string;
  page?: string;
}): Promise<ActionResult> {
  const { supabase, user } = await getAuthed();
  const message = input.message?.trim();
  if (!message) return { ok: false, error: "Escribe tu mensaje" };
  if (message.length > 4000)
    return { ok: false, error: "El mensaje es demasiado largo" };

  const kind = ["bug", "idea", "general"].includes(input.kind)
    ? input.kind
    : "general";

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    email: user.email ?? null,
    kind,
    message,
    page: input.page ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
