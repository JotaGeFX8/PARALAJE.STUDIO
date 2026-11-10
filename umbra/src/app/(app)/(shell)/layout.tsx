import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { unreadCounts } from "@/lib/data/social";
import { BRAND } from "@/config/brand";
import { Wordmark } from "@/components/ui/logo";
import { Avatar } from "@/components/ui/avatar";
import { BottomNav, MobileHeaderActions, SideNav } from "@/components/shell/app-nav";
import { SignOutButton } from "@/components/shell/sign-out";
import { UnreadProvider } from "@/components/shell/unread-provider";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireOnboardedMember();
  const counts = await unreadCounts();
  const name = profile.display_name ?? profile.username ?? "";
  const isStaff = profile.role === "admin" || profile.role === "moderator";

  return (
    <UnreadProvider userId={profile.id} initial={counts}>
      <div className="md:grid md:min-h-[100dvh] md:grid-cols-[16rem_1fr]">
        <a href="#contenido" className="sr-only z-[60] bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Saltar al contenido
        </a>

        {/* Lateral (escritorio) */}
        <aside className="sticky top-0 hidden h-[100dvh] flex-col overflow-y-auto border-r hairline px-3 py-6 md:flex">
          <Link href="/explorar" aria-label={`${BRAND.name}, inicio`} className="mb-7 px-4 text-ink">
            <Wordmark />
          </Link>
          <SideNav isStaff={isStaff} />
          <div className="mt-auto space-y-4 border-t hairline px-4 pt-5">
            <Link href="/perfil" className="flex items-center gap-3">
              <Avatar url={profile.avatar_url} name={name} size={34} />
              <span className="min-w-0">
                <span className="block truncate text-sm text-ink">{name}</span>
                <span className="block truncate font-mono text-xs text-muted">@{profile.username}</span>
              </span>
            </Link>
            <SignOutButton />
          </div>
        </aside>

        {/* Cabecera (móvil) */}
        <header className="sticky top-0 z-30 border-b hairline bg-canvas/92 pt-[env(safe-area-inset-top)] backdrop-blur-md md:hidden">
          <div className="flex h-14 items-center justify-between pl-5 pr-3">
            <Link href="/explorar" aria-label={`${BRAND.name}, inicio`} className="text-ink">
              <Wordmark />
            </Link>
            <MobileHeaderActions isStaff={isStaff} />
          </div>
        </header>

        <main
          id="contenido"
          className="min-w-0 px-5 pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+2.5rem)] pt-7 sm:px-8 md:px-12 md:pb-16 md:pt-12 lg:px-14"
        >
          {children}
        </main>

        <BottomNav avatar={<Avatar url={profile.avatar_url} name={name} size={26} />} />
      </div>
    </UnreadProvider>
  );
}
