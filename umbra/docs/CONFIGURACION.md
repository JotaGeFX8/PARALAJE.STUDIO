# Configuración externa paso a paso

Todo lo que aparece aquí lo tienes que hacer tú (son cuentas y paneles a tu nombre).
Ningún paso tiene coste salvo donde se indica expresamente **[DECISIÓN]**.

> Regla de oro: en el código y en GitHub solo van claves **públicas**. La clave
> `secret` / `service_role` de Supabase nunca se copia en `.env.local`, ni en Vercel,
> ni en ningún archivo del repositorio. La aplicación no la necesita.

---

## 1. Crear el proyecto Supabase (gratis)

1. Entra en <https://supabase.com> → **Start your project** → inicia sesión con GitHub.
2. **New project**:
   - Nombre: el que quieras (p. ej. `umbra`).
   - Contraseña de la base de datos: genera una fuerte y guárdala en tu gestor de contraseñas
     (la app no la usa; solo la necesitarías para conectarte por consola).
   - Región: una de la UE (*Frankfurt* o *West EU*) para simplificar el RGPD.
   - Plan: **Free**.

## 2. Crear la base de datos (migraciones)

La carpeta `supabase/migrations/` contiene 8 archivos que construyen toda la base de datos
(tablas, seguridad, funciones, almacenamiento de imágenes y tiempo real).

**Opción A — sin instalar nada:** panel de Supabase → **SQL Editor** → **New query** → copia,
pega y ejecuta el contenido de cada archivo **en orden de nombre** (del `…000100` al `…000500`):

1. `20261108000100_core_identity.sql` — perfiles, intereses, territorios
2. `20261108000200_avatars_storage.sql` — fotos de perfil
3. `20261108000300_account_deletion.sql` — baja de cuenta
4. `20261109000100_community.sql` — publicaciones, comentarios, reacciones, búsqueda
5. `20261109000200_connections_messaging.sql` — conexiones, mensajes, avisos
6. `20261109000300_circles_projects.sql` — círculos, proyectos, Ágora
7. `20261109000400_moderation.sql` — administración, límites, antispam
8. `20261109000500_guard_fix.sql` — ajuste de permisos de moderación

Comprueba en **Table Editor** que existen tablas como `profiles`, `posts`, `circles` y
`projects`, y en **Storage** los buckets `avatars`, `post-images` y `covers`.

**Opción B — con la CLI (recomendada para futuras migraciones):**

```bash
cd umbra
npx supabase@3.0.0 login
npx supabase@3.0.0 link --project-ref <REF_DEL_PROYECTO>   # el REF está en la URL del panel
npx supabase@3.0.0 db push
```

## 3. Autenticación

Panel → **Authentication**:

1. **Sign In / Providers → Email**
   - *Enable Email provider*: activado.
   - *Confirm email*: **activado** (nadie entra sin confirmar su correo).
   - *Minimum password length*: `10`. *Password requirements*: letras y dígitos.
2. **URL Configuration**
   - *Site URL*: la URL pública de la web (la de Vercel del paso 6; en local `http://localhost:3000`).
   - *Redirect URLs*: añade `http://localhost:3000/**` y `https://<tu-app>.vercel.app/**`
     (y más adelante tu dominio).
3. **Emails → Templates** (para que los enlaces funcionen desde cualquier dispositivo):
   - *Confirm signup* → asunto `Confirma tu cuenta` → pega el HTML de `supabase/templates/confirmation.html`.
   - *Reset password* → asunto `Recupera tu acceso` → pega `supabase/templates/recovery.html`.

## 4. Envío de correos (SMTP) — necesario antes de abrir a otras personas

El servidor de correo que trae Supabase **solo envía a las direcciones del equipo del
proyecto y con un límite muy bajo por hora**. Sirve para que pruebes tú, pero no para
usuarios reales. Hace falta un SMTP propio (Authentication → **Emails → SMTP Settings**).

