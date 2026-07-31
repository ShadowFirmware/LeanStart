"use client";

import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, BadgeCheck, Award } from "lucide-react";
import { useEmpresasStore } from "@leanstart/empresas-front";
import { useHasHydrated, apiFetch, modoDemo } from "@leanstart/commons";
import type { GiroEmpresa } from "@leanstart/commons";

const GIRO_LABELS: Record<GiroEmpresa, string> = {
  tecnologia: "Tecnología",
  educacion: "Educación",
  salud: "Salud",
  sustentabilidad: "Sustentabilidad",
  alimentacion: "Alimentación",
  comercio: "Comercio",
  servicios: "Servicios",
};

const AUTOPLAY_MS = 4200;

/** Esta es una vitrina PÚBLICA: todos los visitantes deben ver las mismas empresas
 *  publicadas, sin importar quién (o si alguien) tenga sesión iniciada. */
interface EmpresaPublica {
  id: string;
  nombre: string;
  giro: GiroEmpresa;
  descripcion: string;
  scoreFinal?: number;
  logoUrl?: string;
}

function mapEmpresaPublica(e: Record<string, unknown>): EmpresaPublica {
  return {
    id: e.id as string,
    nombre: e.nombre as string,
    giro: e.giro as GiroEmpresa,
    descripcion: e.descripcion as string,
    scoreFinal: (e.scoreFinal as number) ?? undefined,
    logoUrl: (e.logoUrl as string) ?? undefined,
  };
}

/** Logo de la empresa (o inicial) para la vitrina pública. */
function EmpresaLogo({ empresa }: { empresa: EmpresaPublica }) {
  if (empresa.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={empresa.logoUrl}
        alt={empresa.nombre}
        className="rounded-2xl object-contain shrink-0"
        style={{
          width: 88, height: 88, padding: 10,
          backgroundColor: "rgba(154,98,250,0.10)",
          border: "1px solid var(--brand-tint-strong)",
        }}
      />
    );
  }
  return (
    <div
      className="rounded-2xl flex items-center justify-center font-bold shrink-0"
      style={{
        width: 88, height: 88, fontSize: 34,
        backgroundColor: "var(--brand-tint)", color: "var(--brand)",
        border: "1px solid var(--brand-tint-strong)",
      }}
    >
      {empresa.nombre.charAt(0).toUpperCase()}
    </div>
  );
}

