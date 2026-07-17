import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from ".prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CRITERIOS_DEFAULT = [
  { nombre: "Problema y solución", descripcion: "Claridad del problema identificado y qué tan bien la solución propuesta lo resuelve.", peso: 25 },
  { nombre: "Propuesta de valor", descripcion: "Qué tan diferenciada y atractiva es la propuesta de valor frente a alternativas del mercado.", peso: 25 },
  { nombre: "Modelo de negocio y viabilidad financiera", descripcion: "Coherencia entre fuentes de ingreso, estructura de costos y mercado objetivo.", peso: 25 },
  { nombre: "Validación de hipótesis", descripcion: "Calidad de los experimentos diseñados y evidencia recabada para validar supuestos clave.", peso: 25 },
];

const NIVELES_DEFAULT = [
  { nombre: "Baja", hasta: 49, color: "#EF4444", orden: 0 },
  { nombre: "Media", hasta: 74, color: "#F59E0B", orden: 1 },
  { nombre: "Alta", hasta: 100, color: "#10B981", orden: 2 },
];

async function main() {
  const existentes = await prisma.criterio.count();
  if (existentes === 0) {
    await prisma.criterio.createMany({ data: CRITERIOS_DEFAULT });
  }

  const nivelesExistentes = await prisma.nivelViabilidad.count();
  if (nivelesExistentes === 0) {
    await prisma.nivelViabilidad.createMany({ data: NIVELES_DEFAULT });
  }

  await prisma.configViabilidad.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", pesoEvaluacion: 80, umbralPublicacion: 70 },
  });

  console.log("Seed completo: 4 criterios, 3 niveles de viabilidad, config 80/70.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
