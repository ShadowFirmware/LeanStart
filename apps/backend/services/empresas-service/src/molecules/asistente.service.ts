import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { GIRO_LABELS, type AuthUser } from "@leanstart/backend-commons";
import { EmpresasService } from "./empresas.service";
import { CanvasService } from "./canvas.service";
import { CreateEmpresaDto, UpdateEmpresaDto } from "../atoms/empresa.dto";
import { UpdateCanvasDto } from "../atoms/canvas.dto";
import type { MensajeChatDto } from "../atoms/asistente.dto";

type EmpresaConDetalle = Awaited<ReturnType<EmpresasService["obtener"]>>;

const GIROS = Object.keys(GIRO_LABELS);

const BLOQUES_TEXTO = ["solucion", "pvp", "ventajaInjusta"] as const;
const BLOQUES_LISTA = ["problema", "segmentosClientes", "metricasClave", "canales", "estructuraCostos", "fuentesIngresos"] as const;
type BloqueTexto = (typeof BLOQUES_TEXTO)[number];
type BloqueLista = (typeof BLOQUES_LISTA)[number];

const MAX_ITEMS_POR_BLOQUE: Record<BloqueLista, number> = {
  problema: 5,
  segmentosClientes: 5,
  metricasClave: 5,
  canales: 5,
  estructuraCostos: 8,
  fuentesIngresos: 5,
};

const BLOQUE_LABELS: Record<BloqueTexto | BloqueLista, string> = {
  problema: "Problema",
  solucion: "Solución",
  pvp: "Propuesta de valor única",
  ventajaInjusta: "Ventaja injusta",
  segmentosClientes: "Segmentos de clientes",
  metricasClave: "Métricas clave",
  canales: "Canales",
  estructuraCostos: "Estructura de costos",
  fuentesIngresos: "Fuentes de ingresos",
};

export interface AsistenteRespuesta {
  respuesta: string;
  empresaId: string | null;
  empresa: EmpresaConDetalle | null;
  camposActualizados: string[];
}

/** Resultado de aplicar un tool_use: `empresa` solo viene poblado cuando la
 *  escritura tocó el perfil (crear/actualizar empresa) — las de canvas no lo
 *  traen, porque `CanvasService.actualizar` devuelve solo el canvas. */
type ResultadoEscritura =
  | { ok: true; etiqueta: string; empresa?: EmpresaConDetalle }
  | { ok: false; motivo: string };

function toolCrearEmpresa(): Anthropic.Tool {
  return {
    name: "crear_empresa",
    description:
      "Crea la empresa del emprendedor con su perfil inicial. Solo llamar cuando ya tengas los 4 campos completos y válidos: nombre (2-100 caracteres), giro, descripción (mínimo 20 caracteres) y mercado objetivo (mínimo 20 caracteres). Se puede llamar una sola vez.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string", minLength: 2, maxLength: 100, description: "Nombre de la empresa." },
        giro: { type: "string", enum: GIROS, description: "Giro/industria de la empresa." },
        descripcion: { type: "string", minLength: 20, maxLength: 500, description: "Qué hace la empresa, mínimo 20 caracteres." },
        mercadoObjetivo: { type: "string", minLength: 20, maxLength: 500, description: "A quién le vende, mínimo 20 caracteres." },
      },
      required: ["nombre", "giro", "descripcion", "mercadoObjetivo"],
      additionalProperties: false,
    },
  };
}

function toolActualizarEmpresa(): Anthropic.Tool {
  return {
    name: "actualizar_empresa",
    description: "Actualiza uno o más campos del perfil de la empresa ya creada. Manda solo los campos que cambian.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string", minLength: 2, maxLength: 100 },
        giro: { type: "string", enum: GIROS },
        descripcion: { type: "string", minLength: 20, maxLength: 500 },
        mercadoObjetivo: { type: "string", minLength: 20, maxLength: 500 },
      },
      additionalProperties: false,
    },
  };
}

