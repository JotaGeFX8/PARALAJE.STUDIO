import Link from "next/link";
import { KnowledgeMap } from "@/components/ui/knowledge-map";
import { BRAND } from "@/config/brand";
import { IconArrow } from "@/components/ui/icons";
import { AREAS, EPISTEMIC_KINDS, TERRITORIES } from "@/lib/content";

const JOURNEY = [
  { label: "Llega por", text: "una pregunta sobre física cuántica" },
  { label: "Conversa en", text: "Conciencia y filosofía" },
  { label: "Conecta con", text: "tres personas que viven en el campo" },
  { label: "Termina en", text: "un proyecto de vivienda autosuficiente" },
];

export default function HomePage() {
  return (
    <>
      {/* ------------------------------------------------------------ Hero */}
      <section className="relative isolate overflow-hidden px-5 pb-16 pt-28 sm:px-8 md:pb-24 md:pt-36">
        <div aria-hidden="true" className="dot-grid absolute inset-0 -z-10" />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 md:grid-cols-[1.05fr_1fr] md:gap-8">
          <div>
            <p className="label animate-rise">
              Comunidad independiente<span className="hidden sm:inline"> · Conocimiento abierto</span>
            </p>
            <h1 className="display mt-6 animate-rise text-[clamp(2.8rem,7.4vw,6.4rem)] text-ink [animation-delay:120ms]">
              Explora ideas.
              <br />
              <span className="italic text-accent">Encuentra</span> personas.
            </h1>
            <p className="mt-8 max-w-[30rem] animate-rise font-serif text-lg leading-relaxed text-ink-2 [animation-delay:240ms] md:text-xl">
              Un lugar para mentes curiosas, autodidactas e inconformistas. Del origen del universo a la casa
              de paja; de la conversación al proyecto real.
            </p>
            <div className="mt-9 flex animate-rise flex-wrap gap-3 [animation-delay:360ms]">
              <Link href="/registro" className="btn btn-primary">
                Unirse a {BRAND.name} <IconArrow size={18} />
              </Link>
              <Link href="/acceso" className="btn btn-ghost">
                Ya soy miembro
              </Link>
            </div>
          </div>
          <figure className="animate-fade [animation-delay:200ms]">
            <KnowledgeMap className="mx-auto w-full max-w-[640px]" />
            <figcaption className="label mt-4 text-center md:text-right">
              Un recorrido posible · de la física cuántica a una vivienda autosuficiente
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ------------------------------------------------------- Manifiesto */}
      <section id="manifiesto" className="scroll-mt-16 border-t hairline px-5 py-24 sm:px-8 md:py-36">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-12">
          <p className="label md:col-span-3">01 — Manifiesto</p>
          <div className="md:col-span-9">
            <p className="font-serif text-[clamp(1.6rem,3.4vw,2.75rem)] font-light leading-[1.22] tracking-[-0.01em] text-ink">
              {BRAND.name} es un lugar para pensar en compañía. Un espacio sin ruido para quienes
              necesitan comprender el mundo —y hacerlo junto a otros—.{" "}
              <span className="text-muted">
                Aquí conviven la física y el mito, la huerta y la inteligencia artificial, la duda y el
                método.
              </span>
            </p>
            <div className="mt-14 grid gap-10 border-t hairline pt-10 sm:grid-cols-3">
              {[
                ["Conocimiento", "Conversaciones largas, ordenadas y con fuentes."],
                ["Personas", "Conexiones por afinidad intelectual y proyectos compartidos."],
                ["Posibilidades", "Iniciativas reales que nacen de la comunidad."],
              ].map(([t, d]) => (
                <div key={t}>
                  <h3 className="font-serif text-xl text-ink">{t}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Áreas */}
      <section id="areas" className="scroll-mt-16 border-t hairline px-5 py-24 sm:px-8 md:py-36">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-12">
            <p className="label md:col-span-3">02 — Arquitectura</p>
            <h2 className="display text-[clamp(2.2rem,5vw,4rem)] text-ink md:col-span-9">
              Seis espacios.
              <br />
              <span className="text-accent">Una misma curiosidad.</span>
            </h2>
          </div>
          <ol className="mt-16 border-t hairline">
            {AREAS.map((a, i) => {
              const Icon = a.icon;
              return (
                <li
                  key={a.href}
                  className="group grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 gap-y-2 border-b hairline py-7 md:grid-cols-[3rem_14rem_1fr_auto] md:items-center md:gap-8 md:py-9"
                >
                  <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-serif text-2xl text-ink md:text-3xl">{a.name}</h3>
                  <p className="col-start-2 max-w-xl text-[0.9375rem] leading-relaxed text-muted md:col-start-auto">
                    {a.description}
                  </p>
                  <Icon
                    size={28}
                    className="hidden text-muted transition-colors duration-500 group-hover:text-accent md:block"
                  />
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------- Territorios */}
      <section className="border-t hairline bg-surface-2 px-5 py-24 sm:px-8 md:py-36">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="label">03 — Territorios</p>
            <h2 className="display mt-6 text-[clamp(2rem,4.2vw,3.25rem)] text-ink">
              Doce territorios de conversación.
            </h2>
            <p className="mt-6 max-w-sm text-[0.9375rem] leading-relaxed text-muted">
              Cada foro tiene su propio ritmo, etiquetas y moderación. Ninguno impone una única forma de
              pensar.
            </p>
          </div>
          <ul className="grid content-start gap-x-10 sm:grid-cols-2 md:col-span-8">
            {TERRITORIES.map(([slug, name], i) => (
              <li key={slug} className="flex items-baseline gap-4 border-b hairline py-4">
                <span className="w-6 font-mono text-[0.6875rem] text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-serif text-lg text-ink">{name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------- Método */}
      <section className="border-t hairline px-5 py-24 sm:px-8 md:py-36">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-12">
            <p className="label md:col-span-3">04 — Método</p>
            <div className="md:col-span-9">
              <h2 className="display text-[clamp(2.2rem,5vw,4rem)] text-ink">
                Mente abierta.
                <br />
                <span className="text-accent">Hechos en su sitio.</span>
              </h2>
              <p className="mt-8 max-w-2xl font-serif text-lg leading-relaxed text-ink-2">
                Las ideas alternativas son bienvenidas. Por eso cada aportación declara su naturaleza: nadie
                presenta una hipótesis como un hecho demostrado.
              </p>
            </div>
          </div>
          <dl className="mt-16 grid gap-px overflow-hidden border hairline bg-line sm:grid-cols-2 lg:grid-cols-4">
            {EPISTEMIC_KINDS.map((k) => (
              <div key={k.key} className="bg-canvas p-7 md:p-8">
                <span className="grid h-10 w-10 place-items-center border border-line-2 font-mono text-sm text-accent">
                  {k.mark}
                </span>
                <dt className="mt-8 font-serif text-xl text-ink">{k.name}</dt>
                <dd className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{k.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* --------------------------------------------------------- Recorrido */}
      <section className="border-t hairline px-5 py-24 sm:px-8 md:py-36">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-12">
            <p className="label md:col-span-3">05 — Recorrido</p>
            <h2 className="display text-[clamp(2.2rem,5vw,4rem)] text-ink md:col-span-9">
              De una pregunta
              <br />
              <span className="text-accent">a una casa de paja.</span>
            </h2>
          </div>
          <ol className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
            <span aria-hidden="true" className="absolute left-[5px] top-2 bottom-2 w-px bg-line-2 md:inset-x-0 md:top-[5px] md:bottom-auto md:h-px md:w-auto" />
            {JOURNEY.map((s, i) => (
              <li key={s.label} className="relative pl-8 md:pl-0 md:pt-10">
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border md:top-0 ${
                    i === JOURNEY.length - 1 ? "border-accent bg-accent" : "border-muted bg-canvas"
                  }`}
                />
                <p className="label">{s.label}</p>
                <p className="mt-3 max-w-[16rem] font-serif text-xl leading-snug text-ink">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------------- Principios */}
      <section className="border-t hairline bg-surface-2 px-5 py-24 sm:px-8 md:py-36">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-12">
          <p className="label md:col-span-3">06 — Principios</p>
          <ul className="grid gap-x-12 gap-y-10 sm:grid-cols-2 md:col-span-9">
            {[
              ["Solo miembros", "Las conversaciones y los perfiles completos solo son visibles para personas registradas."],
              ["Sin ubicación precisa", "Como mucho, país y región, y solo si decides mostrarlos. Nunca coordenadas."],
              ["Sin publicidad ni venta de datos", "No hay anuncios, ni perfiles comerciales, ni seguimiento de terceros."],
              ["Moderación humana", "Denuncias revisadas por personas, normas públicas y decisiones explicadas."],
            ].map(([t, d]) => (
              <li key={t} className="border-t hairline pt-6">
                <h3 className="font-serif text-xl text-ink">{t}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------------------- CTA */}
      <section className="relative isolate overflow-hidden border-t hairline px-5 py-28 sm:px-8 md:py-44">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="display mx-auto max-w-[16ch] text-[clamp(2.4rem,6.5vw,5.5rem)] text-ink">
            Construye posibilidades.
          </h2>
          <p className="mx-auto mt-6 max-w-md font-serif text-lg text-ink-2">
            El acceso es gratuito. Solo necesitas un correo y ganas de conversar.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/registro" className="btn btn-primary">
              Crear mi cuenta <IconArrow size={18} />
            </Link>
            <Link href="/normas" className="btn btn-ghost">
              Leer las normas
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
