import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboardedMember } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { ChangePasswordForm, DeleteAccountForm } from "@/components/profile/account-forms";
import { SignOutButton } from "@/components/shell/sign-out";
import { NotificationPrefsForm } from "@/components/notifications/prefs-form";
import { BlockedList } from "@/components/social/blocked-list";
import { blockedMembers, notificationPrefs } from "@/lib/data/social";
import { getMyCatalogState } from "@/lib/data/catalog";
import { ThemePicker } from "@/components/shell/theme-picker";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const { email, profile } = await requireOnboardedMember();
  const [prefs, blocked, mine] = await Promise.all([notificationPrefs(profile.id), blockedMembers(profile.id), getMyCatalogState(profile.id)]);
  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Cuenta" title="Ajustes" />
      <div className="space-y-0">
        <Row title="Cuenta">
          <dl className="space-y-5">
            <div>
              <dt className="label">Correo</dt>
              <dd className="mt-2 text-ink">{email}</dd>
            </div>
            <div>
              <dt className="label">Usuario</dt>
              <dd className="mt-2 font-mono text-ink">@{profile.username}</dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link href="/perfil/editar" className="btn btn-ghost min-h-11 text-sm">Editar perfil</Link>
            <SignOutButton />
          </div>
        </Row>
        <Row title="Apariencia" id="apariencia">
          <p className="mb-4 text-[0.9375rem] text-muted">Se aplica al momento y se guarda en tu cuenta para todos tus dispositivos.</p>
          <ThemePicker initial={mine.settings.theme} />
        </Row>
        <Row title="Contraseña">
          <ChangePasswordForm />
        </Row>
        <Row title="Avisos" id="avisos">
          <NotificationPrefsForm prefs={prefs} />
        </Row>
        <Row title="Bloqueos">
          <BlockedList rows={blocked} />
        </Row>
        <Row title="Privacidad">
          <p className="text-[0.9375rem] leading-relaxed text-muted">
            Tu perfil solo es visible para miembros registrados. Decide quién ve cada apartado (ubicación,
            presentación, intereses, actividad y red) en{" "}
            <Link href="/perfil/editar#privacidad" className="text-ink underline decoration-line-2 underline-offset-4">tu perfil</Link>. Consulta la{" "}
            <Link href="/privacidad" className="text-ink underline decoration-line-2 underline-offset-4">política de privacidad</Link>.
          </p>
        </Row>
        <Row title="Eliminar cuenta" danger>
          <p className="mb-8 text-[0.9375rem] leading-relaxed text-muted">
            Se borrarán tu perfil, tus intereses y tu foto. Esta acción no se puede deshacer.
          </p>
          <DeleteAccountForm username={profile.username ?? ""} />
        </Row>
      </div>
    </div>
  );
}

function Row({ title, danger, id, children }: { title: string; danger?: boolean; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="grid scroll-mt-20 gap-6 border-t hairline py-10 md:grid-cols-[12rem_1fr] md:gap-10">
      <h2 className={`font-serif text-xl ${danger ? "text-danger" : "text-ink"}`}>{title}</h2>
      <div className="max-w-md">{children}</div>
    </section>
  );
}
