import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { AddPlayerForm } from "@/components/add-player-form";
import { InviteButton } from "@/components/invite-button";
import { PlayerRow } from "@/components/player-row";
import { BackLink } from "@/components/back-link";

export default async function JugadoresPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code")
    .eq("id", groupId)
    .single();
  if (!group) notFound();

  const { data: players } = await supabase
    .from("players")
    .select("id, display_name, is_active, avatar_url, user_id")
    .eq("group_id", groupId)
    .order("is_active", { ascending: false })
    .order("display_name");

  const active = (players ?? []).filter((p) => p.is_active);
  const inactive = (players ?? []).filter((p) => !p.is_active);

  return (
    <div className="space-y-5">
      <div>
        <BackLink href={`/grupos/${groupId}`} label={group.name} />
        <PageHeader
          title="Jugadores"
          subtitle="Invita gente con cuenta o añade invitados sueltos."
          action={
            <div className="flex shrink-0 items-center gap-2">
              <InviteButton groupId={groupId} inviteCode={group.invite_code} />
              <AddPlayerForm groupId={groupId} />
            </div>
          }
        />
      </div>

      {active.length > 0 && (
        <ul className="space-y-2">
          {active.map((p) => (
            <PlayerRow key={p.id} player={p} groupId={groupId} />
          ))}
        </ul>
      )}

      {inactive.length > 0 && (
        <div className="space-y-2">
          <h2 className="pt-2 text-sm font-semibold text-neutral-400">
            Inactivos
          </h2>
          <ul className="space-y-2">
            {inactive.map((p) => (
              <PlayerRow key={p.id} player={p} groupId={groupId} />
            ))}
          </ul>
        </div>
      )}

      {!players?.length && (
        <p className="text-sm text-neutral-500">
          Todavía no hay jugadores. Añade el primero con el botón de arriba.
        </p>
      )}
    </div>
  );
}
