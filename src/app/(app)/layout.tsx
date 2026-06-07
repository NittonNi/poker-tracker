import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/is-admin";
import { AccountMenu } from "@/components/account-menu";
import { PageTransition } from "@/components/page-transition";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  const name =
    profile?.display_name || user.email?.split("@")[0] || "Jugador";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <header className="safe-top sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/grupos" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-lg text-white">
              ♠
            </span>
            <span className="font-bold tracking-tight text-neutral-900">Poker</span>
          </Link>
          <AccountMenu
            name={name}
            email={profile?.email || user.email || ""}
            avatarUrl={profile?.avatar_url}
            isAdmin={isAdminEmail(user.email)}
          />
        </div>
      </header>

      <main className="safe-bottom flex-1 px-4 py-5">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
