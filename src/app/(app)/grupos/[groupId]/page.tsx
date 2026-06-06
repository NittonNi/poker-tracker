import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, BarChart3, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { NewGameForm } from "@/components/new-game-form";
import { GroupSettings } from "@/components/group-settings";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();
  if (!group) notFound();

  const [{ data: players }, { data: games }, { data: gamePlayers }] =
    await Promise.all([
      supabase
        .from("players")
        .select("id, display_name, is_active, avatar_url")
        .eq("group_id", groupId)
        .order("display_name"),
      supabase
        .from("games")
        .select("id, name, played_on, status")
        .eq("group_id", groupId)
        .order("played_on", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("game_players").select("game_id"),
    ]);

  const activePlayers = (players ?? []).filter((p) => p.is_active);
  const countByGame = new Map<string, number>();
  for (const gp of gamePlayers ?? [])
    countByGame.set(gp.game_id, (countByGame.get(gp.game_id) ?? 0) + 1);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/grupos"
          className="mb-2 inline-block text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Grupos
        </Link>
        <PageHeader
          title={group.name}
          subtitle={`${players?.length ?? 0} jugadores · ${games?.length ?? 0} partidas`}
          action={<GroupSettings group={group} />}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href={`/grupos/${groupId}/jugadores`}>
          <Card className="flex items-center gap-3 p-4 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md">
            <Users className="size-6 text-neutral-700" strokeWidth={1.75} />
            <div>
              <div className="font-semibold text-neutral-900">Jugadores</div>
              <div className="text-xs text-neutral-500">
                {activePlayers.length} activos
              </div>
            </div>
          </Card>
        </Link>
        <Link href={`/grupos/${groupId}/estadisticas`}>
          <Card className="flex items-center gap-3 p-4 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md">
            <BarChart3 className="size-6 text-neutral-700" strokeWidth={1.75} />
            <div>
              <div className="font-semibold text-neutral-900">Estadísticas</div>
              <div className="text-xs text-neutral-500">Ranking y totales</div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900">Partidas</h2>
        <NewGameForm
          groupId={groupId}
          defaultRate={Number(group.default_rate)}
          currency={group.currency}
          players={activePlayers}
        />
      </div>

      {!games?.length ? (
        <EmptyState
          icon="🎰"
          title="Sin partidas todavía"
          description={
            activePlayers.length === 0
              ? "Primero añade jugadores al grupo."
              : "Crea la primera partida para empezar a registrar buy-ins."
          }
        />
      ) : (
        <ul className="space-y-3">
          {games.map((game) => (
            <li key={game.id}>
              <Link href={`/partidas/${game.id}`}>
                <Card className="flex items-center justify-between p-4 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-neutral-900">
                        {game.name}
                      </p>
                      {game.status === "open" ? (
                        <Badge color="emerald">En juego</Badge>
                      ) : (
                        <Badge color="zinc">Cerrada</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {formatDate(game.played_on)} ·{" "}
                      {countByGame.get(game.id) ?? 0} jugadores
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-neutral-400" />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
