import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const T = (h: string) => new Date(`1970-01-01T${h}:00.000Z`);
const D = (s: string) => new Date(`${s}T12:00:00.000Z`);

async function main() {
  console.log("Iniciando Seed...");

  // ── Limpieza en orden ──────────────────────────────────
  await prisma.pagos.deleteMany();
  await prisma.reservas.deleteMany();
  await prisma.plantilla_horarios_fijos.deleteMany();
  await prisma.inscripciones.deleteMany();
  await prisma.deportistas_externos.deleteMany();
  await prisma.deportistas_ucb.deleteMany();
  await prisma.deportistas.deleteMany();
  await prisma.usuarios.deleteMany();
  await prisma.personas.deleteMany();
  await prisma.conceptos_pago.deleteMany();
  await prisma.disciplinas.deleteMany();
  await prisma.espacios.deleteMany();
  await prisma.plantilla_horarios_fijos.deleteMany();
  await prisma.tipos_bloqueo.deleteMany();
  await prisma.categorias.deleteMany();
  await prisma.carreras.deleteMany();
  await prisma.roles.deleteMany();

  // ── 1. ROLES ────────────────────────────────────────────
  const rolAdmin = await prisma.roles.create({
    data: { nombre_rol: "admin", descripcion: "Administrador del sistema" },
  });
  const rolEntrenador = await prisma.roles.create({
    data: { nombre_rol: "entrenador", descripcion: "Entrenador de academias deportivas" },
  });
  const rolDelegado = await prisma.roles.create({
    data: { nombre_rol: "delegado", descripcion: "Delegado de carrera" },
  });
  const rolDeportista = await prisma.roles.create({
    data: { nombre_rol: "deportista", descripcion: "Deportista/Jugador" },
  });
  console.log("Roles creados: admin, entrenador, delegado, deportista");

  // ── 2. CARRERAS ─────────────────────────────────────────
  const carrerasData = [
    { nombre: "Medicina", sigla: "MED" },
    { nombre: "Ingeniería de Sistemas", sigla: "SIS" },
    { nombre: "Derecho", sigla: "DER" },
    { nombre: "Arquitectura", sigla: "ARQ" },
    { nombre: "Administración de Empresas", sigla: "ADE" },
  ];
  const carreras = await Promise.all(
    carrerasData.map((c) =>
      prisma.carreras.create({ data: { ...c, activo: true } }),
    ),
  );
  console.log("Carreras creadas");

  // ── 3. CATEGORIAS ───────────────────────────────────────
  const catMayores = await prisma.categorias.create({
    data: { nombre_categoria: "Mayores" },
  });
  const catSub17 = await prisma.categorias.create({
    data: { nombre_categoria: "Sub-17" },
  });
  const catSub15 = await prisma.categorias.create({
    data: { nombre_categoria: "Sub-15" },
  });
  console.log("Categorías creadas");

  // ── 4. TIPOS_BLOQUEO ────────────────────────────────────
  const tbClase = await prisma.tipos_bloqueo.create({
    data: { nombre_bloqueo: "Clase" },
  });
  const tbEntreno = await prisma.tipos_bloqueo.create({
    data: { nombre_bloqueo: "Entrenamiento" },
  });
  console.log("Tipos de bloqueo creados");

  // ── 5. DISCIPLINAS ──────────────────────────────────────
  const futsal = await prisma.disciplinas.create({
    data: { nombre_disciplina: "Futsal", activo: true },
  });
  const basket = await prisma.disciplinas.create({
    data: { nombre_disciplina: "Básquetbol", activo: true },
  });
  const voley = await prisma.disciplinas.create({
    data: { nombre_disciplina: "Voleibol", activo: true },
  });
  const ajedrez = await prisma.disciplinas.create({
    data: { nombre_disciplina: "Ajedrez", activo: true },
  });
  console.log("Disciplinas creadas");

  // ── 6. ESPACIOS ─────────────────────────────────────────
  const coliseo = await prisma.espacios.create({
    data: {
      nombre_espacio: "Coliseo UCB",
      hora_apertura: T("07:00"),
      horario_cierre: T("22:00"),
      activo: true,
    },
  });
  const canchaArq = await prisma.espacios.create({
    data: {
      nombre_espacio: "Cancha de Arquitectura",
      hora_apertura: T("14:00"),
      horario_cierre: T("18:00"),
      activo: true,
    },
  });
  console.log("Espacios creados");

  // ── 7. PLANTILLA_HORARIOS_FIJOS ─────────────────────────
  await prisma.plantilla_horarios_fijos.createMany({
    data: [
      {
        id_espacio: coliseo.id_espacio,
        id_disciplina: futsal.id_disciplina,
        dia_semana: 1,
        hora_inicio: T("08:00"),
        hora_fin: T("09:30"),
        id_tipo_bloqueo: tbClase.id_tipo_bloqueo,
      },
      {
        id_espacio: coliseo.id_espacio,
        id_disciplina: basket.id_disciplina,
        dia_semana: 2,
        hora_inicio: T("10:00"),
        hora_fin: T("11:30"),
        id_tipo_bloqueo: tbClase.id_tipo_bloqueo,
      },
      {
        id_espacio: coliseo.id_espacio,
        id_disciplina: voley.id_disciplina,
        dia_semana: 3,
        hora_inicio: T("14:00"),
        hora_fin: T("15:30"),
        id_tipo_bloqueo: tbEntreno.id_tipo_bloqueo,
      },
      {
        id_espacio: canchaArq.id_espacio,
        id_disciplina: futsal.id_disciplina,
        dia_semana: 4,
        hora_inicio: T("15:00"),
        hora_fin: T("16:30"),
        id_tipo_bloqueo: tbClase.id_tipo_bloqueo,
      },
    ],
  });
  console.log("Plantilla de horarios fijos creada");

  // ── 8. PERSONAS ─────────────────────────────────────────
  const pMartín = await prisma.personas.create({
    data: { nombres: "Martín", ape_paterno: "Quispe", ape_materno: "Flores", ci: 10011001, complemento: null, fecha_nacimiento: D("2001-03-15"), celular: "70011001" },
  });
  const pValeria = await prisma.personas.create({
    data: { nombres: "Valeria", ape_paterno: "Romero", ape_materno: "Choque", ci: 10022002, complemento: null, fecha_nacimiento: D("2002-07-22"), celular: "70022002" },
  });
  const pRodrigo = await prisma.personas.create({
    data: { nombres: "Rodrigo", ape_paterno: "Salinas", ape_materno: "Vega", ci: 10033003, complemento: null, fecha_nacimiento: D("2000-11-10"), celular: "70033003" },
  });
  const pCamila = await prisma.personas.create({
    data: { nombres: "Camila", ape_paterno: "Torrez", ape_materno: "Medina", ci: 10044004, complemento: null, fecha_nacimiento: D("2003-01-05"), celular: "70044004" },
  });
  const pNelson = await prisma.personas.create({
    data: { nombres: "Nelson", ape_paterno: "Condori", ape_materno: "Apaza", ci: 10055005, complemento: null, fecha_nacimiento: D("2001-09-18"), celular: "70055005" },
  });
  const pPatricia = await prisma.personas.create({
    data: { nombres: "Patricia", ape_paterno: "Mamani", ape_materno: "Roque", ci: 10066006, complemento: null, fecha_nacimiento: D("2002-12-30"), celular: "70066006" },
  });
  const pDiego = await prisma.personas.create({
    data: { nombres: "Diego", ape_paterno: "Villca", ape_materno: "Huanca", ci: 10077007, complemento: null, fecha_nacimiento: D("2000-04-14"), celular: "70077007" },
  });
  const pLucía = await prisma.personas.create({
    data: { nombres: "Lucía", ape_paterno: "Fernández", ape_materno: "Vargas", ci: 20011001, complemento: "LP", fecha_nacimiento: D("2001-05-20"), celular: "70111001" },
  });
  const pAndrés = await prisma.personas.create({
    data: { nombres: "Andrés", ape_paterno: "Chávez", ape_materno: "Lima", ci: 20022002, complemento: "LP", fecha_nacimiento: D("2000-08-11"), celular: "70122002" },
  });
  const pSofía = await prisma.personas.create({
    data: { nombres: "Sofía", ape_paterno: "Rojas", ape_materno: "Pereira", ci: 20033003, complemento: "LP", fecha_nacimiento: D("1999-02-28"), celular: "70133003" },
  });
  const pCarlos = await prisma.personas.create({
    data: { nombres: "Carlos", ape_paterno: "Mamani", ape_materno: "Quispe", ci: 30011001, complemento: "SC", fecha_nacimiento: D("1995-06-15"), celular: "70211001" },
  });
  const pAna = await prisma.personas.create({
    data: { nombres: "Ana", ape_paterno: "Guzmán", ape_materno: "Torrez", ci: 30022002, complemento: "CB", fecha_nacimiento: D("1998-09-20"), celular: "70222002" },
  });
  console.log("Personas creadas");

  // ── 9. USUARIOS ─────────────────────────────────────────
  const hash = "$2b$10$dummyhash00000000000000000000000000000000";
  await prisma.usuarios.createMany({
    data: [
      { id_persona: pMartín.id_persona, id_rol: rolAdmin.id_rol, email: "martin.quispe@ucb.edu.bo", hash_password: hash, activo: true },
      { id_persona: pValeria.id_persona, id_rol: rolAdmin.id_rol, email: "valeria.romero@ucb.edu.bo", hash_password: hash, activo: true },
      { id_persona: pLucía.id_persona, id_rol: rolAdmin.id_rol, email: "lucia.fernandez@ucb.edu.bo", hash_password: hash, activo: true },
      { id_persona: pAndrés.id_persona, id_rol: rolAdmin.id_rol, email: "andres.chavez@ucb.edu.bo", hash_password: hash, activo: true },
      { id_persona: pCarlos.id_persona, id_rol: rolEntrenador.id_rol, email: "carlos.mamani@ucb.edu.bo", hash_password: hash, activo: true },
      { id_persona: pAna.id_persona, id_rol: rolEntrenador.id_rol, email: "ana.guzman@ucb.edu.bo", hash_password: hash, activo: true },
      { id_persona: pRodrigo.id_persona, id_rol: rolDeportista.id_rol, email: "rodrigo.salinas@ucb.edu.bo", hash_password: hash, activo: true },
      { id_persona: pCamila.id_persona, id_rol: rolDeportista.id_rol, email: "camila.torrez@ucb.edu.bo", hash_password: hash, activo: true },
    ],
  });
  console.log("Usuarios creados (admin: 4, entrenador: 2, deportista: 2)");

  // ── 10. DEPORTISTAS ─────────────────────────────────────
  const dMartín = await prisma.deportistas.create({
    data: { id_persona: pMartín.id_persona, tipo_deportista: "academia", talla_ropa: "M", activo: true },
  });
  const dValeria = await prisma.deportistas.create({
    data: { id_persona: pValeria.id_persona, tipo_deportista: "academia", talla_ropa: "S", activo: true },
  });
  const dRodrigo = await prisma.deportistas.create({
    data: { id_persona: pRodrigo.id_persona, tipo_deportista: "academia", talla_ropa: "L", activo: true },
  });
  const dCamila = await prisma.deportistas.create({
    data: { id_persona: pCamila.id_persona, tipo_deportista: "academia", talla_ropa: "M", activo: true },
  });
  const dNelson = await prisma.deportistas.create({
    data: { id_persona: pNelson.id_persona, tipo_deportista: "academia", talla_ropa: "XL", activo: true },
  });
  const dPatricia = await prisma.deportistas.create({
    data: { id_persona: pPatricia.id_persona, tipo_deportista: "academia", talla_ropa: "S", activo: true },
  });
  const dDiego = await prisma.deportistas.create({
    data: { id_persona: pDiego.id_persona, tipo_deportista: "exonerado", talla_ropa: "M", activo: true },
  });
  const dLucía = await prisma.deportistas.create({
    data: { id_persona: pLucía.id_persona, tipo_deportista: "estudiante_ucb", talla_ropa: "S", activo: true },
  });
  const dAndrés = await prisma.deportistas.create({
    data: { id_persona: pAndrés.id_persona, tipo_deportista: "estudiante_ucb", talla_ropa: "M", activo: true },
  });
  const dSofía = await prisma.deportistas.create({
    data: { id_persona: pSofía.id_persona, tipo_deportista: "estudiante_ucb", talla_ropa: "S", activo: true },
  });
  console.log("Deportistas creados");

  // ── 11. DEPORTISTAS_UCB ─────────────────────────────────
  await prisma.deportistas_ucb.createMany({
    data: [
      { id_deportista: dLucía.id_deportista, id_carrera: carreras[0].id_carrera, semestre: 3, est_regular: true },
      { id_deportista: dAndrés.id_deportista, id_carrera: carreras[1].id_carrera, semestre: 5, est_regular: true },
      { id_deportista: dSofía.id_deportista, id_carrera: carreras[2].id_carrera, semestre: 7, est_regular: true },
    ],
  });
  console.log("Deportistas UCB creados");

  // ── 12. DEPORTISTAS_EXTERNOS ────────────────────────────
  await prisma.deportistas_externos.createMany({
    data: [
      { id_deportista: dMartín.id_deportista, colegio_instituto: "Colegio San Ignacio", curso: "6to Secundaria" },
      { id_deportista: dValeria.id_deportista, colegio_instituto: "Colegio Santa Ana", curso: "5to Secundaria" },
    ],
  });
  console.log("Deportistas externos creados");

  // ── 13. INSCRIPCIONES ─────────────────────────────────
  const hoy = new Date();
  await prisma.inscripciones.createMany({
    data: [
      { id_deportista: dMartín.id_deportista, id_disciplina: voley.id_disciplina, id_categoria: catMayores.id_categoria, fecha_inscripcion: hoy, estado: "activo" },
      { id_deportista: dValeria.id_deportista, id_disciplina: ajedrez.id_disciplina, id_categoria: catMayores.id_categoria, fecha_inscripcion: hoy, estado: "activo" },
      { id_deportista: dRodrigo.id_deportista, id_disciplina: futsal.id_disciplina, id_categoria: catMayores.id_categoria, fecha_inscripcion: hoy, estado: "activo" },
      { id_deportista: dCamila.id_deportista, id_disciplina: voley.id_disciplina, id_categoria: catSub17.id_categoria, fecha_inscripcion: hoy, estado: "activo" },
      { id_deportista: dNelson.id_deportista, id_disciplina: basket.id_disciplina, id_categoria: catMayores.id_categoria, fecha_inscripcion: hoy, estado: "activo" },
      { id_deportista: dPatricia.id_deportista, id_disciplina: ajedrez.id_disciplina, id_categoria: catSub17.id_categoria, fecha_inscripcion: hoy, estado: "activo" },
      { id_deportista: dDiego.id_deportista, id_disciplina: futsal.id_disciplina, id_categoria: catMayores.id_categoria, fecha_inscripcion: hoy, estado: "activo" },
      { id_deportista: dLucía.id_deportista, id_disciplina: basket.id_disciplina, id_categoria: catSub15.id_categoria, fecha_inscripcion: hoy, estado: "activo" },
      { id_deportista: dAndrés.id_deportista, id_disciplina: voley.id_disciplina, id_categoria: catMayores.id_categoria, fecha_inscripcion: hoy, estado: "activo" },
      { id_deportista: dSofía.id_deportista, id_disciplina: futsal.id_disciplina, id_categoria: catMayores.id_categoria, fecha_inscripcion: hoy, estado: "activo" },
    ],
  });
  console.log("Inscripciones creadas");

  // ── 14. CONCEPTOS_PAGO ──────────────────────────────────
  const conceptos = await prisma.conceptos_pago.createManyAndReturn({
    data: [
      { id_disciplina: futsal.id_disciplina, codigo_caja: "MAT-FUT", nombre: "Matrícula Futsal", monto_actual: 150, activo: true },
      { id_disciplina: futsal.id_disciplina, codigo_caja: "MEN-FUT", nombre: "Mensualidad Futsal", monto_actual: 120, activo: true },
      { id_disciplina: basket.id_disciplina, codigo_caja: "MAT-BASK", nombre: "Matrícula Básquetbol", monto_actual: 150, activo: true },
      { id_disciplina: basket.id_disciplina, codigo_caja: "MEN-BASK", nombre: "Mensualidad Básquetbol", monto_actual: 120, activo: true },
      { id_disciplina: voley.id_disciplina, codigo_caja: "MAT-VOL", nombre: "Matrícula Voleibol", monto_actual: 150, activo: true },
      { id_disciplina: voley.id_disciplina, codigo_caja: "MEN-VOL", nombre: "Mensualidad Voleibol", monto_actual: 120, activo: true },
      { id_disciplina: ajedrez.id_disciplina, codigo_caja: "MAT-AJE", nombre: "Matrícula Ajedrez", monto_actual: 100, activo: true },
      { id_disciplina: ajedrez.id_disciplina, codigo_caja: "MEN-AJE", nombre: "Mensualidad Ajedrez", monto_actual: 80, activo: true },
    ],
  });
  const c = (nombre: string) => conceptos.find((x: any) => x.nombre === nombre);
  console.log("Conceptos de pago creados");

  // ── 15. RESERVAS ────────────────────────────────────────
  const fechaRes = new Date();
  fechaRes.setUTCHours(12, 0, 0, 0);
  await prisma.reservas.createMany({
    data: [
      {
        id_espacio: coliseo.id_espacio,
        id_persona_aprobador: pMartín.id_persona,
        fecha_reserva: fechaRes,
        hora_inicio: T("14:00"),
        hora_fin: T("16:00"),
        tipo_reserva: "entrenamiento",
        motivo: "Entrenamiento Futsal",
        estado: "confirmada",
        nombre_solicitante: "Martín Quispe",
        ci: 10011001,
        complemento: null,
        correo_solicitante: "martin.quispe@ucb.edu.bo",
      },
      {
        id_espacio: canchaArq.id_espacio,
        id_persona_aprobador: pValeria.id_persona,
        fecha_reserva: new Date(fechaRes.getTime() + 86400000),
        hora_inicio: T("15:00"),
        hora_fin: T("17:00"),
        tipo_reserva: "entrenamiento",
        motivo: "Entrenamiento Básquetbol",
        estado: "Pendiente",
        nombre_solicitante: "Valeria Romero",
        ci: 10022002,
        complemento: null,
        correo_solicitante: "valeria.romero@ucb.edu.bo",
      },
      {
        id_espacio: coliseo.id_espacio,
        id_persona_aprobador: pRodrigo.id_persona,
        fecha_reserva: new Date(fechaRes.getTime() + 172800000),
        hora_inicio: T("10:00"),
        hora_fin: T("12:00"),
        tipo_reserva: "partido",
        motivo: "Partido amistoso",
        estado: "confirmada",
        nombre_solicitante: "Rodrigo Salinas",
        ci: 10033003,
        complemento: null,
        correo_solicitante: "rodrigo.salinas@ucb.edu.bo",
      },
    ],
  });
  console.log("Reservas creadas");

  // ── 16. PAGOS ──────────────────────────────────────────
  const gestion = new Date().getFullYear();
  const fp = (mes: number, dia: number) => new Date(`${gestion}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}T12:00:00.000Z`);

  // Martín — tiene matrícula + mensualidades 1-3
  await prisma.pagos.createMany({
    data: [
      { id_persona_pago: pMartín.id_persona, id_deportista_beneficiario: dMartín.id_deportista, id_concepto: c("Matrícula Voleibol").id_concepto, id_transaccion_caja: "CAJA-001", monto_pagado: 150, fecha_pago: fp(2, 10), mes_correspondiente: 0, gestion, estado_factura: "Activa" },
      { id_persona_pago: pMartín.id_persona, id_deportista_beneficiario: dMartín.id_deportista, id_concepto: c("Mensualidad Voleibol").id_concepto, id_transaccion_caja: "CAJA-002", monto_pagado: 120, fecha_pago: fp(3, 5), mes_correspondiente: 1, gestion, estado_factura: "Activa" },
      { id_persona_pago: pMartín.id_persona, id_deportista_beneficiario: dMartín.id_deportista, id_concepto: c("Mensualidad Voleibol").id_concepto, id_transaccion_caja: "CAJA-003", monto_pagado: 120, fecha_pago: fp(4, 4), mes_correspondiente: 2, gestion, estado_factura: "Activa" },
      { id_persona_pago: pMartín.id_persona, id_deportista_beneficiario: dMartín.id_deportista, id_concepto: c("Mensualidad Voleibol").id_concepto, id_transaccion_caja: "CAJA-004", monto_pagado: 120, fecha_pago: fp(5, 3), mes_correspondiente: 3, gestion, estado_factura: "Activa" },
    ],
  });

  // Valeria — matrícula + mensualidades 1-4
  await prisma.pagos.createMany({
    data: [
      { id_persona_pago: pValeria.id_persona, id_deportista_beneficiario: dValeria.id_deportista, id_concepto: c("Matrícula Ajedrez").id_concepto, id_transaccion_caja: "CAJA-005", monto_pagado: 100, fecha_pago: fp(2, 12), mes_correspondiente: 0, gestion, estado_factura: "Activa" },
      { id_persona_pago: pValeria.id_persona, id_deportista_beneficiario: dValeria.id_deportista, id_concepto: c("Mensualidad Ajedrez").id_concepto, id_transaccion_caja: "CAJA-006", monto_pagado: 80, fecha_pago: fp(3, 6), mes_correspondiente: 1, gestion, estado_factura: "Activa" },
      { id_persona_pago: pValeria.id_persona, id_deportista_beneficiario: dValeria.id_deportista, id_concepto: c("Mensualidad Ajedrez").id_concepto, id_transaccion_caja: "CAJA-007", monto_pagado: 80, fecha_pago: fp(4, 5), mes_correspondiente: 2, gestion, estado_factura: "Activa" },
      { id_persona_pago: pValeria.id_persona, id_deportista_beneficiario: dValeria.id_deportista, id_concepto: c("Mensualidad Ajedrez").id_concepto, id_transaccion_caja: "CAJA-008", monto_pagado: 80, fecha_pago: fp(5, 2), mes_correspondiente: 3, gestion, estado_factura: "Activa" },
      { id_persona_pago: pValeria.id_persona, id_deportista_beneficiario: dValeria.id_deportista, id_concepto: c("Mensualidad Ajedrez").id_concepto, id_transaccion_caja: "CAJA-009", monto_pagado: 80, fecha_pago: fp(6, 2), mes_correspondiente: 4, gestion, estado_factura: "Activa" },
    ],
  });

  // Rodrigo — matrícula + mensualidades 1-2
  await prisma.pagos.createMany({
    data: [
      { id_persona_pago: pRodrigo.id_persona, id_deportista_beneficiario: dRodrigo.id_deportista, id_concepto: c("Matrícula Futsal").id_concepto, id_transaccion_caja: "CAJA-010", monto_pagado: 150, fecha_pago: fp(2, 15), mes_correspondiente: 0, gestion, estado_factura: "Activa" },
      { id_persona_pago: pRodrigo.id_persona, id_deportista_beneficiario: dRodrigo.id_deportista, id_concepto: c("Mensualidad Futsal").id_concepto, id_transaccion_caja: "CAJA-011", monto_pagado: 120, fecha_pago: fp(3, 8), mes_correspondiente: 1, gestion, estado_factura: "Activa" },
      { id_persona_pago: pRodrigo.id_persona, id_deportista_beneficiario: dRodrigo.id_deportista, id_concepto: c("Mensualidad Futsal").id_concepto, id_transaccion_caja: "CAJA-012", monto_pagado: 120, fecha_pago: fp(4, 7), mes_correspondiente: 2, gestion, estado_factura: "Activa" },
    ],
  });

  // Camila — solo matrícula
  await prisma.pagos.createMany({
    data: [
      { id_persona_pago: pCamila.id_persona, id_deportista_beneficiario: dCamila.id_deportista, id_concepto: c("Matrícula Voleibol").id_concepto, id_transaccion_caja: "CAJA-013", monto_pagado: 150, fecha_pago: fp(2, 20), mes_correspondiente: 0, gestion, estado_factura: "Activa" },
    ],
  });

  // Nelson — matrícula + mensualidad 1 + mensualidad 2 (ANULADA)
  await prisma.pagos.createMany({
    data: [
      { id_persona_pago: pNelson.id_persona, id_deportista_beneficiario: dNelson.id_deportista, id_concepto: c("Matrícula Básquetbol").id_concepto, id_transaccion_caja: "CAJA-014", monto_pagado: 150, fecha_pago: fp(2, 18), mes_correspondiente: 0, gestion, estado_factura: "Activa" },
      { id_persona_pago: pNelson.id_persona, id_deportista_beneficiario: dNelson.id_deportista, id_concepto: c("Mensualidad Básquetbol").id_concepto, id_transaccion_caja: "CAJA-015", monto_pagado: 120, fecha_pago: fp(3, 12), mes_correspondiente: 1, gestion, estado_factura: "Activa" },
      { id_persona_pago: pNelson.id_persona, id_deportista_beneficiario: dNelson.id_deportista, id_concepto: c("Mensualidad Básquetbol").id_concepto, id_transaccion_caja: "CAJA-016", monto_pagado: 120, fecha_pago: fp(4, 10), mes_correspondiente: 2, gestion, estado_factura: "Anulado" },
    ],
  });

  // Patricia — solo matrícula
  await prisma.pagos.createMany({
    data: [
      { id_persona_pago: pPatricia.id_persona, id_deportista_beneficiario: dPatricia.id_deportista, id_concepto: c("Matrícula Ajedrez").id_concepto, id_transaccion_caja: "CAJA-017", monto_pagado: 100, fecha_pago: fp(2, 22), mes_correspondiente: 0, gestion, estado_factura: "Activa" },
    ],
  });

  console.log("Pagos creados");

  // ── Verificar vista ──────────────────────────────────────
  const deportistaIds = [dMartín.id_deportista, dValeria.id_deportista, dRodrigo.id_deportista, dCamila.id_deportista, dNelson.id_deportista, dPatricia.id_deportista, dDiego.id_deportista, dLucía.id_deportista, dAndrés.id_deportista, dSofía.id_deportista];
  const registros: any[] = await prisma.planillaPagosAcademia.findMany({
    where: { deportista_id: { in: deportistaIds }, gestion },
  });
  console.log(`\nVista PlanillaPagosAcademia: ${registros.length} registros encontrados`);
  for (const r of registros) {
    console.log(`  #${r.deportista_id} ${r.nombre_completo.padEnd(25)} matrícula=${r.matricula_pagada ? "✓" : "✗"} meses pagados=${[1, 2, 3, 4, 5, 6, 7, 8, 9].filter((m) => r[`mes_${m}_pagado`]).length} total=${r.total_pagado} saldo=${r.saldo_pendiente}`);
  }

  console.log("\nSeed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
