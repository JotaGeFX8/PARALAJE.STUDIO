import type { Metadata } from "next";
import { InDevelopment } from "@/components/ui/in-development";
import { AREAS } from "@/lib/content";

export const metadata: Metadata = { title: "Proyectos" };

export default function ProyectosPage() {
  return (
    <InDevelopment
      area={AREAS[4]}
      features={[
        "Ficha de proyecto: nombre, descripción, imágenes y objetivos",
        "Localización aproximada opcional (región, nunca coordenadas)",
        "Estado: idea, en marcha, pausado, completado",
        "Solicitudes de colaboración y lista de participantes",
        "Espacio de conversación propio del proyecto",
      ]}
    />
  );
}
