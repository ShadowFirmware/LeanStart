import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InternalHttpClient, type AuthUser, type EstadoEmpresa } from "@leanstart/backend-commons";
import { PrismaService } from "../prisma/prisma.service";
import { EstadoEmpresaService } from "./estado-empresa.service";
import { puedeVerEmpresa, whereScope } from "./scope";
import type { CreateEmpresaDto, UpdateEmpresaDto } from "../atoms/empresa.dto";

const DEFAULT_CANVAS = {
  problema: [] as string[],
  solucion: "",
  pvp: "",
  ventajaInjusta: "",
  segmentosClientes: [] as string[],
  metricasClave: [] as string[],
  canales: [] as string[],
  estructuraCostos: [] as string[],
  fuentesIngresos: [] as string[],
};

const INCLUDE_DETALLE = {
  canvas: true,
  productos: true,
  hipotesis: true,
} as const;

@Injectable()
export class EmpresasService {
  private readonly logger = new Logger(EmpresasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly estadoService: EstadoEmpresaService,
    private readonly http: InternalHttpClient,
    private readonly config: ConfigService
  ) {}

  async listar(user: AuthUser) {
    return this.prisma.empresa.findMany({
      where: whereScope(user),
      include: INCLUDE_DETALLE,
      orderBy: { createdAt: "desc" },
    });
  }

  async listarPublicas() {
    return this.prisma.empresa.findMany({
      where: { estado: "publicado" },
      orderBy: { updatedAt: "desc" },
    });
  }

  async obtener(user: AuthUser, id: string) {
    const empresa = await this.prisma.empresa.findUnique({ where: { id }, include: INCLUDE_DETALLE });
    if (!empresa) throw new NotFoundException("Empresa no encontrada.");
    if (!puedeVerEmpresa(user, empresa)) {
      throw new ForbiddenException("No tienes acceso a esta empresa.");
    }
    return empresa;
  }

  /** Variante sin scoping de usuario, para llamadas internas de otros servicios (p. ej. evaluaciones-service). */
  async obtenerInterno(id: string) {
    const empresa = await this.prisma.empresa.findUnique({ where: { id }, include: INCLUDE_DETALLE });
    if (!empresa) throw new NotFoundException("Empresa no encontrada.");
    return empresa;
  }

  async crear(user: AuthUser, dto: CreateEmpresaDto) {
    await this.assertNombreDisponible(dto.nombre);
    return this.prisma.empresa.create({
      data: {
        ...dto,
        ownerId: user.id,
        canvas: { create: DEFAULT_CANVAS },
      },
      include: INCLUDE_DETALLE,
    });
  }

  async actualizar(user: AuthUser, id: string, dto: UpdateEmpresaDto) {
    await this.obtener(user, id);
    if (dto.nombre) {
      await this.assertNombreDisponible(dto.nombre, id);
    }
    return this.prisma.empresa.update({ where: { id }, data: dto, include: INCLUDE_DETALLE });
  }

