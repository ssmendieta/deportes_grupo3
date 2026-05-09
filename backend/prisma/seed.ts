import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Iniciando Seed...");

  // ─────────────────────────────────────────────────────────────
  // LIMPIEZA
  // ─────────────────────────────────────────────────────────────
  await prisma.planillaPagosAcademia.deleteMany({});
  await prisma.pago.deleteMany({});
  await prisma.inscripcion.deleteMany({});
  await prisma.deportista.deleteMany({});
  await prisma.conceptoPago.deleteMany({});
  await prisma.horarioDisponible.deleteMany({});
  await prisma.reserva.deleteMany({});
  await prisma.disciplina.deleteMany({});
  await prisma.espacio.deleteMany({});

  // ─────────────────────────────────────────────────────────────
  // ESPACIOS
  // ─────────────────────────────────────────────────────────────
  const coliseo = await prisma.espacio.create({
    data: {
      nombre: "Coliseo UCB",
      ubicacion: "Bloque A",
      capacidad: 150,
      horario_apertura: "07:00",
      horario_cierre: "22:00",
      activo: true,
    },
  });

  const canchaArquitectura = await prisma.espacio.create({
    data: {
      nombre: "Cancha de Arquitectura",
      ubicacion: "Facultad de Arquitectura",
      capacidad: 12,
      horario_apertura: "14:00",
      horario_cierre: "18:00",
      activo: true,
    },
  });

  console.log("✅ Espacios creados");

  // ─────────────────────────────────────────────────────────────
  // DISCIPLINAS (solo las 4 originales)
  // ─────────────────────────────────────────────────────────────
  const futsal = await prisma.disciplina.create({
    data: {
      nombre: "Fútsal",
      descripcion: "Fútbol sala",
      categorias: "Mayores, Sub-17",
      mensualidad: 120,
      activo: true,
      orden: 1,
    },
  });
  const basquet = await prisma.disciplina.create({
    data: {
      nombre: "Básquetbol",
      descripcion: "Baloncesto",
      categorias: "Mayores, Sub-17",
      mensualidad: 120,
      activo: true,
      orden: 2,
    },
  });
  const voley = await prisma.disciplina.create({
    data: {
      nombre: "Voleibol",
      descripcion: "Vóleibol",
      categorias: "Mayores, Sub-17",
      mensualidad: 120,
      activo: true,
      orden: 3,
    },
  });
  const ajedrez = await prisma.disciplina.create({
    data: {
      nombre: "Ajedrez",
      descripcion: "Ajedrez",
      categorias: "Mayores, Sub-17",
      mensualidad: 80,
      activo: true,
      orden: 4,
    },
  });

  console.log("✅ Disciplinas creadas");

  // ─────────────────────────────────────────────────────────────
  // HORARIOS
  // ─────────────────────────────────────────────────────────────
  const diasSemana = [1, 2, 3, 4, 5];
  for (const dia of diasSemana) {
    for (const clase of [
      { hora_inicio: "08:00", hora_fin: "10:00" },
      { hora_inicio: "10:00", hora_fin: "12:00" },
      { hora_inicio: "12:00", hora_fin: "14:00" },
    ]) {
      await prisma.horarioDisponible.create({
        data: {
          espacio_id: coliseo.id,
          dia_semana: dia,
          ...clase,
          disponible: false,
        },
      });
    }
    await prisma.horarioDisponible.create({
      data: {
        espacio_id: canchaArquitectura.id,
        dia_semana: dia,
        hora_inicio: "07:00",
        hora_fin: "14:00",
        disponible: false,
      },
    });
  }

  console.log("✅ Horarios creados");

  // ─────────────────────────────────────────────────────────────
  // RESERVAS
  // ─────────────────────────────────────────────────────────────
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  await prisma.reserva.createMany({
    data: [
      {
        espacio_id: coliseo.id,
        nombre_solicitante: "Juan Pérez",
        carnet: "202012345",
        fecha: hoy,
        hora_inicio: "14:00",
        hora_fin: "16:00",
        disciplina_id: futsal.id,
        motivo: "Entrenamiento Fútsal",
        estado: "confirmada",
      },
      {
        espacio_id: canchaArquitectura.id,
        nombre_solicitante: "María García",
        carnet: "202054321",
        fecha: hoy,
        hora_inicio: "15:00",
        hora_fin: "17:00",
        disciplina_id: basquet.id,
        motivo: "Entrenamiento Básquetbol",
        estado: "confirmada",
      },
    ],
  });

  console.log("✅ Reservas creadas");

  // ─────────────────────────────────────────────────────────────
  // CONCEPTOS DE PAGO (solo academia paga)
  // ─────────────────────────────────────────────────────────────
  const conceptos = await prisma.conceptoPago.createManyAndReturn({
    data: [
      {
        nombre: "Matrícula Fútsal",
        monto: 150,
        periodicidad: "única",
        disciplina_id: futsal.id,
      },
      {
        nombre: "Mensualidad Fútsal",
        monto: 120,
        periodicidad: "mensual",
        disciplina_id: futsal.id,
      },
      {
        nombre: "Matrícula Básquetbol",
        monto: 150,
        periodicidad: "única",
        disciplina_id: basquet.id,
      },
      {
        nombre: "Mensualidad Básquetbol",
        monto: 120,
        periodicidad: "mensual",
        disciplina_id: basquet.id,
      },
      {
        nombre: "Matrícula Voleibol",
        monto: 150,
        periodicidad: "única",
        disciplina_id: voley.id,
      },
      {
        nombre: "Mensualidad Voleibol",
        monto: 120,
        periodicidad: "mensual",
        disciplina_id: voley.id,
      },
      {
        nombre: "Matrícula Ajedrez",
        monto: 100,
        periodicidad: "única",
        disciplina_id: ajedrez.id,
      },
      {
        nombre: "Mensualidad Ajedrez",
        monto: 80,
        periodicidad: "mensual",
        disciplina_id: ajedrez.id,
      },
    ],
  });

  const concepto = (nombre: string) =>
    conceptos.find((c) => c.nombre === nombre)!;
  const fechaPago = (mes: number, dia: number) =>
    new Date(
      `${new Date().getFullYear()}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}T12:00:00.000Z`,
    );
  const anio = new Date().getFullYear();

  console.log("✅ Conceptos de pago creados");

  // ─────────────────────────────────────────────────────────────
  // DEPORTISTAS
  // ─────────────────────────────────────────────────────────────

  // ── ACADEMIA (externos, no tienen carrera/semestre) ──────────

  // AL DÍA — pagó matrícula + mar + abr + may
  const martin = await prisma.deportista.create({
    data: {
      tipo: "academia",
      ci: "10011001",
      nombre_completo: "Martín Quispe Flores",
      genero: "M",
      telefono: "70011001",
      email: "martin.quispe@gmail.com",
      talla_camiseta: "M",
      activo: true,
    },
  });

  // AL DÍA — pagó adelantado hasta jun
  const valeria = await prisma.deportista.create({
    data: {
      tipo: "academia",
      ci: "10022002",
      nombre_completo: "Valeria Romero Choque",
      genero: "F",
      telefono: "70022002",
      email: "valeria.romero@gmail.com",
      talla_camiseta: "S",
      activo: true,
    },
  });

  // PENDIENTE — pagó mar + abr, falta may
  const rodrigo = await prisma.deportista.create({
    data: {
      tipo: "academia",
      ci: "10033003",
      nombre_completo: "Rodrigo Salinas Vega",
      genero: "M",
      telefono: "70033003",
      email: "rodrigo.salinas@gmail.com",
      talla_camiseta: "L",
      activo: true,
    },
  });

  // PENDIENTE — solo pagó matrícula, ningún mes aún
  const camila = await prisma.deportista.create({
    data: {
      tipo: "academia",
      ci: "10044004",
      nombre_completo: "Camila Torrez Medina",
      genero: "F",
      telefono: "70044004",
      email: "camila.torrez@gmail.com",
      talla_camiseta: "M",
      activo: true,
    },
  });

  // MOROSO — pagó matrícula + mar, debe abr + may (2 meses)
  const nelson = await prisma.deportista.create({
    data: {
      tipo: "academia",
      ci: "10055005",
      nombre_completo: "Nelson Condori Apaza",
      genero: "M",
      telefono: "70055005",
      email: "nelson.condori@gmail.com",
      talla_camiseta: "XL",
      activo: true,
    },
  });

  // MOROSO — solo matrícula, debe mar + abr + may (3 meses)
  const patricia = await prisma.deportista.create({
    data: {
      tipo: "academia",
      ci: "10066006",
      nombre_completo: "Patricia Mamani Roque",
      genero: "F",
      telefono: "70066006",
      email: "patricia.mamani@gmail.com",
      talla_camiseta: "S",
      activo: true,
    },
  });

  // SIN PLANILLA — nunca pagó nada
  const diego = await prisma.deportista.create({
    data: {
      tipo: "academia",
      ci: "10077007",
      nombre_completo: "Diego Villca Huanca",
      genero: "M",
      telefono: "70077007",
      email: "diego.villca@gmail.com",
      talla_camiseta: "M",
      activo: true,
    },
  });

  // ── ESTUDIANTES UCB (tienen carrera y semestre, no pagan) ────

  const lucia = await prisma.deportista.create({
    data: {
      tipo: "estudiante_ucb",
      ci: "20011001",
      nombre_completo: "Lucía Fernández Vargas",
      genero: "F",
      telefono: "70111001",
      email: "lucia.fernandez@ucb.edu.bo",
      carrera: "Medicina",
      semestre: 3,
      matricula_activa: true,
      talla_camiseta: "S",
      activo: true,
    },
  });

  const andres = await prisma.deportista.create({
    data: {
      tipo: "estudiante_ucb",
      ci: "20022002",
      nombre_completo: "Andrés Chávez Lima",
      genero: "M",
      telefono: "70122002",
      email: "andres.chavez@ucb.edu.bo",
      carrera: "Ingeniería de Sistemas",
      semestre: 5,
      matricula_activa: true,
      talla_camiseta: "M",
      activo: true,
    },
  });

  const sofia = await prisma.deportista.create({
    data: {
      tipo: "estudiante_ucb",
      ci: "20033003",
      nombre_completo: "Sofía Rojas Pereira",
      genero: "F",
      telefono: "70133003",
      email: "sofia.rojas@ucb.edu.bo",
      carrera: "Derecho",
      semestre: 7,
      matricula_activa: true,
      talla_camiseta: "S",
      activo: true,
    },
  });

  // ── COMPETITIVOS (sin carrera, no pagan) ─────────────────────

  const miguel = await prisma.deportista.create({
    data: {
      tipo: "competitivo",
      ci: "30011001",
      nombre_completo: "Miguel Vargas López",
      genero: "M",
      telefono: "70211001",
      email: "miguel.vargas@gmail.com",
      talla_camiseta: "XL",
      activo: true,
    },
  });

  const carla = await prisma.deportista.create({
    data: {
      tipo: "competitivo",
      ci: "30022002",
      nombre_completo: "Carla Mendoza Torrico",
      genero: "F",
      telefono: "70222002",
      email: "carla.mendoza@gmail.com",
      talla_camiseta: "M",
      activo: true,
    },
  });

  const roberto = await prisma.deportista.create({
    data: {
      tipo: "competitivo",
      ci: "30033003",
      nombre_completo: "Roberto Ticona Huanca",
      genero: "M",
      telefono: "70233003",
      email: "roberto.ticona@gmail.com",
      talla_camiseta: "L",
      activo: false, // inactivo
    },
  });

  console.log("✅ Deportistas creados");

  // ─────────────────────────────────────────────────────────────
  // INSCRIPCIONES
  // ─────────────────────────────────────────────────────────────
  await prisma.inscripcion.createMany({
    data: [
      // Academia
      {
        deportista_id: martin.id,
        disciplina_id: voley.id,
        categoria: "Mayores",
        nivel: "Avanzado",
        estado: "activo",
      },
      {
        deportista_id: valeria.id,
        disciplina_id: ajedrez.id,
        categoria: "Mayores",
        nivel: "Intermedio",
        estado: "activo",
      },
      {
        deportista_id: rodrigo.id,
        disciplina_id: futsal.id,
        categoria: "Mayores",
        nivel: "Intermedio",
        estado: "activo",
      },
      {
        deportista_id: camila.id,
        disciplina_id: voley.id,
        categoria: "Mayores",
        nivel: "Inicial",
        estado: "activo",
      },
      {
        deportista_id: nelson.id,
        disciplina_id: basquet.id,
        categoria: "Mayores",
        nivel: "Principiante",
        estado: "activo",
      },
      {
        deportista_id: patricia.id,
        disciplina_id: ajedrez.id,
        categoria: "Mayores",
        nivel: "Inicial",
        estado: "activo",
      },
      {
        deportista_id: diego.id,
        disciplina_id: futsal.id,
        categoria: "Mayores",
        nivel: "Inicial",
        estado: "activo",
      },
      // Estudiantes UCB
      {
        deportista_id: lucia.id,
        disciplina_id: basquet.id,
        categoria: "Mayores",
        nivel: "Intermedio",
        estado: "activo",
      },
      {
        deportista_id: andres.id,
        disciplina_id: voley.id,
        categoria: "Mayores",
        nivel: "Avanzado",
        estado: "activo",
      },
      {
        deportista_id: sofia.id,
        disciplina_id: futsal.id,
        categoria: "Mayores",
        nivel: "Principiante",
        estado: "activo",
      },
      // Competitivos
      {
        deportista_id: miguel.id,
        disciplina_id: basquet.id,
        categoria: "Mayores",
        nivel: "Avanzado",
        estado: "activo",
      },
      {
        deportista_id: carla.id,
        disciplina_id: voley.id,
        categoria: "Mayores",
        nivel: "Avanzado",
        estado: "activo",
      },
      {
        deportista_id: roberto.id,
        disciplina_id: futsal.id,
        categoria: "Mayores",
        nivel: "Intermedio",
        estado: "inactivo",
      },
    ],
  });

  console.log("✅ Inscripciones creadas");

  // ─────────────────────────────────────────────────────────────
  // PAGOS Y PLANILLAS (solo academia)
  // Hoy Mayo 2026 → deben estar pagados: mes_1(Mar), mes_2(Abr), mes_3(May)
  // ─────────────────────────────────────────────────────────────

  // ── MARTÍN: AL DÍA — matrícula + mes_1 + mes_2 + mes_3
  await prisma.pago.createMany({
    data: [
      {
        deportista_id: martin.id,
        concepto_id: concepto("Matrícula Voleibol").id,
        monto: 150,
        anio,
        fecha_pago: fechaPago(2, 10),
        origen: "manual",
        estado: "confirmado",
      },
      {
        deportista_id: martin.id,
        concepto_id: concepto("Mensualidad Voleibol").id,
        monto: 120,
        mes: 1,
        anio,
        fecha_pago: fechaPago(3, 5),
        origen: "manual",
        estado: "confirmado",
      },
      {
        deportista_id: martin.id,
        concepto_id: concepto("Mensualidad Voleibol").id,
        monto: 120,
        mes: 2,
        anio,
        fecha_pago: fechaPago(4, 4),
        origen: "manual",
        estado: "confirmado",
      },
      {
        deportista_id: martin.id,
        concepto_id: concepto("Mensualidad Voleibol").id,
        monto: 120,
        mes: 3,
        anio,
        fecha_pago: fechaPago(5, 3),
        origen: "manual",
        estado: "confirmado",
      },
    ],
  });
  await prisma.planillaPagosAcademia.create({
    data: {
      deportista_id: martin.id,
      anio,
      matricula_pagada: true,
      mes_1_pagado: true,
      mes_2_pagado: true,
      mes_3_pagado: true,
      total_pagado: 510,
      saldo_pendiente: 720,
    },
  });

  // ── VALERIA: AL DÍA — pagó adelantado hasta mes_4 (Jun)
  await prisma.pago.createMany({
    data: [
      {
        deportista_id: valeria.id,
        concepto_id: concepto("Matrícula Ajedrez").id,
        monto: 100,
        anio,
        fecha_pago: fechaPago(2, 12),
        origen: "manual",
        estado: "confirmado",
      },
      {
        deportista_id: valeria.id,
        concepto_id: concepto("Mensualidad Ajedrez").id,
        monto: 80,
        mes: 1,
        anio,
        fecha_pago: fechaPago(3, 6),
        origen: "manual",
        estado: "confirmado",
      },
      {
        deportista_id: valeria.id,
        concepto_id: concepto("Mensualidad Ajedrez").id,
        monto: 80,
        mes: 2,
        anio,
        fecha_pago: fechaPago(4, 5),
        origen: "manual",
        estado: "confirmado",
      },
      {
        deportista_id: valeria.id,
        concepto_id: concepto("Mensualidad Ajedrez").id,
        monto: 80,
        mes: 3,
        anio,
        fecha_pago: fechaPago(5, 2),
        origen: "manual",
        estado: "confirmado",
      },
      {
        deportista_id: valeria.id,
        concepto_id: concepto("Mensualidad Ajedrez").id,
        monto: 80,
        mes: 4,
        anio,
        fecha_pago: fechaPago(5, 2),
        origen: "manual",
        estado: "confirmado",
      },
    ],
  });
  await prisma.planillaPagosAcademia.create({
    data: {
      deportista_id: valeria.id,
      anio,
      matricula_pagada: true,
      mes_1_pagado: true,
      mes_2_pagado: true,
      mes_3_pagado: true,
      mes_4_pagado: true,
      total_pagado: 420,
      saldo_pendiente: 400,
    },
  });

  // ── RODRIGO: PENDIENTE — matrícula + mes_1 + mes_2, falta mes_3 (May)
  await prisma.pago.createMany({
    data: [
      {
        deportista_id: rodrigo.id,
        concepto_id: concepto("Matrícula Fútsal").id,
        monto: 150,
        anio,
        fecha_pago: fechaPago(2, 15),
        origen: "manual",
        estado: "confirmado",
      },
      {
        deportista_id: rodrigo.id,
        concepto_id: concepto("Mensualidad Fútsal").id,
        monto: 120,
        mes: 1,
        anio,
        fecha_pago: fechaPago(3, 8),
        origen: "manual",
        estado: "confirmado",
      },
      {
        deportista_id: rodrigo.id,
        concepto_id: concepto("Mensualidad Fútsal").id,
        monto: 120,
        mes: 2,
        anio,
        fecha_pago: fechaPago(4, 7),
        origen: "manual",
        estado: "confirmado",
      },
    ],
  });
  await prisma.planillaPagosAcademia.create({
    data: {
      deportista_id: rodrigo.id,
      anio,
      matricula_pagada: true,
      mes_1_pagado: true,
      mes_2_pagado: true,
      total_pagado: 390,
      saldo_pendiente: 840,
    },
  });

  // ── CAMILA: PENDIENTE — solo matrícula, ningún mes
  await prisma.pago.createMany({
    data: [
      {
        deportista_id: camila.id,
        concepto_id: concepto("Matrícula Voleibol").id,
        monto: 150,
        anio,
        fecha_pago: fechaPago(2, 20),
        origen: "manual",
        estado: "confirmado",
      },
    ],
  });
  await prisma.planillaPagosAcademia.create({
    data: {
      deportista_id: camila.id,
      anio,
      matricula_pagada: true,
      total_pagado: 150,
      saldo_pendiente: 1080,
    },
  });

  // ── NELSON: MOROSO — matrícula + mes_1, debe mes_2 + mes_3 (2 meses)
  await prisma.pago.createMany({
    data: [
      {
        deportista_id: nelson.id,
        concepto_id: concepto("Matrícula Básquetbol").id,
        monto: 150,
        anio,
        fecha_pago: fechaPago(2, 18),
        origen: "manual",
        estado: "confirmado",
      },
      {
        deportista_id: nelson.id,
        concepto_id: concepto("Mensualidad Básquetbol").id,
        monto: 120,
        mes: 1,
        anio,
        fecha_pago: fechaPago(3, 12),
        origen: "manual",
        estado: "confirmado",
      },
      // Pago de abr intentado pero anulado
      {
        deportista_id: nelson.id,
        concepto_id: concepto("Mensualidad Básquetbol").id,
        monto: 120,
        mes: 2,
        anio,
        fecha_pago: fechaPago(4, 10),
        origen: "manual",
        estado: "anulado",
      },
    ],
  });
  await prisma.planillaPagosAcademia.create({
    data: {
      deportista_id: nelson.id,
      anio,
      matricula_pagada: true,
      mes_1_pagado: true,
      total_pagado: 270,
      saldo_pendiente: 960,
    },
  });

  // ── PATRICIA: MOROSO — solo matrícula, debe mes_1 + mes_2 + mes_3 (3 meses)
  await prisma.pago.createMany({
    data: [
      {
        deportista_id: patricia.id,
        concepto_id: concepto("Matrícula Ajedrez").id,
        monto: 100,
        anio,
        fecha_pago: fechaPago(2, 22),
        origen: "manual",
        estado: "confirmado",
      },
    ],
  });
  await prisma.planillaPagosAcademia.create({
    data: {
      deportista_id: patricia.id,
      anio,
      matricula_pagada: true,
      total_pagado: 100,
      saldo_pendiente: 720,
    },
  });

  // ── DIEGO: SIN PLANILLA — nunca pagó nada → pendiente
  // No se crea planilla ni pagos intencionalmente

  console.log("✅ Pagos y planillas creados");

  console.log(`
┌─────────────────────────────────────────────────────────────────┐
│                  RESUMEN DE CASOS DE PRUEBA                     │
├────────────────────────┬──────────────────┬─────────────────────┤
│ Deportista             │ Tipo             │ Estado esperado     │
├────────────────────────┼──────────────────┼─────────────────────┤
│ Martín Quispe          │ Academia         │ AL DÍA              │
│ Valeria Romero         │ Academia         │ AL DÍA (adelantado) │
│ Rodrigo Salinas        │ Academia         │ PENDIENTE (falta May)│
│ Camila Torrez          │ Academia         │ PENDIENTE (solo mat.)│
│ Nelson Condori         │ Academia         │ MOROSO (2 meses)    │
│ Patricia Mamani        │ Academia         │ MOROSO (3 meses)    │
│ Diego Villca           │ Academia         │ PENDIENTE (sin plan.)│
│ Lucía Fernández        │ Estudiante UCB   │ EXONERADO           │
│ Andrés Chávez          │ Estudiante UCB   │ EXONERADO           │
│ Sofía Rojas            │ Estudiante UCB   │ EXONERADO           │
│ Miguel Vargas          │ Competitivo      │ EXONERADO           │
│ Carla Mendoza          │ Competitivo      │ EXONERADO           │
│ Roberto Ticona         │ Competitivo      │ (inactivo)          │
└────────────────────────┴──────────────────┴─────────────────────┘
  `);
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
