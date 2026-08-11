"use client";

import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, BadgeCheck, Award, Sparkles } from "lucide-react";
import { useEmpresasStore } from "@leanstart/empresas-front";
import { useHasHydrated, apiFetch, modoDemo, GIRO_LABELS, EmpresaLogo } from "@leanstart/commons";
import type { GiroEmpresa } from "@leanstart/commons";

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

// Deterministas (no Math.random): el server y el primer render del cliente
// tienen que pintar exactamente lo mismo, o React se queja de un mismatch.
const PARTICULAS = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 0.55) % 9,
  duration: 7 + (i % 5) * 1.6,
  drift: (i % 2 === 0 ? 1 : -1) * (16 + (i % 3) * 12),
  size: 2 + (i % 3),
}));

/** Distancia más corta al slide activo, considerando el loop (p. ej. con 5 slides,
 *  el 4 está a "-1" del 0, no a "+4"). Da el sentido del tilt 3D y cuánto se apaga
 *  cada tarjeta según qué tan lejos esté de la que se está mostrando. */
function offsetCircular(i: number, seleccionado: number, total: number): number {
  let diff = i - seleccionado;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

/** Cuenta ascendente del score, se reproduce de nuevo cada vez que la tarjeta
 *  vuelve a quedar activa (no solo la primera vez que aparece en pantalla). */
function ScoreContador({ valor, activo }: { valor: number; activo: boolean }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!activo) return;
    let raf = 0;
    const inicio = performance.now();
    const duracion = 900;
    function tick(ahora: number) {
      const t = Math.min(1, (ahora - inicio) / duracion);
      const suavizado = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(valor * suavizado));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activo, valor]);
  return <>{display}</>;
}

