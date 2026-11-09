/**
 * Iconografía de la plataforma: trazo fino 1.25, geometría de observatorio.
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
export const IconComment = (p: P) => (
  <Base {...p}>
    <path d="M4.5 5.5h15v10h-8l-4 3.5v-3.5h-3Z" />
  </Base>
);
export const IconBookmark = (p: P) => (
  <Base {...p}>
    <path d="M7 4.5h10v15l-5-3.5-5 3.5Z" />
  </Base>
);
export const IconBell = (p: P) => (
  <Base {...p}>
    <path d="M6.5 16.5v-5a5.5 5.5 0 0 1 11 0v5l1.5 1.5H5Z" />
    <path d="M10 20.5h4" />
  </Base>
);
export const IconShare = (p: P) => (
  <Base {...p}>
    <path d="M12 3.5v11M8 7.5l4-4 4 4" />
    <path d="M5.5 12.5v7h13v-7" />
  </Base>
);
export const IconFlag = (p: P) => (
  <Base {...p}>
    <path d="M6 20.5v-16M6 5h11l-2.5 4L17 13H6" />
  </Base>
);
export const IconEdit = (p: P) => (
  <Base {...p}>
    <path d="M5 19l1-4.5L15.5 5l3.5 3.5L9.5 18Z" />
    <path d="M13.5 7l3.5 3.5" />
  </Base>
);
export const IconTrash = (p: P) => (
  <Base {...p}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5" />
  </Base>
);
export const IconImage = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="1" />
    <path d="m3.5 16 5-5 4 4 3-3 5 5" />
    <circle cx="15.5" cy="9" r="1.3" />
  </Base>
);
export const IconPlus = (p: P) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);
export const IconSearch = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Base>
);
export const IconQuestion = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.7" />
    <circle cx="12" cy="16.8" r=".6" fill="currentColor" />
  </Base>
);
export const IconLock = (p: P) => (
  <Base {...p}>
    <rect x="5.5" y="10.5" width="13" height="9" rx="1" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Base>
);
export const IconPin = (p: P) => (
  <Base {...p}>
    <path d="M9 4.5h6l-1 5 3 3H7l3-3ZM12 12.5v7" />
  </Base>
);
export const IconClose = (p: P) => (
  <Base {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Base>
);
export const IconSend = (p: P) => (
  <Base {...p}>
    <path d="M4.5 12 20 4.5 15 20l-3.5-6.5Z" />
    <path d="m11.5 13.5 3-3" />
  </Base>
);
export const IconMail = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="1" />
    <path d="m4 6.5 8 6 8-6" />
  </Base>
);
export const IconUsers = (p: P) => (
  <Base {...p}>
    <circle cx="9" cy="9" r="3" />
    <path d="M3.5 19c.8-3 2.9-4.5 5.5-4.5s4.7 1.5 5.5 4.5" />
    <circle cx="16.5" cy="9.5" r="2.4" />
    <path d="M16 14.6c2.2.2 3.8 1.6 4.5 4.4" />
  </Base>
);
export const IconShield = (p: P) => (
  <Base {...p}>
    <path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6Z" />
    <path d="m9 12 2 2 4-4" />
  </Base>
);
export const IconMore = (p: P) => (
  <Base {...p}>
    <circle cx="6" cy="12" r=".9" fill="currentColor" />
    <circle cx="12" cy="12" r=".9" fill="currentColor" />
    <circle cx="18" cy="12" r=".9" fill="currentColor" />
  </Base>
);
export const IconSpark = (p: P) => (
  <Base {...p}>
    <path d="M12 3.5 13.8 10 20.5 12l-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2Z" />
  </Base>
);
export const IconEye = (p: P) => (
  <Base {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Base>
);
export const IconQuote = (p: P) => (
  <Base {...p}>
    <path d="M5 17.5c2.5-1 3.5-3 3.5-6.5H5V6.5h5v4.5c0 4.5-1.5 7-5 8M14 17.5c2.5-1 3.5-3 3.5-6.5H14V6.5h5v4.5c0 4.5-1.5 7-5 8" />
  </Base>
);
export const IconBlock = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 6 12 12" />
  </Base>
);
export const IconLink = (p: P) => (
  <Base {...p}>
    <path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" />
    <path d="M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />
  </Base>
);
export const IconPoll = (p: P) => (
  <Base {...p}>
    <path d="M5 19.5V11M10 19.5V5M15 19.5v-6M20 19.5V8.5" />
  </Base>
);
export const IconFile = (p: P) => (
  <Base {...p}>
    <path d="M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8Z" />
    <path d="M14 3.5V8h4.5M9 13h6M9 16.5h4" />
  </Base>
);
export const IconDownload = (p: P) => (
  <Base {...p}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />
  </Base>
);
export const IconBook = (p: P) => (
  <Base {...p}>
    <path d="M12 6.5C10.3 5.2 7.8 4.5 4.5 4.5v13c3.3 0 5.8.7 7.5 2 1.7-1.3 4.2-2 7.5-2v-13c-3.3 0-5.8.7-7.5 2Z" />
    <path d="M12 6.5v13" />
  </Base>
);
