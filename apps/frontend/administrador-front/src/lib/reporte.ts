import type { Empresa } from "@leanstart/empresas-front";
import type { Criterio } from "../store/criterios";
import type { NivelViabilidad } from "../store/viabilidad";
import type { EvaluacionEmpresa } from "../store/evaluaciones";

export interface CriterioCalculado {
  id: string;
  nombre: string;
  descripcion: string;
  peso: number;
  /** Puntaje 0-100 (porcentaje del criterio). */
  puntaje: number;
  /** Puntaje convertido a puntos sobre el peso del criterio (p. ej. 28/30). */
  puntos: number;
  comentario: string;
}

export interface ReporteCalculo {
  /** Calificación ponderada de los criterios del evaluador (0-100). */
  scoreEvaluacion: number;
  /** % de hipótesis validadas sobre el total. */
  scoreHipotesis: number;
  /** Score final combinando evaluación e hipótesis según el peso configurado. */
  scoreFinal: number;
  nivel: NivelViabilidad | null;
  criterios: CriterioCalculado[];
  hipotesis: { validadas: number; total: number };
  pesoEvaluacion: number;
}

/** Combina la evaluación capturada con la validación real de hipótesis para producir todas las cifras del reporte. */
export function calcularReporte(
  empresa: Empresa,
  evaluacion: EvaluacionEmpresa | undefined,
  criterios: Criterio[],
  niveles: NivelViabilidad[],
  pesoEvaluacion: number
): ReporteCalculo {
  const criteriosCalc: CriterioCalculado[] = criterios.map((c) => {
    const puntaje = Math.round(evaluacion?.criterios?.[c.id] ?? 0);
    return {
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion,
      peso: c.peso,
      puntaje,
      puntos: Math.round((puntaje / 100) * c.peso),
      comentario: evaluacion?.comentariosCriterios?.[c.id] ?? "",
    };
  });

  const sumaPesos = criteriosCalc.reduce((a, c) => a + c.peso, 0);
  const scoreEvaluacion = sumaPesos > 0
    ? Math.round(criteriosCalc.reduce((a, c) => a + c.peso * c.puntaje, 0) / sumaPesos)
    : 0;

  const hip = empresa.hipotesisList ?? [];
  const validadas = hip.filter((h) => h.estado === "validada").length;
  const total = hip.length;
  const scoreHipotesis = total > 0 ? Math.round((validadas / total) * 100) : 0;

  const w = Math.max(0, Math.min(100, pesoEvaluacion)) / 100;
  const scoreFinal = Math.round(scoreEvaluacion * w + scoreHipotesis * (1 - w));

  const nivel =
    niveles.find((n) => scoreFinal <= n.hasta) ?? niveles[niveles.length - 1] ?? null;

  return {
    scoreEvaluacion,
    scoreHipotesis,
    scoreFinal,
    nivel,
    criterios: criteriosCalc,
    hipotesis: { validadas, total },
    pesoEvaluacion: Math.round(pesoEvaluacion),
  };
}

/** Rango numérico (p. ej. "75–100") que ocupa un nivel de viabilidad dentro de la escala 0-100. */
export function rangoNivel(niveles: NivelViabilidad[], nivel: NivelViabilidad): string {
  const i = niveles.findIndex((n) => n.id === nivel.id);
  const desde = i <= 0 ? 0 : niveles[i - 1].hasta + 1;
  return `${desde}–${nivel.hasta}`;
}
