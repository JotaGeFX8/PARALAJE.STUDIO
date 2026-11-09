/** Utilidades de formato en español. */

const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
const dateFmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

/** «hace 5 minutos», «ayer», «hace 3 semanas». */
export function timeAgo(value: string | Date, now = Date.now()): string {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "ahora mismo";
}

export const formatDate = (value: string | Date) => dateFmt.format(new Date(value));
export const formatDateTime = (value: string | Date) => dateTimeFmt.format(new Date(value));
export const formatTime = (value: string | Date) => timeFmt.format(new Date(value));

/** «1 comentario», «3 comentarios». */
export function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString("es")} ${n === 1 ? one : many}`;
}

/** Recorta texto en el último espacio antes del límite. */
export function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).trimEnd() + "…";
}

/** Número de página a partir de un parámetro de búsqueda. */
export function pageParam(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 && n < 500 ? n : 1;
}

export function oneParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Tamaño de archivo legible (KB o MB). */
export function fileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
