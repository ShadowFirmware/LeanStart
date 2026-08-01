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
    apiFetch<Record<string, unknown>[]>("/public/empresas", { skipAuth: true })
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
          className="relative overflow-hidden"
          ref={emblaRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{
            WebkitMaskImage: "linear-gradient(90deg, transparent 0, black 64px, black calc(100% - 64px), transparent 100%)",
            maskImage: "linear-gradient(90deg, transparent 0, black 64px, black calc(100% - 64px), transparent 100%)",
          }}
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
                    className="relative overflow-hidden rounded-3xl p-8 md:p-10 flex flex-col items-center text-center gap-5 transition-all"
                    style={{
                      backgroundColor: "var(--surface-profile)",
                      border: `1px solid ${isActive ? "rgba(154,98,250,0.4)" : "var(--border-subtle)"}`,
                      boxShadow: isActive ? "0 30px 80px rgba(154,98,250,0.22)" : "var(--shadow-card)",
                      opacity: isActive ? 1 : 0.45,
                      transform: isActive ? "scale(1)" : "scale(0.9)",
                      filter: isActive ? "none" : "blur(0.5px)",
                      minHeight: 340,
                      transitionDuration: "600ms",
                      transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    {/* Línea de acento superior, solo en la tarjeta activa */}
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all"
                      style={{
                        width: isActive ? "40%" : "0%",
                        background: "linear-gradient(90deg, transparent, var(--brand), transparent)",
                        opacity: isActive ? 1 : 0,
                      }}
                    />

                    <div style={{ boxShadow: isActive ? "0 8px 24px rgba(154,98,250,0.25)" : "none", borderRadius: 16 }}>
                      <EmpresaLogo empresa={empresa} />
                    </div>
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
            className="group flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ color: "var(--text-dim)", backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)";
              e.currentTarget.style.color = "var(--brand)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-hair)";
              e.currentTarget.style.color = "var(--text-dim)";
            }}
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-active:-translate-x-0.5" />
          </button>

          {/* Barras tipo "stories" */}
          <div className="flex items-center gap-1.5" style={{ maxWidth: 320 }}>
            {publicadas.map((empresa, i) => (
              <button
                key={empresa.id}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                className="relative h-1.5 rounded-full overflow-hidden transition-transform hover:scale-y-150"
                style={{ width: 32, backgroundColor: "var(--border-subtle)" }}
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
            className="group flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ color: "var(--text-dim)", backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)";
              e.currentTarget.style.color = "var(--brand)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-hair)";
              e.currentTarget.style.color = "var(--text-dim)";
            }}
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4 transition-transform group-active:translate-x-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
