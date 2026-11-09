# UMBRA · Configuración externa paso a paso

Todo lo que aparece aquí lo tienes que hacer tú (son cuentas y paneles a tu nombre).
Ningún paso tiene coste salvo donde se indica expresamente **[DECISIÓN]**.

> Regla de oro: en el código y en GitHub solo van claves **públicas**. La clave
> `secret` / `service_role` de Supabase nunca se copia en `.env.local`, ni en Vercel,
> ni en ningún archivo del repositorio. UMBRA no la necesita.

---

## 1. Crear el proyecto Supabase (gratis)

1. Entra en <https://supabase.com> → **Start your project** → inicia sesión con GitHub.
2. **New project**:
   - Nombre: `umbra`.
   - Contraseña de la base de datos: genera una fuerte y guárdala en tu gestor de contraseñas
     (la app no la usa; solo la necesitarías para conectarte por consola).
   - Región: una de la UE (por ejemplo, *Frankfurt* o *West EU*) para simplificar el RGPD.
   - Plan: **Free**.

## 2. Crear la base de datos (migraciones)

**Opción A — sin instalar nada (recomendada la primera vez):**

1. Panel de Supabase → **SQL Editor** → **New query**.
2. Copia y ejecuta, **en este orden**, el contenido de:
   1. `supabase/migrations/20261108000100_core_identity.sql`
   2. `supabase/migrations/20261108000200_avatars_storage.sql`
   3. `supabase/migrations/20261108000300_account_deletion.sql`
3. Comprueba en **Table Editor** que existen `profiles`, `interests` (18 filas),
   `categories` (12 filas) y `profile_interests`, y en **Storage** el bucket `avatars`.

**Opción B — con la CLI (para futuras migraciones):**

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
   - *Confirm email*: **activado** (obligatorio: nadie entra sin confirmar su correo).
   - *Minimum password length*: `10`.
   - *Password requirements*: letras y dígitos.
2. **URL Configuration**
   - *Site URL*: la URL pública de la web (de momento, la de Vercel del paso 6;
     mientras pruebas en local: `http://localhost:3000`).
   - *Redirect URLs*: añade `http://localhost:3000/**` y, cuando la tengas,
     `https://<tu-app>.vercel.app/**` (y más adelante tu dominio).
3. **Emails → Templates** (para que los enlaces funcionen desde cualquier dispositivo):
   - *Confirm signup* → asunto `Confirma tu cuenta en UMBRA` → pega el HTML de
     `supabase/templates/confirmation.html`.
   - *Reset password* → asunto `Recupera tu acceso a UMBRA` → pega
     `supabase/templates/recovery.html`.

## 4. Envío de correos (SMTP) — necesario antes de abrir a otras personas

El servidor de correo que trae Supabase **solo envía a las direcciones del equipo del
proyecto y con un límite muy bajo por hora**. Sirve para que pruebes tú, pero no para
usuarios reales. Hace falta un SMTP propio (Authentication → **Emails → SMTP Settings**).

Opciones con plan gratuito (comprueba sus límites actuales al darte de alta):
**Brevo**, **Resend**, **Mailjet**, **Amazon SES** (casi gratis con poco volumen).

**[DECISIÓN] Dominio propio.** Para que los correos no acaben en spam, el remitente debe
ser una dirección de un dominio tuyo (por ejemplo `hola@umbra.xxx`) con los registros
SPF/DKIM que te indique el proveedor. Un remitente `@gmail.com` enviado por terceros suele
ser rechazado. Un dominio cuesta aproximadamente 10–15 €/año. **No he contratado nada:
decide tú cuándo y dónde.** Ese mismo dominio servirá para la web.

## 5. Claves para la aplicación

Panel → **Project Settings → API Keys** (o botón **Connect**):

| Variable | Dónde está | ¿Es pública? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | *Project URL* (`https://xxxx.supabase.co`) | Sí |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | *Publishable key* (`sb_publishable_…`). Si tu panel solo muestra claves antiguas, usa la `anon` | Sí: la protección real la da RLS |
| `NEXT_PUBLIC_SITE_URL` | La URL pública de la web | Sí |

En local:

```bash
cd umbra
cp .env.example .env.local     # y rellena los tres valores
npm install
npm run dev                    # http://localhost:3000
```

`.env.local` está en `.gitignore`: nunca se sube a GitHub.

## 6. Publicar en Vercel (cuando tú lo decidas)

No he publicado nada. Cuando quieras:

1. <https://vercel.com> → inicia sesión con GitHub → **Add New… → Project**.
2. Importa el repositorio `PARALAJE.STUDIO`.
3. **Root Directory**: `umbra` (importante: la app vive en esa carpeta).
4. **Environment Variables**: las tres del paso 5 (con `NEXT_PUBLIC_SITE_URL` = la URL que
   te asigne Vercel; puedes editarla después y volver a desplegar).
5. **Deploy**. Después vuelve al paso 3.2 y pon esa URL como *Site URL* y en *Redirect URLs*.

Notas sobre el plan gratuito de Vercel (Hobby): es para uso **no comercial**. Mientras
UMBRA sea una comunidad sin ingresos, encaja. Si algún día se monetiza, habrá que pasar a
un plan de pago o migrar a Netlify / Cloudflare Pages (el código es compatible).

## 7. Convertirte en administrador

1. Regístrate en la web con tu correo y completa la bienvenida.
2. Panel de Supabase → **SQL Editor**:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'TU_CORREO@ejemplo.com');
```

Solo funciona desde el panel (con privilegios de propietario). Desde la web nadie puede
cambiar su propio rol: lo impiden los privilegios de columna y un trigger.

## 8. Dominio propio (más adelante)

1. Compra el dominio (ver **[DECISIÓN]** del paso 4).
2. Vercel → Project → **Settings → Domains** → añade el dominio y crea los registros DNS que indique.
3. Actualiza `NEXT_PUBLIC_SITE_URL` en Vercel y la *Site URL* / *Redirect URLs* de Supabase.

## 9. Mantenimiento del plan gratuito

- Supabase **pausa los proyectos gratuitos tras 7 días sin actividad**. Se reactiva desde el
  panel con un clic; con miembros activos no ocurre.
- Vigila en **Reports / Usage**: base de datos (500 MB), archivos (1 GB) y transferencia.
- Copias de seguridad: no cuentes con las del plan gratuito. Exporta periódicamente con
  `npx supabase@3.0.0 db dump -f backup.sql` (requiere el paso 2B y Docker) o con `pg_dump`
  y la cadena de conexión que muestra el botón **Connect** del panel.
