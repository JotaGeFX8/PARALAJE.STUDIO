/** Esqueleto mientras carga una sección: respuesta inmediata al navegar. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="animate-pulse">
      <div className="h-3 w-24 rounded bg-surface-3" />
      <div className="mt-5 h-10 w-2/3 max-w-lg rounded bg-surface-3" />
      <div className="mt-10 space-y-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-b hairline pb-6">
            <div className="h-3 w-40 rounded bg-surface-2" />
            <div className="mt-4 h-5 w-3/4 rounded bg-surface-3" />
            <div className="mt-3 h-3 w-full max-w-xl rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
