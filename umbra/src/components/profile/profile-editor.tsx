"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { saveProfileAction } from "@/app/(app)/profile-actions";
import { initialFormState } from "@/lib/form-state";
import {
  AVAILABILITY_LABELS,
  GOALS,
  LANGUAGES,
  PRIVACY_SECTIONS,
  VISIBILITY_OPTIONS,
  type GoalKey,
  type PrivacySectionKey,
  type VisibilityKey,
} from "@/lib/content";
import { MAX_SKILLS, MAX_TOPICS, USERNAME_RE } from "@/lib/validation/profile";
import type { ProfileRow } from "@/lib/supabase/types";
import type { Catalog, CatalogTopic } from "@/lib/data/catalog";
import { FormMessage, SubmitButton } from "@/components/forms/fields";
import { TagsInput } from "@/components/forms/tags-input";
import { AvatarUploader } from "./avatar-uploader";
import { CoverUploader } from "./cover-uploader";
import { TopicPicker, TopicRelations, type TopicChoice } from "./topic-picker";
import { IconArrow, IconBack } from "@/components/ui/icons";
import { BRAND } from "@/config/brand";

const STEPS = [
  { key: "identity", title: "¿Quién eres?", lead: "Así te verán los demás miembros. Solo el nombre y el usuario son obligatorios." },
  {
    key: "interests",
    title: "¿Qué te interesa?",
    lead: "Busca o recorre las 22 áreas y elige los temas que te mueven. Podrás cambiarlos cuando quieras.",
  },
  {
    key: "knowledge",
    title: "¿Qué sabes y qué aprendes?",
    lead: "Tu relación con cada tema ayuda a encontrar a quien puede enseñarte y a quien tú puedes ayudar.",
  },
  {
    key: "goals",
    title: "¿Qué vienes a hacer?",
    lead: "Tus objetivos orientan las recomendaciones de personas, círculos y proyectos.",
  },
  { key: "preferences", title: "Tus preferencias.", lead: "Idiomas, disponibilidad y quién ve cada parte de tu perfil." },
] as const;

const FIELD_STEP: Record<string, number> = {
  username: 0, display_name: 0, bio: 0,
  topics: 1,
  skills: 2, can_offer: 2, exploring: 2,
  goals: 3, looking_for: 3, personal_projects: 3,
  languages: 4, availability: 4, country: 4, region: 4, privacy: 4,
};

type Block =
  | "identity" | "bio" | "exploring" | "can_offer" | "looking_for" | "personal_projects" | "skills"
  | "picker" | "relations" | "goals" | "details" | "privacy";

const ONBOARDING_LAYOUT: { title: string; blocks: Block[] }[] = [
  { title: "Identidad", blocks: ["identity", "bio"] },
  { title: "Intereses", blocks: ["picker"] },
  { title: "Conocimientos", blocks: ["relations", "skills", "can_offer", "exploring"] },
  { title: "Objetivos", blocks: ["goals", "looking_for", "personal_projects"] },
  { title: "Preferencias", blocks: ["details", "privacy"] },
];

const EDIT_LAYOUT: { title: string; id: string; blocks: Block[] }[] = [
  { title: "Identidad", id: "identidad", blocks: ["identity"] },
  { title: "Presentación", id: "presentacion", blocks: ["bio", "exploring", "can_offer", "looking_for", "personal_projects", "skills"] },
  { title: "Intereses y conocimientos", id: "intereses", blocks: ["picker", "relations"] },
  { title: "Objetivos", id: "objetivos", blocks: ["goals"] },
  { title: "Detalles", id: "detalles", blocks: ["details"] },
  { title: "Privacidad", id: "privacidad", blocks: ["privacy"] },
];

export type ProfileEditorInitial = {
  topics: TopicChoice[];
  goals: GoalKey[];
  privacy: Record<PrivacySectionKey, VisibilityKey>;
};

