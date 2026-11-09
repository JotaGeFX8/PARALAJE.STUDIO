import { mediaUrl } from "@/lib/media";

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
        src={mediaUrl(url)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={`shrink-0 rounded-full bg-surface-3 object-cover ${className}`}
        style={style}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-accent-soft font-mono font-medium text-accent-strong ${className}`}
      style={{ ...style, fontSize: Math.max(10, size * 0.32) }}
    >
      {initials}
    </span>
  );
}
