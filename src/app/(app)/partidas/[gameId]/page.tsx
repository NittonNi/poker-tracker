import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GameBoard } from "@/components/game-board";

export default async function PartidaPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const supabase = await createClient();

  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();
  if (!game) notFound();

  const [
    { data: group },
    { data: gps },
    { data: roster },
    { data: txs },
    { data: settlements },
  ] = await Promise.all([
    supabase.from("groups").select("id, name").eq("id", game.group_id).single(),
    supabase
      .from("game_players")
      .select("player_id, final_chips")
      .eq("game_id", gameId),
    supabase
      .from("players")
      .select("id, display_name, avatar_url")
      .eq("group_id", game.group_id),
    supabase
      .from("transactions")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true }),
    supabase.from("settlements").select("*").eq("game_id", gameId),
  ]);

  const rosterById = new Map(
    (roster ?? []).map((p) => [p.id, p]),
  );
  const players = (gps ?? []).map((g) => {
    const p = rosterById.get(g.player_id);
    return {
      playerId: g.player_id,
      name: p?.display_name ?? "Jugador",
      avatarUrl: p?.avatar_url ?? null,
      finalChips: g.final_chips,
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/grupos/${game.group_id}`}
          className="mb-2 inline-block text-sm text-zinc-400 hover:text-white"
        >
          ← {group?.name ?? "Grupo"}
        </Link>
      </div>
      <GameBoard
        game={{
          id: game.id,
          groupId: game.group_id,
          name: game.name,
          playedOn: game.played_on,
          status: game.status as "open" | "closed",
          rate: Number(game.rate),
          currency: game.currency,
        }}
        players={players}
        transactions={(txs ?? []).map((t) => ({
          id: t.id,
          type: t.type as "buy_in" | "transfer" | "adjustment",
          playerId: t.player_id,
          counterpartyId: t.counterparty_player_id,
          money: Number(t.amount_money),
          points: Number(t.amount_points),
          note: t.note,
          createdAt: t.created_at,
        }))}
        settlements={(settlements ?? []).map((s) => ({
          id: s.id,
          from: s.from_player_id,
          to: s.to_player_id,
          amount: Number(s.amount_money),
          isPaid: s.is_paid,
        }))}
      />
    </div>
  );
}