export function ProfileEditor({
  mode,
  profile,
  catalog,
  initial,
}: {
  mode: "onboarding" | "edit";
  profile: ProfileRow;
  catalog: Catalog;
  initial: ProfileEditorInitial;
}) {
  const [state, action] = useActionState(saveProfileAction, initialFormState);
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<TopicChoice[]>(initial.topics);
  const [proposed, setProposed] = useState<CatalogTopic[]>([]);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onboarding = mode === "onboarding";
  const errors = { ...state.errors, ...localErrors };
  const topics = useMemo(() => [...catalog.topics, ...proposed.filter((p) => !catalog.topics.some((t) => t.id === p.id))], [catalog.topics, proposed]);

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

  function validateIdentity(): boolean {
    const e: Record<string, string> = {};
    const fd = new FormData(formRef.current!);
    if (!USERNAME_RE.test(String(fd.get("username") ?? "").trim())) e.username = "De 3 a 24 caracteres: letras, números o guion bajo.";
    if (!String(fd.get("display_name") ?? "").trim()) e.display_name = "¿Cómo quieres que te llamen?";
    setLocalErrors(e);
    return Object.keys(e).length === 0;
  }

  function toggleTopic(id: number) {
    setLocalErrors({});
    setChosen((c) =>
      c.some((x) => x.topic_id === id)
        ? c.filter((x) => x.topic_id !== id)
        : c.length >= MAX_TOPICS
          ? c
          : [...c, { topic_id: id, relation: "interested", is_primary: false }],
    );
  }

  const last = step === STEPS.length - 1;

  const blocks: Record<Block, React.ReactNode> = {
    identity: (
      <div className="space-y-9">
        <AvatarUploader initialUrl={profile.avatar_url} name={displayName} />
        <CoverUploader initialPath={profile.cover_path} />
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
      </div>
    ),
    bio: (
      <TextArea
        label="Sobre mí"
        name="bio"
        defaultValue={profile.bio}
        maxLength={600}
        placeholder="Quién eres, qué te apasiona, qué preguntas te quitan el sueño…"
        error={errors.bio}
      />
    ),
    exploring: (
      <TextArea
        label="Qué estoy explorando"
        name="exploring"
        defaultValue={profile.exploring}
        maxLength={600}
        placeholder="Leo sobre cosmología, estoy montando mi primer huerto, investigo la historia de mi pueblo…"
        error={errors.exploring}
      />
    ),
    can_offer: (
      <TextArea
        label="Qué puedo aportar"
        name="can_offer"
        defaultValue={profile.can_offer}
        maxLength={600}
        placeholder="Sé de electricidad solar, puedo revisar textos, tengo experiencia en bioconstrucción…"
        error={errors.can_offer}
      />
    ),
    looking_for: (
      <TextArea
        label="A quién me gustaría conocer"
        name="looking_for"
        defaultValue={profile.looking_for}
        maxLength={400}
        placeholder="Personas con huerta, astrónomos aficionados, gente con quien debatir sobre conciencia…"
        error={errors.looking_for}
      />
    ),
    personal_projects: (
      <TextArea
        label="Proyectos personales"
        name="personal_projects"
        defaultValue={profile.personal_projects}
        maxLength={600}
        placeholder="Una casa de adobe, un telescopio casero, una investigación sobre…"
        error={errors.personal_projects}
      />
    ),
    skills: (
      <TagsInput
        name="skills"
        label={`Habilidades · hasta ${MAX_SKILLS}`}
        initial={profile.skills ?? []}
        max={MAX_SKILLS}
        placeholder="Carpintería, Python, fotografía…"
        hint="Escribe una y pulsa Intro o «Añadir»."
        error={errors.skills}
      />
    ),
    picker: (
      <TopicPicker
        areas={catalog.areas}
        topics={topics}
        chosen={chosen}
        onToggle={toggleTopic}
        onProposed={(t) => {
          setProposed((p) => (p.some((x) => x.id === t.id) ? p : [...p, t]));
          setChosen((c) =>
            c.some((x) => x.topic_id === t.id) || c.length >= MAX_TOPICS ? c : [...c, { topic_id: t.id, relation: "interested", is_primary: false }],
          );
        }}
        error={onboarding ? errors.topics : undefined}
      />
    ),
    relations: (
      <div>
        {!onboarding && <p className="label mb-3">Tu relación con cada tema</p>}
        <TopicRelations
          areas={catalog.areas}
          topics={topics}
          chosen={chosen}
          onChange={(id, patch) => setChosen((c) => c.map((x) => (x.topic_id === id ? { ...x, ...patch } : x)))}
          onRemove={(id) => setChosen((c) => c.filter((x) => x.topic_id !== id))}
          onPickMore={onboarding ? () => setStep(1) : undefined}
        />
        {errors.topics && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {errors.topics}
          </p>
        )}
      </div>
    ),
    goals: (
      <fieldset>
        <legend className="label mb-4">Objetivos · elige los que quieras</legend>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <label key={g.key} className="chip cursor-pointer">
              <input type="checkbox" name="goals" value={g.key} defaultChecked={initial.goals.includes(g.key)} className="sr-only" />
              {g.label}
            </label>
          ))}
        </div>
        {errors.goals && <p role="alert" className="mt-3 text-sm text-danger">{errors.goals}</p>}
      </fieldset>
    ),
    details: (
      <div className="space-y-9">
        <fieldset>
          <legend className="label mb-4">Idiomas</legend>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <label key={l} className="chip cursor-pointer">
                <input type="checkbox" name="languages" value={l} defaultChecked={profile.languages.includes(l)} className="sr-only" />
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
                <input type="radio" name="availability" value={k} defaultChecked={profile.availability === k} className="sr-only" />
                {AVAILABILITY_LABELS[k]}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <p className="label mb-1">Ubicación aproximada · opcional</p>
          <p className="mb-2 text-sm text-muted">Solo país y región, nunca tu dirección. Déjalo en blanco si prefieres no mostrarla.</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <TextInput label="País" name="country" defaultValue={profile.country ?? ""} maxLength={60} autoComplete="country-name" error={errors.country} />
            <TextInput label="Región o ciudad" name="region" defaultValue={profile.region ?? ""} maxLength={80} autoComplete="off" error={errors.region} />
          </div>
        </div>
      </div>
    ),
    privacy: (
      <div className="space-y-6">
        <p className="text-sm text-muted">
          «Miembros» significa cualquier persona registrada: el contenido de {BRAND.name} nunca es público en internet.
        </p>
        {PRIVACY_SECTIONS.map((s) => (
          <fieldset key={s.key} className="border-t hairline pt-4">
            <legend className="sr-only">Quién ve: {s.label}</legend>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div aria-hidden="true">
                <p className="text-[1rem] text-ink">{s.label}</p>
                <p className="text-sm text-muted">{s.hint}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {VISIBILITY_OPTIONS.map((o) => (
                  <label key={o.key} className="chip !min-h-9 cursor-pointer !px-3 !text-[0.8125rem]" title={o.hint}>
                    <input
                      type="radio"
                      name={`privacy_${s.key}`}
                      value={o.key}
                      defaultChecked={initial.privacy[s.key] === o.key}
                      className="sr-only"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
          </fieldset>
        ))}
        {errors.privacy && <p role="alert" className="text-sm text-danger">{errors.privacy}</p>}
      </div>
    ),
  };

  const layout = onboarding ? ONBOARDING_LAYOUT.map((l, i) => ({ ...l, id: STEPS[i].key })) : EDIT_LAYOUT;

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      onSubmit={(e) => {
        if (onboarding && !last) {
          e.preventDefault();
          if (step > 0 || validateIdentity()) setStep(step + 1);
        }
      }}
    >
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="topics" value={JSON.stringify(chosen)} />

      {onboarding && (
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <span className="label">
              Paso {step + 1} de {STEPS.length}
            </span>
            <span className="label text-accent">
              {STEPS[step].key === "interests" || STEPS[step].key === "knowledge" ? `${chosen.length} temas` : ""}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span key={s.key} className={`h-px transition-colors duration-500 ${i <= step ? "bg-accent" : "bg-line-2"}`} />
            ))}
          </div>
          <h1 ref={headingRef} tabIndex={-1} className="display mt-10 text-[clamp(2.4rem,7vw,3.5rem)] text-ink outline-none">
            {STEPS[step].title}
          </h1>
          <p className="mt-4 font-serif text-lg text-ink-2">{STEPS[step].lead}</p>
        </div>
      )}

      {!onboarding && (
        <nav aria-label="Apartados del perfil" className="-mx-1 mb-10 flex gap-1 overflow-x-auto pb-1">
          {EDIT_LAYOUT.map((l) => (
            <a key={l.id} href={`#${l.id}`} className="shrink-0 rounded-full px-3 py-1.5 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink">
              {l.title}
            </a>
          ))}
        </nav>
      )}

      <FormMessage message={state.ok ? undefined : state.message} />
      {state.ok && <FormMessage tone="ok" message={state.message} />}

      <div className="space-y-16">
        {layout.map((section, i) => (
          <Section key={section.id} id={section.id} title={section.title} show={!onboarding || step === i} onboarding={onboarding}>
            {section.blocks.map((b) => (
              <div key={b}>{blocks[b]}</div>
            ))}
          </Section>
        ))}
      </div>

      <div
        className={
          onboarding
            ? "mt-14 flex flex-wrap items-center justify-between gap-4"
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
        <div className="flex items-center gap-2">
          {onboarding && step > 0 && !last && (
            <button type="button" className="btn btn-quiet" onClick={() => setStep(step + 1)}>
              Saltar este paso
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
      </div>
    </form>
  );
}

function Section({
  id,
  title,
  show,
  onboarding,
  children,
}: {
  id: string;
  title: string;
  show: boolean;
  onboarding: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={onboarding ? undefined : id}
      hidden={!show}
      className={onboarding ? "" : "grid scroll-mt-24 gap-8 border-t hairline pt-8 md:grid-cols-[12rem_1fr]"}
    >
      {!onboarding && <h2 className="font-serif text-xl text-ink">{title}</h2>}
      <div className="min-w-0 space-y-9">{children}</div>
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
      <label htmlFor={id} className="label block">
        {label}
      </label>
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
        <p id={`${id}-e`} role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-h`} className="mt-2 text-sm text-muted">
          {hint}
        </p>
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
        <label htmlFor={id} className="label block">
          {label}
        </label>
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
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
