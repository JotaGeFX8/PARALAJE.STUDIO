import Link from "next/link";

type Params = Record<string, string | undefined>;

/** Construye una URL conservando los parámetros actuales y aplicando cambios. */
export function hrefWith(base: string, current: Params, patch: Params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch })) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

/** Pestañas basadas en enlaces (funcionan sin JavaScript y se pueden compartir). */
export function NavTabs({
  items,
  active,
  label,
  className = "",
}: {
  items: { key: string; label: string; short?: string; href: string; count?: number }[];
  active: string;
  label: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={`tabs ${className}`}>
      {items.map((t) => (
        <Link key={t.key} href={t.href} className="tab" aria-current={t.key === active ? "page" : undefined} scroll={false}>
          {t.short ? (
            <>
              <span className="sm:hidden">{t.short}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </>
          ) : (
            t.label
          )}
          {t.count ? <span className="badge ml-2 align-[1px]">{t.count > 99 ? "99+" : t.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

export function Pagination({
  page,
  hasMore,
  hrefFor,
}: {
  page: number;
  hasMore: boolean;
  hrefFor: (page: number) => string;
}) {
  if (page === 1 && !hasMore) return null;
  return (
    <nav aria-label="Paginación" className="mt-8 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="btn btn-ghost btn-sm">
          ← Anteriores
        </Link>
      ) : (
        <span />
      )}
      <span className="label">Página {page}</span>
      {hasMore ? (
        <Link href={hrefFor(page + 1)} className="btn btn-ghost btn-sm">
          Siguientes →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
