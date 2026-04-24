import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Iniciando Seed del Grupo 3: Gestión de Reservas...");

  // 1. LIMPIEZA DE TABLAS
  await prisma.horarioDisponible.deleteMany({});
  await prisma.reserva.deleteMany({});
  await prisma.disciplina.deleteMany({});
  await prisma.espacio.deleteMany({});

  // 2. CREACIÓN DE ESPACIOS
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
      ubicacion: "Facultad de Arquitectura - Exterior",
      capacidad: 12,
      horario_apertura: "14:00",
      horario_cierre: "18:00",
      activo: true,
    },
  });

  console.log("✅ Espacios creados");

  // 3. DISCIPLINAS
  await prisma.disciplina.createMany({
    data: [
      { nombre: "Fútsal", descripcion: "Fútbol sala", activo: true, orden: 1 },
      {
        nombre: "Básquetbol",
        descripcion: "Baloncesto",
        activo: true,
        orden: 2,
      },
      { nombre: "Voleibol", descripcion: "Vóleibol", activo: true, orden: 3 },
      { nombre: "Ajedrez", descripcion: "Ajedrez", activo: true, orden: 4 },
    ],
  });

  console.log("✅ Disciplinas creadas");

  // 4. HORARIOS BLOQUEADOS POR CLASES
  // TODO: Reemplazar con horarios reales cuando Don Víctor los confirme
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

  console.log("✅ Horarios de clases creados");

  // 5. RESERVAS DE PRUEBA
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Obtener ids de disciplinas
  const futsal = await prisma.disciplina.findFirst({
    where: { nombre: "Fútsal" },
  });
  const basquet = await prisma.disciplina.findFirst({
    where: { nombre: "Básquetbol" },
  });

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
        disciplina_id: futsal!.id,
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
        disciplina_id: basquet!.id,
        motivo: "Entrenamiento Básquetbol",
        estado: "confirmada",
        comprobante_pdf: null,
      },
    ],
  });

  console.log("✅ Reservas de prueba creadas");
  console.log("--- SEED FINALIZADO ---");
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
