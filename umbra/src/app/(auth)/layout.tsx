import Link from "next/link";
import { Eclipse } from "@/components/ui/eclipse";
import { UmbraWordmark } from "@/components/ui/logo";
import { isSupabaseConfigured } from "@/lib/env";


export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r hairline bg-ink lg:block">
        <Eclipse className="absolute left-1/2 top-1/2 aspect-square w-[130%] -translate-x-1/2 -translate-y-1/2 opacity-80" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link href="/" aria-label="UMBRA, inicio" className="text-bone">
            <UmbraWordmark />
          </Link>
          <p className="display max-w-md text-5xl text-bone-2">
            La zona de sombra donde mejor se ve el cielo.
          </p>
        </div>
      </aside>
      <main className="flex flex-col px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-10">
        <Link href="/" aria-label="UMBRA, inicio" className="text-bone lg:hidden">
          <UmbraWordmark />
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          {!isSupabaseConfigured && (
            <p className="mb-10 border-l-2 border-danger px-4 py-3 text-sm leading-relaxed text-stone-2">
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
