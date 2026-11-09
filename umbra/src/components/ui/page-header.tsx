export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
      <div className="max-w-2xl animate-rise">
        <p className="label">{eyebrow}</p>
        <h1 className="display mt-5 text-[clamp(2.4rem,6vw,4.25rem)] text-bone">{title}</h1>
        {lead && <p className="mt-5 font-serif text-lg leading-relaxed text-stone-2">{lead}</p>}
      </div>
      {children}
    </header>
  );
}
