"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { saveProfileAction } from "@/app/(app)/profile-actions";
import { initialFormState } from "@/lib/form-state";
import { AVAILABILITY_LABELS, LANGUAGES } from "@/lib/content";
import { USERNAME_RE } from "@/lib/validation/profile";
import type { ProfileRow } from "@/lib/supabase/types";
import { FormMessage, SubmitButton } from "@/components/forms/fields";
import { AvatarUploader } from "./avatar-uploader";
import { IconArrow, IconBack } from "@/components/ui/icons";
import { BRAND } from "@/config/brand";

type Interest = { slug: string; name: string };

const STEPS = [
  { key: "identity", title: "¿Quién eres?", lead: "Así te verán los demás miembros." },
  { key: "interests", title: "¿Qué te mueve?", lead: "Elige al menos tres. Marca hasta tres como favoritos." },
  { key: "about", title: "Cuéntanos algo.", lead: "Todo es opcional, pero ayuda a encontrar afinidades." },
  { key: "details", title: "Últimos detalles.", lead: "Idiomas, disponibilidad y, si quieres, dónde estás." },
] as const;

const FIELD_STEP: Record<string, number> = {
  username: 0, display_name: 0,
  interests: 1, favorites: 1,
  bio: 2, looking_for: 2, personal_projects: 2,
  languages: 3, availability: 3, country: 3, region: 3,
};

