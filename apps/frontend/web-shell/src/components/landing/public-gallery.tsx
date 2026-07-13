"use client";

import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { useEmpresasStore, type Empresa } from "@leanstart/empresas-front";
import { useHasHydrated } from "@leanstart/commons";
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

/** Logo de la empresa (o inicial) para la vitrina pública. */
function EmpresaLogo({ empresa }: { empresa: Empresa }) {
  if (empresa.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={empresa.logoUrl}
        alt={empresa.nombre}
        className="rounded-2xl object-contain shrink-0"
        style={{
          width: 88, height: 88, padding: 10,
          backgroundColor: "rgba(154,98,250,0.10)",
          border: "1px solid rgba(154,98,250,0.2)",
        }}
      />
    );
  }
  return (
    <div
      className="rounded-2xl flex items-center justify-center font-bold shrink-0"
      style={{
        width: 88, height: 88, fontSize: 34,
        backgroundColor: "rgba(154,98,250,0.12)", color: "#9A62FA",
        border: "1px solid rgba(154,98,250,0.2)",
      }}
    >
      {empresa.nombre.charAt(0).toUpperCase()}
    </div>
  );
}

export function PublicGallery() {
  const hydrated = useHasHydrated();
  const empresasRaw = useEmpresasStore((s) => s.empresas);
  const empresas = hydrated ? empresasRaw : [];
  const publicadas = empresas.filter((e) => e.estado === "publicado");

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

  // Autoplay suave, en pausa mientras el mouse está sobre la vitrina.
  useEffect(() => {
    if (!emblaApi || paused || publicadas.length < 2) return;
    const id = setInterval(() => emblaApi.scrollNext(), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [emblaApi, paused, publicadas.length]);

  if (!hydrated || publicadas.length === 0) return null;

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
            style={{ backgroundColor: "rgba(154,98,250,0.08)", border: "1px solid rgba(154,98,250,0.18)", color: "#9A62FA" }}
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            Proyectos publicados
          </div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#F2F0F7" }}>
            Ideas que ya validaron su viabilidad
          </h2>
          <p className="text-sm mt-3 max-w-lg mx-auto" style={{ color: "#7E7C86" }}>
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
                  style={{ flexBasis: "80%", maxWidth: 560, paddingLeft: 16 }}
                >
                  <div
                    className="rounded-3xl p-8 md:p-10 flex flex-col items-center text-center gap-5 transition-all duration-500"
                    style={{
                      backgroundColor: "#131219",
                      border: `1px solid ${isActive ? "rgba(154,98,250,0.4)" : "rgba(255,255,255,0.06)"}`,
                      boxShadow: isActive ? "0 30px 80px rgba(154,98,250,0.22)" : "0 10px 30px rgba(0,0,0,0.3)",
                      opacity: isActive ? 1 : 0.4,
                      transform: isActive ? "scale(1)" : "scale(0.92)",
                      minHeight: 340,
                    }}
                  >
                    <EmpresaLogo empresa={empresa} />
                    <div>
                      <p className="text-2xl md:text-3xl font-bold break-words" style={{ color: "#F2F0F7" }}>{empresa.nombre}</p>
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mt-3"
                        style={{ backgroundColor: "rgba(154,98,250,0.12)", color: "#C9A8FE" }}
                      >
                        {GIRO_LABELS[empresa.giro]}
                      </span>
                    </div>
                    <p
                      className="text-sm md:text-base leading-relaxed line-clamp-2 break-words max-w-md"
                      style={{ color: "#7E7C86" }}
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
            onClick={() => emblaApi?.scrollPrev()}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors shrink-0"
            style={{ color: "#7E7C86", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
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
                  <span className="absolute inset-0" style={{ backgroundColor: "#9A62FA" }} />
                )}
                {i === selectedIndex && (
                  <span
                    key={`${selectedIndex}-${paused}`}
                    className="absolute inset-y-0 left-0"
                    style={{
                      backgroundColor: "#9A62FA",
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
            onClick={() => emblaApi?.scrollNext()}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors shrink-0"
            style={{ color: "#7E7C86", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