function toolActualizarBloqueTexto(): Anthropic.Tool {
  return {
    name: "actualizar_bloque_texto",
    description:
      "Reemplaza el contenido de uno de los 3 bloques de texto libre del Lean Canvas (Solución, Propuesta de valor única, Ventaja injusta). Máximo 400 caracteres.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        bloque: { type: "string", enum: [...BLOQUES_TEXTO], description: "Qué bloque se actualiza." },
        texto: { type: "string", maxLength: 400, description: "Contenido nuevo del bloque." },
      },
      required: ["bloque", "texto"],
      additionalProperties: false,
    },
  };
}

function toolActualizarBloqueLista(): Anthropic.Tool {
  return {
    name: "actualizar_bloque_lista",
    description:
      "Reemplaza la lista COMPLETA de uno de los 6 bloques tipo lista del Lean Canvas (Problema, Segmentos de clientes, Métricas clave, Canales, Estructura de costos, Fuentes de ingresos). Esto reemplaza todo el bloque — si ya tenía elementos y quieres conservarlos, inclúyelos de nuevo junto con los nuevos.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        bloque: { type: "string", enum: [...BLOQUES_LISTA], description: "Qué bloque se actualiza." },
        items: {
          type: "array",
          items: { type: "string", maxLength: 100 },
          description: "Lista completa de elementos del bloque (máximo 5, salvo Estructura de costos que admite hasta 8).",
        },
      },
      required: ["bloque", "items"],
      additionalProperties: false,
    },
  };
}

/**
 * Asistente conversacional (Claude API) para el panel de Alexa: ayuda al
 * emprendedor a llenar el perfil de su empresa y el Lean Canvas charlando en
 * vez de por formulario. Reutiliza EmpresasService/CanvasService — mismo
 * proceso, no HTTP — así que ni la validación ni el scoping por usuario se
 * duplican aquí.
 */
@Injectable()
export class AsistenteService {
  private readonly logger = new Logger(AsistenteService.name);
  private readonly anthropic: Anthropic | null;

  constructor(
    config: ConfigService,
    private readonly empresas: EmpresasService,
    private readonly canvas: CanvasService
  ) {
    const apiKey = config.get<string>("ANTHROPIC_API_KEY");
    this.anthropic = apiKey ? new Anthropic({ apiKey }) : null;
  }

  async enviarMensaje(user: AuthUser, dto: MensajeChatDto): Promise<AsistenteRespuesta> {
    if (!this.anthropic) {
      this.logger.warn("ANTHROPIC_API_KEY no configurada — el asistente no puede responder.");
      return {
        respuesta: "El asistente no está configurado todavía — contacta al administrador.",
        empresaId: dto.empresaId ?? null,
        empresa: null,
        camposActualizados: [],
      };
    }

    const empresaActual = dto.empresaId ? await this.empresas.obtener(user, dto.empresaId) : null;

    let respuestaClaude: Anthropic.Message;
    try {
      respuestaClaude = await this.anthropic.messages.create({
        model: "claude-opus-5",
        max_tokens: 1024,
        system: this.construirSystemPrompt(empresaActual),
        messages: dto.historial.map((m) => ({ role: m.rol, content: m.contenido })),
        tools: empresaActual ? [toolActualizarEmpresa(), toolActualizarBloqueTexto(), toolActualizarBloqueLista()] : [toolCrearEmpresa()],
      });
    } catch (err) {
      this.logger.warn(`Anthropic falló: ${err instanceof Error ? err.message : err}`);
      return {
        respuesta: "El asistente está ocupado en este momento — intenta de nuevo en unos segundos.",
        empresaId: dto.empresaId ?? null,
        empresa: null,
        camposActualizados: [],
      };
    }

    const textoClaude = respuestaClaude.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    const usosDeHerramienta = respuestaClaude.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

    let empresaId = dto.empresaId ?? null;
    let empresaFinal = empresaActual;
    const camposActualizados: string[] = [];
    const errores: string[] = [];
    let canvasTocado = false;

    for (const uso of usosDeHerramienta) {
      let resultado: ResultadoEscritura;
      if (uso.name === "crear_empresa" && !empresaId) {
        resultado = await this.crearEmpresa(user, uso.input);
      } else if (uso.name === "actualizar_empresa" && empresaId) {
        resultado = await this.actualizarEmpresa(user, empresaId, uso.input);
      } else if (uso.name === "actualizar_bloque_texto" && empresaId) {
        resultado = await this.actualizarBloqueTexto(user, empresaId, uso.input);
        if (resultado.ok) canvasTocado = true;
      } else if (uso.name === "actualizar_bloque_lista" && empresaId) {
        resultado = await this.actualizarBloqueLista(user, empresaId, uso.input);
        if (resultado.ok) canvasTocado = true;
      } else {
        continue;
      }

      if (!resultado.ok) {
        errores.push(resultado.motivo);
        continue;
      }
      camposActualizados.push(resultado.etiqueta);
      if (resultado.empresa) {
        empresaFinal = resultado.empresa;
        empresaId = resultado.empresa.id;
      }
    }

    // CanvasService.actualizar solo devuelve el canvas, no la empresa completa — si se
    // tocó el canvas hay que releer para que el front reciba todo junto en una respuesta.
    if (empresaId && canvasTocado) {
      empresaFinal = await this.empresas.obtener(user, empresaId);
    }

    const respuesta =
      errores.length > 0 ? `${textoClaude || "Casi lo tengo, pero hubo un problema:"} ${errores.join(" ")}`.trim() : textoClaude || "Listo.";

    return { respuesta, empresaId, empresa: empresaFinal, camposActualizados };
  }

