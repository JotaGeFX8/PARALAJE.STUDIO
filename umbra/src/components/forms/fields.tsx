"use client";

import { useFormStatus } from "react-dom";
import { useId, useState } from "react";

export function Field({
  label,
  name,
  error,
  hint,
  type = "text",
  defaultValue,
  autoComplete,
  required,
  maxLength,
  placeholder,
  inputMode,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  type?: string;
  defaultValue?: string;
  autoComplete?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="label block">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isPassword && reveal ? "text" : type}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          inputMode={inputMode}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`field ${isPassword ? "pr-20" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute right-0 top-1/2 -translate-y-1/2 px-1 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted hover:text-ink"
            aria-pressed={reveal}
            aria-label={reveal ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {reveal ? "Ocultar" : "Ver"}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Un momento…",
  className = "btn btn-primary w-full",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FormMessage({ message, tone = "error" }: { message?: string; tone?: "error" | "ok" }) {
  if (!message) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`border-l-2 px-4 py-3 text-sm leading-relaxed ${
        tone === "error" ? "border-danger bg-danger-soft text-ink" : "border-accent-mid bg-accent-soft text-ink"
      }`}
    >
      {message}
    </p>
  );
}