Opciones con plan gratuito (comprueba sus límites actuales al darte de alta):
**Brevo**, **Resend**, **Mailjet**, **Amazon SES** (casi gratis con poco volumen).

**[DECISIÓN] Dominio propio.** Para que los correos no acaben en spam, el remitente debe ser
una dirección de un dominio tuyo (p. ej. `hola@tudominio.org`) con los registros SPF/DKIM que
te indique el proveedor. Un remitente `@gmail.com` enviado por terceros suele ser rechazado.
Un dominio cuesta aproximadamente 10–15 €/año. **No he contratado nada: decide tú cuándo y
dónde.** Ese mismo dominio servirá para la web.

## 5. Claves para la aplicación

Panel → **Project Settings → API Keys** (o botón **Connect**):

| Variable | Dónde está | ¿Es pública? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | *Project URL* (`https://xxxx.supabase.co`) | Sí |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | *Publishable key* (`sb_publishable_…`); si solo ves claves antiguas, la `anon` | Sí: la protección real la da RLS |
| `NEXT_PUBLIC_SITE_URL` | La URL pública de la web | Sí |
| `NEXT_PUBLIC_BRAND_NAME` | El nombre de la plataforma (provisional) | Sí |

En local:

```bash
cd umbra
cp .env.example .env.local     # y rellena los valores
npm install
npm run dev                    # http://localhost:3000
```

`.env.local` está en `.gitignore`: nunca se sube a GitHub.

## 6. Publicar en Vercel (cuando tú lo decidas)

No he publicado nada. Cuando quieras:

1. <https://vercel.com> → inicia sesión con GitHub → **Add New… → Project**.
2. Importa el repositorio donde esté el proyecto.
3. **Root Directory**: `umbra` si el proyecto está en esa carpeta del repositorio.
4. **Environment Variables**: las cuatro del paso 5 (con `NEXT_PUBLIC_SITE_URL` = la URL que te
   asigne Vercel; puedes editarla después y volver a desplegar).
5. **Deploy**. Después vuelve al paso 3.2 y pon esa URL como *Site URL* y en *Redirect URLs*.

Notas del plan gratuito de Vercel (Hobby): es para uso **no comercial**. Mientras la comunidad no
tenga ingresos, encaja. Si algún día se monetiza, habrá que pasar a un plan de pago o migrar a
Netlify / Cloudflare (el código es compatible). Las imágenes se sirven a través de la propia web
(`/media/…`), lo que consume transferencia de Vercel (100 GB/mes gratis: holgado al principio).

## 7. Convertirte en administrador

1. Regístrate en la web con tu correo y completa la bienvenida.
2. Supabase → **SQL Editor**:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'TU_CORREO@ejemplo.com');
```

Solo funciona desde el panel. Desde la web nadie puede cambiar su propio rol.
Después verás «Administración» en el menú. Desde ahí puedes nombrar moderadores.

## 8. Dominio propio (más adelante)

1. Compra el dominio (ver **[DECISIÓN]** del paso 4).
2. Vercel → Project → **Settings → Domains** → añade el dominio y crea los registros DNS que indique.
3. Actualiza `NEXT_PUBLIC_SITE_URL` en Vercel y la *Site URL* / *Redirect URLs* de Supabase.

## 9. Mantenimiento del plan gratuito

- Supabase **pausa los proyectos gratuitos tras 7 días sin actividad**. Se reactiva desde el
  panel con un clic; con miembros activos no ocurre.
- Vigila en **Reports / Usage**: base de datos (500 MB), archivos (1 GB), transferencia (5 GB/mes)
  y conexiones en tiempo real (200 simultáneas).
- Copias de seguridad: no cuentes con las del plan gratuito. Exporta periódicamente con
  `npx supabase@3.0.0 db dump -f backup.sql` (requiere el paso 2B y Docker) o con `pg_dump`
  y la cadena de conexión que muestra el botón **Connect** del panel.
