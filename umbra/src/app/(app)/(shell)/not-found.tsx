import Link from "next/link";

/** «No encontrado» dentro de la zona privada (contenido borrado, sin acceso o enlace roto). */
export default function NotFoundInApp() {
  return (
    <div className="max-w-xl py-10">
      <p className="label">No disponible</p>
      <h1 className="display mt-4 text-4xl text-ink">Aquí no hay nada.</h1>
      <p className="mt-4 font-serif text-lg leading-relaxed text-ink-2">
        Este contenido no existe, se ha retirado o no tienes acceso a él.
      </p>
      <Link href="/explorar" className="btn btn-primary mt-8">
        Volver a Explorar
      </Link>
    </div>
  );
}
