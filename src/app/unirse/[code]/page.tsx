import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonClass } from "@/components/ui";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sin sesión: a login y de vuelta aquí al entrar.
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/unirse/${code}`)}`);
  }

  const { data: groupId, error } = await supabase.rpc("join_group_by_code", {
    p_code: code,
  });

  if (!error && groupId) {
    redirect(`/grupos/${groupId}`);
  }

  return (
    <main className="safe-top safe-bottom flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-100 text-3xl">
          🃏
        </div>
        <h1 className="text-xl font-bold text-neutral-900">
          Invitación no válida
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Este enlace no funciona o ha caducado. Pídele a quien te invitó que te
          mande uno nuevo.
        </p>
        <Link href="/grupos" className={`${buttonClass("primary")} mt-6 w-full`}>
          Ir a mis grupos
        </Link>
      </div>
    </main>
  );
}
