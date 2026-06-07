import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GameBoard } from "@/components/game-board";
import { BackLink } from "@/components/back-link";

export default async function PartidaPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    supabase
      .from("groups")
      .select("id, name, created_by")
      .eq("id", game.group_id)
      .single(),
    supabase
      .from("game_players")
      .select("player_id, final_chips")
      .eq("game_id", gameId),
    supabase
      .from("players")
      .select("id, display_name, avatar_url, is_active")
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

  // Jugadores del grupo (activos) que aún no están en la mesa.
  const inGame = new Set((gps ?? []).map((g) => g.player_id));
  const eligible = (roster ?? [])
    .filter((p) => p.is_active && !inGame.has(p.id))
    .map((p) => ({
      playerId: p.id,
      name: p.display_name,
      avatarUrl: p.avatar_url ?? null,
    }));

  return (
    <div className="space-y-4">
      <BackLink href={`/grupos/${game.group_id}`} label={group?.name ?? "Grupo"} />
      <GameBoard
        game={{
          id: game.id,
          groupId: game.group_id,
          name: game.name,
          playedOn: game.played_on,
          status: game.status as "open" | "closed",
          rate: Number(game.rate),
          buyin: Number(game.buyin),
          currency: game.currency,
        }}
        players={players}
        roster={eligible}
        isOwner={group?.created_by === user?.id}
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
