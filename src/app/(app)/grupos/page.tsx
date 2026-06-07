import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, PageHeader } from "@/components/ui";
import { formatSignedMoney, balanceColor } from "@/lib/format";
import { CreateGroupForm } from "@/components/create-group-form";
import { DemoButton } from "@/components/demo-button";
import { Sparkline } from "@/components/sparkline";
import { PendingDebts, type DebtItem } from "@/components/pending-debts";

export default async function GruposPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user!.id;

  // Grupos del usuario + mis jugadores (uno por grupo donde tengo cuenta)
  const [{ data: groups }, { data: myPlayers }, { data: profile }] =
    await Promise.all([
      supabase.from("groups").select("*").order("created_at", { ascending: false }),
      supabase.from("players").select("id, group_id").eq("user_id", uid),
      supabase.from("profiles").select("display_name, email").eq("id", uid).single(),
    ]);

  const groupIds = (groups ?? []).map((g) => g.id);
  const myPlayerIds = (myPlayers ?? []).map((p) => p.id);
  const myPlayerByGroup = new Map(
    (myPlayers ?? []).map((p) => [p.group_id, p.id]),
  );

  const [
    { data: games },
    { data: stats },
    { data: rosterPlayers },
    { data: settlements },
    { data: balances },
  ] = await Promise.all([
    groupIds.length
      ? supabase
          .from("games")
          .select("id, group_id, status, played_on")
          .in("group_id", groupIds)
      : Promise.resolve({ data: [] as never[] }),
    groupIds.length
      ? supabase
          .from("player_stats")
          .select("group_id, player_id, total_net, games_played")
          .in("group_id", groupIds)
      : Promise.resolve({ data: [] as never[] }),
    groupIds.length
      ? supabase
          .from("players")
          .select("id, group_id, display_name")
          .in("group_id", groupIds)
      : Promise.resolve({ data: [] as never[] }),
    myPlayerIds.length
      ? supabase
          .from("settlements")
          .select("id, game_id, from_player_id, to_player_id, amount_money")
          .eq("is_paid", false)
          .or(
            `from_player_id.in.(${myPlayerIds.join(",")}),to_player_id.in.(${myPlayerIds.join(",")})`,
          )
      : Promise.resolve({ data: [] as never[] }),
    myPlayerIds.length
      ? supabase
          .from("game_balances")
          .select("game_id, balance")
          .in("player_id", myPlayerIds)
          .eq("status", "closed")
      : Promise.resolve({ data: [] as never[] }),
  ]);

  // --- Mapas auxiliares ---
  const playerName = new Map(
    (rosterPlayers ?? []).map((p) => [p.id, p.display_name]),
  );
  const gameGroup = new Map((games ?? []).map((g) => [g.id, g.group_id]));
  const gameDate = new Map((games ?? []).map((g) => [g.id, g.played_on]));
  const groupName = new Map((groups ?? []).map((g) => [g.id, g.name]));
  const myIdSet = new Set(myPlayerIds);

  // --- Conteo de partidas por grupo ---
  const gamesByGroup = new Map<string, { total: number; open: number }>();
  for (const g of games ?? []) {
    const e = gamesByGroup.get(g.group_id) ?? { total: 0, open: 0 };
    e.total++;
    if (g.status === "open") e.open++;
    gamesByGroup.set(g.group_id, e);
  }

  // --- Mi neto y posición por grupo ---
  const myStatByGroup = new Map<string, { net: number; played: number }>();
  const rankByGroup = new Map<string, { rank: number; total: number }>();
  const statsByGroup = new Map<string, { player_id: string; net: number; played: number }[]>();
  for (const s of stats ?? []) {
    if (!s.group_id) continue;
    const arr = statsByGroup.get(s.group_id) ?? [];
    arr.push({
      player_id: s.player_id as string,
      net: Number(s.total_net ?? 0),
      played: Number(s.games_played ?? 0),
    });
    statsByGroup.set(s.group_id, arr);
  }
  for (const [gid, arr] of statsByGroup) {
    const ranked = arr
      .filter((r) => r.played > 0)
      .sort((a, b) => b.net - a.net);
    const myPid = myPlayerByGroup.get(gid);
    const mine = arr.find((r) => r.player_id === myPid);
    if (mine) myStatByGroup.set(gid, { net: mine.net, played: mine.played });
    if (myPid && mine && mine.played > 0) {
      const idx = ranked.findIndex((r) => r.player_id === myPid);
      if (idx >= 0) rankByGroup.set(gid, { rank: idx + 1, total: ranked.length });
    }
  }

  const totalNet = [...myStatByGroup.values()].reduce((s, v) => s + v.net, 0);

  // --- Serie temporal (sparkline / este mes / racha) ---
  const series = (balances ?? [])
    .map((b) => ({
      date: gameDate.get(b.game_id ?? "") ?? "",
      bal: Number(b.balance ?? 0),
    }))
    .filter((x) => x.date)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const cumulative: number[] = [];
  for (let i = 0, run = 0; i < series.length; i++) {
    run += series[i].bal;
    cumulative.push(run);
  }

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthNet = series
    .filter((x) => x.date.startsWith(ym))
    .reduce((s, x) => s + x.bal, 0);

  // Racha: resultados recientes con el mismo signo
  let streakCount = 0;
  let streakWin = false;
  for (let i = series.length - 1; i >= 0; i--) {
    const v = series[i].bal;
    if (Math.abs(v) < 0.005) break;
    const win = v > 0;
    if (i === series.length - 1) {
      streakWin = win;
      streakCount = 1;
    } else if (win === streakWin) {
      streakCount++;
    } else break;
  }

  // --- Deudas pendientes ---
  const debts: DebtItem[] = (settlements ?? [])
    .map((s): DebtItem | null => {
      const incoming = myIdSet.has(s.to_player_id);
      const outgoing = myIdSet.has(s.from_player_id);
      if (!incoming && !outgoing) return null;
      const counterparty = incoming ? s.from_player_id : s.to_player_id;
      const gid = gameGroup.get(s.game_id) ?? "";
      return {
        settlementId: s.id,
        gameId: s.game_id,
        dir: incoming ? "in" : "out",
        name: playerName.get(counterparty) ?? "Jugador",
        groupName: groupName.get(gid) ?? "Grupo",
        amount: Number(s.amount_money ?? 0),
      };
    })
    .filter((d): d is DebtItem => d !== null)
    .sort((a, b) => (a.dir === b.dir ? b.amount - a.amount : a.dir === "in" ? -1 : 1));

  const name = profile?.display_name || profile?.email?.split("@")[0] || "";
  const hasActivity = series.length > 0;

  return (
    <div className="space-y-5">
      {/* Cabecera personal */}
      {hasActivity && (
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-neutral-500">
                Hola{name ? `, ${name}` : ""} 👋
              </div>
              <div className="mt-3 text-xs text-neutral-500">
                Tu balance total
              </div>
              <div
                className={`text-3xl font-bold tabular-nums ${balanceColor(totalNet)}`}
              >
                {formatSignedMoney(totalNet)}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {streakCount >= 2 && (
                  <Badge color={streakWin ? "emerald" : "rose"}>
                    {streakWin ? "🔥" : "🥶"} {streakCount} noches{" "}
                    {streakWin ? "ganando" : "perdiendo"}
                  </Badge>
                )}
                <Badge color="zinc">
                  Este mes {formatSignedMoney(monthNet)}
                </Badge>
              </div>
            </div>
            <div className="shrink-0 pt-1">
              <Sparkline values={cumulative} />
            </div>
          </div>
        </Card>
      )}

      {/* Cuentas pendientes */}
      <PendingDebts items={debts} />

      {/* Grupos */}
      <PageHeader
        title="Tus grupos"
        subtitle="Cada grupo agrupa a tus jugadores y partidas."
        action={<CreateGroupForm />}
      />

      {!groups?.length ? (
        <Card className="p-5">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-3xl text-white">
              🃏
            </div>
            <h2 className="text-lg font-bold text-neutral-900">
              Empieza en 3 pasos
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              En un minuto tienes tu primera partida en marcha.
            </p>
          </div>

          <ol className="mt-5 space-y-3">
            {[
              "Crea un grupo (tu peña de poker).",
              "Añade jugadores o invítalos con un enlace.",
              "Empieza una partida y apunta los buy-ins.",
            ].map((t, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <span className="text-sm text-neutral-700">{t}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 space-y-2">
            <CreateGroupForm
              label="Crear mi primer grupo"
              className={`${"inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-5 text-base font-medium text-white shadow-sm transition active:scale-[0.97] hover:bg-neutral-800"}`}
            />
            <DemoButton />
            <p className="pt-1 text-center text-xs text-neutral-400">
              ¿Solo curioseando? Prueba con un grupo de ejemplo y bórralo cuando
              quieras.
            </p>
          </div>
        </Card>
      ) : (
        <ul className="space-y-3">
          {groups.map((g) => {
            const gc = gamesByGroup.get(g.id) ?? { total: 0, open: 0 };
            const mine = myStatByGroup.get(g.id);
            const rank = rankByGroup.get(g.id);
            return (
              <li key={g.id}>
                <Link href={`/grupos/${g.id}`}>
                  <Card className="p-4 transition duration-150 ease-out hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md active:scale-[0.99]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-neutral-900">
                          {g.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-neutral-500">
                          <span>
                            {gc.total} partida{gc.total === 1 ? "" : "s"}
                          </span>
                          {gc.open > 0 && (
                            <Badge color="emerald">
                              {gc.open} en juego
                            </Badge>
                          )}
                          {rank && (
                            <Badge color="zinc">
                              {rank.rank === 1 ? "🥇 " : ""}
                              {rank.rank}º de {rank.total}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold tabular-nums ${balanceColor(mine?.net ?? 0)}`}
                        >
                          {formatSignedMoney(mine?.net ?? 0, g.currency)}
                        </div>
                        <div className="text-xs text-neutral-400">tu balance</div>
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
