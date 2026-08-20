"use client";

import { useState } from "react";
import { Mic, X, KeyRound } from "lucide-react";
import { apiFetch, modoDemo, Button, Input, useCurrentUser } from "@leanstart/commons";

interface GenerarSemillaResponse {
  seed: string;
  expiraEn: string;
}

/**
 * Widget flotante para vincular la cuenta con la skill de voz de Alexa:
 * burbuja fija en la esquina que, al abrirse, genera un código de un solo
 * uso. Vive en el layout de emprendedor, así que está disponible en
 * cualquier página, no solo en una sección dedicada del menú.
 */
export function AlexaWidget() {
  const [abierto, setAbierto] = useState(false);
  const currentUser = useCurrentUser();
  const [username, setUsername] = useState(currentUser?.name ?? "");
  const [seed, setSeed] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!username.trim()) {
      setError("Escribe un nombre.");
      return;
    }
    if (modoDemo()) {
      setError("El login por voz de Alexa necesita una cuenta real conectada al backend — no está disponible en modo demo.");
      return;
    }
    setGenerando(true);
    setError(null);
    setSeed(null);
    try {
      const data = await apiFetch<GenerarSemillaResponse>("/auth/seeds/generate", {
        method: "POST",
        body: JSON.stringify({ nombre: username.trim() }),
        etiquetaCarga: null,
      });
      setSeed(data.seed);
    } catch {
      setError("No se pudo generar la semilla. Intenta de nuevo en unos segundos.");
    } finally {
      setGenerando(false);
    }
  }

  return (
    <>
      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 pl-3.5 pr-4 h-12 rounded-full transition-transform hover:scale-105"
          style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)", boxShadow: "0 8px 24px rgba(154,98,250,0.4)" }}
          aria-label="Vincular con Alexa"
        >
          <Mic className="w-5 h-5" />
          <span className="text-sm font-semibold">Alexa</span>
        </button>
      )}

      {abierto && (
        <div
          className="fixed bottom-5 right-5 z-50 w-[340px] max-w-[calc(100vw-2.5rem)] rounded-2xl flex flex-col overflow-hidden"
          style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)", boxShadow: "0 16px 48px rgba(0,0,0,0.28)" }}
        >
          <div className="flex items-center justify-between px-4 h-14 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--brand-gradient)" }}>
                <Mic className="w-4 h-4" style={{ color: "var(--brand-fg)" }} />
              </div>
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-strong)" }}>
                Vincular con Alexa
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ color: "var(--text-dim)" }}
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>
              Genera un código de un solo uso y díselo a Alexa junto con tu nombre para iniciar sesión por voz.
            </p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="alexa-username" className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                Nombre (el mismo que le dirás a Alexa)
              </label>
              <Input id="alexa-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tu nombre" />
            </div>
            <Button onClick={handleGenerate} loading={generando} loadingText="Generando…" className="gap-2 w-fit">
              <KeyRound className="w-4 h-4" />
              Generar código
            </Button>
            {error && (
              <p className="text-sm" style={{ color: "var(--destructive)" }}>
                {error}
              </p>
            )}
            {seed && (
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "var(--brand-tint)", border: "1px solid var(--border-subtle)" }}>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                  Código generado para &quot;{username}&quot;
                </p>
                <p className="text-3xl font-bold tracking-[0.3em] mt-1" style={{ color: "var(--brand)" }}>
                  {seed}
                </p>
                <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>
                  Es de un solo uso: en cuanto lo uses en Alexa deja de servir y hay que generar otro.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
