import { apiRequest } from "../../../shared/services/apiClient";
import type {
  Disciplina,
  DisciplinaFormData,
  EstadoDisciplina,
} from "../types/disciplina.types";

type DisciplinaRaw = {
  id: number;
  nombre: string;
  descripcion: string | null;
  categorias: string | null;
  mensualidad: string | number | null;
  activo: boolean;
  orden: number;
};

function mapDisciplina(raw: DisciplinaRaw): Disciplina {
  return {
    id: raw.id,
    nombre: raw.nombre,
    descripcion: raw.descripcion ?? "",
    categorias: raw.categorias ?? "",
    mensualidad: Number(raw.mensualidad ?? 0),
    estado: raw.activo ? "activa" : "inactiva",
  };
}

export async function listarDisciplinas(): Promise<Disciplina[]> {
  const data = await apiRequest<DisciplinaRaw[]>("/api/disciplinas", {
    requiresAdmin: true,
  });
  return data.map(mapDisciplina);
}

export async function crearDisciplina(
  data: DisciplinaFormData,
): Promise<Disciplina> {
  const raw = await apiRequest<DisciplinaRaw>("/api/disciplinas", {
    method: "POST",
    requiresAdmin: true,
    body: JSON.stringify({
      nombre: data.nombre.trim(),
      descripcion: data.descripcion.trim(),
      categorias: data.categorias.trim(),
      mensualidad: Number(data.mensualidad || 0),
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
    requiresAdmin: true,
    body: JSON.stringify({
      descripcion: data.descripcion.trim(),
      categorias: data.categorias.trim(),
      mensualidad: Number(data.mensualidad || 0),
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
    requiresAdmin: true,
    body: JSON.stringify({ activo: estado === "activa" }),
  });
  return mapDisciplina(raw);
}
