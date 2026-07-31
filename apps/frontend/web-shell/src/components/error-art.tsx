"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/** Ilustraciones de marca disponibles para las páginas de error. */
const ART = [
  "/images/error-robot.svg",
  "/images/error-ghost.svg",
  "/images/error-search.svg",
  "/images/error-plug.svg",
  "/images/error-lock.svg",
  "/images/error-rocket.svg",
  "/images/error-cloud.svg",
];

const LAST_KEY = "ls-error-art";

/** Elige una ilustración distinta de la última mostrada (para que "se sienta"
 *  aleatorio y no repita al recargar). Persistimos la elección en sessionStorage. */
function pickArt(): string {
  let last: string | null = null;
  try {
    last = sessionStorage.getItem(LAST_KEY);
  } catch {
    /* sessionStorage puede no estar disponible; ignoramos */
  }
  const pool = last ? ART.filter((a) => a !== last) : ART;
  const choice = pool[Math.floor(Math.random() * pool.length)] ?? ART[0];
  try {
    sessionStorage.setItem(LAST_KEY, choice);
  } catch {
    /* noop */
  }
  return choice;
}

/**
 * Muestra una ilustración ALEATORIA (mascota) en las páginas de error.
 *
 * La elección se hace en el cliente tras montar, por dos motivos:
 *  1. Evita el desajuste de hidratación (el servidor no puede conocer el
 *     valor aleatorio; además muchas error pages se generan estáticas y
 *     quedarían "congeladas" con una sola imagen).
 *  2. Es barato: solo se descarga UNA imagen (la elegida); las demás nunca
 *     se piden. Cada SVG pesa ~1–2 KB.
 */
export function ErrorArt({ className }: { className?: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    // Lee/escribe sessionStorage (sistema externo real) — encaja en el caso que el
    // propio lint sí permite: sincronizar con algo fuera de React, no estado derivado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSrc(pickArt());
  }, []);

  return (
    <div className={className}>
      {/* Reservamos el espacio (cuadrado) para que no haya salto de layout
          mientras se elige/carga la imagen. */}
      <div className="relative w-full aspect-square">
        {src && (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            priority
            unoptimized
            draggable={false}
            className="object-contain select-none [animation:error-art-in_0.22s_ease-out_both]"
          />
        )}
      </div>
    </div>
  );
}
