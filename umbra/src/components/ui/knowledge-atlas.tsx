/**
 * Atlas del conocimiento: lámina de grabado científico que funde las 22 áreas
 * del catálogo en una sola composición radial.
 *
 * - Anillo exterior con marcas de grado (dial de observatorio).
 * - 22 estaciones con glifos dibujados a mano a trazo fino.
 * - Nombres sobre trayectorias circulares (arriba y abajo, siempre legibles).
 * - Cuerdas de Bézier entre disciplinas relacionadas; un recorrido en verde:
 *   física → filosofía → agricultura → arquitectura sostenible.
 * - Partículas (personas) en órbitas lentas alrededor del núcleo.
 *
 * Solo SVG + CSS: sin JavaScript en el cliente. Decorativa (aria-hidden).
 */

const C = 400; // centro
const R_TICKS = 372;
const R_LABEL_TOP = 342;
const R_LABEL_BOTTOM = 352;
const R_STATION = 296;
const R_CHORD = 268;

type Area = { name: string; glyph: React.ReactNode };

// Glifos en una retícula de 24×24, trazo «currentColor».
const AREAS: Area[] = [
  { name: "Cosmos", glyph: <><circle cx="12" cy="12" r="4.6" /><ellipse cx="12" cy="12" rx="10.5" ry="3.2" transform="rotate(-22 12 12)" /><circle cx="19" cy="5" r=".7" fill="currentColor" /></> },
  { name: "Física", glyph: <><ellipse cx="12" cy="12" rx="10" ry="3.8" /><ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(120 12 12)" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></> },
  { name: "Biología", glyph: <><path d="M7.5 2.5c0 4.5 9 5 9 9.5s-9 5-9 9.5M16.5 2.5c0 4.5-9 5-9 9.5s9 5 9 9.5" /><path d="M9 6h6M10.5 9h3M10.5 15h3M9 18h6" /></> },
  { name: "Mente", glyph: <><circle cx="12" cy="12.5" r="3" /><path d="M12 9.5V3.5M12 3.5 9.5 2M12 3.5 14.5 2M9.6 14.3 4.5 18.5M4.5 18.5 3 21M4.5 18.5 2 18M14.4 14.3l5 4.2M19.4 18.5l1.6 2.5M14.8 11.4 20.5 9M20.5 9l1.5-2" /></> },
  { name: "Filosofía", glyph: <><path d="M5 4.5h14M6.5 6.5h11M8 6.5v12M12 6.5v12M16 6.5v12M6 18.5h12M4.5 21h15" /><circle cx="6" cy="4.5" r="1.1" /><circle cx="18" cy="4.5" r="1.1" /></> },
  { name: "Historia", glyph: <><path d="M6.5 2.5h11M6.5 21.5h11M8 2.5c0 5 8 6 8 9.5s-8 4.5-8 9.5M16 2.5c0 5-8 6-8 9.5s8 4.5 8 9.5" /><path d="M10 19.5h4" /></> },
  { name: "Arqueología", glyph: <><path d="M9 2.5h6M10 2.5v3.2C6.2 7.6 5 11.5 6 15c.9 3.3 3.6 6 6 6s5.1-2.7 6-6c1-3.5-.2-7.4-4-9.3V2.5" /><path d="M10 7.5c-3 0-3.3 4-1 5M14 7.5c3 0 3.3 4 1 5M7.5 14.5h9" /></> },
  { name: "Anomalías", glyph: <><path d="M12 12c0-1 1-1.9 2-1.4.9.5.9 2.6-.6 3.4-1.7.9-4 .2-4.4-2-.4-2.5 1.6-4.9 4.6-4.9 3.3 0 5.6 3 4.9 6.3-.8 3.6-4.5 5.6-8 4.9-3.9-.8-6.1-4.6-5.4-8.2" /><circle cx="20" cy="4" r=".8" fill="currentColor" /></> },
  { name: "Tradiciones", glyph: <><path d="M12 19.5c-3-3-3.2-8.2 0-12.5 3.2 4.3 3 9.5 0 12.5ZM12 19.5c-4.4.2-8.4-2.8-8.6-7.3 3.3-.3 6.6 2 8.6 7.3ZM12 19.5c4.4.2 8.4-2.8 8.6-7.3-3.3-.3-6.6 2-8.6 7.3Z" /><path d="M5 21.5h14" /></> },
  { name: "Tecnología", glyph: <><rect x="7" y="7" width="10" height="10" rx="1" /><rect x="10" y="10" width="4" height="4" /><path d="M9.5 7V3.5M12 7V3.5M14.5 7V3.5M9.5 20.5V17M12 20.5V17M14.5 20.5V17M7 9.5H3.5M7 12H3.5M7 14.5H3.5M20.5 9.5H17M20.5 12H17M20.5 14.5H17" /></> },
  { name: "Naturaleza", glyph: <><path d="M4.5 19.5C4.5 10.5 10.5 5 20 4c-.8 9.6-6.2 15.5-15.5 15.5Z" /><path d="M4.5 19.5 14.5 9.5M8.5 15.5h4.5M11 13V8.8" /></> },
  { name: "Agricultura", glyph: <><path d="M12 21.5V5.5" /><path d="M12 5.5c-2-1.2-2-3.6 0-4.6 2 1 2 3.4 0 4.6ZM12 9.8c-2.6 0-3.8-2-3.8-3.6 2.2 0 3.8 1.2 3.8 3.6ZM12 9.8c2.6 0 3.8-2 3.8-3.6-2.2 0-3.8 1.2-3.8 3.6ZM12 14.2c-2.6 0-3.8-2-3.8-3.6 2.2 0 3.8 1.2 3.8 3.6ZM12 14.2c2.6 0 3.8-2 3.8-3.6-2.2 0-3.8 1.2-3.8 3.6Z" /></> },
  { name: "Arquitectura", glyph: <><path d="M3 21h18M5.5 21v-7.5L12 8l6.5 5.5V21M10 21v-4.5h4V21" /><circle cx="18.5" cy="4.5" r="1.8" /><path d="M18.5 1v1M18.5 7v1M15 4.5h1M21 4.5h1" /></> },
  { name: "Exploración", glyph: <><path d="M2 20.5 9 9.5l4 6 3-4 6 9Z" /><path d="M9 9.5V3.5l4.5 1.6L9 6.7" /></> },
  { name: "Arte", glyph: <><path d="M12 3a9 9 0 1 0 0 18c1.6 0 2.1-1.1 1.6-2.3-.6-1.4.4-2.9 2-2.9H18a3 3 0 0 0 3-3c0-5.4-4-9.8-9-9.8Z" /><circle cx="7.6" cy="10.5" r="1.2" /><circle cx="11" cy="6.8" r="1.2" /><circle cx="15.6" cy="8" r="1.2" /></> },
  { name: "Sociedad", glyph: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18M4.6 7.5h14.8M4.6 16.5h14.8" /></> },
  { name: "Ingeniería", glyph: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="6.5" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></> },
  { name: "Proyectos", glyph: <><path d="M9 17.5h6M10 20.5h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2v1.5h5V16c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z" /><path d="M12 7v4M10.5 9.5 12 11l1.5-1.5" /></> },
  { name: "Bienestar", glyph: <><path d="M2 12.5h4.5l2-5 4 10 2.2-5H22" /><circle cx="12" cy="12" r="10" strokeDasharray="1.5 2.5" /></> },
  { name: "Literatura", glyph: <><path d="M12 6C10 4.5 7 4 3.5 4.5V19C7 18.5 10 19 12 20.5c2-1.5 5-2 8.5-1.5V4.5C17 4 14 4.5 12 6Z" /><path d="M12 6v14.5M6 8.5c1.5-.1 2.8.1 4 .7M6 11.5c1.5-.1 2.8.1 4 .7M14 9.2c1.2-.6 2.5-.8 4-.7" /></> },
  { name: "Relaciones", glyph: <><circle cx="8.5" cy="12" r="5.5" /><circle cx="15.5" cy="12" r="5.5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></> },
  { name: "Ágora", glyph: <><path d="M3.5 18a8.5 8.5 0 0 1 17 0M7.5 18a4.5 4.5 0 0 1 9 0M2.5 21h19" /><circle cx="12" cy="7" r="1.3" /><path d="M9 4.5c1.5-1.5 4.5-1.5 6 0" /></> },
];

const N = AREAS.length;
const deg = (i: number) => -90 + (i * 360) / N; // empieza arriba, sentido horario
const rad = (d: number) => (d * Math.PI) / 180;
const pt = (r: number, d: number) => [C + r * Math.cos(rad(d)), C + r * Math.sin(rad(d))] as const;
const f = (n: number) => Math.round(n * 10) / 10;

// Relaciones entre disciplinas (índices en AREAS)
const CHORDS: [number, number][] = [
  [0, 1], [0, 7], [1, 3], [2, 3], [2, 10], [3, 8], [3, 18], [4, 1], [5, 6], [6, 8], [5, 19],
  [9, 16], [9, 17], [14, 19], [15, 20], [15, 21], [20, 21], [13, 10], [16, 12], [11, 10], [17, 20], [0, 13],
];
const JOURNEY = [1, 4, 11, 12]; // física → filosofía → agricultura → arquitectura

function chordPath(a: number, b: number) {
  const [x1, y1] = pt(R_CHORD, deg(a));
  const [x2, y2] = pt(R_CHORD, deg(b));
  // Punto de control hacia el centro, proporcional a la separación angular
  let diff = Math.abs(deg(a) - deg(b)) % 360;
  if (diff > 180) diff = 360 - diff;
  const mid = (deg(a) + deg(b)) / 2 + (Math.abs(deg(a) - deg(b)) > 180 ? 180 : 0);
  const pull = R_CHORD * (1 - diff / 180) * 0.55;
  const [cx, cy] = pt(pull, mid);
  return `M${f(x1)} ${f(y1)} Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}`;
}

function arcPath(r: number, from: number, to: number, sweep: 0 | 1) {
  const [x1, y1] = pt(r, from);
  const [x2, y2] = pt(r, to);
  return `M${f(x1)} ${f(y1)} A${r} ${r} 0 1 ${sweep} ${f(x2)} ${f(y2)}`;
}

function Atlas({ compact }: { compact?: boolean }) {
  const journeyD = JOURNEY.slice(1).map((b, k) => chordPath(JOURNEY[k], b));
  return (
    <svg viewBox="0 0 800 800" className="h-full w-full overflow-visible" role="presentation">
      <defs>
        {/* Trayectorias para los nombres: arriba (horario) y abajo (antihorario), siempre legibles */}
        <path id="atlas-top" d={arcPath(R_LABEL_TOP, -200, 20, 1)} />
        <path id="atlas-bottom" d={arcPath(R_LABEL_BOTTOM, 200, -20, 0)} />
      </defs>

      {/* Dial exterior con marcas de grado */}
      <g className="animate-orbit-slow" style={{ transformOrigin: "400px 400px", transformBox: "view-box" }}>
        <circle cx={C} cy={C} r={R_TICKS} fill="none" stroke="var(--color-ink)" strokeOpacity=".16" />
        {Array.from({ length: 180 }, (_, i) => {
          const d = i * 2;
          const long = d % 30 === 0;
          const [x1, y1] = pt(R_TICKS, d);
          const [x2, y2] = pt(R_TICKS - (long ? 14 : 6), d);
          return (
            <line key={i} x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)} stroke="var(--color-ink)" strokeOpacity={long ? 0.32 : 0.12} />
          );
        })}
      </g>

      {/* Guías concéntricas */}
      <g fill="none" stroke="var(--color-ink)">
        <circle cx={C} cy={C} r={R_STATION} strokeOpacity=".1" />
        <circle cx={C} cy={C} r={204} strokeOpacity=".08" strokeDasharray="2 6" />
        <circle cx={C} cy={C} r={132} strokeOpacity=".08" />
        <circle cx={C} cy={C} r={66} strokeOpacity=".12" strokeDasharray="1 4" />
      </g>

      {/* Cuerdas de relación */}
      <g fill="none" stroke="var(--color-ink)" strokeOpacity=".14" strokeWidth="1">
        {CHORDS.map(([a, b]) => (
          <path key={`${a}-${b}`} d={chordPath(a, b)} />
        ))}
      </g>
      {/* Recorrido destacado */}
      <g fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round">
        {journeyD.map((d, k) => (
          <path
            key={k}
            d={d}
            strokeDasharray="900"
            className="animate-draw"
            style={{ ["--len" as string]: 900, animationDelay: `${0.5 + k * 0.6}s` }}
          />
        ))}
      </g>

      {/* Personas en órbita */}
      <g className="animate-orbit" style={{ transformOrigin: "400px 400px", transformBox: "view-box" }} fill="var(--color-accent-mid)">
        {Array.from({ length: 12 }, (_, i) => {
          const [x, y] = pt(204, i * 30 + 8);
          return <circle key={i} cx={f(x)} cy={f(y)} r={i % 3 === 0 ? 3.4 : 2.4} className="animate-breathe" style={{ animationDelay: `${i * 0.4}s` }} />;
        })}
      </g>
      <g className="animate-orbit-rev" style={{ transformOrigin: "400px 400px", transformBox: "view-box" }} fill="var(--color-accent)">
        {Array.from({ length: 7 }, (_, i) => {
          const [x, y] = pt(132, i * 51 + 20);
          return <circle key={i} cx={f(x)} cy={f(y)} r={2.6} opacity=".75" />;
        })}
      </g>

      {/* Núcleo: la marca (idea y dos personas) */}
      <g transform="translate(352 352) scale(3)">
        <circle cx="16" cy="16" r="15" fill="var(--color-canvas)" stroke="var(--color-ink)" strokeOpacity=".2" strokeWidth=".35" />
        <path d="M16 9 7.5 23M16 9l8.5 14" stroke="var(--color-ink)" strokeOpacity=".5" strokeWidth=".6" />
        <path d="M7.5 23h17" stroke="var(--color-ink)" strokeOpacity=".5" strokeWidth=".6" strokeDasharray="1.2 1.4" />
        <circle cx="7.5" cy="23" r="2.4" fill="var(--color-canvas)" stroke="var(--color-ink)" strokeWidth=".7" />
        <circle cx="24.5" cy="23" r="2.4" fill="var(--color-canvas)" stroke="var(--color-ink)" strokeWidth=".7" />
        <circle cx="16" cy="9" r="3" fill="var(--color-accent)" />
      </g>

      {/* Estaciones: las 22 áreas */}
      {AREAS.map((a, i) => {
        const d = deg(i);
        const [x, y] = pt(R_STATION, d);
        const on = JOURNEY.includes(i);
        return (
          <g key={a.name} className="animate-fade" style={{ animationDelay: `${0.15 + i * 0.05}s` }}>
            <circle cx={f(x)} cy={f(y)} r="22" fill={on ? "var(--color-accent-faint)" : "var(--color-canvas)"} stroke={on ? "var(--color-accent)" : "var(--color-ink)"} strokeOpacity={on ? 0.9 : 0.22} />
            <g
              transform={`translate(${f(x - 14.4)} ${f(y - 14.4)}) scale(1.2)`}
              fill="none"
              stroke={on ? "var(--color-accent)" : "var(--color-ink)"}
              strokeWidth={on ? 1.35 : 1.15}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: on ? "var(--color-accent)" : "var(--color-ink)" }}
            >
              {a.glyph}
            </g>
          </g>
        );
      })}

      {/* Nombres sobre el dial */}
      {!compact && (
        <g style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.16em" }}>
          {AREAS.map((a, i) => {
            const d = deg(i);
            const top = d < 0 || d > 180 ? d > 180 ? d - 360 : d : null;
            const on = JOURNEY.includes(i);
            const fill = on ? "var(--color-accent)" : "var(--color-muted)";
            if (top !== null && top >= -180 && top < 0) {
              const offset = ((top + 200) / 220) * 100;
              return (
                <text key={a.name} fill={fill} fontWeight={on ? 600 : 400}>
                  <textPath href="#atlas-top" startOffset={`${f(offset)}%`} textAnchor="middle">
                    {a.name.toUpperCase()}
                  </textPath>
                </text>
              );
            }
            const offset = ((200 - d) / 220) * 100;
            return (
              <text key={a.name} fill={fill} fontWeight={on ? 600 : 400}>
                <textPath href="#atlas-bottom" startOffset={`${f(offset)}%`} textAnchor="middle">
                  {a.name.toUpperCase()}
                </textPath>
              </text>
            );
          })}
        </g>
      )}
    </svg>
  );
}

export function KnowledgeAtlas({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <div className="aspect-square w-full md:hidden">
        <Atlas compact />
      </div>
      <div className="hidden aspect-square w-full md:block">
        <Atlas />
      </div>
    </div>
  );
}

export const ATLAS_AREA_COUNT = N;
