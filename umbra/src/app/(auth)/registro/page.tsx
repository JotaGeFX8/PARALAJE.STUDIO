import type { Metadata } from "next";
import Link from "next/link";
import { redirectIfSignedIn } from "@/lib/auth";
import { SignUpForm } from "./form";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegistroPage() {
  await redirectIfSignedIn();
  return (
    <>
      <p className="label">Nuevo miembro</p>
      <h1 className="display mb-3 mt-5 text-[2.75rem] text-ink">Únete a {BRAND.name}.</h1>
      <p className="mb-10 font-serif text-lg text-ink-2">Gratuito. Sin publicidad. Solo para curiosos.</p>
      <SignUpForm />
      <p className="mt-10 text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/acceso" className="text-ink underline decoration-line-2 underline-offset-4">
          Entrar
        </Link>
      </p>
    </>
  );
}
