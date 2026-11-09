import Link from "next/link";
import { KnowledgeMap } from "@/components/ui/knowledge-map";
import { BRAND } from "@/config/brand";
import { Wordmark } from "@/components/ui/logo";
import { isSupabaseConfigured } from "@/lib/env";


export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r hairline bg-surface-2 lg:block">
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link href="/" aria-label={`${BRAND.name}, inicio`} className="text-ink">
            <Wordmark />
          </Link>
          <KnowledgeMap className="mx-auto w-full max-w-[520px] py-8" />
          <p className="display max-w-md text-[2.6rem] text-ink">
            Pensar en compañía <span className="italic text-accent">cambia</span> lo que pensamos.
          </p>
        </div>
      </aside>
      <main className="flex flex-col px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-10">
        <Link href="/" aria-label={`${BRAND.name}, inicio`} className="text-ink lg:hidden">
          <Wordmark />
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          {!isSupabaseConfigured && (
            <p className="mb-10 border-l-2 border-danger px-4 py-3 text-sm leading-relaxed text-ink-2">
              Modo sin conexión: faltan las claves de Supabase en <code className="font-mono">.env.local</code>.
              Los formularios no podrán enviar datos hasta configurarlas.
            </p>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
