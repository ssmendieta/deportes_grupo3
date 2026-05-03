-- CreateTable
CREATE TABLE "Espacio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "horario_apertura" TEXT NOT NULL,
    "horario_cierre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Espacio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" SERIAL NOT NULL,
    "espacio_id" INTEGER NOT NULL,
    "solicitante_id" INTEGER NOT NULL DEFAULT 0,
    "deportista_id" INTEGER NOT NULL DEFAULT 0,
    "nombre_solicitante" TEXT NOT NULL,
    "carnet" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "disciplina_id" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'confirmada',
    "comprobante_pdf" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HorarioDisponible" (
    "id" SERIAL NOT NULL,
    "espacio_id" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HorarioDisponible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disciplina" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Disciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deportista" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "ci" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3),
    "genero" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "carrera" TEXT,
    "semestre" INTEGER,
    "matricula_activa" BOOLEAN NOT NULL DEFAULT false,
    "ultima_validacion_matricula" TIMESTAMP(3),
    "talla_camiseta" TEXT,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deportista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscripcion" (
    "id" SERIAL NOT NULL,
    "deportista_id" INTEGER NOT NULL,
    "disciplina_id" INTEGER NOT NULL,
    "categoria" TEXT,
    "nivel" TEXT,
    "fecha_inscripcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_baja" TIMESTAMP(3),
    "motivo_baja" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptoPago" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "periodicidad" TEXT,
    "disciplina_id" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ConceptoPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "deportista_id" INTEGER NOT NULL,
    "concepto_id" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "mes" INTEGER,
    "anio" INTEGER,
    "fecha_pago" TIMESTAMP(3) NOT NULL,
    "comprobante" TEXT,
    "origen" TEXT NOT NULL DEFAULT 'manual',
    "estado" TEXT NOT NULL DEFAULT 'confirmado',
    "observaciones" TEXT,
    "registrado_por" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanillaPagosAcademia" (
    "id" SERIAL NOT NULL,
    "deportista_id" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "matricula_pagada" BOOLEAN NOT NULL DEFAULT false,
    "mes_1_pagado" BOOLEAN NOT NULL DEFAULT false,
    "mes_2_pagado" BOOLEAN NOT NULL DEFAULT false,
    "mes_3_pagado" BOOLEAN NOT NULL DEFAULT false,
    "mes_4_pagado" BOOLEAN NOT NULL DEFAULT false,
    "mes_5_pagado" BOOLEAN NOT NULL DEFAULT false,
    "mes_6_pagado" BOOLEAN NOT NULL DEFAULT false,
    "mes_7_pagado" BOOLEAN NOT NULL DEFAULT false,
    "mes_8_pagado" BOOLEAN NOT NULL DEFAULT false,
    "mes_9_pagado" BOOLEAN NOT NULL DEFAULT false,
    "total_pagado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldo_pendiente" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanillaPagosAcademia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Disciplina_nombre_key" ON "Disciplina"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Deportista_ci_key" ON "Deportista"("ci");

-- CreateIndex
CREATE UNIQUE INDEX "Inscripcion_deportista_id_disciplina_id_categoria_estado_key" ON "Inscripcion"("deportista_id", "disciplina_id", "categoria", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "PlanillaPagosAcademia_deportista_id_anio_key" ON "PlanillaPagosAcademia"("deportista_id", "anio");

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_espacio_id_fkey" FOREIGN KEY ("espacio_id") REFERENCES "Espacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HorarioDisponible" ADD CONSTRAINT "HorarioDisponible_espacio_id_fkey" FOREIGN KEY ("espacio_id") REFERENCES "Espacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_deportista_id_fkey" FOREIGN KEY ("deportista_id") REFERENCES "Deportista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptoPago" ADD CONSTRAINT "ConceptoPago_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "Disciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_deportista_id_fkey" FOREIGN KEY ("deportista_id") REFERENCES "Deportista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_concepto_id_fkey" FOREIGN KEY ("concepto_id") REFERENCES "ConceptoPago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanillaPagosAcademia" ADD CONSTRAINT "PlanillaPagosAcademia_deportista_id_fkey" FOREIGN KEY ("deportista_id") REFERENCES "Deportista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
