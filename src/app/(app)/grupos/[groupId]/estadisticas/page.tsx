import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import { BackLink } from "@/components/back-link";
import { formatSignedMoney, formatMoney, balanceColor } from "@/lib/format";

export default async function EstadisticasPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, currency")
    .eq("id", groupId)
    .single();
  if (!group) notFound();
  const currency = group.currency;

  const [{ data: stats }, { data: players }, { data: games }] =
    await Promise.all([
      supabase.from("player_stats").select("*").eq("group_id", groupId),
      supabase
        .from("players")
        .select("id, display_name, avatar_url")
        .eq("group_id", groupId),
      supabase.from("games").select("id").eq("group_id", groupId),
    ]);

  const gameIds = (games ?? []).map((g) => g.id);
  const { data: settlements } = gameIds.length
    ? await supabase
        .from("settlements")
        .select("id, from_player_id, to_player_id, amount_money")
        .in("game_id", gameIds)
        .eq("is_paid", false)
    : { data: [] as never[] };

  const playerName = new Map(
    (players ?? []).map((p) => [p.id, p.display_name]),
  );

  const ranking = (stats ?? [])
    .filter((s) => (s.games_played ?? 0) > 0)
    .sort((a, b) => Number(b.total_net ?? 0) - Number(a.total_net ?? 0));

  const podium = ranking.slice(0, 3);
  const medals = ["🥇", "🥈", "🥉"];

  const debts = (settlements ?? []).sort(
    (a, b) => Number(b.amount_money ?? 0) - Number(a.amount_money ?? 0),
  );

  return (
    <div className="space-y-5">
      <div>
        <BackLink href={`/grupos/${groupId}`} label={group.name} />
        <PageHeader
          title="Estadísticas"
          subtitle="Acumulado de todas las partidas cerradas."
        />
      </div>

      {ranking.length === 0 ? (
        <EmptyState
          icon="📊"
          title="Aún no hay datos"
          description="Cierra alguna partida para ver el ranking y los totales."
        />
      ) : (
        <>
          {/* Podio */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 0, 2].map((pos) => {
              const s = podium[pos];
              if (!s) return <div key={pos} />;
              const net = Number(s.total_net ?? 0);
              const isFirst = pos === 0;
              return (
                <div
                  key={s.player_id}
                  className={`flex flex-col items-center rounded-2xl border p-3 text-center ${
                    isFirst
                      ? "order-2 border-amber-300 bg-amber-50"
                      : pos === 1
                        ? "order-1 mt-4 border-neutral-200 bg-white"
                        : "order-3 mt-4 border-neutral-200 bg-white"
                  }`}
                >
                  <div className="text-2xl">{medals[pos]}</div>
                  <Avatar
                    name={s.display_name ?? "?"}
                    size={isFirst ? 48 : 40}
                  />
                  <div className="mt-1 w-full truncate text-sm font-semibold text-neutral-900">
                    {s.display_name}
                  </div>
                  <div
                    className={`text-sm font-bold tabular-nums ${balanceColor(net)}`}
                  >
                    {formatSignedMoney(net, currency)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ranking detallado (todos) */}
          <ol className="space-y-3">
            {ranking.map((s, i) => (
              <li key={s.player_id}>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 shrink-0 text-center text-lg font-bold text-neutral-400">
                      {i < 3 ? medals[i] : i + 1}
                    </div>
                    <Avatar name={s.display_name ?? "?"} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-neutral-900">
                        {s.display_name}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {s.games_played} partidas · {s.games_won} ganadas
                      </div>
                    </div>
                    <div
                      className={`text-lg font-bold tabular-nums ${balanceColor(Number(s.total_net ?? 0))}`}
                    >
                      {formatSignedMoney(Number(s.total_net ?? 0), currency)}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Stat
                      label="Mejor"
                      value={formatSignedMoney(Number(s.best_game ?? 0), currency)}
                      valueClassName={balanceColor(Number(s.best_game ?? 0))}
                    />
                    <Stat
                      label="Peor"
                      value={formatSignedMoney(Number(s.worst_game ?? 0), currency)}
                      valueClassName={balanceColor(Number(s.worst_game ?? 0))}
                    />
                    <Stat
                      label="Invertido"
                      value={formatMoney(Number(s.total_invested ?? 0), currency)}
                    />
                  </div>
                </Card>
              </li>
            ))}
          </ol>

          {/* Cuentas pendientes del grupo */}
          {debts.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-neutral-500">
                Cuentas pendientes del grupo
              </h2>
              <Card className="divide-y divide-neutral-100">
                {debts.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-neutral-900">
                        {playerName.get(d.from_player_id) ?? "?"}
                      </span>{" "}
                      <span className="text-neutral-400">paga a</span>{" "}
                      <span className="font-semibold text-neutral-900">
                        {playerName.get(d.to_player_id) ?? "?"}
                      </span>
                    </div>
                    <span className="shrink-0 font-bold tabular-nums text-neutral-900">
                      {formatMoney(Number(d.amount_money ?? 0), currency)}
                    </span>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
