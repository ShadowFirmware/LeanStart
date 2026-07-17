import { BadRequestException, Injectable } from "@nestjs/common";
import type { EstadoEmpresa } from "@leanstart/backend-commons";

/**
 * Máquina de estados server-side de EstadoEmpresa. En el front (solo-Zustand) cada
 * botón llamaba `actualizarEmpresa({estado})` sin validar el estado anterior; aquí
 * se valida la transición para que ningún cliente pueda saltarse el flujo real.
 */
const TRANSICIONES: Record<EstadoEmpresa, EstadoEmpresa[]> = {
  borrador: ["pendiente_mentoria"],
  pendiente_mentoria: ["en_mentoria"],
  en_mentoria: ["observaciones_pendientes", "pendiente_evaluacion"],
  observaciones_pendientes: ["observaciones_atendidas"],
  observaciones_atendidas: ["observaciones_pendientes", "pendiente_evaluacion"],
  pendiente_evaluacion: ["en_evaluacion"],
  en_evaluacion: ["publicado", "devuelto"],
  publicado: [],
  devuelto: ["pendiente_mentoria"],
};

@Injectable()
export class EstadoEmpresaService {
  validarTransicion(actual: EstadoEmpresa, siguiente: EstadoEmpresa): void {
    if (actual === siguiente) return;
    const permitidos = TRANSICIONES[actual] ?? [];
    if (!permitidos.includes(siguiente)) {
      throw new BadRequestException(
        `No se puede pasar de "${actual}" a "${siguiente}". Transiciones válidas desde "${actual}": ${permitidos.join(", ") || "ninguna"}.`
      );
    }
  }
}
