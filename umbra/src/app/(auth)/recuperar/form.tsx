"use client";

import { useActionState } from "react";
import { requestResetAction } from "../actions";
import { initialFormState } from "@/lib/form-state";
import { Field, FormMessage, SubmitButton } from "@/components/forms/fields";

export function ResetForm() {
  const [state, action] = useActionState(requestResetAction, initialFormState);
  if (state.ok) {
    return (
      <FormMessage
        tone="ok"
        message="Si existe una cuenta con ese correo, recibirás un enlace para crear una contraseña nueva. Caduca en una hora."
      />
    );
  }
  return (
    <form action={action} noValidate className="space-y-8">
      <FormMessage message={state.message} />
      <Field
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        error={state.errors?.email}
      />
      <SubmitButton pendingLabel="Enviando…">Enviar enlace</SubmitButton>
    </form>
  );
}
