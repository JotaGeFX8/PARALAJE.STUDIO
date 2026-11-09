import type { Metadata } from "next";
import { InDevelopment } from "@/components/ui/in-development";
import { AREAS } from "@/lib/content";

export const metadata: Metadata = { title: "Conexiones" };

export default function ConexionesPage() {
  return (
    <InDevelopment
      area={AREAS[2]}
      features={[
        "Buscador de miembros por intereses, país, región, proyectos y disponibilidad",
        "Afinidad calculada a partir de intereses y favoritos compartidos",
        "Solicitudes de conexión: enviar, aceptar o rechazar",
        "Mensajes privados con historial e indicador de no leídos",
        "Bloqueo de usuarios y denuncia de perfiles o mensajes",
        "Notificaciones internas de solicitudes y mensajes",
      ]}
    />
  );
}
