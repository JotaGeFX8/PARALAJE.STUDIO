# Identidad visual y experiencia (máster prompt de diseño)

## Fase 1 · Auditoría (10 nov 2026)

| Ámbito | Antes | Decisión |
|---|---|---|
| Pila | Next.js 16 + React 19 + Tailwind 4 + Supabase (RLS en todas las tablas) | Se conserva tal cual |
| Tokens | Semánticos (`canvas`, `ink`, `accent`…) en `globals.css` | Se reutilizan: el tema oscuro redefine los mismos tokens |
| Paleta | Verde bosque apagado (#1F5C45) sobre papel cálido | Verde de marca #16845B (ajustado a #147F57 por contraste AA) sobre neutros #F7F9F7 / #FFFFFF |
| Formas | Radios de 2 px, aspecto editorial | Radios de 10–16 px, tarjetas y esqueletos de carga |
| Navegación | 6 áreas + Ágora como sección | Inicio, Descubrir, Comunidad (7 espacios con el Ágora), Círculos, Conexiones, Proyectos, Biblioteca, Mensajes, Notificaciones, Perfil, Ajustes |
| Feed | Lista de publicaciones de foros | Tarjetas con fotos en carrusel, me gusta, comentarios, guardar y compartir |
| Perfil | Ficha de texto | Cabecera con contadores, seguir/conectar y pestañas (fotos, publicaciones, libros, acerca de) |

## Fase 2 · Sistema de diseño

**Color** (tokens en `src/app/globals.css`)

| Token | Claro | Oscuro |
|---|---|---|
| canvas (fondo) | #F7F9F7 | #111713 |
| surface | #FFFFFF | #19211C |
| surface-2 | #EEF3EF | #202B24 |
| ink (texto) | #18211D | #F2F6F3 |
| muted | #66726B | #A2ADA5 |
| line | #E5EBE6 | #2A352E |
| accent | #147F57 | #36A879 (verde luminoso) |
| accent-strong | #106548 | #5FC495 |
| accent-soft | #E6F3EC | #1B3A2B |

Contraste comprobado: texto secundario 4,6:1; verde sobre blanco 4,7:1; verde luminoso sobre el fondo oscuro 6,1:1.
El verde se reserva para acciones principales, estados activos, selección e indicadores.

**Temas**: claro, oscuro y automático. Se eligen en Ajustes › Apariencia, se aplican al instante,
se guardan en la cuenta (`user_settings.theme`) y en una cookie para pintar sin parpadeo.

**Tipografía**: Geist (interfaz), Source Serif 4 (titulares editoriales y lectura larga), Geist Mono (metadatos).

**Componentes**: `.btn` (primario, fantasma, discreto, peligro), `.card`, `.chip`, `.tag`, `.field`,
`.tabs`, `.badge`, `.skeleton`; tarjeta de feed, cuadrícula de fotos, cabecera de perfil,
botón de seguir, barra inferior móvil con «Crear» destacado.

**Movimiento**: transiciones de 200–300 ms, aparición suave, «me gusta» con doble toque;
todo se desactiva con `prefers-reduced-motion`.
