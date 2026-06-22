-- Optimizaciones del módulo de pagos:
-- 1. Vista PlanillaPagosAcademia parametrizable por gestión (ya no fuerza el año actual).
-- 2. Índices para acelerar filtros por deportista/año/estado y por mes_correspondiente.

DROP VIEW IF EXISTS "PlanillaPagosAcademia";

CREATE OR REPLACE VIEW "PlanillaPagosAcademia" AS
WITH
monto_conceptos AS (
  SELECT
    id_disciplina,
    MAX(CASE WHEN LOWER(nombre) LIKE '%matrícula%' OR LOWER(nombre) LIKE '%matricula%' THEN monto_actual ELSE 0 END) AS monto_matricula,
    MAX(CASE WHEN LOWER(nombre) LIKE '%mensualidad%' THEN monto_actual ELSE 0 END) AS monto_mensualidad
  FROM conceptos_pago
  WHERE activo = true
  GROUP BY id_disciplina
),
inscritos_con_montos AS (
  SELECT
    i.id_deportista,
    COALESCE(MAX(mc.monto_matricula), 0) AS monto_matricula,
    COALESCE(MAX(mc.monto_mensualidad), 0) AS monto_mensualidad
  FROM inscripciones i
  LEFT JOIN monto_conceptos mc ON mc.id_disciplina = i.id_disciplina
  WHERE i.estado = 'activo'
  GROUP BY i.id_deportista
),
pagos_resumen AS (
  SELECT
    id_deportista_beneficiario AS deportista_id,
    gestion,
    COUNT(*) FILTER (WHERE mes_correspondiente = 0 AND estado_factura = 'Activa') > 0 AS matricula_pagada,
    COUNT(*) FILTER (WHERE mes_correspondiente = 1 AND estado_factura = 'Activa') > 0 AS mes_1_pagado,
    COUNT(*) FILTER (WHERE mes_correspondiente = 2 AND estado_factura = 'Activa') > 0 AS mes_2_pagado,
    COUNT(*) FILTER (WHERE mes_correspondiente = 3 AND estado_factura = 'Activa') > 0 AS mes_3_pagado,
    COUNT(*) FILTER (WHERE mes_correspondiente = 4 AND estado_factura = 'Activa') > 0 AS mes_4_pagado,
    COUNT(*) FILTER (WHERE mes_correspondiente = 5 AND estado_factura = 'Activa') > 0 AS mes_5_pagado,
    COUNT(*) FILTER (WHERE mes_correspondiente = 6 AND estado_factura = 'Activa') > 0 AS mes_6_pagado,
    COUNT(*) FILTER (WHERE mes_correspondiente = 7 AND estado_factura = 'Activa') > 0 AS mes_7_pagado,
    COUNT(*) FILTER (WHERE mes_correspondiente = 8 AND estado_factura = 'Activa') > 0 AS mes_8_pagado,
    COUNT(*) FILTER (WHERE mes_correspondiente = 9 AND estado_factura = 'Activa') > 0 AS mes_9_pagado,
    COALESCE(SUM(monto_pagado) FILTER (WHERE estado_factura = 'Activa'), 0) AS total_pagado
  FROM pagos
  GROUP BY id_deportista_beneficiario, gestion
),
meses_academicos AS (
  SELECT LEAST(GREATEST(EXTRACT(MONTH FROM CURRENT_DATE)::int - 3, 0), 7) AS meses_transcurridos
)
SELECT
  d.id_deportista                               AS deportista_id,
  (p.nombres || ' ' || p.ape_paterno || ' ' || COALESCE(p.ape_materno, '')) AS nombre_completo,
  d.tipo_deportista,
  pr.gestion                                    AS gestion,
  COALESCE(pr.matricula_pagada, false)          AS matricula_pagada,
  COALESCE(pr.mes_1_pagado, false)              AS mes_1_pagado,
  COALESCE(pr.mes_2_pagado, false)              AS mes_2_pagado,
  COALESCE(pr.mes_3_pagado, false)              AS mes_3_pagado,
  COALESCE(pr.mes_4_pagado, false)              AS mes_4_pagado,
  COALESCE(pr.mes_5_pagado, false)              AS mes_5_pagado,
  COALESCE(pr.mes_6_pagado, false)              AS mes_6_pagado,
  COALESCE(pr.mes_7_pagado, false)              AS mes_7_pagado,
  COALESCE(pr.mes_8_pagado, false)              AS mes_8_pagado,
  COALESCE(pr.mes_9_pagado, false)              AS mes_9_pagado,
  COALESCE(pr.total_pagado, 0)                  AS total_pagado,
  CASE
    WHEN d.tipo_deportista = 'exonerado' THEN 0
    ELSE GREATEST(0,
      COALESCE(icm.monto_matricula, 0)
      + COALESCE(icm.monto_mensualidad, 0) * ma.meses_transcurridos
      - COALESCE(pr.total_pagado, 0)
    )
  END                                           AS saldo_pendiente
FROM deportistas d
JOIN personas p ON p.id_persona = d.id_persona
LEFT JOIN inscritos_con_montos icm ON icm.id_deportista = d.id_deportista
LEFT JOIN pagos_resumen pr ON pr.deportista_id = d.id_deportista
CROSS JOIN meses_academicos ma
WHERE pr.deportista_id IS NOT NULL OR d.tipo_deportista = 'exonerado';

CREATE INDEX IF NOT EXISTS "idx_pagos_deportista_gestion_estado"
  ON "pagos" (id_deportista_beneficiario, gestion, estado_factura);

CREATE INDEX IF NOT EXISTS "idx_pagos_mes_correspondiente"
  ON "pagos" (mes_correspondiente);
