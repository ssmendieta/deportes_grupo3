ALTER TABLE "reservas" ADD COLUMN "id_solicitante" INTEGER;

ALTER TABLE "reservas"
ADD CONSTRAINT "reservas_personas_solicitante"
FOREIGN KEY ("id_solicitante") REFERENCES "personas"("id_persona")
ON UPDATE NO ACTION
ON DELETE NO ACTION;
