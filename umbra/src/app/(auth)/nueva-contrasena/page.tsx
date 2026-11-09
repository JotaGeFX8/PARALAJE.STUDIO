import type { Metadata } from "next";
import { NewPasswordForm } from "./form";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function NuevaContrasenaPage() {
  return (
    <>
      <p className="label">Acceso</p>
      <h1 className="display mb-10 mt-5 text-[2.75rem] text-bone">Elige una contraseña nueva.</h1>
      <NewPasswordForm />
    </>
  );
}
