import type { Area } from "@/lib/content";
import { PageHeader } from "./page-header";

/**
 * Estado honesto de una sección cuyo backend aún no está construido.
 * No muestra botones ni datos simulados: describe lo que llegará y cuándo.
 */
export function InDevelopment({ area, features }: { area: Area; features: string[] }) {
  const Icon = area.icon;
  return (
    <>
      <PageHeader eyebrow={`${area.short} · En desarrollo`} title={area.name} lead={area.description} />
      <section className="grid gap-10 border-t hairline pt-10 md:grid-cols-[1fr_1.4fr]">
        <div>
          <Icon size={44} className="text-stone" />
          <p className="label mt-8 text-lichen">Fase {area.phase} del plan</p>
          <p className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-stone">
            Esta sección se está construyendo. Para no mostrarte contenido falso, permanecerá así hasta que
            funcione de verdad.
          </p>
        </div>
        <ul className="border-t hairline md:border-t-0">
          {features.map((f, i) => (
            <li key={f} className="flex gap-5 border-b hairline py-4">
              <span className="font-mono text-xs text-stone">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[0.9375rem] text-stone-2">{f}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
