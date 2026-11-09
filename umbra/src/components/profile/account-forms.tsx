"use client";

import { useActionState } from "react";
import { changePasswordAction, deleteAccountAction } from "@/app/(app)/account-actions";
import { initialFormState } from "@/lib/form-state";
import { Field, FormMessage, SubmitButton } from "@/components/forms/fields";

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, initialFormState);
  return (
    <form action={action} noValidate className="space-y-7">
      <FormMessage message={state.message} tone={state.ok ? "ok" : "error"} />
      <Field label="Nueva contraseña" name="password" type="password" autoComplete="new-password" maxLength={72}
        hint="Mínimo 10 caracteres, con letras y números o símbolos." error={state.errors?.password} />
      <Field label="Repite la contraseña" name="confirm" type="password" autoComplete="new-password" maxLength={72}
        error={state.errors?.confirm} />
      <SubmitButton className="btn btn-ghost" pendingLabel="Guardando…">Cambiar contraseña</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm({ username }: { username: string }) {
  const [state, action] = useActionState(deleteAccountAction, initialFormState);
  return (
    <form action={action} noValidate className="space-y-7">
      <FormMessage message={state.message} />
      <Field label={`Escribe «${username}» para confirmar`} name="confirm" autoComplete="off" maxLength={25}
        error={state.errors?.confirm} />
      <SubmitButton className="btn border border-danger/60 text-danger hover:bg-danger-soft" pendingLabel="Eliminando…">
        Eliminar mi cuenta para siempre
      </SubmitButton>
    </form>
  );
}
