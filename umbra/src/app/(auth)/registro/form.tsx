"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction } from "../actions";
import { initialFormState } from "@/lib/form-state";
import { Field, FormMessage, SubmitButton } from "@/components/forms/fields";
import { IconCheck } from "@/components/ui/icons";

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, initialFormState);

  if (state.ok) {
    return (
      <div className="animate-rise" role="status">
        <span className="grid h-12 w-12 place-items-center border border-accent-mid text-accent">
          <IconCheck />
        </span>
        <h1 className="display mt-8 text-4xl text-ink">Revisa tu correo.</h1>
        <p className="mt-5 font-serif text-lg leading-relaxed text-ink-2">
          Hemos enviado un enlace de confirmación a <span className="text-ink">{state.values?.email}</span>.
          Ábrelo para activar tu cuenta y completar tu perfil.
        </p>
        <p className="mt-6 text-sm text-muted">
          ¿No llega? Mira en la carpeta de spam o espera un par de minutos. Si ya tenías cuenta, puedes{" "}
          <Link href="/acceso" className="text-ink underline decoration-line-2 underline-offset-4">
            entrar directamente
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-8">
      <FormMessage message={state.message} />
      {/* Campo trampa para bots: invisible para personas y lectores de pantalla */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Sitio web
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Field
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={state.errors?.email}
      />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        maxLength={72}
        hint="Mínimo 10 caracteres, con letras y números o símbolos."
        error={state.errors?.password}
      />
      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-2">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-1 h-4 w-4 shrink-0"
            aria-invalid={state.errors?.terms ? true : undefined}
          />
          <span>
            Acepto las{" "}
            <Link href="/normas" target="_blank" className="text-ink underline decoration-line-2 underline-offset-4">
              normas de la comunidad
            </Link>
            , los{" "}
            <Link href="/terminos" target="_blank" className="text-ink underline decoration-line-2 underline-offset-4">
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" target="_blank" className="text-ink underline decoration-line-2 underline-offset-4">
              política de privacidad
            </Link>
            .
          </span>
        </label>
        {state.errors?.terms && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {state.errors.terms}
          </p>
        )}
      </div>
      <SubmitButton pendingLabel="Creando cuenta…">Crear cuenta</SubmitButton>
    </form>
  );
}
