import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InternalHttpClient, type AuthUser } from "@leanstart/backend-commons";
import { PrismaService } from "../prisma/prisma.service";
import { CriteriosService } from "./criterios.service";
import { ViabilidadService } from "./viabilidad.service";
import { ReportesGeneradosService } from "./reportes-generados.service";
import { calcularReporte, type EvaluacionInput } from "../atoms/calcular-reporte";

interface EmpresaConHipotesis {
  id: string;
  nombre: string;
  ownerId: string;
  mentorId: string | null;
  estado: string;
  hipotesis: { estado: string }[];
}

const VACIA: EvaluacionInput = { criterios: {}, comentariosCriterios: {}, comentarioEvaluador: "" };

@Injectable()
export class EvaluacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly criterios: CriteriosService,
    private readonly viabilidad: ViabilidadService,
    private readonly reportes: ReportesGeneradosService,
    private readonly http: InternalHttpClient,
    private readonly config: ConfigService
  ) {}

  private async getRaw(empresaId: string) {
    const fila = await this.prisma.evaluacion.findUnique({ where: { empresaId } });
    if (!fila) return { ...VACIA, finalizada: false, scoreFinal: null as number | null };
    return {
      criterios: (fila.criteriosJson as Record<string, number>) ?? {},
      comentariosCriterios: (fila.comentariosCriteriosJson as Record<string, string>) ?? {},
      comentarioEvaluador: fila.comentarioEvaluador,
      finalizada: fila.finalizada,
      scoreFinal: fila.scoreFinal,
    };
  }

  private async upsertParcial(empresaId: string, data: Partial<EvaluacionInput>) {
    const actual = await this.getRaw(empresaId);
    const nuevo = { ...actual, ...data };
    return this.prisma.evaluacion.upsert({
      where: { empresaId },
      create: {
        empresaId,
        criteriosJson: nuevo.criterios,
        comentariosCriteriosJson: nuevo.comentariosCriterios,
        comentarioEvaluador: nuevo.comentarioEvaluador,
      },
      update: {
        criteriosJson: nuevo.criterios,
        comentariosCriteriosJson: nuevo.comentariosCriterios,
        comentarioEvaluador: nuevo.comentarioEvaluador,
      },
    });
  }

  /**
   * El evaluador/administrador siempre ven todo (incluido mientras se está calificando).
   * El emprendedor solo puede ver SU PROPIA empresa, y solo una vez finalizada la
   * evaluación — antes de eso vería las notas del evaluador a medio escribir, algo que
   * nunca debe pasar (mismo criterio que el borrador de observaciones del mentor).
   */
  async obtener(actingAs: AuthUser, empresaId: string) {
    const data = await this.getRaw(empresaId);
    // El bloque restrictivo aplica cuando NO tiene ningún rol elevado — así un usuario
    // con roles ["emprendedor","evaluador"] sí ve todo, sin importar que también sea emprendedor.
    const esSoloEmprendedor = !actingAs.roles.includes("evaluador") && !actingAs.roles.includes("administrador");
    if (esSoloEmprendedor) {
      const empresasUrl = this.config.getOrThrow<string>("EMPRESAS_SERVICE_URL");
      const empresa = await this.http.get<{ ownerId: string }>(`${empresasUrl}/empresas/${empresaId}/interno`);
      if (empresa.ownerId !== actingAs.id) {
        throw new ForbiddenException("No tienes acceso a esta evaluación.");
      }
      if (!data.finalizada) {
        return { ...VACIA, finalizada: false, scoreFinal: null as number | null };
      }
    }
    return data;
  }

  async setPuntaje(empresaId: string, criterioId: string, puntaje: number) {
    const actual = await this.getRaw(empresaId);
    const clamped = Math.max(0, Math.min(100, Math.round(puntaje)));
    return this.upsertParcial(empresaId, {
      criterios: { ...actual.criterios, [criterioId]: clamped },
    });
  }

  async setComentarioCriterio(empresaId: string, criterioId: string, comentario: string) {
    const actual = await this.getRaw(empresaId);
    return this.upsertParcial(empresaId, {
      comentariosCriterios: { ...actual.comentariosCriterios, [criterioId]: comentario },
    });
  }

  async setComentario(empresaId: string, comentario: string) {
    return this.upsertParcial(empresaId, { comentarioEvaluador: comentario });
  }

  /**
   * Saga de finalización (HTTP directo, sin bus de mensajería):
   *  1. Pide la empresa + hipótesis a empresas-service.
   *  2. Calcula el score con la misma fórmula que el front (calcularReporte).
   *  3. Marca la evaluación como finalizada.
   *  4. Actualiza el estado de la empresa (publicado/devuelto) en empresas-service.
   *  5. Notifica al emprendedor en notificaciones-service.
   */
  async finalizar(actingAs: AuthUser, empresaId: string) {
    const empresasUrl = this.config.getOrThrow<string>("EMPRESAS_SERVICE_URL");
    const notifUrl = this.config.getOrThrow<string>("NOTIFICACIONES_SERVICE_URL");

    const empresa = await this.http.get<EmpresaConHipotesis>(`${empresasUrl}/empresas/${empresaId}/interno`);
    if (empresa.estado !== "en_evaluacion") {
      throw new BadRequestException('Solo se puede finalizar una empresa en estado "en_evaluacion".');
    }

    const [criterios, { niveles, pesoEvaluacion, umbralPublicacion }] = await Promise.all([
      this.criterios.listar(),
      this.viabilidad.obtenerConfig(),
    ]);
    const evaluacionActual = await this.getRaw(empresaId);

    const calculo = calcularReporte(empresa.hipotesis, evaluacionActual, criterios, niveles, pesoEvaluacion);
    const accionResultante = calculo.scoreFinal >= umbralPublicacion ? "publicado" : "devuelto";

    await this.prisma.evaluacion.upsert({
      where: { empresaId },
      create: {
        empresaId,
        criteriosJson: evaluacionActual.criterios,
        comentariosCriteriosJson: evaluacionActual.comentariosCriterios,
        comentarioEvaluador: evaluacionActual.comentarioEvaluador,
        finalizada: true,
        scoreFinal: calculo.scoreFinal,
      },
      update: { finalizada: true, scoreFinal: calculo.scoreFinal },
    });

    await this.http.patch(
      `${empresasUrl}/empresas/${empresaId}/estado-interno`,
      {
        estado: accionResultante,
        scoreFinal: calculo.scoreFinal,
        nivelNombre: calculo.nivel?.nombre,
        nivelColor: calculo.nivel?.color,
      },
      actingAs
    );

    // Sin await: la notificación es best-effort y no afecta lo que se devuelve al
    // frontend — esperarla solo demoraría la respuesta de "finalizar" innecesariamente.
    void this.http
      .post(`${notifUrl}/notificaciones`, {
        destinatarioUserId: empresa.ownerId,
        tipo: accionResultante === "publicado" ? "proyecto_publicado" : "proyecto_devuelto",
        titulo: accionResultante === "publicado" ? "¡Tu proyecto fue publicado!" : "Proyecto devuelto con observaciones",
        mensaje:
          accionResultante === "publicado"
            ? `"${empresa.nombre}" fue aprobado por el equipo evaluador y ya es visible en la galería pública.`
            : `"${empresa.nombre}" fue devuelto. Revisa los comentarios del evaluador antes de reenviarlo.`,
        empresaNombre: empresa.nombre,
      })
      .catch(() => undefined);

    // Igual de best-effort: la auditoría nunca debe tumbar "finalizar".
    void this.http
      .post(
        `${this.config.getOrThrow<string>("AUTH_SERVICE_URL")}/bitacora/interno`,
        {
          servicio: "evaluaciones",
          accion: accionResultante === "publicado" ? "evaluacion.publicar" : "evaluacion.devolver",
          entidadTipo: "empresa",
          entidadId: empresaId,
          entidadDescripcion: empresa.nombre,
          detalle: `scoreFinal: ${calculo.scoreFinal}`,
        },
        actingAs
      )
      .catch(() => undefined);

    return { ...calculo, accionResultante };
  }
}
