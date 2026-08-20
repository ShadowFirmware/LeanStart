-- CreateTable
CREATE TABLE "reportes_soporte" (
    "id" TEXT NOT NULL,
    "autorUserId" TEXT NOT NULL,
    "autorNombre" TEXT NOT NULL,
    "autorCorreo" TEXT NOT NULL,
    "autorRoles" TEXT[],
    "asunto" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "navegador" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'nuevo',
    "avisadoEn" TIMESTAMP(3),
    "atendidoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportes_soporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reportes_soporte_estado_createdAt_idx" ON "reportes_soporte"("estado", "createdAt");

-- AlterTable
ALTER TABLE "correos_entrantes" ADD COLUMN     "cuerpo" TEXT,
ADD COLUMN     "reporteId" TEXT;

-- CreateIndex
CREATE INDEX "correos_entrantes_reporteId_idx" ON "correos_entrantes"("reporteId");

-- AddForeignKey
ALTER TABLE "correos_entrantes" ADD CONSTRAINT "correos_entrantes_reporteId_fkey" FOREIGN KEY ("reporteId") REFERENCES "reportes_soporte"("id") ON DELETE SET NULL ON UPDATE CASCADE;
