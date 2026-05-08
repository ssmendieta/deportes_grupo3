import { apiRequest } from "../../../shared/services/apiClient";
import { readLocalStore, writeLocalStore } from "../../../shared/utils/localStore";
import { disciplinasMock, entrenadoresMock } from "../mocks/disciplinasMock";
import type {
  Disciplina,
  DisciplinaFormData,
  Entrenador,
  EstadoDisciplina,
} from "../types/disciplina.types";

const STORE_KEY = "ucb-disciplinas-demo";

function getLocalDisciplinas() {
  return readLocalStore<Disciplina[]>(STORE_KEY, disciplinasMock);
}

function saveLocalDisciplinas(disciplinas: Disciplina[]) {
  writeLocalStore(STORE_KEY, disciplinas);
}

function normalizarDisciplina(data: Partial<Disciplina> & { activo?: boolean; orden?: number }): Disciplina {
  return {
    id: Number(data.id ?? Date.now()),
    nombre: data.nombre || "Sin nombre",
    descripcion: data.descripcion || "",
    tipo: data.tipo || "academia",
    categorias: data.categorias || "Todas",
    mensualidad: Number(data.mensualidad ?? 0),
    estado: data.estado || (data.activo === false ? "inactiva" : "activa"),
    entrenadorId: data.entrenadorId ?? data.entrenador?.id ?? null,
    entrenador: data.entrenador ?? null,
  };
}

function formDataToPayload(data: DisciplinaFormData) {
  return {
    nombre: data.nombre.trim(),
    descripcion: data.descripcion.trim(),
    tipo: data.tipo || "academia",
    categorias: data.categorias.trim(),
    mensualidad: Number(data.mensualidad || 0),
    estado: data.estado,
    entrenador_id: data.entrenadorId ? Number(data.entrenadorId) : null,
    activo: data.estado === "activa",
  };
}

export async function listarDisciplinas(): Promise<Disciplina[]> {
  try {
    const data = await apiRequest<Disciplina[]>("/api/disciplinas?estado=todas");
    const normalizadas = data.map(normalizarDisciplina);
    return normalizadas.length ? normalizadas : getLocalDisciplinas();
  } catch (error) {
    console.warn("Usando disciplinas locales porque el backend no expone CRUD completo", error);
    return getLocalDisciplinas();
  }
}

export async function listarEntrenadores(): Promise<Entrenador[]> {
  try {
    return await apiRequest<Entrenador[]>("/api/entrenadores");
  } catch {
    return entrenadoresMock;
  }
}

export async function crearDisciplina(data: DisciplinaFormData): Promise<Disciplina> {
  const payload = formDataToPayload(data);
  try {
    return normalizarDisciplina(
      await apiRequest<Disciplina>("/api/disciplinas", {
        method: "POST",
        requiresAdmin: true,
        body: JSON.stringify(payload),
      }),
    );
  } catch (error) {
    console.warn("Simulando creación local de disciplina", error);
    const entrenadorId = data.entrenadorId ? Number(data.entrenadorId) : null;
    const nueva: Disciplina = {
      id: Date.now(),
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      tipo: payload.tipo,
      categorias: payload.categorias,
      mensualidad: payload.mensualidad,
      estado: payload.estado,
      entrenadorId,
      entrenador: entrenadoresMock.find((e) => e.id === entrenadorId) ?? null,
    };
    const actualizadas = [nueva, ...getLocalDisciplinas()];
    saveLocalDisciplinas(actualizadas);
    return nueva;
  }
}

export async function actualizarDisciplina(id: number, data: DisciplinaFormData): Promise<Disciplina> {
  const payload = formDataToPayload(data);
  try {
    return normalizarDisciplina(
      await apiRequest<Disciplina>(`/api/disciplinas/${id}`, {
        method: "PATCH",
        requiresAdmin: true,
        body: JSON.stringify(payload),
      }),
    );
  } catch (error) {
    console.warn("Simulando actualización local de disciplina", error);
    const entrenadorId = data.entrenadorId ? Number(data.entrenadorId) : null;
    const actualizadas = getLocalDisciplinas().map((disciplina) =>
      disciplina.id === id
        ? {
            ...disciplina,
            nombre: payload.nombre,
            descripcion: payload.descripcion,
            tipo: payload.tipo,
            categorias: payload.categorias,
            mensualidad: payload.mensualidad,
            estado: payload.estado,
            entrenadorId,
            entrenador: entrenadoresMock.find((e) => e.id === entrenadorId) ?? null,
          }
        : disciplina,
    );
    saveLocalDisciplinas(actualizadas);
    return actualizadas.find((disciplina) => disciplina.id === id)!;
  }
}

export async function cambiarEstadoDisciplina(id: number, estado: EstadoDisciplina): Promise<Disciplina> {
  try {
    return normalizarDisciplina(
      await apiRequest<Disciplina>(`/api/disciplinas/${id}/estado`, {
        method: "PATCH",
        requiresAdmin: true,
        body: JSON.stringify({ estado, activo: estado === "activa" }),
      }),
    );
  } catch (error) {
    console.warn("Simulando cambio de estado local de disciplina", error);
    const actualizadas = getLocalDisciplinas().map((disciplina) =>
      disciplina.id === id ? { ...disciplina, estado } : disciplina,
    );
    saveLocalDisciplinas(actualizadas);
    return actualizadas.find((disciplina) => disciplina.id === id)!;
  }
}
