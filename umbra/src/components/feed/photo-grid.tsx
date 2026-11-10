import Link from "next/link";
import { IconComment, IconGrid, IconHeart } from "@/components/ui/icons";

/** Cuadrícula de fotos (perfil y Descubrir). */
export function PhotoGrid({
  photos,
  empty,
}: {
  photos: { id: string; cover: string | null; many: boolean; likes: number; comments: number }[];
  empty: React.ReactNode;
}) {
  if (!photos.length) return <div className="py-10 text-center text-[0.9375rem] text-muted">{empty}</div>;
  return (
    <ul className="grid grid-cols-3 gap-0.5 sm:gap-1.5">
      {photos.map((p) => (
        <li key={p.id}>
          <Link href={`/p/${p.id}`} className="group relative block aspect-square overflow-hidden bg-surface-2 sm:rounded-lg">
            {p.cover && (
              // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal
              <img src={p.cover} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            )}
            {p.many && (
              <span className="absolute right-1.5 top-1.5 text-white drop-shadow" aria-label="Varias fotos">
                <IconGrid size={16} />
              </span>
            )}
            <span className="absolute inset-0 hidden items-center justify-center gap-4 bg-black/35 text-sm font-semibold text-white group-hover:flex">
              <span className="flex items-center gap-1">
                <IconHeart size={18} filled /> {p.likes}
              </span>
              <span className="flex items-center gap-1">
                <IconComment size={18} /> {p.comments}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
