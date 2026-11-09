import type { Metadata } from "next";
import { InDevelopment } from "@/components/ui/in-development";
import { AREAS } from "@/lib/content";

export const metadata: Metadata = { title: "Círculos" };

export default function CirculosPage() {
  return (
    <InDevelopment
      area={AREAS[3]}
      features={[
        "Círculos públicos, privados y por invitación",
        "Creación de círculos por cualquier miembro",
        "Descripción, imagen, administración y lista de miembros",
        "Publicaciones y debates internos",
        "Chat grupal",
        "Solicitudes de acceso e invitaciones",
      ]}
    />
  );
}
