/**
 * Portada de un libro: la imagen subida por quien lo recomendó o, si no hay,
 * una portada tipográfica generada (colores de la paleta verde y tierra).
 */
const PALETTE = [
  ["#1f5c45", "#e7f1ea"],
  ["#2f5f52", "#e9f1ee"],
  ["#55693a", "#f2f1e2"],
  ["#7a5a2f", "#f6eee1"],
  ["#3d5562", "#e9eff2"],
  ["#6b493e", "#f5ebe7"],
] as const;

function pick(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function BookCover({
  title,
  authors,
  slug,
  url,
  size = "md",
  className = "",
}: {
  title: string;
  authors: string;
  slug: string;
  url: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = `relative aspect-[2/3] w-full overflow-hidden rounded-[3px] shadow-[0_1px_0_rgb(0_0_0/0.04),0_10px_24px_-14px_rgb(23_32_27/0.45)] ${className}`;
  if (url) {
    return (
      <div className={box}>
        {/* eslint-disable-next-line @next/next/no-img-element -- imagen servida desde /media */}
        <img src={url} alt={`Portada de «${title}»`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }
  const [bg, fg] = pick(slug);
  const titleSize = size === "lg" ? "text-[1.35rem]" : size === "sm" ? "text-[0.8125rem]" : "text-base";
  return (
    <div className={box} style={{ background: bg, color: fg }} role="img" aria-label={`Portada de «${title}», de ${authors}`}>
      <div aria-hidden="true" className="absolute inset-[6%] flex flex-col justify-between border p-[9%]" style={{ borderColor: `${fg}55` }}>
        <span className={`line-clamp-5 font-serif leading-[1.12] ${titleSize}`}>{title}</span>
        <span className="flex items-end justify-between gap-2">
          <span className="line-clamp-2 font-mono text-[0.5625rem] uppercase leading-snug tracking-[0.12em] opacity-80">{authors}</span>
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.2}>
            <circle cx="12" cy="6" r="2" />
            <circle cx="6" cy="17" r="2" />
            <circle cx="18" cy="17" r="2" />
            <path d="M11 8 7 15.3M13 8l4 7.3M8 17h8" />
          </svg>
        </span>
      </div>
    </div>
  );
}

/** Valoración media en estrellas (texto accesible). */
export function Stars({ value, count }: { value: number | null; count?: number }) {
  if (value === null) return <span className="text-xs text-muted">Sin valorar</span>;
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`Valoración media ${value.toLocaleString("es")} de 5`}>
      <span aria-hidden="true" className="tracking-[0.08em] text-accent">
        {"★".repeat(full)}
        <span className="text-line-2">{"★".repeat(5 - full)}</span>
      </span>
      <span className="font-mono text-xs text-muted">
        {value.toLocaleString("es")}
        {count !== undefined && ` · ${count}`}
      </span>
    </span>
  );
}