function manejarSpotlight(e: React.MouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
  e.currentTarget.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
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
  const seccionRef = useRef<HTMLElement>(null);

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
    <section ref={seccionRef} className="relative w-full py-24 overflow-hidden" style={{ perspective: 1600 }}>
      {/* ── Fondo: malla de órbitas + rejilla + partículas ambientales ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute rounded-full blur-[110px]"
          style={{
            width: 620, height: 620, left: "8%", top: "-8%",
            background: "radial-gradient(circle, rgba(154,98,250,0.22) 0%, transparent 70%)",
            animation: "lp-orb-drift-1 16s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full blur-[120px]"
          style={{
            width: 560, height: 560, right: "6%", top: "4%",
            background: "radial-gradient(circle, rgba(174,108,253,0.18) 0%, transparent 70%)",
            animation: "lp-orb-drift-2 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full blur-[100px]"
          style={{
            width: 480, height: 480, left: "38%", bottom: "-12%",
            background: "radial-gradient(circle, rgba(198,135,245,0.16) 0%, transparent 70%)",
            animation: "lp-orb-drift-3 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(var(--brand) 1px, transparent 1px), linear-gradient(90deg, var(--brand) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 60% 60% at 50% 40%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 40%, black, transparent)",
          }}
        />
        {PARTICULAS.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              bottom: "-8%",
              width: p.size,
              height: p.size,
              backgroundColor: "var(--brand-2)",
              boxShadow: "0 0 6px 1px var(--brand-glow)",
              // @ts-expect-error -- custom property leído por @keyframes lp-particle-float
              "--lp-drift": `${p.drift}px`,
              animation: `lp-particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto w-full px-6">
        <div className="text-center mb-14">
          <div
            className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4 overflow-hidden"
            style={{
              backgroundColor: "rgba(154,98,250,0.08)",
              border: "1px solid rgba(154,98,250,0.18)",
              color: "var(--brand)",
              animation: "lp-badge-glow 3.2s ease-in-out infinite",
            }}
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            Proyectos publicados
            <span
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                animation: "lp-shimmer-sweep 3.4s ease-in-out infinite",
                animationDelay: "1s",
              }}
            />
          </div>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight" style={{ color: "var(--text-strong)" }}>
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
              const offset = offsetCircular(i, selectedIndex, total);
              const distancia = Math.min(Math.abs(offset), 2);

              return (
                <div
                  key={empresa.id}
                  className="shrink-0 grow-0"
                  style={{ flexBasis: "85%", maxWidth: 720, paddingLeft: 16, transformStyle: "preserve-3d" }}
                >
                  {/* Anillo con degradado giratorio, solo alrededor de la tarjeta activa */}
                  <div
                    className="relative rounded-3xl transition-all"
                    style={{
                      padding: isActive ? 2 : 0,
                      background: isActive
                        ? "conic-gradient(from var(--lp-angle, 0deg), transparent, var(--brand-2), var(--brand), transparent 45%)"
                        : "transparent",
                      animation: isActive ? "lp-border-spin 5s linear infinite" : undefined,
                      transitionDuration: "600ms",
                    }}
                  >
                    <div
                      onMouseMove={manejarSpotlight}
                      className="relative overflow-hidden rounded-[calc(1.5rem-2px)] p-8 md:p-10 flex flex-col items-center text-center gap-5 transition-all"
                      style={{
                        backgroundColor: "var(--surface-profile)",
                        border: `1px solid ${isActive ? "transparent" : "var(--border-subtle)"}`,
                        boxShadow: isActive ? "0 30px 90px rgba(154,98,250,0.28)" : "var(--shadow-card)",
                        opacity: isActive ? 1 : Math.max(0.18, 0.5 - distancia * 0.18),
                        transform: `perspective(1400px) rotateY(${offset * -9}deg) scale(${isActive ? 1 : Math.max(0.78, 0.92 - distancia * 0.06)}) translateZ(${isActive ? 0 : -60 * distancia}px)`,
                        filter: isActive ? "none" : `blur(${Math.min(distancia, 1) * 1.5}px)`,
                        minHeight: 340,
                        transitionDuration: "650ms",
                        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    >
                      {/* Spotlight que sigue al mouse, solo visible en la tarjeta activa */}
                      {isActive && (
                        <div
                          className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.10), transparent 45%)",
                          }}
                        />
                      )}

                      {/* Inicial gigante de fondo, como marca de agua decorativa */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute font-black select-none"
                        style={{
                          fontSize: 220,
                          lineHeight: 1,
                          top: "-0.15em",
                          right: "-0.05em",
                          color: "var(--brand)",
                          opacity: isActive ? 0.05 : 0,
                          transition: "opacity 600ms",
                        }}
                      >
                        {empresa.nombre.charAt(0).toUpperCase()}
                      </span>

                      {/* Línea de acento superior, solo en la tarjeta activa */}
                      <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all"
                        style={{
                          width: isActive ? "40%" : "0%",
                          background: "linear-gradient(90deg, transparent, var(--brand), transparent)",
                          opacity: isActive ? 1 : 0,
                        }}
                      />

                      <div
                        key={`logo-${empresa.id}-${isActive}`}
                        style={{
                          boxShadow: isActive ? "0 8px 32px rgba(154,98,250,0.35)" : "none",
                          borderRadius: 16,
                          animation: isActive ? "lp-content-in 500ms cubic-bezier(0.22,1,0.36,1) both" : undefined,
                        }}
                      >
                        <EmpresaLogo nombre={empresa.nombre} logoUrl={empresa.logoUrl} size={88} radio="2xl" borde="marca" />
                      </div>

                      <div
                        key={`titulo-${empresa.id}-${isActive}`}
                        style={{ animation: isActive ? "lp-content-in 500ms 80ms cubic-bezier(0.22,1,0.36,1) both" : undefined }}
                      >
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
                              <ScoreContador valor={empresa.scoreFinal} activo={isActive} />% de calificación
                            </span>
                          )}
                        </div>
                      </div>

                      <p
                        key={`desc-${empresa.id}-${isActive}`}
                        className="text-sm md:text-base leading-relaxed line-clamp-2 break-words max-w-md"
                        style={{
                          color: "var(--text-dim)",
                          animation: isActive ? "lp-content-in 500ms 150ms cubic-bezier(0.22,1,0.36,1) both" : undefined,
                        }}
                      >
                        {empresa.descripcion}
                      </p>

                      {isActive && (
                        <span
                          className="absolute bottom-4 right-5 inline-flex items-center gap-1 text-[11px] font-medium"
                          style={{
                            color: "var(--brand)",
                            animation: "lp-content-in 500ms 220ms cubic-bezier(0.22,1,0.36,1) both",
                          }}
                        >
                          <Sparkles className="w-3 h-3" />
                          Validado
                        </span>
                      )}
                    </div>
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
              e.currentTarget.style.boxShadow = "0 0 16px rgba(154,98,250,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-hair)";
              e.currentTarget.style.color = "var(--text-dim)";
              e.currentTarget.style.boxShadow = "none";
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
              e.currentTarget.style.boxShadow = "0 0 16px rgba(154,98,250,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-hair)";
              e.currentTarget.style.color = "var(--text-dim)";
              e.currentTarget.style.boxShadow = "none";
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
