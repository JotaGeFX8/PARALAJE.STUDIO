import { KIND_BY_KEY, type PostKind } from "@/lib/content";
import { IconQuestion } from "@/components/ui/icons";

/** Estilo visual de cada tipo: la hipótesis lleva borde discontinuo (provisional). */
const STYLE: Record<PostKind, string> = {
  documented: "border-accent-mid bg-accent-faint text-accent-strong",
  hypothesis: "border-dashed border-ink/40 text-ink-2",
  opinion: "border-line-2 text-ink-2",
  experience: "border-transparent bg-surface-2 text-ink-2",
};

export function KindBadge({ kind, className = "" }: { kind: PostKind; className?: string }) {
  const k = KIND_BY_KEY[kind];
  return (
    <span
      title={k.description}
      className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[0.6875rem] font-medium tracking-wide ${STYLE[kind]} ${className}`}
    >
      <span aria-hidden="true" className="font-mono text-[0.625rem] opacity-70">
        {k.mark}
      </span>
      {k.name}
    </span>
  );
}

export function QuestionBadge() {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-accent text-on-accent px-2.5 text-[0.6875rem] font-medium">
      <IconQuestion size={13} /> Pregunta
    </span>
  );
}
