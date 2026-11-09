import Link from "next/link";
import { Wordmark } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-xl flex-col justify-center px-5 py-16">
      <Link href="/" className="text-ink">
        <Wordmark />
      </Link>
      <p className="label mt-14">Error 404</p>
      <h1 className="display mt-4 text-5xl text-ink">Aquí no hay nada.</h1>
      <p className="mt-5 font-serif text-lg leading-relaxed text-ink-2">
        La página no existe, se ha eliminado o no tienes acceso a ella.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Link href="/explorar" className="btn btn-primary">
          Ir a Explorar
        </Link>
        <Link href="/" className="btn btn-ghost">
          Portada
        </Link>
      </div>
    </main>
  );
}
