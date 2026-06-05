import { apiRequest } from "../../../shared/services/apiClient";
import type {
  Disciplina,
  DisciplinaFormData,
  EstadoDisciplina,
} from "../types/disciplina.types";

type DisciplinaRaw = {
  id: number;
  nombre: string;
  activo: boolean;
};

function mapDisciplina(raw: DisciplinaRaw): Disciplina {
  return {
    id: raw.id,
    nombre: raw.nombre,
    estado: raw.activo ? "activa" : "inactiva",
  };
}

export async function listarDisciplinas(): Promise<Disciplina[]> {
  const raw = await apiRequest<DisciplinaRaw[]>("/api/disciplinas", {
    requiresAuth: false,
  });
  return raw.map(mapDisciplina);
}

export async function crearDisciplina(
  data: DisciplinaFormData,
): Promise<Disciplina> {
  const raw = await apiRequest<DisciplinaRaw>("/api/disciplinas", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({
      nombre: data.nombre.trim(),
      activo: true,
    }),
  });
  return mapDisciplina(raw);
}

export async function actualizarDisciplina(
  id: number,
  data: DisciplinaFormData,
): Promise<Disciplina> {
  const raw = await apiRequest<DisciplinaRaw>(`/api/disciplinas/${id}`, {
    method: "PATCH",
    requiresAuth: true,
    body: JSON.stringify({
      activo: data.estado === "activa",
    }),
  });
  return mapDisciplina(raw);
}

export async function cambiarEstadoDisciplina(
  id: number,
  estado: EstadoDisciplina,
): Promise<Disciplina> {
  const raw = await apiRequest<DisciplinaRaw>(`/api/disciplinas/${id}/estado`, {
    method: "PATCH",
    requiresAuth: true,
    body: JSON.stringify({ activo: estado === "activa" }),
  });
  return mapDisciplina(raw);
}
