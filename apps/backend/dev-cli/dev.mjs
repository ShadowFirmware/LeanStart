#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import figlet from "figlet";

// El CLI vive en dev-cli/, y el resto del backend (services/*, api-gateway/) está
// una carpeta arriba — es decir, en la raíz de apps/backend.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// api-gateway es el único punto público: no se puede desactivar.
const REQUIRED = "api-gateway";

const SERVICES = {
  "api-gateway": {
    label: "api-gateway — único punto de entrada (:4000)",
    dir: "api-gateway",
    command: "pnpm",
    args: ["start:dev"],
    color: "magenta",
    required: true,
  },
  "auth-service": {
    label: "auth-service — usuarios, login y privilegios (:4001)",
    dir: "services/auth-service",
    command: "pnpm",
    args: ["start:dev"],
    color: "cyan",
    prisma: true,
    studioPort: 5555,
  },
  "empresas-service": {
    label: "empresas-service — empresas, canvas, productos, hipótesis (:4002)",
    dir: "services/empresas-service",
    command: "pnpm",
    args: ["start:dev"],
    color: "green",
    prisma: true,
    studioPort: 5556,
  },
  "evaluaciones-service": {
    label: "evaluaciones-service — criterios, viabilidad, evaluaciones (:4003)",
    dir: "services/evaluaciones-service",
    command: "pnpm",
    args: ["start:dev"],
    color: "yellow",
    prisma: true,
    studioPort: 5557,
  },
  "notificaciones-service": {
    label: "notificaciones-service — bandeja de notificaciones (:4004)",
    dir: "services/notificaciones-service",
    command: "pnpm",
    args: ["start:dev"],
    color: "blue",
    prisma: true,
    studioPort: 5558,
  },
};

const children = [];

function banner() {
  let art;
  try {
    art = figlet.textSync("LEANSTART", { font: "ANSI Shadow" });
  } catch {
    art = "LEANSTART";
  }
  console.log(chalk.magenta(art));
  console.log(chalk.bold("  Panel de arranque del backend (microservicios)\n"));
}

function paintFor(color) {
  return chalk[color] ?? chalk.white;
}

// Antepone [servicio] a cada línea de log del proceso hijo.
function prefixChunk(prefix, chunk) {
  return chunk
    .toString()
    .split("\n")
    .map((line, i, arr) => (i === arr.length - 1 && line === "" ? "" : `${prefix} ${line}`))
    .filter((l) => l !== "")
    .join("\n")
    .concat("\n");
}

function launchService(key) {
  const s = SERVICES[key];
  const paint = paintFor(s.color);
  const prefix = paint(`[${key}]`);
  const child = spawn(s.command, s.args, { cwd: join(ROOT, s.dir), shell: false });
  child.stdout.on("data", (d) => process.stdout.write(prefixChunk(prefix, d)));
  child.stderr.on("data", (d) => process.stderr.write(prefixChunk(prefix, d)));
  child.on("exit", (code) => console.log(`${prefix} ${chalk.red(`proceso terminado (code ${code})`)}`));
  child.on("error", (err) => console.log(`${prefix} ${chalk.red(err.message)}`));
  children.push(child);
  console.log(`${prefix} ${chalk.green("iniciado")}`);
}

function shutdown() {
  console.log(chalk.yellow("\nApagando servicios..."));
  for (const child of children) {
    if (!child.killed) child.kill("SIGINT");
  }
  setTimeout(() => process.exit(0), 500);
}

async function main() {
  banner();

  const dry = process.argv.includes("--dry");

  // Opción obligatoria: se muestra marcada y deshabilitada (no se puede tocar).
  const requiredChoice = {
    name: `${SERVICES[REQUIRED].label} ${chalk.yellow("[obligatorio]")}`,
    value: REQUIRED,
    checked: true,
    disabled: chalk.dim("siempre activo"),
  };

  const optionalChoices = Object.entries(SERVICES)
    .filter(([key]) => key !== REQUIRED)
    .map(([key, s]) => ({ name: s.label, value: key, checked: true }));

  let selected;
  let studios;

  if (dry) {
    selected = Object.keys(SERVICES);
    studios = [];
  } else {
    selected = await checkbox({
      message: "Servicios a levantar (espacio = marcar, enter = confirmar):",
      choices: [requiredChoice, ...optionalChoices],
    });

    const conPrisma = Object.entries(SERVICES).filter(([, s]) => s.prisma);
    studios = await checkbox({
      message: "¿Abrir Prisma Studio de algún servicio? (cada uno en su propio puerto)",
      choices: conPrisma.map(([key, s]) => ({ name: `${key} (puerto ${s.studioPort})`, value: key, checked: false })),
    });
  }

  // api-gateway SIEMPRE se levanta, elija lo que elija el usuario.
  const toStart = Array.from(new Set([...selected, REQUIRED]));

  console.log(chalk.bold("\nPlan de arranque:"));
  for (const key of toStart) {
    const exists = existsSync(join(ROOT, SERVICES[key].dir));
    const mark = exists ? chalk.green("✓") : chalk.red("✗ (carpeta no existe)");
    const req = SERVICES[key].required ? chalk.yellow(" [obligatorio]") : "";
    console.log(`  ${mark} ${key}${req}`);
  }
  for (const key of studios) {
    console.log(`  ${chalk.green("✓")} Prisma Studio: ${key} (puerto ${SERVICES[key].studioPort})`);
  }

  if (dry) {
    console.log(chalk.gray("\n(--dry) No se lanza nada. Solo se muestra el plan."));
    return;
  }

  // 1) Postgres y Redis corren nativos en Windows (sin Docker) — solo lo recordamos.
  console.log(chalk.gray("  → Postgres y Redis deben estar corriendo como servicios nativos de Windows."));

  // 2) Levantar cada servicio seleccionado.
  console.log("");
  for (const key of toStart) {
    if (!existsSync(join(ROOT, SERVICES[key].dir))) {
      console.log(chalk.red(`  ✗ ${key}: no existe la carpeta "${SERVICES[key].dir}", se omite.`));
      continue;
    }
    launchService(key);
  }

  // 3) Prisma Studio de los servicios elegidos, cada uno en su propio puerto.
  for (const key of studios) {
    const s = SERVICES[key];
    if (!existsSync(join(ROOT, s.dir))) continue;
    const prefix = paintFor(s.color)(`[prisma-studio:${key}]`);
    const child = spawn("pnpm", ["exec", "prisma", "studio", "--port", String(s.studioPort)], {
      cwd: join(ROOT, s.dir),
      shell: false,
    });
    child.stdout.on("data", (d) => process.stdout.write(prefixChunk(prefix, d)));
    child.stderr.on("data", (d) => process.stderr.write(prefixChunk(prefix, d)));
    children.push(child);
    console.log(`${prefix} ${chalk.green(`iniciado en http://localhost:${s.studioPort}`)}`);
  }

  if (children.length === 0) {
    console.log(chalk.yellow("\nNo se levantó ningún servicio."));
    return;
  }

  console.log(chalk.gray("\nPresiona Ctrl+C para apagar todo.\n"));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  // Cancelar con Ctrl+C durante los prompts lanza un ExitPromptError.
  if (err?.name === "ExitPromptError") {
    console.log(chalk.gray("\nCancelado."));
    process.exit(0);
  }
  console.error(chalk.red(err));
  process.exit(1);
});
