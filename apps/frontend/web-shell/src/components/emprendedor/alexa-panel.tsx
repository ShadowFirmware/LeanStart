"use client";

import { useEffect, useRef, useState } from "react";
import {
  KeyRound, Send, AlertCircle, Lightbulb, Sparkles, Lock, Users as UsersIcon,
  BarChart2, Share2, TrendingDown, TrendingUp, Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  apiFetch, modoDemo, Button, Input, Textarea, Spinner, useCurrentUser,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@leanstart/commons";
import { useEmpresasStore, useAsistenteStore, CLAVE_NUEVA_CONVERSACION, type CanvasData } from "@leanstart/empresas-front";

interface GenerarSemillaResponse {
  seed: string;
  expiraEn: string;
}

type BloqueKey = keyof CanvasData;

const BLOQUES_RESUMEN: { key: BloqueKey; icon: React.ElementType; label: string; tipo: "texto" | "lista" }[] = [
  { key: "problema", icon: AlertCircle, label: "Problema", tipo: "lista" },
  { key: "solucion", icon: Lightbulb, label: "Solución", tipo: "texto" },
  { key: "pvp", icon: Sparkles, label: "Propuesta de valor única", tipo: "texto" },
  { key: "ventajaInjusta", icon: Lock, label: "Ventaja injusta", tipo: "texto" },
  { key: "segmentosClientes", icon: UsersIcon, label: "Segmentos de clientes", tipo: "lista" },
  { key: "metricasClave", icon: BarChart2, label: "Métricas clave", tipo: "lista" },
  { key: "canales", icon: Share2, label: "Canales", tipo: "lista" },
  { key: "estructuraCostos", icon: TrendingDown, label: "Estructura de costos", tipo: "lista" },
  { key: "fuentesIngresos", icon: TrendingUp, label: "Fuentes de ingresos", tipo: "lista" },
];

export function AlexaPanel() {
  const currentUser = useCurrentUser();

  // ─── Vincular con Alexa — misma funcionalidad de siempre, aparte del chat ───
  const [username, setUsername] = useState(currentUser?.name ?? "");
  const [seed, setSeed] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [errorSemilla, setErrorSemilla] = useState<string | null>(null);

  async function handleGenerate() {
    if (!username.trim()) {
      setErrorSemilla("Escribe un nombre.");
      return;
    }
    if (modoDemo()) {
      setErrorSemilla("El login por voz de Alexa necesita una cuenta real conectada al backend — no está disponible en modo demo.");
      return;
    }
    setGenerando(true);
    setErrorSemilla(null);
    setSeed(null);
    try {
      const data = await apiFetch<GenerarSemillaResponse>("/auth/seeds/generate", {
        method: "POST",
        body: JSON.stringify({ nombre: username.trim() }),
        etiquetaCarga: null,
      });
      setSeed(data.seed);
    } catch {
      setErrorSemilla("No se pudo generar la semilla. Intenta de nuevo en unos segundos.");
    } finally {
      setGenerando(false);
    }
  }

  // ─── Asistente conversacional ───
  const empresas = useEmpresasStore((s) => s.empresas);
  const misEmpresas = empresas.filter((e) => !e.ownerId || e.ownerId === currentUser?.id);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const empresaActiva = misEmpresas.find((e) => e.id === empresaId) ?? null;

  const claveConversacion = empresaId ?? CLAVE_NUEVA_CONVERSACION;
  const conversaciones = useAsistenteStore((s) => s.conversaciones);
  const mensajes = conversaciones[claveConversacion] ?? [];
  const enviarMensajeStore = useAsistenteStore((s) => s.enviarMensaje);

  const [borrador, setBorrador] = useState("");
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes.length, enviando]);

  async function handleEnviar() {
    const texto = borrador.trim();
    if (!texto || enviando) return;
    setBorrador("");
    setEnviando(true);
    try {
      const { empresaId: nuevoId } = await enviarMensajeStore(empresaId, texto);
      if (nuevoId && nuevoId !== empresaId) setEmpresaId(nuevoId);
    } catch {
      toast.error("No se pudo enviar el mensaje. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleEnviar();
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-strong)" }}>
          Alexa
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Genera tu código para iniciar sesión por voz, y platica con el asistente para llenar el perfil de tu
          empresa y su Lean Canvas.
        </p>
      </div>

      {/* Vincular con Alexa */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <label
              htmlFor="alexa-username"
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              Nombre (el mismo que le dirás a Alexa)
            </label>
            <Input id="alexa-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tu nombre" />
          </div>
          <Button onClick={handleGenerate} loading={generando} loadingText="Generando…" className="gap-2 shrink-0">
            <KeyRound className="w-4 h-4" />
            Generar código
          </Button>
        </div>

        {errorSemilla && (
          <p className="text-sm" style={{ color: "var(--destructive)" }}>
            {errorSemilla}
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

      {/* Selector de empresa */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wider shrink-0" style={{ color: "var(--muted-foreground)" }}>
          Empresa
        </span>
        <Select
          value={empresaId ?? CLAVE_NUEVA_CONVERSACION}
          onValueChange={(v) => setEmpresaId(v === CLAVE_NUEVA_CONVERSACION ? null : v)}
          items={[{ value: CLAVE_NUEVA_CONVERSACION, label: "+ Nueva empresa" }, ...misEmpresas.map((e) => ({ value: e.id, label: e.nombre }))]}
        >
          <SelectTrigger
            className="w-full sm:w-80 h-9 text-sm"
            style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CLAVE_NUEVA_CONVERSACION}>+ Nueva empresa</SelectItem>
            {misEmpresas.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        {/* Chat */}
        <div
          className="rounded-2xl flex flex-col overflow-hidden"
          style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)", height: 520 }}
        >
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {mensajes.length === 0 && !enviando && (
              <p className="text-sm text-center py-8" style={{ color: "var(--text-dim)" }}>
                {empresaActiva
                  ? `Pregúntame lo que quieras sobre el perfil o el Lean Canvas de "${empresaActiva.nombre}".`
                  : "Cuéntame de tu idea de negocio y te ayudo a armar el perfil de tu empresa."}
              </p>
            )}
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.rol === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    m.rol === "user"
                      ? { background: "var(--brand-gradient)", color: "var(--brand-fg)", borderBottomRightRadius: 4 }
                      : { backgroundColor: "var(--hover-surface)", color: "var(--text-strong)", borderBottomLeftRadius: 4 }
                  }
                >
                  {m.contenido}
                </div>
              </div>
            ))}
            {enviando && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-3.5 py-2.5 flex items-center gap-2"
                  style={{ backgroundColor: "var(--hover-surface)", borderBottomLeftRadius: 4 }}
                >
                  <Spinner size={14} />
                  <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                    Escribiendo…
                  </span>
                </div>
              </div>
            )}
          </div>

          {modoDemo() ? (
            <div className="p-4 text-xs text-center" style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-dim)" }}>
              El asistente necesita una cuenta real conectada al backend — no está disponible en modo demo.
            </div>
          ) : (
            <div className="p-3 flex items-end gap-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <Textarea
                value={borrador}
                onChange={(e) => setBorrador(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje…"
                rows={1}
                className="flex-1 resize-none text-sm min-h-9"
                style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
              />
              <Button onClick={handleEnviar} disabled={!borrador.trim()} loading={enviando} size="icon" aria-label="Enviar mensaje">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Resumen */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            Resumen
          </p>
          {!empresaActiva ? (
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              Todavía no hay una empresa creada en esta conversación.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--brand-tint)" }}>
                  <Building2 className="w-4 h-4" style={{ color: "var(--brand)" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-strong)" }}>
                    {empresaActiva.nombre}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--text-dim)" }}>
                    {empresaActiva.descripcion || "Sin descripción todavía."}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-1">
                {BLOQUES_RESUMEN.map(({ key, icon: Icon, label, tipo }) => {
                  const valor = empresaActiva.canvas[key];
                  const lleno = tipo === "lista" ? (valor as string[]).length > 0 : !!(valor as string).trim();
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                      style={{ backgroundColor: lleno ? "rgba(154,98,250,0.08)" : "transparent" }}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: lleno ? "var(--brand)" : "var(--text-faint)" }} />
                      <span className="text-xs flex-1 truncate" style={{ color: lleno ? "var(--text-strong)" : "var(--text-dim)" }}>
                        {label}
                      </span>
                      {lleno && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--brand)" }} />}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
