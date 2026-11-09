import Link from "next/link";
import { BrandMark } from "@/components/ui/logo";
import { BRAND } from "@/config/brand";

export function PublicFooter() {
  return (
    <footer className="border-t hairline pb-[calc(2rem+env(safe-area-inset-bottom))] pt-14">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 md:grid-cols-[1fr_auto]">
        <div className="flex items-start gap-4">
          <BrandMark size={32} className="text-ink" />
          <p className="max-w-sm font-serif text-lg leading-snug text-ink-2">
            Explora ideas. Encuentra personas.
            <br />
            Construye posibilidades.
          </p>
        </div>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-2">
          <Link href="/normas" className="link-draw hover:text-ink">Normas de convivencia</Link>
          <Link href="/privacidad" className="link-draw hover:text-ink">Privacidad</Link>
          <Link href="/terminos" className="link-draw hover:text-ink">Términos de uso</Link>
        </nav>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-wrap justify-between gap-4 px-5 sm:px-8">
        <span className="label">Comunidad independiente · Sin publicidad</span>
        <span className="label">© {new Date().getFullYear()} {BRAND.name}</span>
      </div>
    </footer>
  );
}
