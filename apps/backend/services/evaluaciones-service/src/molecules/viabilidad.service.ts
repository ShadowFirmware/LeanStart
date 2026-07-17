import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { EditarNivelDto } from "../atoms/viabilidad.dto";

const PALETA_NIVELES = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#9A62FA", "#EC4899", "#14B8A6", "#F97316"];
const CONFIG_ID = "singleton";

interface NivelRow {
  id: string;
  nombre: string;
  hasta: number;
  color: string;
  orden: number;
}

/**
 * Puerto de apps/frontend/administrador-front/src/store/viabilidad.ts. La única
 * diferencia con el store de Zustand es que aquí el "orden" del arreglo se
 * persiste explícitamente en la columna `orden`, en vez de vivir implícito en
 * la posición dentro de un array en memoria.
 */
@Injectable()
export class ViabilidadService {
  constructor(private readonly prisma: PrismaService) {}

  private async getConfig() {
    return this.prisma.configViabilidad.upsert({
      where: { id: CONFIG_ID },
      update: {},
      create: { id: CONFIG_ID },
    });
  }

  private niveles() {
    return this.prisma.nivelViabilidad.findMany({ orderBy: { orden: "asc" } });
  }

  async obtenerConfig() {
    const config = await this.getConfig();
    const niveles = await this.niveles();
    return { ...config, niveles };
  }

  async actualizarPesoEvaluacion(peso: number) {
    await this.getConfig();
    const clamped = Math.max(0, Math.min(100, Math.round(peso)));
    return this.prisma.configViabilidad.update({ where: { id: CONFIG_ID }, data: { pesoEvaluacion: clamped } });
  }

  async actualizarUmbralPublicacion(umbral: number) {
    await this.getConfig();
    const clamped = Math.max(0, Math.min(100, Math.round(umbral)));
    return this.prisma.configViabilidad.update({ where: { id: CONFIG_ID }, data: { umbralPublicacion: clamped } });
  }

  async actualizarHastaNivel(id: string, hasta: number) {
    const niveles = await this.niveles();
    const i = niveles.findIndex((n) => n.id === id);
    if (i === -1 || i === niveles.length - 1) return niveles;

    const lower = i === 0 ? 0 : niveles[i - 1].hasta;
    const upper = niveles[i + 1].hasta;
    const clamped = Math.max(lower + 1, Math.min(upper - 1, Math.round(hasta)));

    await this.prisma.nivelViabilidad.update({ where: { id }, data: { hasta: clamped } });
    return this.niveles();
  }

  async editarNivel(id: string, dto: EditarNivelDto) {
    await this.prisma.nivelViabilidad.update({ where: { id }, data: dto });
    return this.niveles();
  }

  async agregarNivel() {
    const niveles = await this.niveles();
    const lower = niveles.length >= 2 ? niveles[niveles.length - 2].hasta : 0;
    const upper = niveles[niveles.length - 1]?.hasta ?? 100;
    if (upper - lower < 2) return { creado: false, niveles };

    const mid = lower + Math.floor((upper - lower) / 2);
    const posicion = Math.max(niveles.length - 1, 0);

    await this.prisma.$transaction([
      // Corre el "orden" de todo lo que queda a partir de la posición de inserción.
      ...niveles.slice(posicion).map((n, idx) =>
        this.prisma.nivelViabilidad.update({ where: { id: n.id }, data: { orden: posicion + idx + 1 } })
      ),
      this.prisma.nivelViabilidad.create({
        data: {
          nombre: "Nuevo nivel",
          hasta: mid,
          color: PALETA_NIVELES[niveles.length % PALETA_NIVELES.length],
          orden: posicion,
        },
      }),
    ]);

    return { creado: true, niveles: await this.niveles() };
  }

  async eliminarNivel(id: string) {
    const niveles = await this.niveles();
    if (niveles.length <= 1) return niveles;

    const restantes = niveles.filter((n) => n.id !== id);
    const ultimo = restantes[restantes.length - 1];

    await this.prisma.$transaction([
      this.prisma.nivelViabilidad.delete({ where: { id } }),
      this.prisma.nivelViabilidad.update({ where: { id: ultimo.id }, data: { hasta: 100 } }),
      ...restantes.map((n, idx) =>
        this.prisma.nivelViabilidad.update({ where: { id: n.id }, data: { orden: idx } })
      ),
    ]);

    return this.niveles();
  }

  async reordenarNivel(desde: number, hasta: number) {
    const niveles = await this.niveles();
    if (
      desde === hasta ||
      desde < 0 ||
      hasta < 0 ||
      desde >= niveles.length ||
      hasta >= niveles.length
    ) {
      return niveles;
    }

    const anchos = niveles.map((n: NivelRow, i: number) => {
      const min = i === 0 ? 0 : niveles[i - 1].hasta + 1;
      return n.hasta - min + 1;
    });

    const nivelesReordenados = [...niveles];
    const anchosReordenados = [...anchos];
    const [nivelMovido] = nivelesReordenados.splice(desde, 1);
    const [anchoMovido] = anchosReordenados.splice(desde, 1);
    nivelesReordenados.splice(hasta, 0, nivelMovido);
    anchosReordenados.splice(hasta, 0, anchoMovido);

    let acumulado = 0;
    const actualizaciones = nivelesReordenados.map((n, i) => {
      acumulado += anchosReordenados[i];
      const esUltimo = i === nivelesReordenados.length - 1;
      const nuevoHasta = esUltimo ? 100 : acumulado - 1;
      return this.prisma.nivelViabilidad.update({ where: { id: n.id }, data: { orden: i, hasta: nuevoHasta } });
    });

    await this.prisma.$transaction(actualizaciones);
    return this.niveles();
  }
}
