import type { Metadata } from "next";
import { DocPage, DraftNotice } from "@/components/ui/doc-page";

export const metadata: Metadata = { title: "Privacidad" };

export default function PrivacidadPage() {
  return (
    <DocPage eyebrow="Datos personales" title="Política de privacidad" updated="noviembre 2026">
      <DraftNotice />
      <h2>Qué datos tratamos</h2>
      <ul>
        <li><strong>Cuenta</strong>: correo electrónico y contraseña (cifrada; nunca la vemos).</li>
        <li>
          <strong>Perfil</strong>: nombre de usuario, nombre visible, descripción, intereses, idiomas, avatar y,
          solo si lo indicas, país y región. Nunca guardamos coordenadas ni tu ubicación precisa.
        </li>
        <li><strong>Actividad</strong>: lo que publicas, comentas o envías dentro de la comunidad.</li>
        <li><strong>Técnicos</strong>: cookies de sesión estrictamente necesarias para mantenerte conectado.</li>
      </ul>
      <h2>Para qué los usamos</h2>
      <p>
        Exclusivamente para prestar el servicio: mostrar tu perfil a otros miembros, sugerir afinidades y
        mantener la seguridad de la comunidad. No vendemos datos, no mostramos publicidad y no usamos
        herramientas de seguimiento de terceros.
      </p>
      <h2>Quién puede verlos</h2>
      <p>
        Tu perfil y tus publicaciones solo son visibles para miembros registrados. Los mensajes privados solo
        para sus participantes; el equipo de moderación puede acceder a un mensaje concreto únicamente cuando
        es denunciado.
      </p>
      <h2>Dónde se alojan</h2>
      <p>
        La base de datos y los archivos se alojan en Supabase y la web en Vercel (o proveedor equivalente).
        La región del servidor y los acuerdos de encargo de tratamiento deben indicarse aquí antes del
        lanzamiento.
      </p>
      <h2>Tus derechos</h2>
      <p>
        Puedes acceder, rectificar y eliminar tus datos, oponerte a su tratamiento y solicitar su
        portabilidad. Puedes editar tu perfil en cualquier momento desde Ajustes. Para el resto de
        solicitudes, contacta con el responsable (dato pendiente de completar).
      </p>
    </DocPage>
  );
}
