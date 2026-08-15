"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, KeyRound, Bot, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  apiFetch, modoDemo, Button, Input, Textarea, Spinner, useCurrentUser,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@leanstart/commons";
import { useEmpresasStore, useAsistenteStore, CLAVE_NUEVA_CONVERSACION } from "@leanstart/empresas-front";

interface GenerarSemillaResponse {
  seed: string;
  expiraEn: string;
}

type Vista = "chat" | "vincular";

/**
 * Widget flotante del asistente: burbuja fija en la esquina que, al abrirse,
 * muestra un panel compacto con dos vistas — el chat (Empresa + Lean Canvas) y
 * el generador de código para vincular la cuenta con Alexa. Vive en el layout
 * de emprendedor, así que está disponible en cualquier página, no solo en una
 * sección dedicada del menú.
 */
export function AlexaWidget() {
  const [abierto, setAbierto] = useState(false);
  const [vista, setVista] = useState<Vista>("chat");

  return (
    <>
      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 pl-3.5 pr-4 h-12 rounded-full transition-transform hover:scale-105"
          style={{ background: "var(--brand-gradient)", color: "var(--brand-fg)", boxShadow: "0 8px 24px rgba(154,98,250,0.4)" }}
          aria-label="Abrir el asistente"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">Asistente</span>
        </button>
      )}

      {abierto && (
        <div
          className="fixed bottom-5 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] h-[560px] max-h-[calc(100vh-2.5rem)] rounded-2xl flex flex-col overflow-hidden"
          style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-subtle)", boxShadow: "0 16px 48px rgba(0,0,0,0.28)" }}
        >
          <div className="flex items-center justify-between px-4 h-14 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-2.5 min-w-0">
              {vista === "vincular" ? (
                <button
                  type="button"
                  onClick={() => setVista("chat")}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--hover-surface)", color: "var(--text-dim)" }}
                  aria-label="Volver al chat"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--brand-gradient)" }}>
                  <Bot className="w-4 h-4" style={{ color: "var(--brand-fg)" }} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-strong)" }}>
                  {vista === "vincular" ? "Vincular con Alexa" : "Asistente LeanStart"}
                </p>
                {vista === "chat" && (
                  <button type="button" onClick={() => setVista("vincular")} className="text-[11px] font-medium" style={{ color: "var(--brand)" }}>
                    Vincular con Alexa
                  </button>
                )}
              </div>
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

          {vista === "vincular" ? <VincularAlexa /> : <ChatAsistente />}
        </div>
      )}
    </>
  );
}

function VincularAlexa() {
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
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
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
  );
}

function ChatAsistente() {
  const currentUser = useCurrentUser();
  const empresas = useEmpresasStore((s) => s.empresas);
  const misEmpresas = empresas.filter((e) => !e.ownerId || e.ownerId === currentUser?.id);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

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
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <Select
          value={empresaId ?? CLAVE_NUEVA_CONVERSACION}
          onValueChange={(v) => setEmpresaId(v === CLAVE_NUEVA_CONVERSACION ? null : v)}
          items={[{ value: CLAVE_NUEVA_CONVERSACION, label: "+ Nueva empresa" }, ...misEmpresas.map((e) => ({ value: e.id, label: e.nombre }))]}
        >
          <SelectTrigger
            className="w-full h-8 text-xs"
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 pb-2 flex flex-col gap-2.5 min-h-0">
        {mensajes.length === 0 && !enviando && (
          <p className="text-xs text-center py-6" style={{ color: "var(--text-dim)" }}>
            {empresaId
              ? "Pregúntame lo que quieras sobre el perfil o el Lean Canvas de esta empresa."
              : "Cuéntame de tu idea de negocio y te ayudo a armar el perfil de tu empresa."}
          </p>
        )}
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.rol === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap"
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
            <div className="rounded-2xl px-3 py-2 flex items-center gap-2" style={{ backgroundColor: "var(--hover-surface)", borderBottomLeftRadius: 4 }}>
              <Spinner size={12} />
              <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>
                Escribiendo…
              </span>
            </div>
          </div>
        )}
      </div>

      {modoDemo() ? (
        <div className="p-3 text-[11px] text-center shrink-0" style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-dim)" }}>
          El asistente necesita una cuenta real conectada al backend — no está disponible en modo demo.
        </div>
      ) : (
        <div className="p-2.5 flex items-end gap-2 shrink-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <Textarea
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje…"
            rows={1}
            className="flex-1 resize-none text-xs min-h-8 py-1.5"
            style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
          />
          <Button onClick={handleEnviar} disabled={!borrador.trim()} loading={enviando} size="icon-sm" aria-label="Enviar mensaje">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
