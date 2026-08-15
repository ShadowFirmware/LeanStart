-- CreateTable
CREATE TABLE "usuario_privilegios" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "otorgado" BOOLEAN NOT NULL,

    CONSTRAINT "usuario_privilegios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_privilegios_userId_modulo_accion_key" ON "usuario_privilegios"("userId", "modulo", "accion");

-- AddForeignKey
ALTER TABLE "usuario_privilegios" ADD CONSTRAINT "usuario_privilegios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
