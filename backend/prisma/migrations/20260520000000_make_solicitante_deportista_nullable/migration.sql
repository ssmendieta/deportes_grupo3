-- AlterTable: make solicitante_id and deportista_id nullable
ALTER TABLE "Reserva" ALTER COLUMN "solicitante_id" DROP NOT NULL;
ALTER TABLE "Reserva" ALTER COLUMN "solicitante_id" DROP DEFAULT;
ALTER TABLE "Reserva" ALTER COLUMN "deportista_id" DROP NOT NULL;
ALTER TABLE "Reserva" ALTER COLUMN "deportista_id" DROP DEFAULT;