export function ProfileEditor({
  mode,
  profile,
  interests,
  selected,
  favorites,
}: {
  mode: "onboarding" | "edit";
  profile: ProfileRow;
  interests: Interest[];
  selected: string[];
  favorites: string[];
}) {
  const [state, action] = useActionState(saveProfileAction, initialFormState);
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<string[]>(selected);
  const [favs, setFavs] = useState<string[]>(favorites);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onboarding = mode === "onboarding";
  const errors = { ...state.errors, ...localErrors };

  // Si el servidor devuelve errores, saltar al primer paso afectado
  // (ajuste de estado durante el render, sin efecto).
  const [seenErrors, setSeenErrors] = useState(state.errors);
  if (state.errors !== seenErrors) {
    setSeenErrors(state.errors);
    if (onboarding && state.errors) {
      const first = Math.min(...Object.keys(state.errors).map((k) => FIELD_STEP[k] ?? 0));
      if (Number.isFinite(first)) setStep(first);
    }
  }

  useEffect(() => {
    if (onboarding) headingRef.current?.focus();
  }, [step, onboarding]);

  function validateStep(i: number): boolean {
    const e: Record<string, string> = {};
    const fd = new FormData(formRef.current!);
    if (i === 0) {
      if (!USERNAME_RE.test(String(fd.get("username") ?? "").trim()))
        e.username = "De 3 a 24 caracteres: letras, números o guion bajo.";
      if (!String(fd.get("display_name") ?? "").trim()) e.display_name = "¿Cómo quieres que te llamen?";
    }
    if (i === 1 && chosen.length < 3) e.interests = "Elige al menos 3 intereses.";
    setLocalErrors(e);
    return Object.keys(e).length === 0;
  }

  function toggleInterest(slug: string) {
    setLocalErrors({});
    setChosen((c) => {
      if (c.includes(slug)) {
        setFavs((f) => f.filter((x) => x !== slug));
        return c.filter((x) => x !== slug);
      }
      return c.length >= 24 ? c : [...c, slug];
    });
  }

  function toggleFav(slug: string) {
    setFavs((f) => (f.includes(slug) ? f.filter((x) => x !== slug) : f.length >= 3 ? f : [...f, slug]));
  }

  const visible = (i: number) => !onboarding || step === i;
  const last = step === STEPS.length - 1;

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      onSubmit={(e) => {
        if (onboarding && !last) {
          e.preventDefault();
          if (validateStep(step)) setStep(step + 1);
        }
      }}
    >
      <input type="hidden" name="mode" value={mode} />
      {chosen.map((s) => (
        <input key={s} type="hidden" name="interests" value={s} />
      ))}
      {favs.map((s) => (
        <input key={s} type="hidden" name="favorites" value={s} />
      ))}

      {onboarding && (
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <span className="label">
              Paso {step + 1} de {STEPS.length}
            </span>
            <span className="label text-accent">{STEPS[step].key === "interests" ? `${chosen.length} elegidos` : ""}</span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span
                key={s.key}
                className={`h-px transition-colors duration-500 ${i <= step ? "bg-accent" : "bg-line-2"}`}
              />
            ))}
          </div>
          <h1 ref={headingRef} tabIndex={-1} className="display mt-10 text-[clamp(2.4rem,7vw,3.5rem)] text-ink outline-none">
            {STEPS[step].title}
          </h1>
          <p className="mt-4 font-serif text-lg text-ink-2">{STEPS[step].lead}</p>
        </div>
      )}

      <FormMessage message={state.ok ? undefined : state.message} />
      {state.ok && <FormMessage tone="ok" message={state.message} />}

      <div className="space-y-16">
        {/* ------------------------------------------------ Identidad */}
        <Section title="Identidad" show={visible(0)} onboarding={onboarding}>
          <AvatarUploader userId={profile.id} initialUrl={profile.avatar_url} name={displayName} />
          <TextInput
            label="Nombre visible"
            name="display_name"
            defaultValue={profile.display_name ?? ""}
            maxLength={60}
            autoComplete="name"
            error={errors.display_name}
            onChange={setDisplayName}
          />
          <TextInput
            label="Nombre de usuario"
            name="username"
            defaultValue={profile.username ?? ""}
            maxLength={24}
            autoComplete="username"
            prefix="@"
            hint="Letras, números y guion bajo. Será tu dirección en la comunidad."
            error={errors.username}
          />
        </Section>

        {/* ------------------------------------------------ Intereses */}
        <Section title="Intereses" show={visible(1)} onboarding={onboarding}>
          <fieldset>
            <legend className="label mb-4">Tus intereses</legend>
            <div className="flex flex-wrap gap-2">
              {interests.map((it) => (
                <button
                  key={it.slug}
                  type="button"
                  className="chip"
                  aria-pressed={chosen.includes(it.slug)}
                  onClick={() => toggleInterest(it.slug)}
                >
                  {it.name}
                </button>
              ))}
            </div>
            {errors.interests && <p role="alert" className="mt-3 text-sm text-danger">{errors.interests}</p>}
          </fieldset>
          {chosen.length > 0 && (
            <fieldset className="animate-rise">
              <legend className="label mb-4">Favoritos · {favs.length}/3</legend>
              <div className="flex flex-wrap gap-2">
                {interests
                  .filter((it) => chosen.includes(it.slug))
                  .map((it) => (
                    <button
                      key={it.slug}
                      type="button"
                      className="chip"
                      aria-pressed={favs.includes(it.slug)}
                      disabled={!favs.includes(it.slug) && favs.length >= 3}
                      onClick={() => toggleFav(it.slug)}
                    >
                      <span aria-hidden="true" className={favs.includes(it.slug) ? "text-accent" : "text-muted"}>
                        ✦
                      </span>
                      {it.name}
                    </button>
                  ))}
              </div>
            </fieldset>
          )}
        </Section>

        {/* ------------------------------------------------ Sobre ti */}
        <Section title="Sobre ti" show={visible(2)} onboarding={onboarding}>
          <TextArea
            label="Descripción"
            name="bio"
            defaultValue={profile.bio}
            maxLength={600}
            placeholder="Qué te apasiona, qué estás aprendiendo, qué preguntas te quitan el sueño…"
            error={errors.bio}
          />
          <TextArea
            label="A quién te gustaría conocer"
            name="looking_for"
            defaultValue={profile.looking_for}
            maxLength={400}
            placeholder="Personas con huerta, astrónomos aficionados, gente con quien debatir sobre conciencia…"
            error={errors.looking_for}
          />
          <TextArea
            label="Proyectos personales"
            name="personal_projects"
            defaultValue={profile.personal_projects}
            maxLength={600}
            placeholder="Una casa de adobe, un telescopio casero, una investigación sobre…"
            error={errors.personal_projects}
          />
        </Section>

        {/* ------------------------------------------------ Detalles */}
        <Section title="Detalles" show={visible(3)} onboarding={onboarding}>
          <fieldset>
            <legend className="label mb-4">Idiomas</legend>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <label key={l} className="chip cursor-pointer">
                  <input
                    type="checkbox"
                    name="languages"
                    value={l}
                    defaultChecked={profile.languages.includes(l)}
                    className="sr-only"
                  />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label mb-4">Disponibilidad para conversar</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(AVAILABILITY_LABELS) as (keyof typeof AVAILABILITY_LABELS)[]).map((k) => (
                <label key={k} className="chip cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    value={k}
                    defaultChecked={profile.availability === k}
                    className="sr-only"
                  />
                  {AVAILABILITY_LABELS[k]}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <p className="label mb-1">Ubicación aproximada · opcional</p>
            <p className="mb-2 text-sm text-muted">
              Solo país y región, nunca tu dirección. Déjalo en blanco si prefieres no mostrarla.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <TextInput label="País" name="country" defaultValue={profile.country ?? ""} maxLength={60} autoComplete="country-name" error={errors.country} />
              <TextInput label="Región o ciudad" name="region" defaultValue={profile.region ?? ""} maxLength={80} autoComplete="off" error={errors.region} />
            </div>
          </div>
        </Section>
      </div>

      <div
        className={
          onboarding
            ? "mt-14 flex items-center justify-between gap-4"
            : "sticky bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom))] z-10 -mx-5 mt-14 flex justify-end border-t hairline bg-canvas/90 px-5 py-4 backdrop-blur md:bottom-0"
        }
      >
        {onboarding && (
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{ visibility: step === 0 ? "hidden" : "visible" }}
          >
            <IconBack size={18} /> Atrás
          </button>
        )}
        {onboarding && !last ? (
          <button type="submit" className="btn btn-primary">
            Continuar <IconArrow size={18} />
          </button>
        ) : (
          <SubmitButton className="btn btn-primary" pendingLabel="Guardando…">
            {onboarding ? `Entrar en ${BRAND.name}` : "Guardar cambios"}
          </SubmitButton>
        )}
      </div>
    </form>
  );
}

