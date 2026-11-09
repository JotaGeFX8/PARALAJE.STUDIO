export function DocPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="px-5 pb-28 pt-32 sm:px-8 md:pt-44">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-12">
        <header className="md:col-span-4">
          <p className="label">{eyebrow}</p>
          <h1 className="display mt-6 text-[clamp(2.4rem,5vw,4rem)] text-bone">{title}</h1>
          <p className="label mt-8">Actualizado · {updated}</p>
        </header>
        <div className="prose-umbra max-w-2xl md:col-span-8 md:pt-2">{children}</div>
      </div>
    </article>
  );
}

export function DraftNotice() {
  return (
    <p className="!mb-10 border-l-2 border-moss-2 bg-graphite px-5 py-4 font-sans !text-sm !leading-relaxed text-stone-2">
      Borrador de trabajo. Antes del lanzamiento público debe revisarlo una persona con formación jurídica y
      completarse con los datos del responsable del tratamiento.
    </p>
  );
}
