import { redirect } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { siteSettings } from "@/lib/data/admin";
import { SettingsForm } from "@/components/admin/controls";
import { BRAND } from "@/config/brand";

export default async function ConfiguracionPage() {
  const { profile } = await requireOnboardedMember();
  if (profile.role !== "admin") redirect("/admin");
  const s = await siteSettings();
  return (
    <div className="space-y-12">
      <SettingsForm registrationOpen={s.registration_open} welcome={s.welcome_message} />
      <section className="max-w-2xl rounded-sm bg-surface-2 p-6 text-[0.9375rem] leading-relaxed text-ink-2">
        <h2 className="font-medium text-ink">Nombre de la plataforma</h2>
        <p className="mt-2">
          El nombre actual es <strong className="text-ink">{BRAND.name}</strong>. Es provisional: para cambiarlo, define la variable{" "}
          <code className="font-mono text-sm">NEXT_PUBLIC_BRAND_NAME</code> en Vercel (o en <code className="font-mono text-sm">.env.local</code>) y
          vuelve a desplegar. Guía completa en <code className="font-mono text-sm">docs/RENOMBRAR.md</code>.
        </p>
      </section>
    </div>
  );
}
