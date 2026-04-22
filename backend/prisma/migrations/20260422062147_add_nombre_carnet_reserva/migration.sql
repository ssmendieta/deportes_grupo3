/*
  Warnings:

  - Added the required column `carnet` to the `Reserva` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre_solicitante` to the `Reserva` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN     "carnet" TEXT NOT NULL,
ADD COLUMN     "nombre_solicitante" TEXT NOT NULL,
ALTER COLUMN "solicitante_id" SET DEFAULT 0,
ALTER COLUMN "deportista_id" SET DEFAULT 0;
