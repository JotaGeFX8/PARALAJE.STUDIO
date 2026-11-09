import type { Metadata } from "next";
import Link from "next/link";
import { redirectIfSignedIn } from "@/lib/auth";
import { SignUpForm } from "./form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegistroPage() {
  await redirectIfSignedIn();
  return (
    <>
      <p className="label">Nuevo miembro</p>
      <h1 className="display mb-3 mt-5 text-[2.75rem] text-bone">Únete a UMBRA.</h1>
      <p className="mb-10 font-serif text-lg text-stone-2">Gratuito. Sin publicidad. Solo para curiosos.</p>
      <SignUpForm />
      <p className="mt-10 text-sm text-stone">
        ¿Ya tienes cuenta?{" "}
        <Link href="/acceso" className="text-bone underline decoration-line-2 underline-offset-4">
          Entrar
        </Link>
      </p>
    </>
  );
}
