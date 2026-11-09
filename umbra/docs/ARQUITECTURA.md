# UMBRA · Arquitectura

## 1. Auditoría inicial (noviembre 2026)

- Repositorio `PARALAJE.STUDIO`: contenía un único archivo, `paralaje (1).html`, una web estática de
  otro proyecto (prendas «Paralaje»). **No se ha tocado.** UMBRA vive en la carpeta `umbra/`, independiente.
- No existía código previo de UMBRA ni proyecto Supabase.
- Entorno: Node 22, npm 10.

## 2. Pila tecnológica (coste 0 €)

| Capa | Tecnología | Por qué |
|---|---|---|
| Interfaz | Next.js 16 (App Router), React 19, TypeScript | SSR, Server Actions, rutas protegidas en servidor |
| Estilos | Tailwind CSS 4 + sistema de tokens propio (`globals.css`) | Sin librerías de componentes: identidad propia |
| Datos | Supabase (PostgreSQL 17) | Plan gratuito suficiente para el arranque |
| Auth | Supabase Auth (correo + contraseña, confirmación obligatoria) | Sesiones por cookie httpOnly con `@supabase/ssr` |
| Seguridad de datos | Row Level Security en **todas** las tablas | La autorización vive en la base de datos, no en el navegador |
| Archivos | Supabase Storage (bucket `avatars`) | 1 GB gratis; avatares reducidos a 512 px WebP en el navegador |
| Validación | zod (servidor) | Todos los formularios se validan en el servidor |
| Hosting | Vercel Hobby (o Netlify / Cloudflare) | Despliegue desde GitHub |

Dependencias de producción: `next`, `react`, `react-dom`, `@supabase/ssr`, `@supabase/supabase-js`, `zod`,
`server-only`. Nada más.

## 3. Estructura de carpetas

```
umbra/
├─ src/
│  ├─ proxy.ts                    # (antes "middleware") refresca la sesión y protege rutas
│  ├─ app/
│  │  ├─ (public)/                # Portada, normas, privacidad, términos
│  │  ├─ (auth)/                  # acceso, registro, recuperar, nueva-contrasena + actions.ts
│  │  ├─ auth/confirm/route.ts    # destino de los enlaces de correo
│  │  ├─ auth/salir/route.ts      # cierre de sesión (solo POST)
│  │  └─ (app)/                   # ZONA PRIVADA: exige sesión verificada
│  │     ├─ bienvenida/           # onboarding en 4 pasos
│  │     ├─ profile-actions.ts    # guardar perfil, avatar
│  │     ├─ account-actions.ts    # contraseña, eliminar cuenta
│  │     └─ (shell)/              # exige perfil completo; navegación lateral / inferior
│  │        ├─ explorar/ comunidad/ conexiones/ circulos/ proyectos/ agora/
│  │        ├─ perfil/ perfil/editar/ miembros/[username]/ ajustes/
│  ├─ components/                 # ui/, forms/, shell/, profile/
│  └─ lib/
│     ├─ supabase/                # clientes navegador / servidor / proxy + tipos
│     ├─ auth.ts                  # getMember / requireMember / requireOnboardedMember
│     ├─ data/                    # consultas de servidor
│     ├─ validation/              # esquemas zod
│     ├─ content.ts               # textos editoriales (áreas, territorios, tipos epistémicos)
│     └─ routes.ts                # rutas privadas y saneado de redirecciones
├─ supabase/
│  ├─ migrations/                 # SQL versionado (esquema + RLS + catálogos)
│  ├─ templates/                  # plantillas de correo (confirmación, recuperación)
│  ├─ tests/                      # pruebas de seguridad de las políticas RLS
│  └─ config.toml                 # entorno Supabase local
└─ docs/
```

## 4. Seguridad: tres barreras

1. **Proxy** (`src/proxy.ts`): comprobación optimista en cada navegación. Sin sesión → `/acceso`.
2. **Servidor** (`(app)/layout.tsx`): `supabase.auth.getUser()` verifica el token contra Supabase Auth;
   bloquea cuentas suspendidas. Las páginas privadas se renderizan siempre por petición.
3. **Base de datos** (RLS): aunque alguien llamase a la API directamente con la clave pública, solo
   vería lo que las políticas permiten.

Detalles:

- Rol y estado de cuenta protegidos por **privilegios de columna** y un trigger: nadie puede
  ascenderse a administrador.
