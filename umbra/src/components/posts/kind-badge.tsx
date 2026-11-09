import { KIND_BY_KEY, TYPE_BY_KEY, type AnyPostKind, type PostTypeKey } from "@/lib/content";
import { IconPoll, IconQuestion } from "@/components/ui/icons";

/** Estilo de cada clasificación: la hipótesis lleva borde discontinuo (provisional). */
const STYLE: Record<AnyPostKind, string> = {
  documented: "border-accent-mid bg-accent-faint text-accent-strong",
  hypothesis: "border-dashed border-ink/40 text-ink-2",
  interpretation: "border-dotted border-ink/40 text-ink-2",
  opinion: "border-line-2 text-ink-2",
  open_question: "border-accent-mid text-accent-strong",
  experience: "border-transparent bg-surface-2 text-ink-2",
};

/** Clasificación epistémica (Hecho documentado, Hipótesis, Interpretación, Opinión, Pregunta abierta). */
export function KindBadge({ kind, className = "" }: { kind: AnyPostKind; className?: string }) {
  const k = KIND_BY_KEY[kind] ?? KIND_BY_KEY.opinion;
  return (
    <span
      title={k.description}
      className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[0.6875rem] font-medium tracking-wide ${STYLE[kind] ?? STYLE.opinion} ${className}`}
    >
      <span aria-hidden="true" className="font-mono text-[0.625rem] opacity-70">
        {k.mark}
      </span>
      {k.short}
    </span>
  );
}

/** Tipo de publicación (Debate, Pregunta, Investigación…). */
export function TypeBadge({ type }: { type: PostTypeKey }) {
  const t = TYPE_BY_KEY[type] ?? TYPE_BY_KEY.debate;
  const strong = type === "question" || type === "poll";
  return (
    <span
      title={t.description}
      className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[0.6875rem] font-medium ${
        strong ? "bg-accent text-on-accent" : "bg-surface-2 text-ink"
      }`}
    >
      {type === "question" && <IconQuestion size={13} />}
      {type === "poll" && <IconPoll size={13} />}
      {t.name}
    </span>
  );
}
