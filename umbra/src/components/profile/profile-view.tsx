import { Avatar } from "@/components/ui/avatar";
import { AVAILABILITY_LABELS } from "@/lib/content";
import type { ChatAvailability } from "@/lib/supabase/types";

export type ProfileViewData = {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string;
  country: string | null;
  region: string | null;
  availability: ChatAvailability;
  looking_for: string;
  personal_projects: string;
  languages: string[];
  created_at: string;
  interests: { slug: string; name: string; is_favorite: boolean }[];
};

const fmt = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" });

export function ProfileView({
  p,
  actions,
  footer,
  shared,
}: {
  p: ProfileViewData;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  shared?: string[];
}) {
  const name = p.display_name ?? p.username ?? "";
  const place = [p.region, p.country].filter(Boolean).join(", ");
  const favs = p.interests.filter((i) => i.is_favorite);
  const rest = p.interests.filter((i) => !i.is_favorite);

  return (
    <article className="max-w-5xl">
      <header className="flex flex-col gap-8 border-b hairline pb-12 sm:flex-row sm:items-end">
        <Avatar url={p.avatar_url} name={name} size={112} />
        <div className="min-w-0 flex-1 animate-rise">
          <p className="font-mono text-sm text-muted">@{p.username}</p>
          <h1 className="display mt-3 break-words text-[clamp(2.4rem,6vw,4rem)] text-ink">{name}</h1>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {place && <span>{place}</span>}
            <span className={p.availability === "open" ? "text-accent" : ""}>{AVAILABILITY_LABELS[p.availability]}</span>
            <span>Miembro desde {fmt.format(new Date(p.created_at))}</span>
          </p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
      {shared && shared.length > 0 && (
        <p className="flex flex-wrap items-center gap-2 border-b hairline py-4 text-sm text-muted">
          <span className="label mr-1">Compartís</span>
          {shared.map((i) => (
            <span key={i} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-accent-strong">
              {i}
            </span>
          ))}
        </p>
      )}

      <div className="grid gap-12 pt-12 md:grid-cols-[1.4fr_1fr] md:gap-16">
        <div className="space-y-12">
          <Block title="Sobre mí" text={p.bio} empty="Todavía sin descripción." />
          <Block title="A quién le gustaría conocer" text={p.looking_for} />
          <Block title="Proyectos personales" text={p.personal_projects} />
        </div>
        <aside className="space-y-12">
          {favs.length > 0 && (
            <div>
              <h2 className="label mb-4">Favoritos</h2>
              <ul className="space-y-2">
                {favs.map((i) => (
                  <li key={i.slug} className="flex items-baseline gap-3 font-serif text-lg text-ink">
                    <span aria-hidden="true" className="text-accent">✦</span>
                    {i.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              <h2 className="label mb-4">Intereses</h2>
              <ul className="flex flex-wrap gap-2">
                {rest.map((i) => (
                  <li key={i.slug} className="border border-line-2 px-3 py-1.5 text-sm text-ink-2">{i.name}</li>
                ))}
              </ul>
            </div>
          )}
          {p.languages.length > 0 && (
            <div>
              <h2 className="label mb-4">Idiomas</h2>
              <p className="text-ink-2">{p.languages.join(" · ")}</p>
            </div>
          )}
        </aside>
      </div>
      {footer && <div className="mt-12 border-t hairline pt-4">{footer}</div>}
    </article>
  );
}

function Block({ title, text, empty }: { title: string; text: string; empty?: string }) {
  if (!text && !empty) return null;
  return (
    <section>
      <h2 className="label mb-4">{title}</h2>
      <p className={`whitespace-pre-line font-serif text-lg leading-relaxed ${text ? "text-ink-2" : "text-muted"}`}>
        {text || empty}
      </p>
    </section>
  );
}
