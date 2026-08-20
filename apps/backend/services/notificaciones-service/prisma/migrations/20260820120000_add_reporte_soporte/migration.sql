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
    "atendidoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportes_soporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reportes_soporte_estado_createdAt_idx" ON "reportes_soporte"("estado", "createdAt");
