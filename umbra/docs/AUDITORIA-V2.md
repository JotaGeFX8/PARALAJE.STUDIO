# Auditoría frente al documento definitivo (v2)

Fecha: 9 de noviembre de 2026. Punto de partida: la plataforma de las fases 1–7 (todo probado:
36 comprobaciones de seguridad y 5 suites de extremo a extremo).

## Diagnóstico técnico

| Ámbito | Estado actual | Valoración |
|---|---|---|
| Pila | Next.js 16 + React 19 + TypeScript + Tailwind 4 + Supabase (Postgres 17, Auth, Storage, Realtime) | Se mantiene: coincide con la pila pedida |
| Arquitectura | Server Components + Server Actions; capa `lib/data` por dominio; validación zod; RLS en todas las tablas | Correcta; se amplía sin reescribir |
| Seguridad | RLS, privilegios de columna, funciones con comprobación de rol, límites de frecuencia, CSP, auditoría | Sólida; se extiende a las tablas nuevas |
| Diseño | Tema claro con verdes, tokens semánticos, componentes propios, estados de carga/vacío/error | Se mantiene (petición expresa: «no oscuro, más claro y con verdes») |
| Datos | 30+ tablas normalizadas con claves foráneas e índices; 8 migraciones versionadas | Se amplía con nuevas migraciones, sin romper las anteriores |

## Qué ya cumple el documento

Registro con verificación, sesiones seguras, recuperación, protección de rutas, baja de cuenta;
perfiles con avatar, intereses y favoritos; publicaciones con clasificación epistémica, fuentes,
imágenes, etiquetas, hilos, reacciones, guardados, seguimiento de conversaciones, denuncias;
búsqueda sin tildes; conexiones con solicitud, bloqueo y «Descubrir»; mensajes privados en
tiempo real; notificaciones con preferencias; círculos públicos/privados/por invitación con chat;
proyectos con participantes, solicitudes y novedades; panel de administración con auditoría,
suspensiones, roles y límites antispam; PWA instalable (manifiesto e iconos).

## Qué falta (por sección del documento)

| § | Pendiente |
|---|---|
| 04 | Navegación de 8 áreas (Ágora pasa a ser un foro; Mensajes y Notificaciones como áreas) |
| 05 | Onboarding de 5 pasos con saltos; portada de perfil; exportación de datos; cerrar sesión en otros dispositivos; preferencias de privacidad |
| 06 | Catálogo de **22 áreas** con temas, sinónimos, autocompletado, intereses propuestos, fusión y moderación de etiquetas |
| 07 | Relación con cada tema (me interesa · aprendiendo · conocimientos · experiencia · puedo enseñar · busco colaboradores) y objetivos |
| 08 | Presentación por apartados, habilidades, actividad (seguidores, seguidos, círculos, proyectos) y privacidad por apartado |
| 09 | Filtros «Sin responder» y «Siguiendo»; feed que mezcla intereses y descubrimiento |
| 10 | **7 foros** con normas y subcategorías (los 12 territorios actuales pasan a ser subcategorías); 8 tipos de publicación; encuestas; archivos adjuntos; clasificación «interpretación» y «pregunta abierta» |
| 11 | Filtros por conocimientos, objetivos, idiomas, círculos y proyectos; razones de recomendación; seguir personas; invitar a círculo o proyecto |
| 12 | Categoría, etiquetas, normas, rol de moderación, silenciar, fijar publicaciones |
| 13 | Estados nuevos (buscando colaboradores, en desarrollo), tareas con responsables, archivos, conocimientos necesarios |
| 14 | Chats de grupo, respuestas, reacciones, adjuntos, solicitudes de mensajes, archivar, silenciar, fijar, búsqueda, confirmación de lectura configurable |
| 15 | Avisos de seguidores y reacciones; leer o borrar uno a uno; filtrar por tipo |
| 16 | Autocompletado, corrección de consultas, búsquedas recientes |
| 17 | Seguir personas, foros y etiquetas, distinto de conectar |
| 18 | Gestión de foros y etiquetas, sanciones y **apelaciones**, actividad agregada |
| 19 | Exportación de datos (RGPD art. 20) |
| 25 | Analítica interna agregada (activos, retención, uso por sección) |

## Decisiones

- **Tema visual**: el documento orienta a una estética oscura, pero también pide «mantener la
  identidad visual existente»; y la petición expresa más reciente es un tema claro con verdes y una
  ilustración que funda las áreas de conocimiento en lugar del eclipse. Se mantiene el tema claro.
- **Foros ≠ intereses**: foros (7) y subcategorías organizan conversaciones; el catálogo (22 áreas
  → temas → etiquetas) describe personas, publicaciones, círculos y proyectos.
- **Seguir ≠ conectar**: seguir es unilateral y alimenta «Siguiendo»; conectar es mutuo y habilita
  los mensajes directos. Fuera de las conexiones, un mensaje llega como «solicitud».
- **Sin datos inventados en producción**: los datos de demostración solo existen en la vista previa local.
- **Pagos, publicidad y marketplace**: fuera de alcance, como pide el documento.

## Plan (v2)

1. Ilustración «fusión del conocimiento» (portada y acceso).
2. Catálogo de 22 áreas, niveles, objetivos, perfiles, privacidad y onboarding de 5 pasos.
3. Siete foros, tipos de publicación, encuestas, archivos y etiquetas moderadas.
4. Seguimientos, Explorar personalizado y búsqueda global con autocompletado.
5. Mensajería v2 (grupos, respuestas, reacciones, adjuntos, solicitudes).
6. Círculos y proyectos v2 (normas, moderación, tareas, archivos).
7. Notificaciones, RGPD (exportación, sesiones), apelaciones, analítica y navegación de 8 áreas.
8. Pruebas (seguridad + extremo a extremo), documentación y entrega.
