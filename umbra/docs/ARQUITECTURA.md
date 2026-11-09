# Arquitectura

## 1. Punto de partida

- El repositorio `PARALAJE.STUDIO` contenía solo `paralaje (1).html`, una web de otro proyecto.
  **No se ha modificado.** Esta plataforma es un proyecto independiente que vive entero en la
  carpeta `umbra/` y puede moverse a su propio repositorio en cualquier momento.
- El nombre «UMBRA» es provisional y está centralizado (ver `RENOMBRAR.md`).

## 2. Pila tecnológica (coste 0 €)

| Capa | Tecnología | Por qué |
|---|---|---|
| Interfaz | Next.js 16 (App Router), React 19, TypeScript | Renderizado en servidor, Server Actions, rutas protegidas |
| Estilos | Tailwind CSS 4 + tokens semánticos propios (`globals.css`) | Identidad propia, tema claro, sin librerías de componentes |
| Datos | Supabase (PostgreSQL 17) | Plan gratuito suficiente para empezar |
| Auth | Supabase Auth (correo + contraseña, confirmación obligatoria) | Sesiones por cookie con `@supabase/ssr` |
| Seguridad de datos | Row Level Security en **todas** las tablas + funciones con comprobación de rol | La autorización vive en la base de datos |
| Archivos | Supabase Storage: `avatars` y `covers` (públicos), `post-images` (privado, URLs firmadas) | Imágenes reducidas en el navegador antes de subir |
| Tiempo real | Supabase Realtime (mensajes, avisos, chats) con sondeo de respaldo | Funciona aunque el tiempo real no esté disponible |
| Validación | zod en el servidor + restricciones SQL | Doble barrera |
| Hosting | Vercel Hobby (o Netlify / Cloudflare) | Despliegue desde GitHub |

Dependencias de producción: `next`, `react`, `react-dom`, `@supabase/ssr`, `@supabase/supabase-js`,
`zod`, `server-only`. Nada más: sin librerías de UI, de Markdown ni de iconos.

## 3. Estructura

```
umbra/
├─ src/
│  ├─ proxy.ts                      # (antes «middleware») refresca sesión y protege rutas
│  ├─ config/brand.ts               # nombre, eslogan y descripción (nombre provisional)
│  ├─ app/
│  │  ├─ (public)/                  # portada, normas, privacidad, términos
│  │  ├─ (auth)/                    # acceso, registro, recuperar, nueva contraseña
│  │  ├─ auth/confirm · auth/salir  # enlaces de correo y cierre de sesión (POST)
│  │  └─ (app)/                     # ZONA PRIVADA (sesión verificada)
│  │     ├─ bienvenida/             # alta en 4 pasos
│  │     ├─ actions/                # Server Actions: posts, social, groups, admin
│  │     └─ (shell)/                # navegación lateral (escritorio) e inferior (móvil)
│  │        ├─ explorar  comunidad[/slug]  publicar  p/[id][/editar]  etiqueta/[slug]
│  │        ├─ conexiones  mensajes[/id]  notificaciones  guardados  buscar
│  │        ├─ circulos[/nuevo|/ref]  proyectos[/nuevo|/ref[/editar]]  agora
│  │        ├─ perfil[/editar]  miembros/[username]  ajustes
│  │        └─ admin/ (resumen, denuncias, usuarios, contenido, grupos, territorios, configuración)
│  ├─ components/                   # ui, forms, shell, profile, posts, social, messages,
│  │                                #  notifications, groups, moderation, admin
│  └─ lib/
│     ├─ supabase/                  # clientes + tipos generados de la base de datos
│     ├─ data/                      # consultas de servidor por dominio
│     ├─ validation/                # esquemas zod
│     ├─ auth.ts  routes.ts  media.ts  realtime.ts  format.ts  images.ts  content.ts
├─ supabase/
│  ├─ migrations/                   # 8 migraciones SQL versionadas
│  ├─ templates/                    # correos de confirmación y recuperación
│  ├─ tests/security_test.sql       # 36 comprobaciones de seguridad
│  └─ config.toml                   # Supabase local
├─ tests/e2e/                       # 5 suites de extremo a extremo (navegador real)
└─ docs/
```

## 4. Seguridad

**Tres barreras**

1. **Proxy** (`src/proxy.ts`): sin sesión, las rutas privadas redirigen a `/acceso`.
2. **Servidor**: cada página privada verifica la sesión con Supabase Auth (`getUser`) y bloquea
   cuentas suspendidas o cerradas. Las páginas privadas se renderizan siempre por petición.
3. **Base de datos**: RLS en todas las tablas; las acciones sensibles son funciones que vuelven a
   comprobar el rol. Aunque alguien llamara a la API con la clave pública, solo vería y haría lo
   que las políticas permiten.

