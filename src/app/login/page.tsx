import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { EmailAuthForm } from "@/components/email-auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next || "/grupos");

  return (
    <main className="safe-top safe-bottom flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-5xl shadow-xl shadow-emerald-900/50">
          ♠
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Poker Home Tracker
        </h1>
        <p className="mt-2 text-balance text-zinc-400">
          Lleva el registro de vuestras partidas caseras: recompras, fichas y
          quién paga a quién, sin liarte.
        </p>

        {error && (
          <p className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            No se pudo iniciar sesión. Inténtalo de nuevo.
          </p>
        )}

        <div className="mt-8">
          <EmailAuthForm next={next} />
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-wide text-zinc-500">o</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <GoogleSignInButton next={next} />

        <p className="mt-6 text-xs text-zinc-500">
          Al continuar aceptas guardar tus partidas en tu cuenta.
        </p>
      </div>
    </main>
  );
}
