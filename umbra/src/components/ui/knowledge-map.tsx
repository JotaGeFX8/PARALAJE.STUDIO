/**
 * Mapa de conocimiento: temas conectados entre sí y personas (puntos) a su
 * alrededor. Un recorrido resaltado en verde ilustra la idea central de la
 * comunidad: de una pregunta sobre física cuántica a una vivienda autosuficiente.
 * Decorativo (aria-hidden), solo SVG + CSS, sin JavaScript en el cliente.
 */

type Node = { id: string; x: number; y: number; label: string; key?: boolean; project?: boolean; anchor?: "start" | "end" };

const NODES: Node[] = [
  { id: "cuantica", x: 96, y: 92, label: "Física cuántica", key: true },
  { id: "astronomia", x: 300, y: 50, label: "Astronomía" },
  { id: "uap", x: 560, y: 78, label: "UAP", anchor: "end" },
  { id: "conciencia", x: 214, y: 204, label: "Conciencia", key: true },
  { id: "civilizaciones", x: 428, y: 160, label: "Civilizaciones antiguas", anchor: "end" },
  { id: "filosofia", x: 58, y: 288, label: "Filosofía" },
  { id: "ia", x: 548, y: 284, label: "Inteligencia artificial", anchor: "end" },
  { id: "energia", x: 336, y: 318, label: "Energías alternativas", key: true },
  { id: "permacultura", x: 112, y: 420, label: "Permacultura" },
  { id: "rural", x: 520, y: 430, label: "Vida rural", anchor: "end" },
  { id: "casa", x: 312, y: 470, label: "Vivienda autosuficiente", key: true, project: true },
];

const EDGES: [string, string][] = [
  ["cuantica", "astronomia"],
  ["astronomia", "uap"],
  ["astronomia", "civilizaciones"],
  ["civilizaciones", "uap"],
  ["conciencia", "filosofia"],
  ["conciencia", "civilizaciones"],
  ["civilizaciones", "ia"],
  ["ia", "energia"],
  ["ia", "rural"],
  ["filosofia", "permacultura"],
  ["permacultura", "casa"],
  ["energia", "rural"],
  ["rural", "casa"],
  ["cuantica", "filosofia"],
];

const PATH = ["cuantica", "conciencia", "energia", "casa"];

const PEOPLE: [number, number, number][] = [
  [132, 64, 0], [52, 132, 1.2], [176, 238, 2.1], [258, 168, 0.6], [338, 92, 3], [468, 196, 1.8],
  [590, 252, 2.6], [378, 352, 0.9], [74, 452, 3.4], [262, 504, 1.5], [482, 466, 2.3], [24, 318, 0.3],
  [592, 120, 2.9], [236, 28, 1.1], [402, 284, 3.8], [152, 372, 2.7],
];

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

function Map({ viewBox, compact }: { viewBox: string; compact?: boolean }) {
  const pathD = PATH.map((id, i) => `${i ? "L" : "M"}${byId[id].x} ${byId[id].y}`).join(" ");
  return (
    <svg viewBox={viewBox} className="h-full w-full overflow-visible" role="presentation">
      {/* Conexiones */}
      <g stroke="var(--color-ink)" strokeOpacity=".13" strokeWidth="1">
        {EDGES.map(([a, b]) => (
          <line key={a + b} x1={byId[a].x} y1={byId[a].y} x2={byId[b].x} y2={byId[b].y} />
        ))}
      </g>

      {/* Recorrido destacado */}
      <path
        d={pathD}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1200"
        className="animate-draw"
        style={{ ["--len" as string]: 1200 }}
      />

      {/* Personas */}
      <g fill="var(--color-accent-mid)">
        {PEOPLE.map(([x, y, d]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" className="animate-breathe" style={{ animationDelay: `${d}s` }} />
        ))}
      </g>

      {/* Temas */}
      {NODES.map((n) => {
        const showLabel = !compact || n.key;
        const anchor = n.anchor ?? "start";
        const dx = anchor === "end" ? -12 : 12;
        return (
          <g key={n.id}>
            {n.project ? (
              <rect x={n.x - 7} y={n.y - 7} width="14" height="14" fill="var(--color-accent)" />
            ) : (
              <circle
                cx={n.x}
                cy={n.y}
                r={n.key ? 6 : 4.5}
                fill={n.key ? "var(--color-accent)" : "var(--color-canvas)"}
                stroke={n.key ? "none" : "var(--color-ink)"}
                strokeOpacity=".45"
                strokeWidth="1.2"
              />
            )}
            {showLabel && (
              <text
                x={n.x + dx}
                y={n.y + 4.5}
                textAnchor={anchor}
                className={n.key ? "fill-ink" : "fill-muted"}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: compact ? 17 : n.key ? 14.5 : 13,
                  fontWeight: n.key ? 500 : 400,
                }}
              >
                {n.label}
              </text>
            )}
            {n.project && (
              <text
                x={n.x + dx}
                y={n.y + (compact ? 26 : 22)}
                className="fill-accent"
                style={{ fontFamily: "var(--font-mono)", fontSize: compact ? 12 : 10, letterSpacing: "0.14em" }}
              >
                PROYECTO
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function KnowledgeMap({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <div className="aspect-[480/500] w-full md:hidden">
        <Map viewBox="20 30 480 500" compact />
      </div>
      <div className="hidden aspect-[640/540] w-full md:block">
        <Map viewBox="0 0 640 540" />
      </div>
    </div>
  );
}
