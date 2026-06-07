import { redirect } from "next/navigation";
import { Trophy, HandCoins, Sparkles } from "lucide-react";
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
    <main className="safe-top safe-bottom relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-white to-neutral-100 px-6 py-10">
      {/* Palos decorativos de fondo */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
        <span className="absolute -left-6 top-10 text-[120px] leading-none text-neutral-200/70 rotate-[-15deg]">
          ♣
        </span>
        <span className="absolute right-2 top-24 text-[96px] leading-none text-red-200/70 rotate-[12deg]">
          ♥
        </span>
        <span className="absolute -right-4 bottom-16 text-[130px] leading-none text-neutral-200/70 rotate-[10deg]">
          ♠
        </span>
        <span className="absolute left-4 bottom-10 text-[90px] leading-none text-red-200/60 rotate-[-10deg]">
          ♦
        </span>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Branding */}
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-neutral-900 text-5xl text-white shadow-xl ring-1 ring-black/5">
            ♠
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Poker Home Tracker
          </h1>
          <p className="mt-2 text-balance text-neutral-500">
            Las cuentas de vuestras partidas caseras, sin discusiones.
          </p>
        </div>

        {/* Ganchos */}
        <div className="mx-auto mt-5 flex max-w-xs flex-wrap justify-center gap-1.5">
          <Feature icon={<HandCoins size={13} />} text="Quién paga a quién" />
          <Feature icon={<Trophy size={13} />} text="Ranking del grupo" />
          <Feature icon={<Sparkles size={13} />} text="Liquidación al instante" />
        </div>

        {/* Tarjeta de acceso */}
        <div className="mt-7 rounded-3xl border border-neutral-200 bg-white p-6 shadow-lg shadow-neutral-900/5">
          {error && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              No se pudo iniciar sesión. Inténtalo de nuevo.
            </p>
          )}

          <EmailAuthForm next={next} />

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs uppercase tracking-wide text-neutral-400">
              o
            </span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <GoogleSignInButton next={next} />
        </div>

        <p className="mt-5 text-center text-xs text-neutral-400">
          Al continuar aceptas guardar tus partidas en tu cuenta.
        </p>
      </div>
    </main>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-neutral-600 backdrop-blur-sm">
      {icon}
      {text}
    </span>
  );
}
