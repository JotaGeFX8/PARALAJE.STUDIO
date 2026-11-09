import Link from "next/link";
import { UmbraMark } from "@/components/ui/logo";

export function PublicFooter() {
  return (
    <footer className="border-t hairline pb-[calc(2rem+env(safe-area-inset-bottom))] pt-14">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 md:grid-cols-[1fr_auto]">
        <div className="flex items-start gap-4">
          <UmbraMark size={32} className="text-bone" />
          <p className="max-w-sm font-serif text-lg leading-snug text-stone-2">
            Explora ideas. Encuentra personas.
            <br />
            Construye posibilidades.
          </p>
        </div>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-stone-2">
          <Link href="/normas" className="link-draw hover:text-bone">Normas de convivencia</Link>
          <Link href="/privacidad" className="link-draw hover:text-bone">Privacidad</Link>
          <Link href="/terminos" className="link-draw hover:text-bone">Términos de uso</Link>
        </nav>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-wrap justify-between gap-4 px-5 sm:px-8">
        <span className="label">Comunidad independiente · Sin publicidad</span>
        <span className="label">© {new Date().getFullYear()} UMBRA</span>
      </div>
    </footer>
  );
}
