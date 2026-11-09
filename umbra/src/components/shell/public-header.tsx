import Link from "next/link";
import { UmbraWordmark } from "@/components/ui/logo";

export function PublicHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-carbon/70 pt-[env(safe-area-inset-top)] backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_75%,transparent)] supports-[backdrop-filter]:bg-carbon/55">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="UMBRA, inicio" className="text-bone">
          <UmbraWordmark />
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-6">
          <Link href="/#manifiesto" className="link-draw hidden text-sm text-stone-2 hover:text-bone md:inline">
            Manifiesto
          </Link>
          <Link href="/#areas" className="link-draw hidden text-sm text-stone-2 hover:text-bone md:inline">
            Áreas
          </Link>
          <Link href="/normas" className="link-draw hidden text-sm text-stone-2 hover:text-bone md:inline">
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
