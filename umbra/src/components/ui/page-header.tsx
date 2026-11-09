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
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5 md:mb-14 md:gap-6">
      <div className="max-w-2xl animate-rise">
        <p className="label">{eyebrow}</p>
        <h1 className="display mt-4 text-[clamp(2.1rem,6vw,4.25rem)] text-ink md:mt-5">{title}</h1>
        {lead && <p className="mt-4 font-serif text-[1.0625rem] leading-relaxed text-ink-2 md:mt-5 md:text-lg">{lead}</p>}
      </div>
      {children}
    </header>
  );
}
