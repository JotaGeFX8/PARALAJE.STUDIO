import type { Metadata } from "next";
import Link from "next/link";
import { redirectIfSignedIn } from "@/lib/auth";
import { ResetForm } from "./form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default async function RecuperarPage() {
  await redirectIfSignedIn();
  return (
    <>
      <p className="label">Acceso</p>
      <h1 className="display mb-3 mt-5 text-[2.75rem] text-bone">Recupera tu acceso.</h1>
      <p className="mb-10 font-serif text-lg text-stone-2">Te enviaremos un enlace para crear una contraseña nueva.</p>
      <ResetForm />
      <p className="mt-10 text-sm text-stone">
        <Link href="/acceso" className="text-bone underline decoration-line-2 underline-offset-4">
          Volver a entrar
        </Link>
      </p>
    </>
  );
}
