"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Button, Input, useCurrentUser } from "@leanstart/commons";

// Servicio backend temporal para el login por semilla de la skill de Alexa
// (ver /seed-service en la raíz del repo). Todavía no es el backend real.
const SEED_API_URL = process.env.NEXT_PUBLIC_SEED_API_URL || "http://localhost:3001";

export function AlexaPanel() {
  const currentUser = useCurrentUser();
  const [username, setUsername] = useState(currentUser?.name ?? "");
  const [seed, setSeed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!username.trim()) {
      setError("Escribe un nombre.");
      return;
    }

    setLoading(true);
    setError(null);
    setSeed(null);

    try {
      const res = await fetch(`${SEED_API_URL}/auth/seeds/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!res.ok) {
        throw new Error("El servicio de semillas respondió con un error.");
      }

      const data = await res.json();
      setSeed(data.seed);
    } catch {
      setError(
        `No se pudo conectar con el servicio de semillas (${SEED_API_URL}). ¿Está corriendo "npm start" en /seed-service?`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-strong)" }}>
          Alexa
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Sección provisional (solo funcional, sin diseño final) para probar el login por semilla de la
          skill de Alexa. Genera una semilla de un solo uso y dísela a Alexa junto con tu nombre para
          iniciar sesión.
        </p>
      </div>

      <div
        className="rounded-2xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="alexa-username"
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            Nombre (el mismo que le dirás a Alexa)
          </label>
          <Input
            id="alexa-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-fit gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          Generar nueva semilla
        </Button>

        {error && (
          <p className="text-sm" style={{ color: "var(--destructive)" }}>
            {error}
          </p>
        )}

        {seed && (
          <div
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: "var(--brand-tint)", border: "1px solid var(--border-subtle)" }}
          >
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>
              Semilla generada para &quot;{username}&quot;
            </p>
            <p className="text-3xl font-bold tracking-[0.3em] mt-1" style={{ color: "var(--brand)" }}>
              {seed}
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>
              Es de un solo uso: en cuanto la uses en Alexa deja de servir y hay que generar otra.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
