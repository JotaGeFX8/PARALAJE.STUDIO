import { Avatar } from "@/components/ui/avatar";
import { AVAILABILITY_LABELS, GOAL_LABEL, PRIVACY_SECTIONS, TOPIC_RELATIONS, VISIBILITY_OPTIONS } from "@/lib/content";
import type { MemberProfile } from "@/lib/data/members";
import type { PrivacySectionKey, VisibilityKey } from "@/lib/content";

const fmt = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" });

/** Orden en que se muestran los temas: primero lo que la persona puede ofrecer. */
const RELATION_ORDER = ["can_teach", "experienced", "knowledgeable", "seeking_collaborators", "learning", "interested"] as const;
const RELATION_HEADING: Record<(typeof RELATION_ORDER)[number], string> = {
  can_teach: "Puede enseñar o ayudar",
  experienced: "Tiene experiencia",
  knowledgeable: "Tiene conocimientos",
  seeking_collaborators: "Busca colaboradores",
  learning: "Está aprendiendo",
  interested: "Le interesa",
};
const OWN_HEADING: Record<(typeof RELATION_ORDER)[number], string> = Object.fromEntries(
  TOPIC_RELATIONS.map((r) => [r.key, r.label]),
) as Record<(typeof RELATION_ORDER)[number], string>;

