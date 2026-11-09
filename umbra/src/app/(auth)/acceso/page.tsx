import type { Metadata } from "next";
import Link from "next/link";
import { redirectIfSignedIn } from "@/lib/auth";
import { SignInForm } from "./form";

export const metadata: Metadata = { title: "Entrar" };

export default async function AccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  await redirectIfSignedIn();
  const { next, error } = await searchParams;
  const notice =
    error === "enlace"
      ? "El enlace no es válido o ha caducado. Inicia sesión o solicita uno nuevo."
      : undefined;
  return (
    <>
      <p className="label">Miembros</p>
      <h1 className="display mb-10 mt-5 text-[2.75rem] text-ink">Hola de nuevo.</h1>
      <SignInForm next={next} notice={notice} />
      <p className="mt-10 text-sm text-muted">
        ¿Aún no eres miembro?{" "}
        <Link href="/registro" className="text-ink underline decoration-line-2 underline-offset-4">
          Crear cuenta
        </Link>
      </p>
    </>
  );
}
