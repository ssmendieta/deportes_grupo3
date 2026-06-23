-- CreateIndex
CREATE INDEX "auditoria_tabla_fecha_auditoria_idx" ON "auditoria"("tabla", "fecha_auditoria");

-- CreateIndex
CREATE INDEX "auditoria_id_usuario_idx" ON "auditoria"("id_usuario");

-- CreateIndex
CREATE INDEX "auditoria_accion_idx" ON "auditoria"("accion");
