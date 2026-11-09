# Cambiar el nombre de la plataforma

«UMBRA» es un nombre provisional. Está centralizado para que cambiarlo cueste minutos.

## 1. En la web (obligatorio)

El nombre sale de una sola variable:

```
NEXT_PUBLIC_BRAND_NAME=NuevoNombre
```

- **En Vercel**: Project → Settings → Environment Variables → edita `NEXT_PUBLIC_BRAND_NAME`
  → vuelve a desplegar (Deployments → ⋯ → Redeploy). Es necesario redesplegar porque el
  nombre se incorpora al compilar.
- **En local**: cámbiala en `.env.local` y reinicia `npm run dev`.

Esto actualiza la marca de la cabecera, títulos de página, textos legales, mensajes, el
manifiesto de la app instalable y los metadatos para buscadores.

El eslogan y la descripción están en `src/config/brand.ts` (también editables).

## 2. En los correos (recomendado)

Las plantillas de correo viven en Supabase y llevan el nombre escrito:

1. Edita `supabase/templates/confirmation.html` y `supabase/templates/recovery.html`
   (busca `UMBRA`).
2. Supabase → Authentication → Emails → Templates → pega de nuevo ambas plantillas.
3. Si usas SMTP propio, cambia también el «nombre del remitente» en Authentication →
   Emails → SMTP Settings.

## 3. Opcional

- La carpeta del proyecto (`umbra/`) y el `name` de `package.json` pueden quedarse como están;
  no se muestran a nadie.
- La marca gráfica (los tres nodos) no depende del nombre.
- Si compras un dominio con el nuevo nombre, sigue el paso 8 de `CONFIGURACION.md`.