function Section({
  title,
  show,
  onboarding,
  children,
}: {
  title: string;
  show: boolean;
  onboarding: boolean;
  children: React.ReactNode;
}) {
  return (
    <section hidden={!show} className={onboarding ? "" : "grid gap-8 border-t hairline pt-8 md:grid-cols-[12rem_1fr]"}>
      {!onboarding && <h2 className="font-serif text-xl text-ink">{title}</h2>}
      <div className="space-y-9">{children}</div>
    </section>
  );
}

function TextInput({
  label,
  name,
  defaultValue,
  maxLength,
  autoComplete,
  hint,
  error,
  prefix,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue: string;
  maxLength: number;
  autoComplete?: string;
  hint?: string;
  error?: string;
  prefix?: string;
  onChange?: (v: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label block">{label}</label>
      <div className="flex items-baseline">
        {prefix && <span className="pr-1 font-mono text-muted">{prefix}</span>}
        <input
          id={id}
          name={name}
          defaultValue={defaultValue}
          maxLength={maxLength}
          autoComplete={autoComplete}
          autoCapitalize={name === "username" ? "none" : undefined}
          spellCheck={name === "username" ? false : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className="field"
        />
      </div>
      {error ? (
        <p id={`${id}-e`} role="alert" className="mt-2 text-sm text-danger">{error}</p>
      ) : hint ? (
        <p id={`${id}-h`} className="mt-2 text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  maxLength,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  defaultValue: string;
  maxLength: number;
  placeholder?: string;
  error?: string;
}) {
  const id = useId();
  const [len, setLen] = useState(defaultValue.length);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="label block">{label}</label>
        <span className="font-mono text-[0.6875rem] text-muted" aria-hidden="true">
          {len}/{maxLength}
        </span>
      </div>
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={4}
        aria-invalid={error ? true : undefined}
        onChange={(e) => setLen(e.target.value.length)}
        className="field"
      />
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
