import { BRAND } from "@/config/brand";

/**
 * Marca: tres nodos. Arriba, una idea (verde); abajo, dos personas.
 * La línea discontinua entre ellas es la posibilidad que aún está por construir.
 * No depende del nombre, que es provisional.
 */
export function BrandMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <path d="M16 9 7.5 23M16 9l8.5 14" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.3" />
      <path d="M7.5 23h17" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.3" strokeDasharray="2 2.4" />
      <circle cx="7.5" cy="23" r="3.1" fill="var(--color-canvas)" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24.5" cy="23" r="3.1" fill="var(--color-canvas)" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="9" r="3.9" fill="var(--color-accent)" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark size={26} />
      <span className="font-mono text-[0.8125rem] font-medium tracking-[0.38em]">{BRAND.name.toUpperCase()}</span>
    </span>
  );
}
