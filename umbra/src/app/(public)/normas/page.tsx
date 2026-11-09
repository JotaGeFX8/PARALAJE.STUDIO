import type { Metadata } from "next";
import { DocPage } from "@/components/ui/doc-page";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = { title: "Normas de convivencia" };

export default function NormasPage() {
  return (
    <DocPage eyebrow="Convivencia" title="Normas de la comunidad" updated="noviembre 2026">
      <p>
        {BRAND.name} existe para conversar sobre cualquier idea —también las incómodas o minoritarias— sin perder el
        respeto ni la honestidad intelectual. Estas normas protegen ese equilibrio.
      </p>
      <h2>1. Discute ideas, no personas</h2>
      <p>
        Puedes discrepar con toda la intensidad que quieras de un argumento. No se permiten insultos,
        acoso, amenazas ni ataques por origen, creencias, género, orientación, discapacidad o cualquier otra
        condición personal.
      </p>
      <h2>2. Declara la naturaleza de lo que aportas</h2>
      <p>Cada publicación indica si es:</p>
      <ul>
        <li><strong>Documentado</strong>: se apoya en fuentes verificables. Cítalas.</li>
        <li><strong>Hipótesis</strong>: una posibilidad por explorar, no un hecho.</li>
        <li><strong>Opinión</strong>: tu postura personal argumentada.</li>
        <li><strong>Experiencia</strong>: algo vivido en primera persona.</li>
      </ul>
      <p>
        Presentar especulación como hecho demostrado, o inventar fuentes, es motivo de moderación. La
        moderación puede reclasificar una aportación mal etiquetada.
      </p>
      <h2>3. Cuida la información sensible</h2>
      <ul>
        <li>No publiques datos personales de otras personas (direcciones, teléfonos, documentos).</li>
        <li>No compartas tu ubicación exacta: basta con país o región.</li>
        <li>Los consejos de salud, legales o de seguridad física no sustituyen a profesionales.</li>
      </ul>
      <h2>4. Sin spam ni captación</h2>
      <p>
        No se permite la publicidad no solicitada, las cadenas, la captación para esquemas económicos ni el
        uso de la red de contactos con fines comerciales sin consentimiento.
      </p>
      <h2>5. Contenido prohibido</h2>
      <p>
        Contenido ilegal, explotación de menores, incitación a la violencia, instrucciones para causar daño
        y contenido sexual explícito. Se elimina y, cuando la ley lo exige, se comunica a las autoridades.
      </p>
      <h2>6. Cómo moderamos</h2>
      <p>
        Cualquier miembro puede denunciar contenido o perfiles. Una persona del equipo revisa cada denuncia.
        Las medidas son graduales: aviso, restricción temporal, suspensión y, en casos graves, expulsión.
        Siempre puedes pedir una revisión de la decisión.
      </p>
    </DocPage>
  );
}
