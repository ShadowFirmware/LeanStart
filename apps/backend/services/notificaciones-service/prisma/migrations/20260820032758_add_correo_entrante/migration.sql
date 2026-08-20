-- CreateTable
CREATE TABLE "correos_entrantes" (
    "id" TEXT NOT NULL,
    "resendId" TEXT NOT NULL,
    "remitente" TEXT NOT NULL,
    "destinatarios" TEXT[],
    "asunto" TEXT NOT NULL,
    "recibidoEn" TIMESTAMP(3) NOT NULL,
    "procesado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correos_entrantes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "correos_entrantes_resendId_key" ON "correos_entrantes"("resendId");

-- CreateIndex
CREATE INDEX "correos_entrantes_procesado_idx" ON "correos_entrantes"("procesado");
