-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "giro" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "mercadoObjetivo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "logoUrl" TEXT,
    "ownerId" TEXT NOT NULL,
    "mentorId" TEXT,
    "evaluadorId" TEXT,
    "canvasBloques" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canvas" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canvas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "caracteristicas" TEXT,
    "precio" DOUBLE PRECISION,
    "imagenes" TEXT[],
    "modalidadPrecio" TEXT,
    "precioMin" DOUBLE PRECISION,
    "precioMax" DOUBLE PRECISION,
    "precioPeriodo" DOUBLE PRECISION,
    "unidadTiempo" TEXT,
    "precioPersonalizado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hipotesis" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fase" INTEGER NOT NULL DEFAULT 1,
    "estado" TEXT NOT NULL DEFAULT 'pendiente_validacion',
    "experimento" JSONB,
    "resultados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hipotesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observaciones" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipoElemento" TEXT NOT NULL,
    "elementoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "autorNombre" TEXT NOT NULL,
    "comentario" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "canvas_empresaId_key" ON "canvas"("empresaId");

-- AddForeignKey
ALTER TABLE "canvas" ADD CONSTRAINT "canvas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hipotesis" ADD CONSTRAINT "hipotesis_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observaciones" ADD CONSTRAINT "observaciones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