  private async validarDto<T extends object>(cls: new () => T, input: unknown): Promise<{ ok: true; dto: T } | { ok: false; motivo: string }> {
    const dto = plainToInstance(cls, (input ?? {}) as object);
    const erroresValidacion = await validate(dto as object, { whitelist: true });
    if (erroresValidacion.length > 0) {
      const motivo = erroresValidacion.flatMap((e) => Object.values(e.constraints ?? {})).join("; ");
      return { ok: false, motivo: motivo || "Datos inválidos." };
    }
    return { ok: true, dto };
  }

  private async crearEmpresa(user: AuthUser, input: unknown): Promise<ResultadoEscritura> {
    const v = await this.validarDto(CreateEmpresaDto, input);
    if (!v.ok) return v;
    const empresa = await this.empresas.crear(user, v.dto);
    return { ok: true, etiqueta: "Perfil de la empresa", empresa };
  }

  private async actualizarEmpresa(user: AuthUser, empresaId: string, input: unknown): Promise<ResultadoEscritura> {
    const v = await this.validarDto(UpdateEmpresaDto, input);
    if (!v.ok) return v;
    const empresa = await this.empresas.actualizar(user, empresaId, v.dto);
    return { ok: true, etiqueta: "Perfil de la empresa", empresa };
  }

  private async actualizarBloqueTexto(user: AuthUser, empresaId: string, input: unknown): Promise<ResultadoEscritura> {
    const raw = (input ?? {}) as { bloque?: unknown; texto?: unknown };
    if (typeof raw.bloque !== "string" || !(BLOQUES_TEXTO as readonly string[]).includes(raw.bloque)) {
      return { ok: false, motivo: "El bloque de texto indicado no existe." };
    }
    const bloque = raw.bloque as BloqueTexto;
    const v = await this.validarDto(UpdateCanvasDto, { [bloque]: raw.texto });
    if (!v.ok) return v;
    await this.canvas.actualizar(user, empresaId, v.dto);
    return { ok: true, etiqueta: BLOQUE_LABELS[bloque] };
  }

