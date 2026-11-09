"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AREAS, MOBILE_NAV, PROFILE_AREA } from "@/lib/content";
import { IconSettings } from "@/components/ui/icons";

function isActive(path: string, href: string) {
  return path === href || path.startsWith(href + "/");
}

/** Navegación lateral (escritorio). */
export function SideNav() {
  const path = usePathname();
  const items = [...AREAS, PROFILE_AREA, { href: "/ajustes", name: "Ajustes", icon: IconSettings }];
  return (
    <nav aria-label="Secciones" className="flex flex-col gap-0.5">
      {items.map((a, i) => {
        const Icon = a.icon;
        const active = isActive(path, a.href);
        return (
          <div key={a.href}>
            {i === AREAS.length && <hr className="my-4 border-line" />}
            <Link
              href={a.href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3.5 py-2.5 pl-4 pr-3 text-[0.9375rem] transition-colors duration-300 ${
                active ? "text-ink" : "text-muted hover:text-ink"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute left-0 top-1/2 h-5 w-px -translate-y-1/2 transition-colors duration-300 ${
                  active ? "bg-accent" : "bg-transparent"
                }`}
              />
              <Icon size={19} className={active ? "text-accent" : ""} />
              {a.name}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

/** Barra inferior (móvil). */
export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-canvas/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid h-[var(--nav-h)] max-w-lg grid-cols-5">
        {MOBILE_NAV.map((a) => {
          const Icon = a.icon;
          const active = isActive(path, a.href);
          return (
            <li key={a.href}>
              <Link
                href={a.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 transition-colors ${
                  active ? "text-ink" : "text-muted"
                }`}
              >
                <Icon size={22} className={active ? "text-accent" : ""} />
                <span className="text-[0.625rem] tracking-wide">{a.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
