"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AREAS, MOBILE_NAV } from "@/lib/content";
import { useUnread } from "./unread-provider";
import { IconBell, IconBook, IconBookmark, IconMail, IconPlus, IconProfile, IconSearch, IconSettings, IconShield } from "@/components/ui/icons";

function isActive(path: string, href: string) {
  return path === href || path.startsWith(href + "/");
}

type Item = {
  href: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number }>;
  count?: number;
};

function NavLink({ item, path }: { item: Item; path: string }) {
  const Icon = item.icon;
  const active = isActive(path, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3.5 rounded-xl py-2 pl-4 pr-3 text-[0.9375rem] transition-colors duration-200 ${
        active ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2/60 hover:text-ink"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full transition-colors ${active ? "bg-accent" : "bg-transparent"}`}
      />
      <Icon size={19} className={active ? "text-accent" : "text-muted group-hover:text-accent-mid"} />
      <span className="flex-1">{item.name}</span>
      {item.count ? <span className="badge">{item.count > 99 ? "99+" : item.count}</span> : null}
    </Link>
  );
}

/** Navegación lateral (escritorio). */
export function SideNav({ isStaff }: { isStaff: boolean }) {
  const path = usePathname();
  const counts = useUnread();
  const main: Item[] = AREAS.map((a) => ({
    href: a.href,
    name: a.name,
    icon: a.icon,
    count: a.href === "/conexiones" ? counts.requests : undefined,
  }));
  const personal: Item[] = [
    { href: "/mensajes", name: "Mensajes", icon: IconMail, count: counts.messages },
    { href: "/notificaciones", name: "Notificaciones", icon: IconBell, count: counts.notifications },
    { href: "/libros", name: "Biblioteca", icon: IconBook },
    { href: "/guardados", name: "Guardados", icon: IconBookmark },
    { href: "/perfil", name: "Perfil", icon: IconProfile },
    { href: "/ajustes", name: "Ajustes", icon: IconSettings },
  ];
  if (isStaff) personal.push({ href: "/admin", name: "Administración", icon: IconShield });

  return (
    <nav aria-label="Secciones" className="flex flex-col gap-0.5">
      <div className="mb-4 flex gap-2 px-1">
        <Link href="/publicar" className="btn btn-primary btn-sm flex-1">
          <IconPlus size={16} /> Publicar
        </Link>
        <Link href="/buscar" className="btn btn-ghost btn-sm !px-3" aria-label="Buscar">
          <IconSearch size={17} />
        </Link>
      </div>
      {main.map((i) => (
        <NavLink key={i.href} item={i} path={path} />
      ))}
      <hr className="my-3 border-line" />
      {personal.map((i) => (
        <NavLink key={i.href} item={i} path={path} />
      ))}
    </nav>
  );
}

/** Iconos de la cabecera móvil. */
export function MobileHeaderActions() {
  const counts = useUnread();
  const items = [
    { href: "/buscar", label: "Buscar", icon: IconSearch, count: 0 },
    { href: "/mensajes", label: "Mensajes", icon: IconMail, count: counts.messages },
    { href: "/notificaciones", label: "Notificaciones", icon: IconBell, count: counts.notifications },
  ];
  return (
    <div className="flex items-center gap-1">
      {items.map((i) => {
        const Icon = i.icon;
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-label={i.count ? `${i.label} (${i.count} sin leer)` : i.label}
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-accent"
          >
            <Icon size={21} />
            {i.count ? <span className="badge absolute right-0.5 top-0.5 !h-4 !min-w-4 !px-1 !text-[0.5625rem]">{i.count > 9 ? "9+" : i.count}</span> : null}
          </Link>
        );
      })}
    </div>
  );
}

/** Barra inferior (móvil). */
export function BottomNav() {
  const path = usePathname();
  const counts = useUnread();
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid h-[var(--nav-h)] max-w-lg grid-cols-5">
        {MOBILE_NAV.map((a) => {
          const Icon = a.icon;
          const active = isActive(path, a.href);
          const count = a.href === "/conexiones" ? counts.requests : 0;
          return (
            <li key={a.href}>
              <Link
                href={a.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-1 transition-colors ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <Icon size={22} />
                <span className="text-[0.625rem] tracking-wide">{a.name}</span>
                {count ? <span className="badge absolute left-[55%] top-2 !h-4 !min-w-4 !px-1 !text-[0.5625rem]">{count}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
