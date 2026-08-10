-- CreateTable
CREATE TABLE "semillas_alexa" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraAt" TIMESTAMP(3) NOT NULL,
    "usadaAt" TIMESTAMP(3),

    CONSTRAINT "semillas_alexa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "semillas_alexa_nombre_seed_idx" ON "semillas_alexa"("nombre", "seed");

-- AddForeignKey
ALTER TABLE "semillas_alexa" ADD CONSTRAINT "semillas_alexa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
