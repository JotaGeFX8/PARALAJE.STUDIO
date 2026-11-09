# UMBRA

**Explora ideas. Encuentra personas. Construye posibilidades.**

Comunidad digital independiente de exploración, conocimiento y conexión humana:
red social + foro + conexiones por afinidad + proyectos reales.
El nombre es provisional y se cambia con una variable ([docs/RENOMBRAR.md](docs/RENOMBRAR.md)).

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, Storage,
Realtime, RLS). Coste de infraestructura: 0 €.

---

## Qué puede hacer una persona

1. Registrarse con su correo y confirmarlo.
2. Completar su perfil en 4 pasos: foto, intereses y favoritos, descripción, a quién quiere
   conocer, proyectos personales, idiomas, disponibilidad y ubicación aproximada opcional.
3. **Explorar**: publicaciones con orden por recientes, populares, más comentados y tendencias;
   debates abiertos, temáticas recomendadas, personas afines, círculos activos, proyectos
   destacados, nuevos miembros y actividad de la comunidad.
4. **Comunidad**: 12 territorios con publicaciones que declaran su naturaleza (documentada con
   fuentes, hipótesis, opinión o experiencia), imágenes, etiquetas, comentarios en hilo,
   reacciones, guardar, seguir conversaciones, compartir y denunciar. Búsqueda sin tildes.
5. **Conexiones**: «Descubrir» por afinidad, buscador con filtros (intereses, país, región,
   disponibilidad, proyectos), solicitudes con nota, mensajes privados con no leídos,
   bloqueos y denuncias.
6. **Círculos** públicos, privados o por invitación, con publicaciones, chat de grupo,
   solicitudes, invitaciones y roles.
7. **Proyectos** con estado, objetivos, temáticas, portada, participantes, solicitudes de
   colaboración y una conversación con novedades.
8. **Ágora**: publicaciones rápidas y preguntas abiertas.
9. **Notificaciones** de comentarios, respuestas, menciones, conexiones, mensajes, círculos
   y proyectos, con preferencias.

Y el equipo fundador administra todo desde **/admin**: denuncias, usuarios (roles, suspensión,
expulsión), contenido (fijar, cerrar, reclasificar, retirar), círculos y proyectos, territorios
y configuración (registro abierto/cerrado, mensaje de bienvenida), con registro de auditoría.

## Puesta en marcha

Sigue **[docs/CONFIGURACION.md](docs/CONFIGURACION.md)**. Resumen para local:

```bash
cd umbra
cp .env.example .env.local   # URL y clave pública de Supabase
npm install
npm run dev
```

## Pruebas

```bash
npm test                 # tipos + lint + 36 comprobaciones de seguridad de la base de datos

# Extremo a extremo (navegador real contra Supabase local con Docker):
npm run db:start         # Supabase local + buzón de correo de pruebas (Mailpit)
npm run db:reset         # base limpia con todas las migraciones
npm run build && npm start
npm run test:e2e         # 5 suites; requiere Playwright (npm i -g playwright)
```

Las suites cubren: cuenta completa (registro → confirmación → bienvenida → perfil → avatar →
sesión → recuperación → baja), comunidad, conexiones y mensajería en vivo, círculos y
proyectos, y administración (denuncias, suspensiones, roles, territorios, registro cerrado,
límites de frecuencia y antispam).

## Documentación

- [docs/CONFIGURACION.md](docs/CONFIGURACION.md) — todo lo que tienes que configurar tú.
- [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) — estructura, seguridad, datos y límites gratuitos.
- [docs/RENOMBRAR.md](docs/RENOMBRAR.md) — cambiar el nombre provisional.
