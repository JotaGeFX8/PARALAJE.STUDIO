"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/denuncias", label: "Denuncias" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/contenido", label: "Contenido" },
  { href: "/admin/grupos", label: "Círculos y proyectos" },
  { href: "/admin/temas", label: "Temas" },
  { href: "/admin/etiquetas", label: "Etiquetas" },
  { href: "/admin/foros", label: "Foros", adminOnly: true },
  { href: "/admin/configuracion", label: "Configuración", adminOnly: true },
];

export function AdminTabs({ isAdmin, openReports }: { isAdmin: boolean; openReports: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Secciones de administración" className="tabs mb-8">
      {TABS.filter((t) => isAdmin || !t.adminOnly).map((t) => {
        const active = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className="tab" aria-current={active ? "page" : undefined}>
            {t.label}
            {t.href === "/admin/denuncias" && openReports > 0 && <span className="badge ml-2 align-[1px]">{openReports}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
