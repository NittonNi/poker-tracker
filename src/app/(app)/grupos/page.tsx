import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { formatSignedMoney, balanceColor } from "@/lib/format";
import { CreateGroupForm } from "@/components/create-group-form";

export default async function GruposPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: groups }, { data: games }, { data: myStats }] =
    await Promise.all([
      supabase.from("groups").select("*").order("created_at", { ascending: false }),
      supabase.from("games").select("id, group_id, status"),
      supabase
        .from("player_stats")
        .select("group_id, total_net, games_played")
        .eq("user_id", user!.id),
    ]);

  const gamesByGroup = new Map<string, { total: number; open: number }>();
  for (const g of games ?? []) {
    const e = gamesByGroup.get(g.group_id) ?? { total: 0, open: 0 };
    e.total++;
    if (g.status === "open") e.open++;
    gamesByGroup.set(g.group_id, e);
  }
  const netByGroup = new Map<string, number>();
  let totalNet = 0;
  for (const s of myStats ?? []) {
    if (s.group_id) netByGroup.set(s.group_id, Number(s.total_net ?? 0));
    totalNet += Number(s.total_net ?? 0);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tus grupos"
        subtitle="Cada grupo agrupa a tus jugadores y partidas."
        action={<CreateGroupForm />}
      />

      {(myStats?.length ?? 0) > 0 && (
        <Card className="p-4">
          <div className="text-sm text-zinc-400">Tu balance total acumulado</div>
          <div
            className={`mt-1 text-3xl font-bold tabular-nums ${balanceColor(totalNet)}`}
          >
            {formatSignedMoney(totalNet)}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            Sumando todas las partidas cerradas en las que has jugado.
          </div>
        </Card>
      )}

      {!groups?.length ? (
        <EmptyState
          icon="🃏"
          title="Aún no tienes grupos"
          description="Crea tu primer grupo para empezar a registrar partidas."
          action={<CreateGroupForm />}
        />
      ) : (
        <ul className="space-y-3">
          {groups.map((g) => {
            const gc = gamesByGroup.get(g.id) ?? { total: 0, open: 0 };
            const net = netByGroup.get(g.id) ?? 0;
            return (
              <li key={g.id}>
                <Link href={`/grupos/${g.id}`}>
                  <Card className="p-4 transition-colors hover:bg-white/[0.07]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-white">
                          {g.name}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-400">
                          {gc.total} partida{gc.total === 1 ? "" : "s"}
                          {gc.open > 0 && (
                            <span className="text-emerald-400">
                              {" "}
                              · {gc.open} abierta{gc.open === 1 ? "" : "s"}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold tabular-nums ${balanceColor(net)}`}
                        >
                          {formatSignedMoney(net, g.currency)}
                        </div>
                        <div className="text-xs text-zinc-500">tu balance</div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
