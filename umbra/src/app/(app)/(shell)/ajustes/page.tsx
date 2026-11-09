import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { ChangePasswordForm, DeleteAccountForm } from "@/components/profile/account-forms";
import { SignOutButton } from "@/components/shell/sign-out";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const { email, profile } = await requireOnboardedMember();
  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Cuenta" title="Ajustes" />
      <div className="space-y-0">
        <Row title="Cuenta">
          <dl className="space-y-5">
            <div>
              <dt className="label">Correo</dt>
              <dd className="mt-2 text-bone">{email}</dd>
            </div>
            <div>
              <dt className="label">Usuario</dt>
              <dd className="mt-2 font-mono text-bone">@{profile.username}</dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link href="/perfil/editar" className="btn btn-ghost min-h-11 text-sm">Editar perfil</Link>
            <SignOutButton />
          </div>
        </Row>
        <Row title="Contraseña">
          <ChangePasswordForm />
        </Row>
        <Row title="Notificaciones">
          <p className="text-[0.9375rem] leading-relaxed text-stone">
            Las preferencias de notificación llegarán junto con la mensajería y las conexiones (fase 4).
          </p>
        </Row>
        <Row title="Privacidad">
          <p className="text-[0.9375rem] leading-relaxed text-stone">
            Tu perfil solo es visible para miembros registrados. Tu ubicación, si la indicas, se limita a país y
            región. Consulta la{" "}
            <Link href="/privacidad" className="text-bone underline decoration-line-2 underline-offset-4">política de privacidad</Link>.
          </p>
        </Row>
        <Row title="Eliminar cuenta" danger>
          <p className="mb-8 text-[0.9375rem] leading-relaxed text-stone">
            Se borrarán tu perfil, tus intereses y tu foto. Esta acción no se puede deshacer.
          </p>
          <DeleteAccountForm username={profile.username ?? ""} />
        </Row>
      </div>
    </div>
  );
}

function Row({ title, danger, children }: { title: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t hairline py-10 md:grid-cols-[12rem_1fr] md:gap-10">
      <h2 className={`font-serif text-xl ${danger ? "text-danger" : "text-bone"}`}>{title}</h2>
      <div className="max-w-md">{children}</div>
    </section>
  );
}