export function PublicGallery() {
  const hydrated = useHasHydrated();
  // Modo demo: no hay backend real, se usa el store local (seed compartido, no
  // escopeado por sesión real, así que no arrastra el problema de abajo).
  const empresasDemo = useEmpresasStore((s) => s.empresas);
  // Modo real: SIEMPRE desde el endpoint público (sin auth, sin scoping por usuario)
  // — nunca desde useEmpresasStore, que es privado y queda persistido en localStorage
  // con los datos de quien estuvo logueado por última vez (por eso, al cerrar sesión
  // como emprendedor, esta vitrina mostraba solo SUS empresas en vez de todas).
  const [publicasReal, setPublicasReal] = useState<EmpresaPublica[]>([]);

  useEffect(() => {
    if (modoDemo()) return;
    apiFetch<Record<string, unknown>[]>("/public/empresas")
      .then((filas) => setPublicasReal(filas.map(mapEmpresaPublica)))
      .catch(() => setPublicasReal([]));
  }, []);

  const publicadas: EmpresaPublica[] = modoDemo()
    ? (hydrated ? empresasDemo : []).filter((e) => e.estado === "publicado")
    : publicasReal;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi]);

  // Con muy pocas tarjetas (ej. solo 2 empresas publicadas) Embla no tiene suficiente
  // contenido para armar un loop real y se queda pegado en el primer/último slide al
  // llegar al borde. Envolvemos el índice nosotros mismos en vez de depender de su loop.
  const total = publicadas.length;
  function irA(index: number) {
    if (!emblaApi || total === 0) return;
    emblaApi.scrollTo(((index % total) + total) % total);
  }

  // Autoplay suave, en pausa mientras el mouse está sobre la vitrina.
  useEffect(() => {
    if (!emblaApi || paused || total < 2) return;
    const id = setInterval(() => irA(selectedIndex + 1), AUTOPLAY_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi, paused, total, selectedIndex]);

  // La hidratación del store solo aplica al modo demo; el modo real no depende de ella.
  if ((modoDemo() && !hydrated) || publicadas.length === 0) return null;

  return (
    <section className="relative w-full py-24 overflow-hidden">
      {/* Glow de fondo, exclusivo de la vitrina */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full blur-[120px]"
          style={{ width: 800, height: 420, background: "radial-gradient(ellipse, rgba(154,98,250,0.16) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto w-full px-6">
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ backgroundColor: "rgba(154,98,250,0.08)", border: "1px solid rgba(154,98,250,0.18)", color: "var(--brand)" }}
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            Proyectos publicados
          </div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--text-strong)" }}>
            Ideas que ya validaron su viabilidad
          </h2>
          <p className="text-sm mt-3 max-w-lg mx-auto" style={{ color: "var(--text-dim)" }}>
            Empresas que pasaron por todo el proceso de LeanStart y fueron aprobadas por un evaluador.
          </p>
        </div>

        <div
          className="overflow-hidden"
          ref={emblaRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="flex" style={{ marginLeft: "-16px" }}>
            {publicadas.map((empresa, i) => {
              const isActive = i === selectedIndex;
              return (
                <div
                  key={empresa.id}
                  className="shrink-0 grow-0"
                  style={{ flexBasis: "85%", maxWidth: 720, paddingLeft: 16 }}
                >
                  <div
                    className="rounded-3xl p-8 md:p-10 flex flex-col items-center text-center gap-5 transition-all duration-500"
                    style={{
                      backgroundColor: "var(--surface-profile)",
                      border: `1px solid ${isActive ? "rgba(154,98,250,0.4)" : "var(--border-subtle)"}`,
                      boxShadow: isActive ? "0 30px 80px rgba(154,98,250,0.22)" : "var(--shadow-card)",
                      opacity: isActive ? 1 : 0.4,
                      transform: isActive ? "scale(1)" : "scale(0.92)",
                      minHeight: 340,
                    }}
                  >
                    <EmpresaLogo empresa={empresa} />
                    <div>
                      <p className="text-2xl md:text-3xl font-bold break-words" style={{ color: "var(--text-strong)" }}>{empresa.nombre}</p>
                      <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: "var(--brand-tint)", color: "#C9A8FE" }}
                        >
                          {GIRO_LABELS[empresa.giro]}
                        </span>
                        {typeof empresa.scoreFinal === "number" && (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: "rgba(16,185,129,0.14)", color: "#10B981" }}
                          >
                            <Award className="w-3.5 h-3.5" />
                            {empresa.scoreFinal}% de calificación
                          </span>
                        )}
                      </div>
                    </div>
                    <p
                      className="text-sm md:text-base leading-relaxed line-clamp-2 break-words max-w-md"
                      style={{ color: "var(--text-dim)" }}
                    >
                      {empresa.descripcion}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-center gap-5 mt-8">
          <button
            type="button"
            onClick={() => irA(selectedIndex - 1)}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors shrink-0"
            style={{ color: "var(--text-dim)", backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)" }}
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Barras tipo "stories" */}
          <div className="flex items-center gap-1.5" style={{ maxWidth: 320 }}>
            {publicadas.map((empresa, i) => (
              <button
                key={empresa.id}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                className="relative h-1 rounded-full overflow-hidden"
                style={{ width: 32, backgroundColor: "rgba(255,255,255,0.12)" }}
                aria-label={`Ir a ${empresa.nombre}`}
              >
                {i < selectedIndex && (
                  <span className="absolute inset-0" style={{ backgroundColor: "var(--brand)" }} />
                )}
                {i === selectedIndex && (
                  <span
                    key={`${selectedIndex}-${paused}`}
                    className="absolute inset-y-0 left-0"
                    style={{
                      backgroundColor: "var(--brand)",
                      animation: `lp-story-fill ${AUTOPLAY_MS}ms linear forwards`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => irA(selectedIndex + 1)}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors shrink-0"
            style={{ color: "var(--text-dim)", backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)" }}
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
