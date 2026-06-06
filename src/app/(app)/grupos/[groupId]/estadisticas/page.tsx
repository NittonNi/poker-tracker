import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
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

  const { data: stats } = await supabase
    .from("player_stats")
    .select("*")
    .eq("group_id", groupId);

  const ranking = (stats ?? [])
    .filter((s) => (s.games_played ?? 0) > 0)
    .sort((a, b) => Number(b.total_net ?? 0) - Number(a.total_net ?? 0));

  const currency = group.currency;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/grupos/${groupId}`}
          className="mb-2 inline-block text-sm text-zinc-400 hover:text-white"
        >
          ← {group.name}
        </Link>
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
        <ol className="space-y-3">
          {ranking.map((s, i) => (
            <li key={s.player_id}>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 text-center text-lg font-bold text-zinc-500">
                    {i + 1}
                  </div>
                  <Avatar name={s.display_name ?? "?"} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-white">
                      {s.display_name}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {s.games_played} partidas · {s.games_won} ganadas
                    </div>
                  </div>
                  <div
                    className={`text-xl font-bold tabular-nums ${balanceColor(Number(s.total_net ?? 0))}`}
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
      )}
    </div>
  );
}
