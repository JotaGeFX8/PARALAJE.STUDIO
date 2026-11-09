"use client";

import { useState } from "react";
import { IconShare } from "./icons";

/** Comparte con el menú nativo del móvil o copia el enlace. */
export function ShareButton({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* el usuario canceló */
    }
  }
  return (
    <button type="button" className="icon-btn" onClick={share}>
      <IconShare size={17} />
      <span aria-live="polite">{copied ? "Enlace copiado" : "Compartir"}</span>
    </button>
  );
}
