import type { Metadata } from "next";
import Link from "next/link";
import { DocPage, DraftNotice } from "@/components/ui/doc-page";

export const metadata: Metadata = { title: "Términos de uso" };

export default function TerminosPage() {
  return (
    <DocPage eyebrow="Condiciones" title="Términos de uso" updated="noviembre 2026">
      <DraftNotice />
      <h2>1. El servicio</h2>
      <p>
        UMBRA es una comunidad online gratuita para compartir conocimiento, conversar y colaborar en
        proyectos. El acceso al contenido requiere una cuenta.
      </p>
      <h2>2. Tu cuenta</h2>
      <p>
        Debes tener al menos 16 años, facilitar un correo válido y mantener tu contraseña en secreto. Eres
        responsable de la actividad realizada desde tu cuenta.
      </p>
      <h2>3. Tu contenido</h2>
      <p>
        Conservas los derechos sobre lo que publicas. Nos concedes una licencia limitada para mostrarlo a
        otros miembros dentro de la plataforma. Puedes eliminarlo cuando quieras.
      </p>
      <h2>4. Convivencia</h2>
      <p>
        El uso de UMBRA implica aceptar las <Link href="/normas">normas de la comunidad</Link>. Su
        incumplimiento puede conllevar la retirada de contenido, la restricción o la suspensión de la cuenta.
      </p>
      <h2>5. Información y responsabilidad</h2>
      <p>
        Las aportaciones de los miembros reflejan sus opiniones y no las de UMBRA. Las hipótesis y
        experiencias compartidas no constituyen asesoramiento profesional.
      </p>
      <h2>6. Cambios</h2>
      <p>Avisaremos con antelación razonable de cualquier cambio relevante en estos términos.</p>
    </DocPage>
  );
}