- Anónimos no pueden leer perfiles (solo los nombres de las categorías, para la portada).
- Las cuentas suspendidas desaparecen para el resto de miembros y no pueden modificar su
  perfil, sus intereses ni su avatar.
- El rol `restricted` (miembro restringido) queda definido; a partir de la fase 3 las
  políticas de escritura (publicar, comentar, enviar mensajes) lo excluirán.
- Redirecciones saneadas (`safeNext`) para evitar redirecciones abiertas.
- Cierre de sesión solo por POST.
- Mensajes de error neutros en registro y recuperación (no revelan si un correo existe).
- Cabeceras HTTP de seguridad (`next.config.ts`).
- React escapa todo el texto: no se usa `dangerouslySetInnerHTML`. PostgREST usa consultas
  parametrizadas: no hay SQL construido a mano.
- Las fotos se re-codifican en el navegador, lo que elimina metadatos EXIF (incluida la geolocalización).
- Ubicación: solo país y región en texto libre, opcionales. Nunca coordenadas.
- Pendiente para la fase 6: Content-Security-Policy con nonces y límites de frecuencia
  propios para publicaciones y mensajes (Supabase Auth ya limita registro, acceso y correos).

Pruebas: `supabase/tests/` (22 comprobaciones de RLS en PostgreSQL) y
`tests/e2e/flujo-completo.mjs` (flujo completo en navegador contra Supabase local).

## 5. Modelo de datos

### Implementado (fases 1–2)

```
auth.users ─1:1─ profiles ─1:N─ profile_interests ─N:1─ interests
                                                    categories
```

- `profiles`: username (único, sin distinguir mayúsculas), nombre visible, bio, avatar, país, región,
  idiomas, a quién quiere conocer, proyectos personales, disponibilidad, rol, estado, `onboarded_at`.
- `interests`: catálogo cerrado de 18 intereses.
- `profile_interests`: intereses elegidos (máx. 24) y favoritos (máx. 3).
- `categories`: los 12 territorios del foro.
- Funciones: `is_staff()`, `is_admin()`, `is_active_member()`, `set_my_interests()`, `delete_my_account()`.

### Previsto (fases 3–6)

| Fase | Tablas |
|---|---|
| 3 | `posts` (con `kind`: documentado · hipótesis · opinión · experiencia), `comments` (hilos), `reactions`, `saved_posts`, `post_follows`, `tags`, `post_tags`, `post_images` + búsqueda full-text en español (`tsvector`) |
| 4 | `connections` (pendiente/aceptada/rechazada), `blocks`, `conversations`, `conversation_members`, `messages` (con `read_at`), `notifications`, `notification_prefs` |
| 5 | `circles` (público/privado/invitación), `circle_members` (rol), `circle_requests`, `circle_messages`; `projects` (estado, región), `project_members`, `project_requests`; Ágora como posts sin categoría |
| 6 | `reports` (objetivo polimórfico, estado, resolución), `moderation_actions` (auditoría), límites de frecuencia en SQL (triggers por usuario/minuto) |

Mensajería y chat grupal: tablas preparadas para Supabase Realtime (Postgres Changes con RLS).

## 6. Límites de los planes gratuitos (a vigilar)

| Servicio | Límite relevante | Impacto |
|---|---|---|
| Supabase Free | 500 MB de base de datos, 1 GB de archivos, 5 GB de transferencia/mes, 50 000 usuarios activos/mes | Holgado para cientos de miembros |
| Supabase Free | **El proyecto se pausa tras 7 días sin actividad** | Se reactiva desde el panel; con uso real no ocurre |
| Supabase Free | 2 proyectos activos | Uno para producción basta |
| Supabase Auth (correo integrado) | **Solo envía a direcciones del equipo y con un límite muy bajo por hora** | Para usuarios reales hace falta un SMTP propio: ver CONFIGURACION.md (opciones gratuitas) |
| Vercel Hobby | Uso **no comercial**; 100 GB de transferencia/mes | Válido mientras UMBRA no tenga ingresos; si se monetiza, pasar a Pro o migrar a Netlify/Cloudflare |
| Supabase Realtime | 200 conexiones simultáneas | Suficiente para la fase inicial de mensajería |

Optimización de coste aplicada: sin optimizador de imágenes de Vercel (avatares ya reducidos en el
navegador), avatares antiguos borrados automáticamente, sin servicios de terceros.
