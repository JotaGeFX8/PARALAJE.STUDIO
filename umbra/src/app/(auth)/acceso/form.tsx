"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction } from "../actions";
import { initialFormState } from "@/lib/form-state";
import { Field, FormMessage, SubmitButton } from "@/components/forms/fields";

export function SignInForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(signInAction, initialFormState);
  return (
    <form action={action} noValidate className="space-y-8">
      <FormMessage message={state.message ?? notice} />
      <input type="hidden" name="next" value={next ?? ""} />
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
      <div>
        <Field
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={72}
          error={state.errors?.password}
        />
        <Link href="/recuperar" className="link-draw mt-3 inline-block text-sm text-stone hover:text-bone">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
    </form>
  );
}
