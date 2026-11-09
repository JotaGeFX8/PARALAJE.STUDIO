/** Marca UMBRA: un eclipse. La sombra (umbra) cubre el disco y deja la corona. */
export function UmbraMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="16" cy="16" r="11.5" stroke="currentColor" strokeOpacity=".35" strokeWidth="1" />
      <circle cx="16" cy="16" r="9" fill="currentColor" />
      <circle cx="18.6" cy="14.4" r="8.6" fill="var(--color-carbon)" />
    </svg>
  );
}

export function UmbraWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <UmbraMark size={24} />
      <span className="font-mono text-[0.8125rem] font-medium tracking-[0.42em]">UMBRA</span>
    </span>
  );
}
