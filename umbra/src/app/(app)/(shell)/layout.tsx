import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { UmbraWordmark } from "@/components/ui/logo";
import { Avatar } from "@/components/ui/avatar";
import { BottomNav, SideNav } from "@/components/shell/app-nav";
import { SignOutButton } from "@/components/shell/sign-out";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireOnboardedMember();
  const name = profile.display_name ?? profile.username ?? "";

  return (
    <div className="md:grid md:min-h-[100dvh] md:grid-cols-[15.5rem_1fr]">
      <a href="#contenido" className="sr-only z-[60] bg-bone px-4 py-2 text-carbon focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Saltar al contenido
      </a>

      {/* Lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r hairline px-4 py-7 md:flex">
        <Link href="/explorar" aria-label="UMBRA, explorar" className="mb-10 px-4 text-bone">
          <UmbraWordmark />
        </Link>
        <SideNav />
        <div className="mt-auto space-y-5 border-t hairline px-4 pt-5">
          <Link href="/perfil" className="flex items-center gap-3">
            <Avatar url={profile.avatar_url} name={name} size={34} />
            <span className="min-w-0">
              <span className="block truncate text-sm text-bone">{name}</span>
              <span className="block truncate font-mono text-xs text-stone">@{profile.username}</span>
            </span>
          </Link>
          <SignOutButton />
        </div>
      </aside>

      {/* Cabecera (móvil) */}
      <header className="sticky top-0 z-30 border-b hairline bg-carbon/90 pt-[env(safe-area-inset-top)] backdrop-blur-md md:hidden">
        <div className="flex h-14 items-center justify-between px-5">
          <Link href="/explorar" aria-label="UMBRA, explorar" className="text-bone">
            <UmbraWordmark />
          </Link>
          <Link href="/ajustes" aria-label="Ajustes de la cuenta">
            <Avatar url={profile.avatar_url} name={name} size={30} />
          </Link>
        </div>
      </header>

      <main
        id="contenido"
        className="min-w-0 px-5 pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+2.5rem)] pt-8 sm:px-8 md:px-12 md:pb-16 md:pt-14 lg:px-16"
      >
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
