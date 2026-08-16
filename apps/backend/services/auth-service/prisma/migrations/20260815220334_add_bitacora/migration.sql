-- CreateTable
CREATE TABLE "bitacora" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidadTipo" TEXT,
    "entidadId" TEXT,
    "entidadDescripcion" TEXT,
    "detalle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bitacora_actorUserId_idx" ON "bitacora"("actorUserId");

-- CreateIndex
CREATE INDEX "bitacora_servicio_accion_idx" ON "bitacora"("servicio", "accion");

-- CreateIndex
CREATE INDEX "bitacora_createdAt_idx" ON "bitacora"("createdAt");

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