export function ProfileView({
  p,
  actions,
  footer,
  shared,
  reasons,
  own,
  privacy,
  bare = false,
}: {
  p: MemberProfile;
  /** Sin cabecera (la página de perfil ya la muestra): solo la información detallada. */
  bare?: boolean;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  shared?: string[];
  reasons?: string[];
  /** Perfil propio: encabezados en primera persona y avisos de visibilidad. */
  own?: boolean;
  privacy?: Record<PrivacySectionKey, VisibilityKey>;
}) {
  const name = p.display_name || p.username;
  const place = [p.region, p.country].filter(Boolean).join(", ");
  const primaries = p.topics.filter((t) => t.is_primary);
  const headings = own ? OWN_HEADING : RELATION_HEADING;
  const visLabel = (s: PrivacySectionKey) =>
    privacy ? VISIBILITY_OPTIONS.find((o) => o.key === privacy[s])?.label : undefined;
  const hidden = (
    <p className="text-[0.9375rem] text-muted">Esta parte del perfil no es visible para ti.</p>
  );

  return (
    <article className="max-w-5xl">
      {!bare && (
        <>
      {p.cover_url && (
        <div className="relative mb-16 sm:mb-20">
          {/* eslint-disable-next-line @next/next/no-img-element -- imagen servida desde /media */}
          <img src={p.cover_url} alt="" className="aspect-[5/2] w-full rounded-xl object-cover sm:aspect-[4/1]" />
          <div className="absolute -bottom-12 left-4 rounded-full ring-4 ring-canvas sm:-bottom-14 sm:left-6">
            <Avatar url={p.avatar_url} name={name} size={104} />
          </div>
        </div>
      )}
      <header className="flex flex-col gap-6 border-b hairline pb-10 sm:flex-row sm:items-end">
        {!p.cover_url && <Avatar url={p.avatar_url} name={name} size={112} />}
        <div className="min-w-0 flex-1 animate-rise">
          <p className="font-mono text-sm text-muted">@{p.username}</p>
          <h1 className="display mt-3 break-words text-[clamp(2.2rem,6vw,3.8rem)] text-ink">{name}</h1>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {place && <span>{place}</span>}
            <span className={p.availability === "open" ? "text-accent" : ""}>{AVAILABILITY_LABELS[p.availability]}</span>
            <span>Miembro desde {fmt.format(new Date(p.created_at))}</span>
            {p.connections_count !== null && (
              <span>
                {p.connections_count} {p.connections_count === 1 ? "conexión" : "conexiones"}
              </span>
            )}
          </p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
        </>
      )}

      {((reasons && reasons.length > 0) || (shared && shared.length > 0)) && (
        <div className="space-y-3 border-b hairline py-5">
          {reasons && reasons.length > 0 && (
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-accent-strong">
              {reasons.map((r) => (
                <li key={r} className="flex gap-2">
                  <span aria-hidden="true" className="text-accent">✦</span>
                  {r}
                </li>
              ))}
            </ul>
          )}
          {shared && shared.length > 0 && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className="label mr-1">Compartís</span>
              {shared.map((i) => (
                <span key={i} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-accent-strong">
                  {i}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      {own && privacy && (
        <p className="border-b hairline py-4 text-sm text-muted">
          Quién ve cada apartado:{" "}
          {PRIVACY_SECTIONS.map((s, i) => (
            <span key={s.key}>
              {i > 0 && " · "}
              {s.label}: <span className="text-ink-2">{visLabel(s.key)}</span>
            </span>
          ))}
        </p>
      )}

      <div className="grid gap-12 pt-12 md:grid-cols-[1.4fr_1fr] md:gap-16">
        <div className="space-y-12">
          {p.visible.about ? (
            <>
              <Block title="Sobre mí" text={p.bio} empty="Todavía sin presentación." />
              <Block title="Qué estoy explorando" text={p.exploring} />
              <Block title="Qué puedo aportar" text={p.can_offer} />
              <Block title="A quién me gustaría conocer" text={p.looking_for} />
              <Block title="Proyectos personales" text={p.personal_projects} />
            </>
          ) : (
            <section>
              <h2 className="label mb-4">Presentación</h2>
              {hidden}
            </section>
          )}
        </div>

        <aside className="space-y-12">
          {p.visible.interests ? (
            <>
              {primaries.length > 0 && (
                <div>
                  <h2 className="label mb-4">Temas principales</h2>
                  <ul className="space-y-2">
                    {primaries.map((t) => (
                      <li key={t.topic_id} className="flex items-baseline gap-3 font-serif text-lg text-ink">
                        <span aria-hidden="true" className="text-accent">✦</span>
                        <span>
                          {t.name}
                          <span className="ml-2 font-sans text-xs text-muted">{t.area_name}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {RELATION_ORDER.map((rel) => {
                const list = p.topics.filter((t) => t.relation === rel);
                if (!list.length) return null;
                return (
                  <div key={rel}>
                    <h2 className="label mb-3">{headings[rel]}</h2>
                    <ul className="flex flex-wrap gap-1.5">
                      {list.map((t) => (
                        <li
                          key={t.topic_id}
                          title={t.area_name}
                          className={`rounded-full px-3 py-1 text-sm ${
                            rel === "can_teach" || rel === "experienced"
                              ? "bg-accent-soft text-accent-strong"
                              : "border border-line-2 text-ink-2"
                          }`}
                        >
                          {t.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {p.topics.length === 0 && (
                <p className="text-[0.9375rem] text-muted">{own ? "Aún no has elegido temas." : "Sin temas elegidos todavía."}</p>
              )}
              {p.goals.length > 0 && (
                <div>
                  <h2 className="label mb-3">{own ? "Mis objetivos" : "Objetivos"}</h2>
                  <ul className="flex flex-wrap gap-1.5">
                    {p.goals.map((g) => (
                      <li key={g} className="rounded-full border border-line-2 px-3 py-1 text-sm text-ink-2">
                        {GOAL_LABEL[g]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div>
              <h2 className="label mb-4">Intereses y objetivos</h2>
              {hidden}
            </div>
          )}
          {p.visible.about && p.skills.length > 0 && (
            <div>
              <h2 className="label mb-3">Habilidades</h2>
              <ul className="flex flex-wrap gap-1.5">
                {p.skills.map((s) => (
                  <li key={s} className="rounded-xl bg-surface-2 px-2.5 py-1 text-sm text-ink-2">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {p.languages.length > 0 && (
            <div>
              <h2 className="label mb-3">Idiomas</h2>
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
      <p className={`whitespace-pre-line font-serif text-lg leading-relaxed ${text ? "text-ink-2" : "text-muted"}`}>{text || empty}</p>
    </section>
  );
}
