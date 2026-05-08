import { readLocalStore, writeLocalStore } from "../../../shared/utils/localStore";
import { deportistasMock } from "../mocks/deportistasMock";
import type { Deportista, DeportistaFormData } from "../types/deportista.types";

const STORE_KEY = "ucb-deportistas-demo";

function getLocalDeportistas() {
  return readLocalStore<Deportista[]>(STORE_KEY, deportistasMock);
}

function saveLocalDeportistas(deportistas: Deportista[]) {
  writeLocalStore(STORE_KEY, deportistas);
}

export async function listarDeportistas(): Promise<Deportista[]> {
  // El backend enviado tiene modelos Prisma de deportistas, pero no tiene controller REST de deportistas todavía.
  // Por eso este servicio usa almacenamiento local temporal para que el front sea funcional.
  return getLocalDeportistas();
}

export async function crearDeportista(data: DeportistaFormData): Promise<Deportista> {
  const nuevo: Deportista = {
    id: Date.now(),
    nombreCompleto: data.nombreCompleto,
    ci: data.ci,
    fechaNacimiento: data.fechaNacimiento,
    genero: data.genero,
    telefono: data.telefono,
    email: data.email,
    direccion: data.direccion,
    carrera: data.carrera,
    semestre: Number(data.semestre || 0),
    tipo: data.tipo,
    disciplina: data.disciplina,
    categoria: data.categoria,
    nivel: data.nivel,
    matriculaActiva: data.matriculaActiva,
    tallaCamiseta: data.tallaCamiseta,
    activo: data.activo,
    mesActual: "Mayo",
    estadoCuenta: "pendiente",
    deuda: 130,
    historialPagos: [
      {
        id: Date.now() + 1,
        mes: "Mayo",
        anio: 2026,
        concepto: "Mensualidad inicial",
        monto: 130,
        estado: "pendiente",
        observaciones: "Registro creado desde front",
      },
    ],
  };
  saveLocalDeportistas([nuevo, ...getLocalDeportistas()]);
  return nuevo;
}
