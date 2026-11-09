import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireOnboardedMember } from "@/lib/auth";
import { adminStats } from "@/lib/data/admin";
import { AdminTabs } from "@/components/admin/admin-tabs";

export const metadata: Metadata = { title: "Administración", robots: { index: false } };

/** Zona del equipo. La base de datos vuelve a comprobar el rol en cada acción. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireOnboardedMember();
  if (profile.role !== "admin" && profile.role !== "moderator") redirect("/explorar");
  const stats = await adminStats();
  return (
    <div>
      <header className="mb-6">
        <p className="label">{profile.role === "admin" ? "Administración" : "Moderación"}</p>
        <h1 className="display mt-4 text-[clamp(2rem,5vw,3.2rem)] text-ink">Panel de la comunidad</h1>
      </header>
      <AdminTabs isAdmin={profile.role === "admin"} openReports={stats.openReports} />
      {children}
    </div>
  );
}
