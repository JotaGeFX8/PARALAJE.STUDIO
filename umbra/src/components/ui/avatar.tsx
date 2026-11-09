/** Avatar: fotografía o monograma. Sin dependencias de optimización de imágenes. */
export function Avatar({
  url,
  name,
  size = 40,
  className = "",
}: {
  url: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "·";
  const style = { width: size, height: size };
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatares pequeños, sin optimizador (coste 0)
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={`shrink-0 rounded-full bg-graphite-2 object-cover ${className}`}
        style={style}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full border border-line-2 bg-graphite font-mono text-stone-2 ${className}`}
      style={{ ...style, fontSize: Math.max(10, size * 0.32) }}
    >
      {initials}
    </span>
  );
}
