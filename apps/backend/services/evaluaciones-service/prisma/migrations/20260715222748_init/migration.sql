-- CreateTable
CREATE TABLE "criterios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "peso" INTEGER NOT NULL,

    CONSTRAINT "criterios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_viabilidad" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "pesoEvaluacion" INTEGER NOT NULL DEFAULT 80,
    "umbralPublicacion" INTEGER NOT NULL DEFAULT 70,

    CONSTRAINT "config_viabilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "niveles_viabilidad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "hasta" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "niveles_viabilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "criteriosJson" JSONB NOT NULL DEFAULT '{}',
    "comentariosCriteriosJson" JSONB NOT NULL DEFAULT '{}',
    "comentarioEvaluador" TEXT NOT NULL DEFAULT '',
    "finalizada" BOOLEAN NOT NULL DEFAULT false,
    "scoreFinal" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes_generados" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "empresaNombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "generadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportes_generados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evaluaciones_empresaId_key" ON "evaluaciones"("empresaId");
