# UMBRA

**Explora ideas. Encuentra personas. Construye posibilidades.**

Comunidad digital independiente de exploración, conocimiento y conexión humana:
red social + foro + conexiones por afinidad + proyectos reales.

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, Storage, RLS).
Coste de infraestructura: 0 €.

---

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Estructura, identidad visual, portada, navegación, responsive | ✅ Hecha |
| 2 | Supabase, registro con confirmación de correo, acceso, recuperación, perfiles, bienvenida en 4 pasos, avatares, permisos (RLS), eliminación de cuenta | ✅ Hecha y probada |
| 3 | Publicaciones, comentarios, reacciones, etiquetas, buscador | ⏳ Siguiente |
| 4 | Conexiones, solicitudes, mensajería, notificaciones | Pendiente |
| 5 | Círculos, proyectos, Ágora | Pendiente |
| 6 | Administración, moderación, límites de frecuencia, CSP | Pendiente |
| 7 | Pruebas completas, despliegue | Pendiente |

Lo que ya funciona de verdad (sin datos simulados):

- Registro → correo de confirmación → bienvenida (intereses, favoritos, descripción,
  idiomas, disponibilidad, ubicación aproximada opcional, foto) → zona privada.
- Inicio y cierre de sesión, recuperación de contraseña, cambio de contraseña.
- **Explorar**: personas con intereses en común (ordenadas por afinidad), nuevos miembros y
  los doce territorios, leídos de la base de datos.
- Perfil propio, edición, perfil de otros miembros (solo para miembros registrados).
- Ajustes y eliminación de la cuenta (derecho de supresión).
- Las secciones aún no construidas (Conexiones, Círculos, Proyectos, Ágora y las
  publicaciones de Comunidad) lo indican claramente con la fase en que llegarán: no hay
  botones decorativos ni contenido falso.

## Puesta en marcha

Sigue **[docs/CONFIGURACION.md](docs/CONFIGURACION.md)** (crear Supabase, claves, correo,
Vercel, hacerte administrador). Resumen para local:

```bash
cd umbra
cp .env.example .env.local   # rellena URL y clave publishable de Supabase
npm install
npm run dev
```

## Pruebas

```bash
npm run typecheck && npm run lint && npm run build

# Seguridad de la base de datos (22 comprobaciones de RLS) contra un PostgreSQL local
npm run test:db

# Flujo completo en navegador real contra Supabase local (Docker):
npm run db:start            # arranca Supabase local + buzón de correo de pruebas
npm run db:reset            # base limpia
npm run build && npm start  # con .env.local apuntando a http://127.0.0.1:54321
npm run test:e2e            # requiere Playwright (npm i -g playwright)
```

La prueba de extremo a extremo recorre: protección de rutas, bloqueo de redirecciones
abiertas, validación de formularios, registro y confirmación por correo de dos personas
(móvil y escritorio), bienvenida completa, afinidad entre ambas, perfil ajeno, nombre de
usuario duplicado, subida de avatar a Storage, cierre e inicio de sesión, recuperación de
contraseña con revocación de sesiones antiguas y eliminación de cuenta.

## Documentación

- [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md): auditoría, pila, carpetas, seguridad,
  modelo de datos actual y previsto, límites de los planes gratuitos.
- [docs/CONFIGURACION.md](docs/CONFIGURACION.md): todo lo que tienes que configurar tú.
