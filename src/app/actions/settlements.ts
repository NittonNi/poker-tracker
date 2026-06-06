"use server";

import { revalidatePath } from "next/cache";
import { getAuthed, type ActionResult } from "./helpers";

/** Marca/desmarca un pago de la liquidación como pagado. */
export async function setSettlementPaid(
  settlementId: string,
  gameId: string,
  isPaid: boolean,
): Promise<ActionResult> {
  const { supabase } = await getAuthed();
  const { error } = await supabase
    .from("settlements")
    .update({ is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null })
    .eq("id", settlementId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/partidas/${gameId}`);
  return { ok: true };
}
