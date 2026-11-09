import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Renderizador de texto con formato ligero, seguro por construcción:
 * genera elementos React (nunca HTML en crudo), así que no hay XSS posible.
 *
 * Admite: párrafos, saltos de línea, > citas, listas con - o 1., **negrita**,
 * *cursiva*, `código`, enlaces http(s) y menciones @usuario.
 */
export function RichText({ text, className = "prose-doc" }: { text: string; className?: string }) {
  const blocks = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return <div className={className}>{blocks.map((b, i) => renderBlock(b, i))}</div>;
}

function renderBlock(block: string, key: number): ReactNode {
  const lines = block.split("\n");
  if (lines.every((l) => /^>\s?/.test(l))) {
    return <blockquote key={key}>{joinLines(lines.map((l) => l.replace(/^>\s?/, "")))}</blockquote>;
  }
  if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
    return (
      <ul key={key}>
        {lines.map((l, i) => (
          <li key={i}>{inline(l.replace(/^\s*[-*•]\s+/, ""))}</li>
        ))}
      </ul>
    );
  }
  if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
    return (
      <ol key={key}>
        {lines.map((l, i) => (
          <li key={i}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>
        ))}
      </ol>
    );
  }
  return <p key={key}>{joinLines(lines)}</p>;
}

function joinLines(lines: string[]) {
  return lines.flatMap((l, i) => (i === 0 ? [inline(l)] : [<br key={`br${i}`} />, inline(l)]));
}

const TOKEN =
  /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])|(\*\*[^*\n]+?\*\*)|(`[^`\n]+`)|(\*[^*\s][^*\n]*?\*)|(@[A-Za-z0-9_]{3,24})/g;

function inline(text: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [tok] = m;
    const k = `${m.index}`;
    if (m[1]) {
      out.push(
        <a key={k} href={tok} target="_blank" rel="noopener noreferrer nofollow ugc">
          {prettyUrl(tok)}
        </a>,
      );
    } else if (m[2]) {
      out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    } else if (m[3]) {
      out.push(<code key={k}>{tok.slice(1, -1)}</code>);
    } else if (m[4]) {
      out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    } else if (m[5]) {
      out.push(
        <Link key={k} href={`/miembros/${tok.slice(1)}`}>
          {tok}
        </Link>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function prettyUrl(url: string) {
  try {
    const u = new URL(url);
    const path = (u.pathname + u.search).replace(/\/$/, "");
    const full = u.hostname.replace(/^www\./, "") + path;
    return full.length > 60 ? full.slice(0, 57) + "…" : full;
  } catch {
    return url;
  }
}
