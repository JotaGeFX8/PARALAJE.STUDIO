import { IconExit } from "@/components/ui/icons";

/** Cierre de sesión por POST (no se puede forzar con un enlace). */
export function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <form action="/auth/salir" method="post">
      <button type="submit" className={`flex items-center gap-2 text-sm text-stone transition-colors hover:text-bone ${className}`}>
        <IconExit size={17} /> Cerrar sesión
      </button>
    </form>
  );
}
