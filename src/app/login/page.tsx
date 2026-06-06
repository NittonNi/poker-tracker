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
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-neutral-900 text-5xl text-white shadow-lg">
          ♠
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Poker Home Tracker
        </h1>
        <p className="mt-2 text-balance text-neutral-500">
          Lleva el registro de vuestras partidas caseras: recompras, fichas y
          quién paga a quién, sin liarte.
        </p>

        {error && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            No se pudo iniciar sesión. Inténtalo de nuevo.
          </p>
        )}

        <div className="mt-8">
          <EmailAuthForm next={next} />
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-xs uppercase tracking-wide text-neutral-400">o</span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <GoogleSignInButton next={next} />

        <p className="mt-6 text-xs text-neutral-400">
          Al continuar aceptas guardar tus partidas en tu cuenta.
        </p>
      </div>
    </main>
  );
}
