"use client";

import { useActionState } from "react";
import { updatePasswordAction } from "../actions";
import { initialFormState } from "@/lib/form-state";
import { Field, FormMessage, SubmitButton } from "@/components/forms/fields";

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, initialFormState);
  return (
    <form action={action} noValidate className="space-y-8">
      <FormMessage message={state.message} />
      <Field
        label="Nueva contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        maxLength={72}
        hint="Mínimo 10 caracteres, con letras y números o símbolos."
        error={state.errors?.password}
      />
      <Field
        label="Repite la contraseña"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        maxLength={72}
        error={state.errors?.confirm}
      />
      <SubmitButton pendingLabel="Guardando…">Guardar contraseña</SubmitButton>
    </form>
  );
}
