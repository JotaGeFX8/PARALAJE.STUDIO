import Link from "next/link";
import { IconArrow } from "./icons";

export function SectionTitle({
  id,
  eyebrow,
  title,
  href,
  hrefLabel = "Ver todo",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="label">{eyebrow}</p>}
        <h2 id={id} className="mt-2 font-serif text-2xl text-ink md:text-[1.75rem]">
          {title}
        </h2>
      </div>
      {href && (
        <Link href={href} className="link-draw flex shrink-0 items-center gap-1.5 text-sm text-ink-2 hover:text-accent">
          {hrefLabel} <IconArrow size={15} />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="border-t hairline py-10">
      <p className="max-w-xl font-serif text-lg leading-relaxed text-muted">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
