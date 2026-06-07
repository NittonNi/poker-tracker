import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/is-admin";
import { Card, PageHeader, Badge } from "@/components/ui";
import { BackLink } from "@/components/back-link";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  bug: "Fallo",
  idea: "Idea",
  general: "Otro",
};
const KIND_COLOR: Record<string, "rose" | "emerald" | "zinc"> = {
  bug: "rose",
  idea: "emerald",
  general: "zinc",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si no eres admin, la página "no existe".
  if (!isAdminEmail(user?.email)) notFound();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div className="space-y-5">
        <BackLink href="/grupos" label="Volver" />
        <PageHeader title="Panel de admin" />
        <Card className="p-4 text-sm text-neutral-600">
          Falta configurar la variable{" "}
          <code className="rounded bg-neutral-100 px-1">
            SUPABASE_SERVICE_ROLE_KEY
          </code>{" "}
          en el servidor (en local en <code>.env.local</code> y en Vercel).
        </Card>
      </div>
    );
  }

  const admin = createAdminClient();
  const [
    accounts,
    groups,
    gamesTotal,
    gamesOpen,
    players,
    feedbackCount,
    { data: recentFeedback },
    { data: recentAccounts },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("groups").select("*", { count: "exact", head: true }),
    admin.from("games").select("*", { count: "exact", head: true }),
    admin
      .from("games")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    admin.from("players").select("*", { count: "exact", head: true }),
    admin.from("feedback").select("*", { count: "exact", head: true }),
    admin
      .from("feedback")
      .select("id, kind, message, email, page, created_at")
      .order("created_at", { ascending: false })
      .limit(25),
    admin
      .from("profiles")
      .select("id, email, display_name, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const stats: { label: string; value: number }[] = [
    { label: "Cuentas", value: accounts.count ?? 0 },
    { label: "Grupos", value: groups.count ?? 0 },
    { label: "Partidas", value: gamesTotal.count ?? 0 },
    { label: "En juego", value: gamesOpen.count ?? 0 },
    { label: "Jugadores", value: players.count ?? 0 },
    { label: "Feedback", value: feedbackCount.count ?? 0 },
  ];

  return (
    <div className="space-y-5">
      <div>
        <BackLink href="/grupos" label="Volver" />
        <PageHeader
          title="Panel de admin"
          subtitle="Resumen general de la aplicación."
        />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <Card key={s.label} className="p-3">
            <div className="text-xs text-neutral-500">{s.label}</div>
            <div className="mt-0.5 text-2xl font-bold tabular-nums text-neutral-900">
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Feedback reciente */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-500">
          Feedback reciente
        </h2>
        {recentFeedback && recentFeedback.length > 0 ? (
          <Card className="divide-y divide-neutral-100">
            {recentFeedback.map((f) => (
              <div key={f.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge color={KIND_COLOR[f.kind] ?? "zinc"}>
                    {KIND_LABEL[f.kind] ?? f.kind}
                  </Badge>
                  <span className="text-xs text-neutral-400">
                    {formatDate(f.created_at)}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-neutral-800">
                  {f.message}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  {f.email ?? "anónimo"}
                  {f.page ? ` · ${f.page}` : ""}
                </p>
              </div>
            ))}
          </Card>
        ) : (
          <Card className="p-4 text-sm text-neutral-500">
            Todavía no hay feedback.
          </Card>
        )}
      </div>

      {/* Cuentas recientes */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-500">
          Últimas cuentas
        </h2>
        <Card className="divide-y divide-neutral-100">
          {(recentAccounts ?? []).map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate text-sm text-neutral-900">
                  {a.display_name || a.email || "—"}
                </div>
                {a.display_name && a.email && (
                  <div className="truncate text-xs text-neutral-400">
                    {a.email}
                  </div>
                )}
              </div>
              <span className="shrink-0 text-xs text-neutral-400">
                {formatDate(a.created_at)}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