**Roles**: `admin` (todo, incluidos roles, expulsiones, territorios y configuración), `moderator`
(denuncias, retirar contenido, suspender miembros), `member`, `restricted` (lee y reacciona, no
publica, no comenta, no escribe mensajes ni crea grupos). Estados de cuenta: `active`,
`suspended`, `banned`.

**Otras medidas**

- Nadie puede cambiarse el rol (privilegios de columna + protección en la base de datos).
- Mensajes privados solo entre conexiones aceptadas; el equipo solo lee un mensaje si es denunciado.
- Bloquear corta la conexión, impide mensajes y solicitudes y oculta publicaciones mutuamente.
- Círculos privados y por invitación: su contenido y su chat solo para miembros; los avisos nunca
  revelan contenido a quien no puede leerlo.
- Límites de frecuencia en la base de datos (publicaciones, comentarios, mensajes, solicitudes,
  denuncias, círculos, proyectos) y antispam (textos duplicados, enlaces en cuentas nuevas,
  campo trampa en el registro). El equipo queda exento.
- Registro abierto/cerrado desde el panel, aplicado también en la base de datos.
- Content-Security-Policy, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Sin HTML de usuarios: el texto con formato se convierte en elementos React (sin XSS posible).
  Consultas parametrizadas en PostgREST (sin inyección SQL).
- Imágenes re-codificadas en el navegador: se eliminan los metadatos EXIF (incluida la ubicación).
- Ubicación: solo país y región, opcionales. Nunca coordenadas.
- Redirecciones saneadas, cierre de sesión solo por POST, errores neutros en registro y recuperación.
- Auditoría: cada acción de moderación queda registrada (`moderation_actions`).

## 5. Modelo de datos

```
auth.users ─1:1─ profiles ─┬─ profile_interests ── interests
                           ├─ posts ─┬─ post_tags ── tags          (territorio, Ágora o círculo)
                           │         ├─ comments (hilos) ── comment_reactions
                           │         ├─ post_reactions · saved_posts · post_follows
                           ├─ connections · member_skips · blocks
                           ├─ conversations ── messages
                           ├─ notifications · notification_prefs
                           ├─ circles ─┬─ circle_members · circle_requests · circle_invites
                           │           └─ circle_messages
                           ├─ projects ─┬─ project_members · project_requests
                           │            └─ project_messages (conversación y novedades)
                           └─ reports · moderation_actions
categories · site_settings
```

Funciones destacadas: `feed_posts` (cuatro ordenaciones: recientes, populares, más comentados y
tendencias con decaimiento temporal), `search_posts` (búsqueda en español sin tildes y por
prefijos), `search_members` y `discover_members` (afinidad por intereses), `my_unread_counts`,
`community_activity`, y las funciones de moderación `admin_*` / `mod_*`.

## 6. Decisiones de producto

- **Honestidad epistémica**: cada publicación declara si es *documentada* (exige fuentes),
  *hipótesis* (borde discontinuo), *opinión* o *experiencia*. El equipo puede reclasificar.
- **Reacciones propias**: Aporta · Me intriga · De acuerdo · Pide fuentes (no «me gusta»).
- **Conexiones por afinidad**: «Descubrir» muestra una persona cada vez con lo que compartís;
  «Pasar» no avisa a nadie. Escribir en privado exige conexión aceptada (antispam).
- **Notificaciones dentro de la web** (sin correos de actividad: coste 0 y sin límites de envío).
- **Secciones sin datos de ejemplo**: todo lo que se ve lo crean miembros reales.

## 7. Límites de los planes gratuitos

| Servicio | Límite relevante | Impacto |
|---|---|---|
| Supabase Free | 500 MB base de datos · 1 GB archivos · 5 GB transferencia/mes · 50.000 usuarios activos/mes · 200 conexiones de tiempo real | Holgado para cientos de miembros |
| Supabase Free | El proyecto se pausa tras 7 días sin actividad | Se reactiva desde el panel |
| Supabase Auth (correo integrado) | Solo envía al equipo del proyecto, con límite muy bajo | Hace falta SMTP propio (ver CONFIGURACION.md) |
| Vercel Hobby | Uso no comercial · 100 GB transferencia/mes | Válido mientras no haya ingresos |

Optimización aplicada: imágenes reducidas antes de subir (máx. 1600 px WebP; avatares 512 px),
avatares antiguos borrados, sin optimizador de imágenes de Vercel, paginación en todos los
listados, índices para las consultas frecuentes, sondeo solo con la pestaña visible.

## 8. Pendiente / siguientes pasos razonables

- Notificaciones push y por correo (requieren servicio de correo; ver paso 4 de CONFIGURACION).
- Service worker para uso sin conexión (el manifiesto y los iconos de la PWA ya están).
- Textos legales revisados por una persona con formación jurídica y datos del responsable.
- Los mensajes (privados y de grupo) se pueden borrar, pero todavía no editar.
