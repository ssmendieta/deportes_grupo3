import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Iniciando Seed del Grupo 3: Gestión de Reservas...");

  // ─────────────────────────────────────────────────────────────
  // LIMPIEZA DE TABLAS
  // ─────────────────────────────────────────────────────────────

  await prisma.planillaPagosAcademia.deleteMany({});
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
  // DISCIPLINAS
  // ─────────────────────────────────────────────────────────────

  const futsalDisciplina = await prisma.disciplina.create({
    data: {
      nombre: "Fútsal",
      descripcion: "Fútbol sala",
      activo: true,
      orden: 1,
    },
  });

  const basquetDisciplina = await prisma.disciplina.create({
    data: {
      nombre: "Básquetbol",
      descripcion: "Baloncesto",
      activo: true,
      orden: 2,
    },
  });

  const voleyDisciplina = await prisma.disciplina.create({
    data: {
      nombre: "Voleibol",
      descripcion: "Vóleibol",
      activo: true,
      orden: 3,
    },
  });

  const ajedrezDisciplina = await prisma.disciplina.create({
    data: {
      nombre: "Ajedrez",
      descripcion: "Ajedrez",
      activo: true,
      orden: 4,
    },
  });

  console.log("✅ Disciplinas creadas");

  // ─────────────────────────────────────────────────────────────
  // HORARIOS BLOQUEADOS
  // ─────────────────────────────────────────────────────────────

  const diasSemana = [1, 2, 3, 4, 5];

  const clasesColiseo = [
    { hora_inicio: "08:00", hora_fin: "10:00" },
    { hora_inicio: "10:00", hora_fin: "12:00" },
    { hora_inicio: "12:00", hora_fin: "14:00" },
  ];

  const clasesCancha = [{ hora_inicio: "07:00", hora_fin: "14:00" }];

  for (const dia of diasSemana) {
    for (const clase of clasesColiseo) {
      await prisma.horarioDisponible.create({
        data: {
          espacio_id: coliseo.id,
          dia_semana: dia,
          hora_inicio: clase.hora_inicio,
          hora_fin: clase.hora_fin,
          disponible: false,
        },
      });
    }

    for (const clase of clasesCancha) {
      await prisma.horarioDisponible.create({
        data: {
          espacio_id: canchaArquitectura.id,
          dia_semana: dia,
          hora_inicio: clase.hora_inicio,
          hora_fin: clase.hora_fin,
          disponible: false,
        },
      });
    }
  }

  console.log("✅ Horarios creados");

  // ─────────────────────────────────────────────────────────────
  // RESERVAS DE PRUEBA
  // ─────────────────────────────────────────────────────────────

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  await prisma.reserva.createMany({
    data: [
      {
        espacio_id: coliseo.id,
        solicitante_id: 0,
        deportista_id: 0,
        nombre_solicitante: "Juan Pérez",
        carnet: "202012345",
        fecha: hoy,
        hora_inicio: "14:00",
        hora_fin: "16:00",
        disciplina_id: futsalDisciplina.id,
        motivo: "Entrenamiento Fútsal Menores",
        estado: "confirmada",
        comprobante_pdf: null,
      },
      {
        espacio_id: canchaArquitectura.id,
        solicitante_id: 0,
        deportista_id: 0,
        nombre_solicitante: "María García",
        carnet: "202054321",
        fecha: hoy,
        hora_inicio: "15:00",
        hora_fin: "17:00",
        disciplina_id: basquetDisciplina.id,
        motivo: "Entrenamiento Básquetbol",
        estado: "confirmada",
        comprobante_pdf: null,
      },
    ],
  });

  console.log("✅ Reservas creadas");

  // ─────────────────────────────────────────────────────────────
  // CONCEPTOS DE PAGO
  // ─────────────────────────────────────────────────────────────

  await prisma.conceptoPago.createMany({
    data: [
      {
        nombre: "Matrícula Fútsal",
        monto: 150,
        periodicidad: "única",
        disciplina_id: futsalDisciplina.id,
      },
      {
        nombre: "Mensualidad Fútsal",
        monto: 120,
        periodicidad: "mensual",
        disciplina_id: futsalDisciplina.id,
      },

      {
        nombre: "Matrícula Básquetbol",
        monto: 150,
        periodicidad: "única",
        disciplina_id: basquetDisciplina.id,
      },
      {
        nombre: "Mensualidad Básquetbol",
        monto: 120,
        periodicidad: "mensual",
        disciplina_id: basquetDisciplina.id,
      },

      {
        nombre: "Matrícula Voleibol",
        monto: 150,
        periodicidad: "única",
        disciplina_id: voleyDisciplina.id,
      },
      {
        nombre: "Mensualidad Voleibol",
        monto: 120,
        periodicidad: "mensual",
        disciplina_id: voleyDisciplina.id,
      },

      {
        nombre: "Matrícula Ajedrez",
        monto: 100,
        periodicidad: "única",
        disciplina_id: ajedrezDisciplina.id,
      },
      {
        nombre: "Mensualidad Ajedrez",
        monto: 80,
        periodicidad: "mensual",
        disciplina_id: ajedrezDisciplina.id,
      },
    ],
  });

  console.log("✅ Conceptos de pago creados");

  // ─────────────────────────────────────────────────────────────
  // DEPORTISTAS
  // ─────────────────────────────────────────────────────────────

  const carlos = await prisma.deportista.upsert({
    where: { ci: "12345678" },
    update: {},
    create: {
      tipo: "estudiante_ucb",
      ci: "12345678",
      nombre_completo: "Carlos Mamani Quispe",
      genero: "M",
      telefono: "70012345",
      email: "carlos.mamani@ucb.edu.bo",
      carrera: "Ingeniería de Sistemas",
      semestre: 5,
      matricula_activa: true,
      talla_camiseta: "M",
    },
  });

  const ana = await prisma.deportista.upsert({
    where: { ci: "23456789" },
    update: {},
    create: {
      tipo: "estudiante_ucb",
      ci: "23456789",
      nombre_completo: "Ana Flores Condori",
      genero: "F",
      telefono: "70023456",
      email: "ana.flores@ucb.edu.bo",
      carrera: "Administración de Empresas",
      semestre: 3,
      matricula_activa: true,
      talla_camiseta: "S",
    },
  });

  const pedro = await prisma.deportista.upsert({
    where: { ci: "34567890" },
    update: {},
    create: {
      tipo: "estudiante_ucb",
      ci: "34567890",
      nombre_completo: "Pedro Ticona Huanca",
      genero: "M",
      telefono: "70034567",
      email: "pedro.ticona@ucb.edu.bo",
      carrera: "Derecho",
      semestre: 7,
      matricula_activa: true,
      talla_camiseta: "L",
    },
  });

  const miguel = await prisma.deportista.upsert({
    where: { ci: "56789012" },
    update: {},
    create: {
      tipo: "externo",
      ci: "56789012",
      nombre_completo: "Miguel Vargas López",
      genero: "M",
      telefono: "70056789",
      email: "miguel.vargas@gmail.com",
      talla_camiseta: "XL",
    },
  });

  const sofia = await prisma.deportista.upsert({
    where: { ci: "67890123" },
    update: {},
    create: {
      tipo: "externo",
      ci: "67890123",
      nombre_completo: "Sofía Rojas Pereira",
      genero: "F",
      telefono: "70067890",
      email: "sofia.rojas@gmail.com",
      talla_camiseta: "M",
    },
  });

  console.log("✅ Deportistas creados");

  // ─────────────────────────────────────────────────────────────
  // INSCRIPCIONES
  // ─────────────────────────────────────────────────────────────

  await prisma.inscripcion.createMany({
    data: [
      {
        deportista_id: carlos.id,
        disciplina_id: voleyDisciplina.id,
        categoria: "academias",
        nivel: "avanzado",
        estado: "activo",
      },
      {
        deportista_id: ana.id,
        disciplina_id: voleyDisciplina.id,
        categoria: "academias",
        nivel: "intermedio",
        estado: "activo",
      },
      {
        deportista_id: pedro.id,
        disciplina_id: futsalDisciplina.id,
        categoria: "academias",
        nivel: "intermedio",
        estado: "activo",
      },
      {
        deportista_id: miguel.id,
        disciplina_id: basquetDisciplina.id,
        categoria: "academias",
        nivel: "principiante",
        estado: "activo",
      },
      {
        deportista_id: sofia.id,
        disciplina_id: ajedrezDisciplina.id,
        categoria: "academias",
        nivel: "principiante",
        estado: "activo",
      },
    ],
  });

  console.log("✅ Inscripciones creadas");

  // ─────────────────────────────────────────────────────────────
  // PLANILLAS
  // ─────────────────────────────────────────────────────────────

  const anio = new Date().getFullYear();

  await prisma.planillaPagosAcademia.createMany({
    data: [
      {
        deportista_id: carlos.id,
        anio,
        matricula_pagada: true,
        mes_1_pagado: true,
        mes_2_pagado: true,
        total_pagado: 390,
        saldo_pendiente: 840,
      },
      {
        deportista_id: ana.id,
        anio,
        matricula_pagada: true,
        mes_1_pagado: true,
        mes_2_pagado: true,
        mes_3_pagado: true,
        total_pagado: 510,
        saldo_pendiente: 720,
      },
      {
        deportista_id: miguel.id,
        anio,
        matricula_pagada: true,
        total_pagado: 150,
        saldo_pendiente: 1080,
      },
    ],
  });

  console.log("✅ Planillas creadas");

  console.log("🎉 Seed completado correctamente");
}

main()
  .then(() => {
    console.log("✅ Seed completado con éxito");
  })
  .catch((e) => {
    console.error("❌ Error en el seed:");
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
