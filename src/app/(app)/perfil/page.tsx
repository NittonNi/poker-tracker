import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { BackLink } from "@/components/back-link";
import { ProfileForm } from "@/components/profile-form";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, phone")
    .eq("id", user!.id)
    .single();

  return (
    <div className="space-y-5">
      <div>
        <BackLink href="/grupos" label="Volver" />
        <PageHeader title="Mi perfil" subtitle="Tu nombre y tu Bizum." />
      </div>
      <ProfileForm
        initialName={profile?.display_name ?? ""}
        initialPhone={profile?.phone ?? ""}
      />
    </div>
  );
}
