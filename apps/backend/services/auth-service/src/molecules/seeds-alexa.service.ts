import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService, type AuthResponse } from "./auth.service";

const SEED_TTL_MS = 15 * 60 * 1000;
const SEED_TOKEN_EXPIRES_IN = "2h";

type ValidarSemillaResultado =
  | { valid: true; auth: AuthResponse }
  | { valid: false; reason: "USER_NOT_FOUND" | "SEED_MISMATCH" | "SEED_ALREADY_USED" | "SEED_EXPIRED" | "UNKNOWN" };

function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase();
}

function generarCodigoDeCuatroDigitos(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

@Injectable()
export class SeedsAlexaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService
  ) {}

  async generar(userId: string, nombre: string): Promise<{ seed: string; expiraEn: string }> {
    const seed = generarCodigoDeCuatroDigitos();
    const expiraAt = new Date(Date.now() + SEED_TTL_MS);

    await this.prisma.semillaAlexa.create({
      data: { userId, nombre: normalizarNombre(nombre), seed, expiraAt },
    });

    return { seed, expiraEn: expiraAt.toISOString() };
  }

  async validar(nombre: string, seed: string): Promise<ValidarSemillaResultado> {
    // La más reciente por nombre: cada "Generar nueva semilla" agrega una fila
    // nueva sin borrar la anterior, así que la última es la única vigente.
    const semilla = await this.prisma.semillaAlexa.findFirst({
      where: { nombre: normalizarNombre(nombre) },
      orderBy: { generatedAt: "desc" },
      include: { user: true },
    });

    if (!semilla) {
      return { valid: false, reason: "USER_NOT_FOUND" };
    }
    if (semilla.seed !== seed) {
      return { valid: false, reason: "SEED_MISMATCH" };
    }
    if (semilla.usadaAt) {
      return { valid: false, reason: "SEED_ALREADY_USED" };
    }
    if (semilla.expiraAt.getTime() < Date.now()) {
      return { valid: false, reason: "SEED_EXPIRED" };
    }

    await this.prisma.semillaAlexa.update({
      where: { id: semilla.id },
      data: { usadaAt: new Date() },
    });

    const auth = await this.auth.buildAuthResponse(semilla.user, { expiresIn: SEED_TOKEN_EXPIRES_IN });
    return { valid: true, auth };
  }
}
