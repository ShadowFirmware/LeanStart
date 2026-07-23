/**
 * Backfill de un solo uso: rellena nivelNombre/nivelColor en empresas que ya
 * fueron evaluadas (tienen scoreFinal) ANTES de que ese campo existiera.
 * Las evaluaciones nuevas ya lo guardan solas en el saga de finalizar
 * (evaluaciones.service.ts); esto es solo para el historial previo.
 *
 * Requiere en el entorno (mismo .env de evaluaciones-service):
 *   DATABASE_URL             — para leer los niveles de viabilidad configurados
 *   EMPRESAS_SERVICE_URL     — para listar/actualizar las empresas pendientes
 *   INTERNAL_KEY             — igual que en los 5 proyectos del backend
 *
 * Uso: pnpm --filter @leanstart/evaluaciones-service backfill:nivel
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from ".prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const EMPRESAS_SERVICE_URL = process.env.EMPRESAS_SERVICE_URL;
const INTERNAL_KEY = process.env.INTERNAL_KEY;

interface NivelRow {
  nombre: string;
  hasta: number;
  color: string;
  orden: number;
}

interface EmpresaPendiente {
  id: string;
  scoreFinal: number;
}

function nivelPorScore(niveles: NivelRow[], score: number): NivelRow | null {
  const ordenados = [...niveles].sort((a, b) => a.orden - b.orden);
  return ordenados.find((n) => score <= n.hasta) ?? ordenados[ordenados.length - 1] ?? null;
}

async function main() {
  if (!EMPRESAS_SERVICE_URL) throw new Error("Falta EMPRESAS_SERVICE_URL en el entorno.");
  if (!INTERNAL_KEY) throw new Error("Falta INTERNAL_KEY en el entorno.");

  const niveles = await prisma.nivelViabilidad.findMany();
  if (niveles.length === 0) {
    console.log("No hay niveles de viabilidad configurados — nada que rellenar.");
    return;
  }

  const pendientesRes = await fetch(`${EMPRESAS_SERVICE_URL}/empresas/pendientes-nivel-interno`, {
    headers: { "x-internal-key": INTERNAL_KEY },
  });
  if (!pendientesRes.ok) {
    throw new Error(`No se pudo listar empresas pendientes (${pendientesRes.status}): ${await pendientesRes.text()}`);
  }
  const pendientes = (await pendientesRes.json()) as EmpresaPendiente[];

  console.log(`${pendientes.length} empresa(s) evaluada(s) sin nivel congelado.`);

  for (const empresa of pendientes) {
    const nivel = nivelPorScore(niveles, empresa.scoreFinal);
    if (!nivel) {
      console.log(`  - ${empresa.id}: sin nivel calculable, se omite.`);
      continue;
    }

    const res = await fetch(`${EMPRESAS_SERVICE_URL}/empresas/${empresa.id}/nivel-interno`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-internal-key": INTERNAL_KEY },
      body: JSON.stringify({ nivelNombre: nivel.nombre, nivelColor: nivel.color }),
    });
    if (!res.ok) {
      console.error(`  - ${empresa.id}: error al actualizar (${res.status}): ${await res.text()}`);
      continue;
    }
    console.log(`  - ${empresa.id}: nivel "${nivel.nombre}" (score ${empresa.scoreFinal}).`);
  }

  console.log("Backfill completo.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
