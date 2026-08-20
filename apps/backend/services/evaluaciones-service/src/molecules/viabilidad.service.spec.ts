import { ViabilidadService } from "./viabilidad.service";

interface FakeNivel {
  id: string;
  nombre: string;
  hasta: number;
  color: string;
  orden: number;
}

/**
 * Prisma real con $transaction([...]) ejecuta cada llamada apenas se evalúa la
 * expresión (antes de que $transaction reciba el arreglo) y solo agrupa el commit;
 * esta fake replica ese orden de efectos para poder probar el algoritmo de
 * reordenamiento/inserción de viabilidad.service.ts sin una base de datos real.
 */
function makeFakePrisma(nivelesIniciales: FakeNivel[]) {
  let niveles = nivelesIniciales.map((n) => ({ ...n }));

  const nivelViabilidad = {
    findMany: jest.fn(async () => [...niveles].sort((a, b) => a.orden - b.orden)),
    update: jest.fn(async ({ where, data }: { where: { id: string }; data: Partial<FakeNivel> }) => {
      const nivel = niveles.find((n) => n.id === where.id);
      if (!nivel) throw new Error(`nivel ${where.id} no existe`);
      Object.assign(nivel, data);
      return { ...nivel };
    }),
    create: jest.fn(async ({ data }: { data: Omit<FakeNivel, "id"> }) => {
      const nuevo = { id: `nivel-${niveles.length + 1}`, ...data };
      niveles.push(nuevo);
      return { ...nuevo };
    }),
    delete: jest.fn(async ({ where }: { where: { id: string } }) => {
      niveles = niveles.filter((n) => n.id !== where.id);
      return { ok: true };
    }),
  };

  const configViabilidad = {
    upsert: jest.fn(async () => ({ id: "singleton", pesoEvaluacion: 50, umbralPublicacion: 60 })),
  };

  return {
    nivelViabilidad,
    configViabilidad,
    $transaction: jest.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

describe("ViabilidadService", () => {
  describe("reordenarNivel", () => {
    it("preserva el ancho de cada tramo al mover un nivel a otra posición", async () => {
      // Tramos: [0-20] [21-50] [51-100] — anchos 21, 30, 50
      const prisma = makeFakePrisma([
        { id: "a", nombre: "Bajo", hasta: 20, color: "#EF4444", orden: 0 },
        { id: "b", nombre: "Medio", hasta: 50, color: "#F59E0B", orden: 1 },
        { id: "c", nombre: "Alto", hasta: 100, color: "#10B981", orden: 2 },
      ]);
      const service = new ViabilidadService(prisma as never);

      // Mover el primero ("a", ancho 21) a la última posición → queda b, c, a.
      const resultado = await service.reordenarNivel(0, 2);

      expect(resultado.map((n) => n.id)).toEqual(["b", "c", "a"]);
      // "b" ahora empieza en 0: conserva su ancho de 30 → termina en 29.
      expect(resultado.find((n) => n.id === "b")!.hasta).toBe(29);
      // "c" le sigue, ancho 50, arranca en 30 → termina en 79.
      expect(resultado.find((n) => n.id === "c")!.hasta).toBe(79);
      // El último tramo siempre cierra en 100, sin importar el ancho acumulado.
      expect(resultado.find((n) => n.id === "a")!.hasta).toBe(100);
    });

    it("no hace nada si el origen y el destino son la misma posición", async () => {
      const prisma = makeFakePrisma([
        { id: "a", nombre: "Bajo", hasta: 50, color: "#EF4444", orden: 0 },
        { id: "b", nombre: "Alto", hasta: 100, color: "#10B981", orden: 1 },
      ]);
      const service = new ViabilidadService(prisma as never);

      await service.reordenarNivel(1, 1);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("ignora índices fuera de rango", async () => {
      const prisma = makeFakePrisma([
        { id: "a", nombre: "Bajo", hasta: 100, color: "#EF4444", orden: 0 },
      ]);
      const service = new ViabilidadService(prisma as never);

      await service.reordenarNivel(0, 5);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("agregarNivel", () => {
    it("inserta un nivel nuevo en la posición que le corresponde según su `hasta`", async () => {
      const prisma = makeFakePrisma([
        { id: "a", nombre: "Bajo", hasta: 50, color: "#EF4444", orden: 0 },
        { id: "b", nombre: "Alto", hasta: 100, color: "#10B981", orden: 1 },
      ]);
      const service = new ViabilidadService(prisma as never);

      const resultado = await service.agregarNivel({ nombre: "Medio", hasta: 75 });

      expect(resultado.creado).toBe(true);
      const nombres = resultado.niveles.map((n) => n.nombre);
      expect(nombres).toEqual(["Bajo", "Medio", "Alto"]);
    });

    it("no inserta si el tramo elegido ya está ocupado (sin espacio para el límite)", async () => {
      const prisma = makeFakePrisma([
        { id: "a", nombre: "Bajo", hasta: 50, color: "#EF4444", orden: 0 },
        { id: "b", nombre: "Alto", hasta: 100, color: "#10B981", orden: 1 },
      ]);
      const service = new ViabilidadService(prisma as never);

      const resultado = await service.agregarNivel({ hasta: 50 });

      expect(resultado.creado).toBe(false);
      expect(resultado.niveles).toHaveLength(2);
    });
  });

  describe("eliminarNivel", () => {
    it("conserva siempre al menos un nivel y el último sigue cerrando en 100", async () => {
      const prisma = makeFakePrisma([
        { id: "a", nombre: "Bajo", hasta: 40, color: "#EF4444", orden: 0 },
        { id: "b", nombre: "Medio", hasta: 70, color: "#F59E0B", orden: 1 },
        { id: "c", nombre: "Alto", hasta: 100, color: "#10B981", orden: 2 },
      ]);
      const service = new ViabilidadService(prisma as never);

      const resultado = await service.eliminarNivel("c");

      expect(resultado.map((n) => n.id)).toEqual(["a", "b"]);
      expect(resultado.find((n) => n.id === "b")!.hasta).toBe(100);
    });

    it("no elimina el último nivel restante", async () => {
      const prisma = makeFakePrisma([
        { id: "a", nombre: "Único", hasta: 100, color: "#EF4444", orden: 0 },
      ]);
      const service = new ViabilidadService(prisma as never);

      const resultado = await service.eliminarNivel("a");

      expect(resultado).toHaveLength(1);
    });
  });
});
