"use client";

import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, BadgeCheck, Sparkles } from "lucide-react";
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
const PARTICULAS = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 31) % 100,
  delay: (i * 0.5) % 9,
  duration: 7 + (i % 5) * 1.6,
  drift: (i % 2 === 0 ? 1 : -1) * (16 + (i % 3) * 12),
  size: 2 + (i % 3),
}));

// Ruido/grano sutil (SVG feTurbulence) para que las superficies no se vean
// planas — el mismo truco que usan la mayoría de los landing pages "premium".
const NOISE_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";
const NOISE_BG = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`;

/** Distancia más corta al slide activo, considerando el loop (p. ej. con 5 slides,
 *  el 4 está a "-1" del 0, no a "+4"). Da el sentido del tilt 3D y cuánto se apaga
 *  cada tarjeta según qué tan lejos esté de la que se está mostrando. */
function offsetCircular(i: number, seleccionado: number, total: number): number {
  let diff = i - seleccionado;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

/** Progreso 0→valor con easing, reproducido de nuevo cada vez que `activo` pasa
 *  a true (no solo la primera vez que la tarjeta aparece en pantalla). Un solo
 *  reloj alimenta tanto el número como el anillo de <ScoreRing/>. */
function useConteo(valor: number, activo: boolean, duracionMs = 1100): number {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!activo) return;
    let raf = 0;
    const inicio = performance.now();
    function tick(ahora: number) {
      const t = Math.min(1, (ahora - inicio) / duracionMs);
      const suavizado = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(valor * suavizado));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activo, valor, duracionMs]);
  return display;
}

/** Medalla circular de calificación: el anillo se dibuja al mismo ritmo que
 *  cuenta el número, como un indicador de carga que "llega" al valor final. */
function ScoreRing({ valor, activo }: { valor: number; activo: boolean }) {
  const display = useConteo(valor, activo);
  const size = 60;
  const grosor = 5;
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia * (1 - display / 100);

  return (
    <div
      className="absolute top-5 right-5 flex items-center justify-center"
      style={{ width: size, height: size, filter: "drop-shadow(0 4px 14px rgba(16,185,129,0.35))" }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 absolute inset-0">
        <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke="var(--border-subtle)" strokeWidth={grosor} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          fill="none"
          stroke="url(#lp-score-gradient)"
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 160ms linear" }}
        />
        <defs>
          <linearGradient id="lp-score-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-[13px] font-bold" style={{ color: "#10B981" }}>
        {display}
      </span>
    </div>
  );
}

function manejarSpotlight(e: React.MouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
  e.currentTarget.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
}

// Cuánto se desplaza cada capa de fondo por cada 1% que el mouse se aleja del
// centro de la sección — capas distintas => sensación real de profundidad.
const PARALLAX_FACTORES = [22, -30, 16];

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
  const orbRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

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

  // Parallax de fondo: cada órbita se mueve a su propia velocidad según qué tan
  // lejos esté el mouse del centro de la sección — no toca React state (solo
  // escribe transform directo vía ref) para que sea perfectamente fluido.
  function manejarParallax(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    orbRefs.forEach((ref, i) => {
      const factor = PARALLAX_FACTORES[i];
      if (ref.current) ref.current.style.transform = `translate3d(${px * factor}px, ${py * factor}px, 0)`;
    });
  }

  // La hidratación del store solo aplica al modo demo; el modo real no depende de ella.
  if ((modoDemo() && !hydrated) || publicadas.length === 0) return null;

  return (
    <section
      className="relative w-full py-24 overflow-hidden"
      style={{ perspective: 1600 }}
      onMouseMove={manejarParallax}
    >
      {/* ── Fondo: malla de órbitas con parallax + rejilla + partículas + grano ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div ref={orbRefs[0]} style={{ willChange: "transform" }}>
          <div
            className="absolute rounded-full blur-[110px]"
            style={{
              width: 620, height: 620, left: "8%", top: "-8%",
              background: "radial-gradient(circle, rgba(154,98,250,0.24) 0%, transparent 70%)",
              animation: "lp-orb-drift-1 16s ease-in-out infinite",
            }}
          />
        </div>
        <div ref={orbRefs[1]} style={{ willChange: "transform" }}>
          <div
            className="absolute rounded-full blur-[120px]"
            style={{
              width: 560, height: 560, right: "6%", top: "4%",
              background: "radial-gradient(circle, rgba(174,108,253,0.20) 0%, transparent 70%)",
              animation: "lp-orb-drift-2 20s ease-in-out infinite",
            }}
          />
        </div>
        <div ref={orbRefs[2]} style={{ willChange: "transform" }}>
          <div
            className="absolute rounded-full blur-[100px]"
            style={{
              width: 480, height: 480, left: "38%", bottom: "-12%",
              background: "radial-gradient(circle, rgba(198,135,245,0.18) 0%, transparent 70%)",
              animation: "lp-orb-drift-3 18s ease-in-out infinite",
            }}
          />
        </div>
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(var(--brand) 1px, transparent 1px), linear-gradient(90deg, var(--brand) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 60% 60% at 50% 40%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 40%, black, transparent)",
          }}
        />
        <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: NOISE_BG }} />
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
            className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-5 overflow-hidden"
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
          <h2
            className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(90deg, var(--text-strong), var(--brand-2), var(--text-strong))",
              backgroundSize: "200% auto",
              animation: "lp-gradient-text 6s ease-in-out infinite",
            }}
          >
            Ideas que ya validaron su viabilidad
          </h2>
          <p className="text-sm md:text-base mt-4 max-w-lg mx-auto" style={{ color: "var(--text-dim)" }}>
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
            paddingBottom: 28,
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
                  <div className="relative">
                    {/* "Mazo" de tarjetas fantasma detrás de la activa, para dar sensación de deck */}
                    {isActive && (
                      <>
                        <div
                          className="absolute inset-x-8 top-3 rounded-3xl"
                          style={{
                            height: "100%",
                            backgroundColor: "var(--surface-profile)",
                            border: "1px solid var(--border-subtle)",
                            opacity: 0.4,
                            transform: "scale(0.95) translateY(10px)",
                            zIndex: -1,
                          }}
                        />
                        <div
                          className="absolute inset-x-14 top-6 rounded-3xl"
                          style={{
                            height: "100%",
                            backgroundColor: "var(--surface-profile)",
                            border: "1px solid var(--border-subtle)",
                            opacity: 0.2,
                            transform: "scale(0.90) translateY(20px)",
                            zIndex: -2,
                          }}
                        />
                      </>
                    )}

                    {/* Anillo con degradado giratorio + respiración, solo en la tarjeta activa */}
                    <div
                      className="relative rounded-3xl transition-all"
                      style={{
                        padding: isActive ? 2 : 0,
                        background: isActive
                          ? "conic-gradient(from var(--lp-angle, 0deg), transparent, var(--brand-2), var(--brand), transparent 45%)"
                          : "transparent",
                        animation: isActive ? "lp-border-spin 5s linear infinite, lp-card-breathe 6s ease-in-out infinite" : undefined,
                        transitionDuration: "600ms",
                      }}
                    >
                      <div
                        onMouseMove={manejarSpotlight}
                        className="relative overflow-hidden rounded-[calc(1.5rem-2px)] p-8 md:p-10 flex flex-col items-center text-center gap-5 transition-all"
                        style={{
                          backgroundColor: "var(--surface-profile)",
                          border: `1px solid ${isActive ? "transparent" : "var(--border-subtle)"}`,
                          boxShadow: isActive ? "0 30px 90px rgba(154,98,250,0.32)" : "var(--shadow-card)",
                          opacity: isActive ? 1 : Math.max(0.14, 0.46 - distancia * 0.18),
                          transform: `perspective(1400px) rotateY(${offset * -13}deg) scale(${isActive ? 1 : Math.max(0.72, 0.9 - distancia * 0.08)}) translateZ(${isActive ? 0 : -90 * distancia}px)`,
                          filter: isActive ? "none" : `blur(${Math.min(distancia, 1) * 2}px)`,
                          minHeight: 360,
                          transitionDuration: "700ms",
                          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                      >
                        {/* Grano sutil también dentro de la tarjeta */}
                        <div
                          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
                          style={{ backgroundImage: NOISE_BG }}
                        />

                        {/* Spotlight que sigue al mouse, solo visible en la tarjeta activa */}
                        {isActive && (
                          <div
                            className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background: "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.12), transparent 45%)",
                            }}
                          />
                        )}

                        {/* Marca de agua de fondo: el logo real, gigante y desenfocado (no una
                            letra genérica) — así cada tarjeta se siente hecha a medida de esa
                            empresa. Sin logoUrl no hay imagen que desenfocar, se conserva la
                            inicial como respaldo. */}
                        {empresa.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            aria-hidden
                            alt=""
                            src={empresa.logoUrl}
                            className="pointer-events-none absolute select-none object-cover"
                            style={{
                              width: 460,
                              height: 460,
                              bottom: "-22%",
                              left: "-14%",
                              borderRadius: "50%",
                              filter: "blur(46px) saturate(1.4)",
                              opacity: isActive ? 0.22 : 0,
                              transition: "opacity 700ms",
                            }}
                          />
                        ) : (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute font-black select-none"
                            style={{
                              fontSize: 240,
                              lineHeight: 1,
                              bottom: "-0.28em",
                              left: "-0.06em",
                              color: "var(--brand)",
                              filter: "blur(2px)",
                              opacity: isActive ? 0.06 : 0,
                              transition: "opacity 700ms",
                            }}
                          >
                            {empresa.nombre.charAt(0).toUpperCase()}
                          </span>
                        )}

                        {/* Línea de acento superior, solo en la tarjeta activa */}
                        <div
                          className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all"
                          style={{
                            width: isActive ? "40%" : "0%",
                            background: "linear-gradient(90deg, transparent, var(--brand), transparent)",
                            opacity: isActive ? 1 : 0,
                          }}
                        />

                        {isActive && typeof empresa.scoreFinal === "number" && (
                          <ScoreRing valor={empresa.scoreFinal} activo={isActive} />
                        )}

                        <div
                          key={`logo-${empresa.id}-${isActive}`}
                          className="relative"
                          style={{ animation: isActive ? "lp-content-in 500ms cubic-bezier(0.22,1,0.36,1) both" : undefined }}
                        >
                          {isActive && (
                            <>
                              {/* Aura: el mismo logo, agrandado y desenfocado detrás del ícono nítido
                                  — un halo con los colores reales de la marca en vez de un glow morado
                                  genérico. Con inicial de respaldo, el halo sale del propio tile. */}
                              <div
                                aria-hidden
                                className="absolute pointer-events-none"
                                style={{
                                  inset: -22,
                                  filter: "blur(22px) saturate(1.3)",
                                  opacity: 0.75,
                                  transform: "scale(1.15)",
                                }}
                              >
                                <EmpresaLogo nombre={empresa.nombre} logoUrl={empresa.logoUrl} size={88} radio="2xl" borde="ninguno" />
                              </div>
                              <span
                                className="absolute inset-0 rounded-2xl animate-ping"
                                style={{ backgroundColor: "var(--brand)", opacity: 0.18, animationDuration: "2.2s" }}
                              />
                            </>
                          )}
                          <div className="relative" style={{ boxShadow: isActive ? "0 8px 32px rgba(154,98,250,0.4)" : "none", borderRadius: 16 }}>
                            <EmpresaLogo nombre={empresa.nombre} logoUrl={empresa.logoUrl} size={88} radio="2xl" borde="marca" />
                          </div>
                        </div>

                        <div
                          key={`titulo-${empresa.id}-${isActive}`}
                          style={{ animation: isActive ? "lp-content-in 500ms 80ms cubic-bezier(0.22,1,0.36,1) both" : undefined }}
                        >
                          <p className="text-2xl md:text-4xl font-bold break-words" style={{ color: "var(--text-strong)" }}>{empresa.nombre}</p>
                          <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                              style={{ backgroundColor: "var(--brand-tint)", color: "#C9A8FE" }}
                            >
                              {GIRO_LABELS[empresa.giro]}
                            </span>
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
                            className="absolute bottom-4 left-5 inline-flex items-center gap-1 text-[11px] font-medium"
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-center gap-6 mt-10">
          <button
            type="button"
            onClick={() => irA(selectedIndex - 1)}
            className="group flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              color: "var(--text-dim)",
              backgroundColor: "var(--surface-profile)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--border-hair)",
              boxShadow: "var(--shadow-card)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)";
              e.currentTarget.style.color = "var(--brand)";
              e.currentTarget.style.boxShadow = "0 0 24px rgba(154,98,250,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-hair)";
              e.currentTarget.style.color = "var(--text-dim)";
              e.currentTarget.style.boxShadow = "var(--shadow-card)";
            }}
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-active:-translate-x-0.5" />
          </button>

          {/* Barras tipo "stories" */}
          <div className="flex items-center gap-1.5" style={{ maxWidth: 360 }}>
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
                      boxShadow: "0 0 8px 1px var(--brand-glow)",
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
            className="group flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              color: "var(--text-dim)",
              backgroundColor: "var(--surface-profile)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--border-hair)",
              boxShadow: "var(--shadow-card)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)";
              e.currentTarget.style.color = "var(--brand)";
              e.currentTarget.style.boxShadow = "0 0 24px rgba(154,98,250,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-hair)";
              e.currentTarget.style.color = "var(--text-dim)";
              e.currentTarget.style.boxShadow = "var(--shadow-card)";
            }}
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5 transition-transform group-active:translate-x-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
