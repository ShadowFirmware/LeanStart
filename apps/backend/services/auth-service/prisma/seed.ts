import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from ".prisma/client";
import * as bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PASSWORD_DEMO = "Leanstart123!";

const USUARIOS_DEMO = [
  { id: "demo-admin", nombre: "Admin Demo", correo: "admin@leanstart.dev", rol: "administrador" },
  { id: "demo-emprendedor", nombre: "Emprendedor Demo", correo: "demo@leanstart.dev", rol: "emprendedor" },
  { id: "demo-mentor", nombre: "Mentor Demo", correo: "mentor@leanstart.dev", rol: "mentor" },
  { id: "demo-evaluador", nombre: "Evaluador Demo", correo: "evaluador@leanstart.dev", rol: "evaluador" },
] as const;

// Espeja apps/frontend/administrador-front/src/store/privilegios.ts → PRIVILEGIOS_DEFAULT
const PRIVILEGIOS_DEFAULT: Record<string, Record<string, string[]>> = {
  administrador: {
    usuarios: ["ver", "crear", "editar"],
    empresas: ["ver"],
    productos: ["ver"],
    lean_canvas: ["ver"],
    hipotesis: ["ver"],
    mentorias: ["ver", "editar"],
    evaluaciones: ["ver", "editar"],
    reportes: ["ver", "exportar"],
  },
  emprendedor: {
    empresas: ["ver", "crear", "editar", "eliminar"],
    productos: ["ver", "crear", "editar", "eliminar"],
    lean_canvas: ["ver", "editar"],
    hipotesis: ["ver", "crear", "editar", "eliminar"],
    mentorias: ["ver"],
    evaluaciones: ["ver"],
    reportes: ["ver"],
  },
  mentor: {
    empresas: ["ver"],
    productos: ["ver"],
    lean_canvas: ["ver"],
    hipotesis: ["ver", "editar", "aprobar"],
    mentorias: ["ver", "crear", "editar", "aprobar"],
    reportes: ["ver"],
  },
  evaluador: {
    empresas: ["ver"],
    productos: ["ver"],
    lean_canvas: ["ver"],
    hipotesis: ["ver"],
    evaluaciones: ["ver", "crear", "editar", "aprobar"],
    reportes: ["ver"],
  },
};

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD_DEMO, 10);

  for (const u of USUARIOS_DEMO) {
    await prisma.user.upsert({
      where: { correo: u.correo },
      update: {},
      create: { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol, roles: [u.rol], passwordHash },
    });
  }

  for (const [rolId, modulos] of Object.entries(PRIVILEGIOS_DEFAULT)) {
    for (const [modulo, acciones] of Object.entries(modulos)) {
      for (const accion of acciones) {
        await prisma.privilegio.upsert({
          where: { rolId_modulo_accion: { rolId, modulo, accion } },
          update: {},
          create: { rolId, modulo, accion },
        });
      }
    }
  }

  console.log(`Seed completo. Password demo para los 4 usuarios: ${PASSWORD_DEMO}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
