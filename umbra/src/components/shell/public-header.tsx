import Link from "next/link";
import { Wordmark } from "@/components/ui/logo";
import { BRAND } from "@/config/brand";

export function PublicHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-canvas/70 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-canvas/55">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label={`${BRAND.name}, inicio`} className="text-ink">
          <Wordmark />
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-6">
          <Link href="/#manifiesto" className="link-draw hidden text-sm text-ink-2 hover:text-ink md:inline">
            Manifiesto
          </Link>
          <Link href="/#areas" className="link-draw hidden text-sm text-ink-2 hover:text-ink md:inline">
            Áreas
          </Link>
          <Link href="/normas" className="link-draw hidden text-sm text-ink-2 hover:text-ink md:inline">
            Normas
          </Link>
          <Link href="/acceso" className="btn btn-quiet min-h-10 text-sm">
            Entrar
          </Link>
          <Link href="/registro" className="btn btn-primary min-h-10 px-4 text-sm">
            Unirse
          </Link>
        </nav>
      </div>
    </header>
  );
}
