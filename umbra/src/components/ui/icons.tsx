/**
 * Iconografía UMBRA: trazo fino 1.25, geometría de observatorio.
 * Todos los iconos son decorativos (aria-hidden); el texto acompaña siempre.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 22, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconExplore = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M15.2 8.8 13.3 13.3 8.8 15.2 10.7 10.7Z" />
  </Base>
);
export const IconCommunity = (p: P) => (
  <Base {...p}>
    <path d="M4 6.5h16M4 12h16M4 17.5h10" />
  </Base>
);
export const IconConnections = (p: P) => (
  <Base {...p}>
    <circle cx="9" cy="12" r="5.5" />
    <circle cx="15" cy="12" r="5.5" />
  </Base>
);
export const IconCircles = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r=".8" fill="currentColor" />
  </Base>
);
export const IconProjects = (p: P) => (
  <Base {...p}>
    <path d="M4 20 12 4l8 16Z" />
    <path d="M8 12h8" />
  </Base>
);
export const IconAgora = (p: P) => (
  <Base {...p}>
    <path d="M3.5 17a8.5 8.5 0 0 1 17 0" />
    <path d="M7.5 17a4.5 4.5 0 0 1 9 0" />
    <path d="M2.5 20h19" />
  </Base>
);
export const IconProfile = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="8.5" r="3.75" />
    <path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
  </Base>
);
export const IconSettings = (p: P) => (
  <Base {...p}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </Base>
);
export const IconArrow = (p: P) => (
  <Base {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);
export const IconBack = (p: P) => (
  <Base {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Base>
);
export const IconCheck = (p: P) => (
  <Base {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Base>
);
export const IconExit = (p: P) => (
  <Base {...p}>
    <path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" />
  </Base>
);
