"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUnread } from "./unread-provider";
import {
  IconBell,
  IconBook,
  IconBookmark,
  IconCircles,
  IconCommunity,
  IconCompass,
  IconConnections,
  IconHome,
  IconMail,
  IconMenu,
  IconPlus,
  IconProfile,
  IconProjects,
  IconSearch,
  IconSettings,
  IconShield,
} from "@/components/ui/icons";

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

const ICON = {
  home: IconHome,
  compass: IconCompass,
  community: IconCommunity,
  circles: IconCircles,
  connections: IconConnections,
  projects: IconProjects,
  book: IconBook,
  mail: IconMail,
  bell: IconBell,
  bookmark: IconBookmark,
  profile: IconProfile,
  settings: IconSettings,
  shield: IconShield,
};

/** Navegación lateral (escritorio). */
export function SideNav({ isStaff }: { isStaff: boolean }) {
  const path = usePathname();
  const counts = useUnread();
  const main: Item[] = [
    { href: "/explorar", name: "Inicio", icon: ICON.home },
    { href: "/descubrir", name: "Descubrir", icon: ICON.compass },
    { href: "/comunidad", name: "Comunidad", icon: ICON.community },
    { href: "/circulos", name: "Círculos", icon: ICON.circles },
    { href: "/conexiones", name: "Conexiones", icon: ICON.connections, count: counts.requests },
    { href: "/proyectos", name: "Proyectos", icon: ICON.projects },
    { href: "/libros", name: "Biblioteca", icon: ICON.book },
  ];
  const personal: Item[] = [
    { href: "/mensajes", name: "Mensajes", icon: ICON.mail, count: counts.messages },
    { href: "/notificaciones", name: "Notificaciones", icon: ICON.bell, count: counts.notifications },
    { href: "/guardados", name: "Guardados", icon: ICON.bookmark },
    { href: "/perfil", name: "Perfil", icon: ICON.profile },
    { href: "/ajustes", name: "Ajustes", icon: ICON.settings },
  ];
  if (isStaff) personal.push({ href: "/admin", name: "Administración", icon: ICON.shield });

  return (
    <nav aria-label="Secciones" className="flex flex-col gap-0.5">
      <div className="mb-4 flex gap-2 px-1">
        <Link href="/crear" className="btn btn-primary btn-sm flex-1">
          <IconPlus size={16} /> Crear
        </Link>
        <Link href="/buscar" aria-label="Buscar" className="btn btn-ghost btn-sm !px-2.5">
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

/** Iconos de la cabecera móvil: buscar, mensajes y menú con el resto de espacios. */
export function MobileHeaderActions({ isStaff = false }: { isStaff?: boolean }) {
  const counts = useUnread();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(path);
  if (seen !== path) {
    setSeen(path);
    setOpen(false);
  }
  const more: Item[] = [
    { href: "/comunidad", name: "Comunidad", icon: ICON.community },
    { href: "/circulos", name: "Círculos", icon: ICON.circles },
    { href: "/conexiones", name: "Conexiones", icon: ICON.connections, count: counts.requests },
    { href: "/proyectos", name: "Proyectos", icon: ICON.projects },
    { href: "/libros", name: "Biblioteca", icon: ICON.book },
    { href: "/guardados", name: "Guardados", icon: ICON.bookmark },
    { href: "/ajustes", name: "Ajustes", icon: ICON.settings },
    ...(isStaff ? [{ href: "/admin", name: "Administración", icon: ICON.shield }] : []),
  ];
  const btn = "relative grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-surface-2";
  return (
    <div className="flex items-center gap-0.5">
      <Link href="/buscar" aria-label="Buscar" className={btn}>
        <IconSearch size={22} />
      </Link>
      <Link href="/mensajes" aria-label={counts.messages ? `Mensajes (${counts.messages} sin leer)` : "Mensajes"} className={btn}>
        <IconMail size={22} />
        {counts.messages ? <span className="badge absolute right-0.5 top-0.5 !h-4 !min-w-4 !px-1 !text-[0.5625rem]">{counts.messages > 9 ? "9+" : counts.messages}</span> : null}
      </Link>
      <button type="button" aria-label="Más secciones" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={btn}>
        <IconMenu size={22} />
        {counts.requests ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" /> : null}
      </button>
      {open && (
        <>
          <button type="button" aria-label="Cerrar menú" className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+3.75rem)] z-50 animate-[rise_0.25s_ease_both] rounded-2xl border border-line bg-surface p-2 shadow-xl">
            <ul className="grid grid-cols-2 gap-1">
              {more.map((i) => {
                const Icon = i.icon;
                return (
                  <li key={i.href}>
                    <Link href={i.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[0.9375rem] text-ink hover:bg-surface-2">
                      <Icon size={20} className="text-accent" />
                      <span className="flex-1">{i.name}</span>
                      {i.count ? <span className="badge">{i.count}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

/** Barra inferior (móvil): Inicio, Descubrir, Crear, Actividad y Perfil. */
export function BottomNav({ avatar }: { avatar: React.ReactNode }) {
  const path = usePathname();
  const counts = useUnread();
  const items = [
    { href: "/explorar", label: "Inicio", icon: ICON.home },
    { href: "/descubrir", label: "Descubrir", icon: ICON.compass },
    { href: "/crear", label: "Crear", icon: IconPlus, create: true },
    { href: "/notificaciones", label: "Actividad", icon: ICON.bell, count: counts.notifications },
    { href: "/perfil", label: "Perfil", icon: ICON.profile, avatar: true },
  ];
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid h-[var(--nav-h)] max-w-lg grid-cols-5">
        {items.map((a) => {
          const Icon = a.icon;
          const active = isActive(path, a.href) || (a.href === "/crear" && (path.startsWith("/publicar") || path.startsWith("/crear")));
          return (
            <li key={a.href}>
              <Link
                href={a.href}
                aria-current={active ? "page" : undefined}
                aria-label={a.count ? `${a.label} (${a.count} sin leer)` : a.label}
                className={`relative flex h-full flex-col items-center justify-center gap-1 transition-colors ${active ? "text-accent" : "text-ink-2"}`}
              >
                {a.create ? (
                  <span className="grid h-9 w-11 place-items-center rounded-xl bg-accent text-on-accent">
                    <Icon size={22} />
                  </span>
                ) : a.avatar ? (
                  <span className={`rounded-full ${active ? "ring-2 ring-accent ring-offset-2 ring-offset-canvas" : ""}`}>{avatar}</span>
                ) : (
                  <Icon size={24} />
                )}
                {!a.create && <span className="text-[0.625rem] tracking-wide">{a.label}</span>}
                {a.count ? <span className="badge absolute left-[55%] top-2 !h-4 !min-w-4 !px-1 !text-[0.5625rem]">{a.count > 9 ? "9+" : a.count}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
