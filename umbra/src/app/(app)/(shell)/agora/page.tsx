import type { Metadata } from "next";
import { InDevelopment } from "@/components/ui/in-development";
import { AREAS } from "@/lib/content";

export const metadata: Metadata = { title: "Ágora" };

export default function AgoraPage() {
  return (
    <InDevelopment
      area={AREAS[5]}
      features={[
        "Publicaciones rápidas sin categoría",
        "Preguntas abiertas a toda la comunidad",
        "Debates y comentarios en hilo",
        "Reacciones",
      ]}
    />
  );
}
