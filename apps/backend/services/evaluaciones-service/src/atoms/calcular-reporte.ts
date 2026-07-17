/**
 * Puerto literal de apps/frontend/administrador-front/src/lib/reporte.ts —
 * mismos redondeos y misma fórmula ponderada. No cambiar sin cambiar ambos lados.
 */

export interface CriterioInput {
  id: string;
  nombre: string;
  descripcion: string;
  peso: number;
}

export interface NivelInput {
  id: string;
  nombre: string;
  hasta: number;
  color: string;
}

export interface EvaluacionInput {
  criterios: Record<string, number>;
  comentariosCriterios: Record<string, string>;
  comentarioEvaluador: string;
}

export interface CriterioCalculado {
  id: string;
  nombre: string;
  descripcion: string;
  peso: number;
  puntaje: number;
  puntos: number;
  comentario: string;
}

export interface ReporteCalculo {
  scoreEvaluacion: number;
  scoreHipotesis: number;
  scoreFinal: number;
  nivel: NivelInput | null;
  criterios: CriterioCalculado[];
  hipotesis: { validadas: number; total: number };
  pesoEvaluacion: number;
}

export function calcularReporte(
  hipotesis: { estado: string }[],
  evaluacion: EvaluacionInput | undefined,
  criterios: CriterioInput[],
  niveles: NivelInput[],
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
  const scoreEvaluacion =
    sumaPesos > 0
      ? Math.round(criteriosCalc.reduce((a, c) => a + c.peso * c.puntaje, 0) / sumaPesos)
      : 0;

  const validadas = hipotesis.filter((h) => h.estado === "validada").length;
  const total = hipotesis.length;
  const scoreHipotesis = total > 0 ? Math.round((validadas / total) * 100) : 0;

  const w = Math.max(0, Math.min(100, pesoEvaluacion)) / 100;
  const scoreFinal = Math.round(scoreEvaluacion * w + scoreHipotesis * (1 - w));

  const nivel = niveles.find((n) => scoreFinal <= n.hasta) ?? niveles[niveles.length - 1] ?? null;

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

export function rangoNivel(niveles: NivelInput[], nivel: NivelInput): string {
  const i = niveles.findIndex((n) => n.id === nivel.id);
  const desde = i <= 0 ? 0 : niveles[i - 1].hasta + 1;
  return `${desde}–${nivel.hasta}`;
}
