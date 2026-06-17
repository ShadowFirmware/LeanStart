import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutTemplate, Users, TrendingUp } from "lucide-react";

const features = [
  {
    icon: LayoutTemplate,
    title: "Lean Canvas guiado",
    description:
      "Plasma tu idea en un modelo de negocio claro y ordenado. El sistema te guía bloque a bloque para que no te pierdas nada importante.",
  },
  {
    icon: Users,
    title: "Mentoría con expertos",
    description:
      "Recibe orientación de personas que ya construyeron empresas. Sin teoría: feedback real aplicado directamente a tu proyecto.",
  },
  {
    icon: TrendingUp,
    title: "Score de Viabilidad",
    description:
      "Descubre qué tan sólida es tu idea antes de lanzarla. Obtén una calificación objetiva y sabe exactamente qué mejorar.",
  },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ backgroundColor: "#0D0C10" }}
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden" style={{ height: "700px" }}>
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full blur-[140px]"
          style={{
            top: "-80px",
            width: "900px",
            height: "600px",
            background: "radial-gradient(ellipse, rgba(154,98,250,0.13) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Navbar ── */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          backgroundColor: "rgba(13,12,16,0.82)",
        }}
      >
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="LeanStart"
              width={130}
              height={130}
              unoptimized
              className="rounded-md"
            />
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Iniciar sesión
            </Button>
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/registro" />}
            >
              Registrarse
            </Button>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <main className="relative flex-1 max-w-6xl mx-auto w-full px-6 py-24 flex items-center">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 w-full">

          {/* Left — copy */}
          <div className="flex-1 flex flex-col items-start text-left">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-7"
              style={{
                backgroundColor: "rgba(154,98,250,0.08)",
                border: "1px solid rgba(154,98,250,0.18)",
                color: "#9A62FA",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#9A62FA" }} />
              Metodología Lean Canvas
            </div>

            <h1 className="text-4xl md:text-[3.2rem] font-bold tracking-tight max-w-xl leading-[1.08]" style={{ color: "#F2F0F7" }}>
              La plataforma que convierte{" "}
              <span style={{ color: "#9A62FA" }}>
                ideas en negocios viables
              </span>
            </h1>

            <p className="mt-6 text-base max-w-md leading-relaxed" style={{ color: "#7E7C86" }}>
              LeanStart te guía paso a paso para estructurar, validar y mejorar
              tu modelo de negocio — con mentores reales y métricas objetivas,
              todo en un solo lugar.
            </p>

            <ul className="mt-7 flex flex-col gap-3 text-sm" style={{ color: "#7E7C86" }}>
              {[
                "Construcción guiada de tu modelo de negocio en 9 bloques",
                "Evaluación de viabilidad con criterios objetivos de mercado",
                "Mentoría especializada en cada etapa de tu proyecto",
              ].map((point) => (
                <li key={point} className="flex items-center gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                    style={{ backgroundColor: "rgba(154,98,250,0.12)", color: "#9A62FA" }}
                  >
                    ✓
                  </span>
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <Button
                size="lg"
                className="h-11 px-8 text-sm font-semibold"
                nativeButton={false}
                render={<Link href="/registro" />}
              >
                Comenzar ahora
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right — illustration */}
          <div className="flex-1 flex items-center justify-center w-full max-w-lg lg:max-w-none">
            <Image
              src="/images/landing-hero.svg"
              alt="LeanStart — plataforma para emprendedores"
              width={520}
              height={520}
              priority
              unoptimized
              className="w-full h-auto"
            />
          </div>
        </div>
      </main>

      {/* ── Features ── */}
      <section className="relative max-w-5xl mx-auto w-full px-6 pb-28">
        <div className="text-center mb-12">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "#9A62FA" }}
          >
            Por qué LeanStart
          </p>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#F2F0F7" }}>
            Todo lo que necesitas para lanzar con confianza
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "#131219",
                border: "1px solid rgba(255,255,255,0.06)",
                borderTop: "1px solid rgba(154,98,250,0.28)",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(154,98,250,0.09)",
                  border: "1px solid rgba(154,98,250,0.14)",
                }}
              >
                <Icon className="w-5 h-5" style={{ color: "#9A62FA" }} />
              </div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: "#F2F0F7" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#7E7C86" }}>
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="border-t py-8 text-center text-sm"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          color: "#4A4850",
        }}
      >
        © 2025 LeanStart. Todos los derechos reservados.
      </footer>
    </div>
  );
}
