/**
 * Eclipse con anillos de observatorio. Puramente decorativo, solo CSS + SVG,
 * sin JavaScript en cliente. Respeta prefers-reduced-motion.
 */
export function Eclipse({ className = "" }: { className?: string }) {
  const ticks = Array.from({ length: 120 }, (_, i) => i);
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <svg viewBox="0 0 800 800" className="h-full w-full overflow-visible">
        <defs>
          <radialGradient id="corona" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="#e9e6dd" stopOpacity=".16" />
            <stop offset="68%" stopColor="#9cc2a9" stopOpacity=".05" />
            <stop offset="100%" stopColor="#0a0b0a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Dial exterior con marcas de grado */}
        <g className="animate-orbit" style={{ transformBox: "view-box", transformOrigin: "400px 400px" }}>
          <circle cx="400" cy="400" r="385" stroke="#e9e6dd" strokeOpacity=".07" fill="none" />
          {ticks.map((i) => {
            const a = (i / ticks.length) * Math.PI * 2;
            const long = i % 10 === 0;
            const r1 = 385;
            const r2 = long ? 368 : 377;
            return (
              <line
                key={i}
                x1={400 + Math.cos(a) * r1}
                y1={400 + Math.sin(a) * r1}
                x2={400 + Math.cos(a) * r2}
                y2={400 + Math.sin(a) * r2}
                stroke="#e9e6dd"
                strokeOpacity={long ? 0.28 : 0.1}
              />
            );
          })}
        </g>

        {/* Órbitas */}
        <g className="animate-orbit-rev" style={{ transformBox: "view-box", transformOrigin: "400px 400px" }}>
          <circle cx="400" cy="400" r="300" stroke="#e9e6dd" strokeOpacity=".08" fill="none" strokeDasharray="2 7" />
          <circle cx="700" cy="400" r="3.5" fill="#b8bcb6" fillOpacity=".7" />
        </g>
        <g className="animate-orbit" style={{ transformBox: "view-box", transformOrigin: "400px 400px", animationDuration: "90s" }}>
          <circle cx="400" cy="400" r="235" stroke="#e9e6dd" strokeOpacity=".06" fill="none" />
          <circle cx="400" cy="165" r="2.5" fill="#9cc2a9" fillOpacity=".8" />
        </g>

        {/* Corona y disco */}
        <circle cx="400" cy="400" r="230" fill="url(#corona)" />
        <circle cx="400" cy="400" r="150" fill="#e9e6dd" fillOpacity=".92" />
        <circle cx="414" cy="391" r="148" fill="#0a0b0a" />
        <circle cx="400" cy="400" r="150" fill="none" stroke="#e9e6dd" strokeOpacity=".12" />

        {/* Retícula */}
        <path d="M400 0v120M400 680v120M0 400h120M680 400h120" stroke="#e9e6dd" strokeOpacity=".1" />
      </svg>
    </div>
  );
}
