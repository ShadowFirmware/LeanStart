-- CreateTable
CREATE TABLE "reportes_empresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "autorNombre" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportes_empresa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reportes_empresa" ADD CONSTRAINT "reportes_empresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
