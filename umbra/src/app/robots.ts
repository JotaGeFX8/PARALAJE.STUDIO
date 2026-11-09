import type { MetadataRoute } from "next";
import { PRIVATE_PREFIXES } from "@/lib/routes";

export default function robots(): MetadataRoute.Robots {
  // Solo la portada y los textos legales son indexables; el resto es privado.
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...PRIVATE_PREFIXES, "/auth", "/nueva-contrasena"] },
  };
}