  /**
   * El nombre de una empresa es único en toda la plataforma, sin importar el
   * dueño (comparación sin mayúsculas/espacios de sobra) — evita el caso real
   * que motivó esto: "Levsek" registrada dos veces sin que nadie lo notara.
   */
  private async assertNombreDisponible(nombre: string, excludeId?: string) {
    const normalizado = nombre.trim();
    const existente = await this.prisma.empresa.findFirst({
      where: {
        nombre: { equals: normalizado, mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existente) {
      throw new ConflictException(`Ya existe una empresa registrada con el nombre "${normalizado}".`);
    }
  }

  async eliminar(user: AuthUser, id: string) {
    await this.obtener(user, id);
    await this.prisma.empresa.delete({ where: { id } });
    return { ok: true };
  }

  async cambiarEstado(user: AuthUser, id: string, estado: EstadoEmpresa) {
    const empresa = await this.obtener(user, id);
    this.estadoService.validarTransicion(empresa.estado as EstadoEmpresa, estado);
    const actualizada = await this.prisma.empresa.update({ where: { id }, data: { estado } });

    void this.registrarBitacora(user, {
      accion: "empresa.cambiar_estado",
      entidadId: id,
      entidadDescripcion: empresa.nombre,
      detalle: `${empresa.estado} → ${estado}`,
    });

    return actualizada;
  }

  /** Usado por el saga de finalizar evaluación (evaluaciones-service), sin scoping de usuario. */
  async cambiarEstadoInterno(
    id: string,
    estado: EstadoEmpresa,
    scoreFinal?: number,
    nivelNombre?: string,
    nivelColor?: string
  ) {
    const empresa = await this.obtenerInterno(id);
    this.estadoService.validarTransicion(empresa.estado as EstadoEmpresa, estado);
    return this.prisma.empresa.update({
      where: { id },
      data: {
        estado,
        ...(scoreFinal !== undefined ? { scoreFinal } : {}),
        ...(nivelNombre !== undefined ? { nivelNombre } : {}),
        ...(nivelColor !== undefined ? { nivelColor } : {}),
      },
    });
  }

  /** [Interno] Empresas ya evaluadas (scoreFinal definido) a las que aún les falta el nivel congelado. */
  async listarPendientesNivelInterno() {
    return this.prisma.empresa.findMany({
      where: { scoreFinal: { not: null }, nivelNombre: null },
      select: { id: true, scoreFinal: true },
    });
  }

  /** [Interno] Solo usado por el script de backfill — no valida transición, no toca estado. */
  async actualizarNivelInterno(id: string, nivelNombre: string, nivelColor: string) {
    return this.prisma.empresa.update({ where: { id }, data: { nivelNombre, nivelColor } });
  }

  async asignarMentor(user: AuthUser, id: string, mentorId: string) {
    const empresa = await this.obtener(user, id);
    this.estadoService.validarTransicion(empresa.estado as EstadoEmpresa, "en_mentoria");
    const actualizada = await this.prisma.empresa.update({ where: { id }, data: { mentorId, estado: "en_mentoria" } });

    // Sin await a propósito: notificar es best-effort (ver comentario en el método) y
    // esperar la ida-vuelta a notificaciones-service solo demora la respuesta al usuario
    // que hizo la asignación sin aportarle nada.
    void this.notificar(mentorId, {
      tipo: "proyecto_asignado",
      titulo: "Te asignaron un nuevo proyecto",
      mensaje: `"${empresa.nombre}" ahora está bajo tu mentoría.`,
      empresaNombre: empresa.nombre,
      empresaId: id,
    });
    void this.registrarBitacora(user, {
      accion: "empresa.asignar_mentor",
      entidadId: id,
      entidadDescripcion: empresa.nombre,
      detalle: `mentorId: ${mentorId}`,
    });

    return actualizada;
  }

  async asignarEvaluador(user: AuthUser, id: string, evaluadorId: string) {
    const empresa = await this.obtener(user, id);
    this.estadoService.validarTransicion(empresa.estado as EstadoEmpresa, "en_evaluacion");
    const actualizada = await this.prisma.empresa.update({ where: { id }, data: { evaluadorId, estado: "en_evaluacion" } });

    void this.notificar(empresa.ownerId, {
      tipo: "enviado_evaluacion",
      titulo: "Tu proyecto fue enviado a evaluación",
      mensaje: `"${empresa.nombre}" ya está en manos del equipo evaluador.`,
      empresaNombre: empresa.nombre,
      empresaId: id,
    });
    void this.registrarBitacora(user, {
      accion: "empresa.asignar_evaluador",
      entidadId: id,
      entidadDescripcion: empresa.nombre,
      detalle: `evaluadorId: ${evaluadorId}`,
    });

    return actualizada;
  }

  // Todo el cuerpo va en el try (no solo la llamada HTTP): un error leyendo la config
  // (p. ej. NOTIFICACIONES_SERVICE_URL sin definir) es síncrono y ocurre ANTES del
  // await, así que un .catch() encadenado solo a la promesa no lo alcanza a cubrir.
  // Notificar es best-effort en todos los call sites — nunca debe tumbar la operación
  // principal (asignar mentor, cambiar estado, etc.), y los call sites la invocan sin
  // await para que la ida-vuelta a notificaciones-service no demore la respuesta.
  private async notificar(destinatarioUserId: string, data: { tipo: string; titulo: string; mensaje: string; empresaNombre: string; empresaId?: string }) {
    try {
      const baseUrl = this.config.getOrThrow<string>("NOTIFICACIONES_SERVICE_URL");
      await this.http.post(`${baseUrl}/notificaciones`, { destinatarioUserId, ...data });
    } catch (err) {
      this.logger.warn(`No se pudo notificar a ${destinatarioUserId} (tipo=${data.tipo}): ${err instanceof Error ? err.message : err}`);
    }
  }

  /** Igual de best-effort que `notificar` — la auditoría nunca debe tumbar la acción que registra. */
  private async registrarBitacora(
    actor: AuthUser,
    data: { accion: string; entidadId: string; entidadDescripcion: string; detalle?: string }
  ) {
    try {
      const authUrl = this.config.getOrThrow<string>("AUTH_SERVICE_URL");
      await this.http.post(
        `${authUrl}/bitacora/interno`,
        { servicio: "empresas", entidadTipo: "empresa", ...data },
        actor
      );
    } catch (err) {
      this.logger.warn(`No se pudo registrar en bitácora (accion=${data.accion}): ${err instanceof Error ? err.message : err}`);
    }
  }
}