  private async actualizarBloqueLista(user: AuthUser, empresaId: string, input: unknown): Promise<ResultadoEscritura> {
    const raw = (input ?? {}) as { bloque?: unknown; items?: unknown };
    if (typeof raw.bloque !== "string" || !(BLOQUES_LISTA as readonly string[]).includes(raw.bloque)) {
      return { ok: false, motivo: "El bloque de lista indicado no existe." };
    }
    const bloque = raw.bloque as BloqueLista;
    if (Array.isArray(raw.items) && raw.items.length > MAX_ITEMS_POR_BLOQUE[bloque]) {
      return { ok: false, motivo: `"${BLOQUE_LABELS[bloque]}" admite hasta ${MAX_ITEMS_POR_BLOQUE[bloque]} elementos.` };
    }
    const v = await this.validarDto(UpdateCanvasDto, { [bloque]: raw.items });
    if (!v.ok) return v;
    await this.canvas.actualizar(user, empresaId, v.dto);
    return { ok: true, etiqueta: BLOQUE_LABELS[bloque] };
  }

  private construirSystemPrompt(empresa: EmpresaConDetalle | null): string {
    const girosDisponibles = GIROS.map((g) => `${g} (${GIRO_LABELS[g as keyof typeof GIRO_LABELS]})`).join(", ");

    const estadoEmpresa = empresa
      ? [
          `- nombre: ${empresa.nombre}`,
          `- giro: ${empresa.giro}`,
          `- descripcion: ${empresa.descripcion}`,
          `- mercadoObjetivo: ${empresa.mercadoObjetivo}`,
        ].join("\n")
      : "Todavía no se ha creado la empresa — falta nombre, giro, descripción y mercado objetivo.";

    const canvas = empresa?.canvas;
    const estadoCanvas = empresa
      ? [...BLOQUES_TEXTO, ...BLOQUES_LISTA]
          .map((bloque) => {
            const valor = canvas ? (canvas as unknown as Record<string, string | string[]>)[bloque] : undefined;
            const vacio = !valor || (Array.isArray(valor) ? valor.length === 0 : valor.trim().length === 0);
            const contenido = Array.isArray(valor) ? valor.join(" | ") : valor;
            return `- ${BLOQUE_LABELS[bloque]} (${bloque}): ${vacio ? "(vacío)" : contenido}`;
          })
          .join("\n")
      : "El Lean Canvas todavía no existe (se crea junto con la empresa, vacío).";

    return `
Eres el asistente de LeanStart, una plataforma para validar ideas de negocio con el método Lean Canvas. Ayudas a un emprendedor, en español, a llenar el perfil de su empresa y los 9 bloques de su Lean Canvas conversando de forma natural — no le hagas llenar un formulario, pregúntale y redacta tú los textos a partir de lo que te cuenta.

Estado actual de la empresa:
${estadoEmpresa}

Estado actual del Lean Canvas:
${estadoCanvas}

Giros válidos: ${girosDisponibles}

Reglas importantes:
- SIEMPRE incluye una respuesta de texto breve junto a cualquier herramienta que uses, confirmando qué guardaste o preguntando lo siguiente que falta.
- "crear_empresa" solo se puede llamar una vez que tengas los 4 campos (nombre, giro, descripción de al menos 20 caracteres, mercado objetivo de al menos 20 caracteres) — si te falta alguno, sigue preguntando en vez de inventar contenido.
- "actualizar_bloque_lista" REEMPLAZA la lista completa del bloque. Si el usuario quiere agregar un elemento a una lista que ya tiene contenido (ver "Estado actual del Lean Canvas" arriba), manda también los elementos que ya había, no solo el nuevo.
- Respeta los límites: bloques de texto libre (Solución, Propuesta de valor, Ventaja injusta) hasta 400 caracteres; listas hasta 5 elementos, salvo Estructura de costos que admite hasta 8; cada elemento de lista hasta 100 caracteres.
- No inventes datos que el usuario no te dio — pregunta antes de llenar un campo con una suposición.
- No hay una herramienta para el código de vinculación con Alexa — eso lo maneja otra parte de la pantalla; si te preguntan por eso, dile al usuario que use el botón "Generar código" que está en esta misma página.
`.trim();
  }
}
