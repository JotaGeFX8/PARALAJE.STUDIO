"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendConnectionAction, skipMemberAction } from "@/app/(app)/actions/social";
import { Avatar } from "@/components/ui/avatar";
import { AVAILABILITY_LABELS } from "@/lib/content";
import type { MemberCardFull } from "@/lib/data/social";
import { IconArrow, IconConnections } from "@/components/ui/icons";

/**
 * «Descubrir»: una persona afín cada vez, sin fotos de citas ni puntuaciones.
 * Conectar envía una solicitud (con nota opcional); Pasar no la vuelve a mostrar en 30 días.
 */
export function DiscoverDeck({ cards }: { cards: MemberCardFull[] }) {
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState("");
  const [composing, setComposing] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const card = cards[index];

  function next(message?: string) {
    setComposing(false);
    setNote("");
    setError(null);
    setFlash(message ?? null);
    setIndex((i) => i + 1);
  }

  if (!card) {
    return (
      <div className="rounded-sm border border-line-2 bg-surface p-8 text-center">
        <p className="font-serif text-2xl text-ink">Has visto a todas las personas afines por ahora.</p>
        <p className="mx-auto mt-3 max-w-md text-[0.9375rem] text-muted">
          {flash ? `${flash} ` : ""}Vuelve más tarde: cada semana llegan miembros nuevos. Mientras, puedes usar el buscador con filtros.
        </p>
        <button type="button" className="btn btn-ghost mt-6" onClick={() => router.refresh()}>
          Buscar de nuevo
        </button>
      </div>
    );
  }

  const place = [card.region, card.country].filter(Boolean).join(", ");
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span>
          {index + 1} de {cards.length}
        </span>
        {flash && (
          <span role="status" className="text-accent">
            {flash}
          </span>
        )}
      </div>

      <article key={card.id} className="animate-rise rounded-sm border border-line-2 bg-surface p-6 sm:p-8">
        <header className="flex items-start gap-5">
          <Avatar url={card.avatar_url} name={card.display_name} size={84} />
          <div className="min-w-0">
            <h2 className="font-serif text-[1.75rem] leading-tight text-ink">{card.display_name}</h2>
            <p className="font-mono text-sm text-muted">@{card.username}</p>
            <p className="mt-2 flex flex-wrap gap-x-3 text-sm text-muted">
              {place && <span>{place}</span>}
              <span className={card.availability === "open" ? "text-accent" : ""}>{AVAILABILITY_LABELS[card.availability]}</span>
            </p>
          </div>
        </header>

        {card.shared_interests.length > 0 && (
          <div className="mt-6">
            <p className="label mb-2.5">Compartís</p>
            <div className="flex flex-wrap gap-1.5">
              {card.shared_interests.map((i) => (
                <span key={i} className="rounded-full bg-accent-soft px-3 py-1 text-[0.8125rem] text-accent-strong">
                  {i}
                </span>
              ))}
            </div>
          </div>
        )}

        {card.bio && <p className="mt-6 line-clamp-4 font-serif text-[1.0625rem] leading-relaxed text-ink-2">{card.bio}</p>}
        {card.looking_for && (
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-2">
            <span className="label mr-2">Busca</span>
            {card.looking_for}
          </p>
        )}
        {card.personal_projects && (
          <p className="mt-3 line-clamp-3 text-[0.9375rem] leading-relaxed text-ink-2">
            <span className="label mr-2">Proyectos</span>
            {card.personal_projects}
          </p>
        )}

        <Link href={`/miembros/${card.username}`} className="link-draw mt-5 inline-flex items-center gap-1.5 text-sm text-accent">
          Ver perfil completo <IconArrow size={15} />
        </Link>

        <footer className="mt-7 border-t hairline pt-5">
          {composing ? (
            <div className="space-y-2">
              <label htmlFor="discover-note" className="label block">
                ¿Por qué te gustaría conectar? (opcional)
              </label>
              <textarea
                id="discover-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                rows={3}
                autoFocus
                className="boxed w-full p-3 text-[0.9375rem] outline-none"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className="btn btn-primary"
                  onClick={() =>
                    start(async () => {
                      const r = await sendConnectionAction(card.id, note);
                      if (r.ok) next(`Solicitud enviada a ${card.display_name}.`);
                      else setError(r.message ?? "No se pudo enviar.");
                    })
                  }
                >
                  {pending ? "Enviando…" : "Enviar solicitud"}
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => setComposing(false)}>
                  Volver
                </button>
                {error && <span className="text-sm text-danger">{error}</span>}
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                disabled={pending}
                className="btn btn-ghost flex-1"
                onClick={() =>
                  start(async () => {
                    await skipMemberAction(card.id);
                    next();
                  })
                }
              >
                Pasar
              </button>
              <button type="button" className="btn btn-primary flex-1" onClick={() => setComposing(true)}>
                <IconConnections size={18} /> Conectar
              </button>
            </div>
          )}
        </footer>
      </article>
    </div>
  );
}
