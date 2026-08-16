-- CreateTable
CREATE TABLE "canvas_versiones" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "problema" TEXT[],
    "solucion" TEXT NOT NULL DEFAULT '',
    "pvp" TEXT NOT NULL DEFAULT '',
    "ventajaInjusta" TEXT NOT NULL DEFAULT '',
    "segmentosClientes" TEXT[],
    "metricasClave" TEXT[],
    "canales" TEXT[],
    "estructuraCostos" TEXT[],
    "fuentesIngresos" TEXT[],
    "canvasBloques" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canvas_versiones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "canvas_versiones_empresaId_createdAt_idx" ON "canvas_versiones"("empresaId", "createdAt");

-- AddForeignKey
ALTER TABLE "canvas_versiones" ADD CONSTRAINT "canvas_versiones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
