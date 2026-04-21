import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Iniciando Seed del Grupo 3: Gestión de Reservas...");

  // 1. LIMPIEZA DE TABLAS (En orden para no romper restricciones de FK)
  await prisma.horarioDisponible.deleteMany({});
  await prisma.reserva.deleteMany({});
  await prisma.espacio.deleteMany({});

  // 2. CREACIÓN DE ESPACIOS (Los requeridos en el Sprint 1)
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
      horario_apertura: "06:00",
      horario_cierre: "18:00",
      activo: true,
    },
  });

  console.log("✅ Espacios creados: Coliseo y Cancha de Arquitectura");

  // 3. PLANTILLA DE HORARIOS DISPONIBLES (Para el calendario dinámico)
  // Crearemos bloques de 2 horas para el Coliseo (Lunes a Viernes)
  const diasSemana = [1, 2, 3, 4, 5]; // Lunes a Viernes

  for (const dia of diasSemana) {
    await prisma.horarioDisponible.createMany({
      data: [
        {
          espacio_id: coliseo.id,
          dia_semana: dia,
          hora_inicio: "08:00",
          hora_fin: "10:00",
          disponible: true,
        },
        {
          espacio_id: coliseo.id,
          dia_semana: dia,
          hora_inicio: "10:00",
          hora_fin: "12:00",
          disponible: true,
        },
        {
          espacio_id: coliseo.id,
          dia_semana: dia,
          hora_inicio: "14:00",
          hora_fin: "16:00",
          disponible: true,
        },
        {
          espacio_id: canchaArquitectura.id,
          dia_semana: dia,
          hora_inicio: "07:00",
          hora_fin: "09:00",
          disponible: true,
        },
        {
          espacio_id: canchaArquitectura.id,
          dia_semana: dia,
          hora_inicio: "09:00",
          hora_fin: "11:00",
          disponible: true,
        },
      ],
    });
  }

  console.log("✅ Plantilla de horarios semanales generada");

  // 4. RESERVAS DE PRUEBA (Para ver el calendario con datos ocupados)
  const hoy = new Date();

  await prisma.reserva.createMany({
    data: [
      {
        espacio_id: coliseo.id,
        solicitante_id: 101, // ID ficticio (vendrá del G1)
        deportista_id: 501, // ID ficticio
        fecha: hoy,
        hora_inicio: "08:00",
        hora_fin: "10:00",
        disciplina_id: 1, // Basquetbol
        motivo: "Entrenamiento Selección Universitaria",
        estado: "confirmada",
        comprobante_pdf: "comprobante_reserva_001.pdf",
      },
      {
        espacio_id: canchaArquitectura.id,
        solicitante_id: 102,
        deportista_id: 502,
        fecha: hoy,
        hora_inicio: "07:00",
        hora_fin: "09:00",
        disciplina_id: 2, // Futbol Sala
        motivo: "Torneo Interfacultades",
        estado: "pendiente",
        comprobante_pdf: null,
      },
    ],
  });

  console.log("✅ Reservas de prueba creadas exitosamente");
  console.log("--- SEED FINALIZADO ---");
}

main()
  .then(() => {
    console.log("✅ Seed completado con éxito");
  })
  .catch((e) => {
    console.error("❌ Error en el seed:");
    console.error(e);
    // Quitamos el process.exit(1) para que no de error de tipos
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
