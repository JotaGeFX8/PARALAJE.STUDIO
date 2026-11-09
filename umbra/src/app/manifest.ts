import type { MetadataRoute } from "next";

/** Base para la futura PWA instalable (falta service worker e iconos PNG). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UMBRA",
    short_name: "UMBRA",
    description: "Explora ideas. Encuentra personas. Construye posibilidades.",
    start_url: "/explorar",
    display: "standalone",
    background_color: "#0a0b0a",
    theme_color: "#0a0b0a",
    lang: "es",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
