import { apiRequest } from "../../../shared/services/apiClient";
import type {
  Deportista,
  DeportistaFormData,
  DeportistaRaw,
  DeportistasRawResponse,
  Inscripcion,
  InscripcionRaw,
  PagoHistorial,
  PagoRaw,
} from "../types/deportista.types";

function mapInscripcion(raw: InscripcionRaw): Inscripcion {
  return {
    id: raw.id,
    deportistaId: raw.deportista_id,
    disciplinaId: raw.disciplina_id,
    categoria: raw.categoria,
    nivel: raw.nivel,
    fechaInscripcion: raw.fecha_inscripcion,
    activo: raw.estado === "activo",
    disciplina: raw.disciplina,
  };
}

function mapDeportista(raw: DeportistaRaw): Deportista {
  return {
    id: raw.id,
    tipo: raw.tipo,
    ci: raw.ci,
    nombreCompleto: raw.nombre_completo,
    fechaNacimiento: raw.fecha_nacimiento,
    genero: raw.genero,
    telefono: raw.telefono,
    email: raw.email,
    direccion: raw.direccion,
    carrera: raw.carrera,
    semestre: raw.semestre,
    matriculaActiva: raw.matricula_activa,
    tallaCamiseta: raw.talla_camiseta,
    activo: raw.activo,
    inscripciones: raw.inscripciones?.map(mapInscripcion),
    estadoCuenta: raw.estado_cuenta,
    deuda: raw.deuda,
  };
}

// ─── Listado y búsqueda ───────────────────────────────────────────────────────

export async function listarDeportistas(params?: {
  page?: number;
  limit?: number;
  tipo?: string;
  disciplinaId?: number;
  activo?: boolean;
}): Promise<Deportista[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.tipo) query.set("tipo", params.tipo);
  if (params?.disciplinaId)
    query.set("disciplinaId", String(params.disciplinaId));
  if (params?.activo !== undefined) query.set("activo", String(params.activo));

  const qs = query.toString();
  const res = await apiRequest<DeportistasRawResponse | DeportistaRaw[]>(
    `/api/deportistas${qs ? `?${qs}` : ""}`,
    { requiresAdmin: true },
  );

  const rawList = Array.isArray(res) ? res : res.data;
  return rawList.map(mapDeportista);
}

export async function buscarPorCi(ci: string): Promise<Deportista | null> {
  try {
    const raw = await apiRequest<DeportistaRaw>(
      `/api/deportistas/buscar?ci=${encodeURIComponent(ci)}`,
      { requiresAdmin: true },
    );
    return mapDeportista(raw);
  } catch {
    return null;
  }
}

export async function obtenerDeportista(id: number): Promise<Deportista> {
  const raw = await apiRequest<DeportistaRaw>(`/api/deportistas/${id}`, {
    requiresAdmin: true,
  });
  return mapDeportista(raw);
}

// ─── Crear / Editar ───────────────────────────────────────────────────────────

export async function crearDeportista(
  data: DeportistaFormData,
): Promise<Deportista> {
  const {
    disciplinaId,
    categoria,
    nivel,
    semestre,
    nombreCompleto,
    tallaCamiseta,
    fechaNacimiento,
    matriculaActiva,
    ...rest
  } = data;

  const raw = await apiRequest<DeportistaRaw>("/api/deportistas", {
    method: "POST",
    body: JSON.stringify({
      ...rest,
      nombre_completo: nombreCompleto,
      fecha_nacimiento: fechaNacimiento,
      talla_camiseta: tallaCamiseta,
      matricula_activa: matriculaActiva ?? false,
      semestre: semestre ? Number(semestre) : undefined,
    }),
    requiresAdmin: true,
  });

  const nuevo = mapDeportista(raw);

  if (disciplinaId) {
    await inscribirDeportista(nuevo.id, { disciplinaId, categoria, nivel });
  }

  return nuevo;
}

export async function actualizarDeportista(
  id: number,
  data: Partial<DeportistaFormData>,
): Promise<Deportista> {
  const raw = await apiRequest<DeportistaRaw>(`/api/deportistas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    requiresAdmin: true,
  });
  return mapDeportista(raw);
}

export async function cambiarEstadoDeportista(
  id: number,
  activo: boolean,
): Promise<Deportista> {
  const raw = await apiRequest<DeportistaRaw>(`/api/deportistas/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ activo }),
    requiresAdmin: true,
  });
  return mapDeportista(raw);
}

// ─── Inscripciones ────────────────────────────────────────────────────────────

export async function inscribirDeportista(
  id: number,
  body: { disciplinaId: number; categoria?: string; nivel?: string },
): Promise<Inscripcion> {
  const raw = await apiRequest<InscripcionRaw>(
    `/api/deportistas/${id}/inscripciones`,
    {
      method: "POST",
      body: JSON.stringify({
        disciplinaId: body.disciplinaId,
        categoria: body.categoria,
        nivel: body.nivel,
      }),
      requiresAdmin: true,
    },
  );
  return mapInscripcion(raw);
}

export async function obtenerInscripciones(id: number): Promise<Inscripcion[]> {
  const rawList = await apiRequest<InscripcionRaw[]>(
    `/api/deportistas/${id}/inscripciones`,
    { requiresAdmin: true },
  );
  return rawList.map(mapInscripcion);
}

// ─── Pagos ────────────────────────────────────────────────────────────────────

const MESES: Record<number, string> = {
  1: "Marzo",
  2: "Abril",
  3: "Mayo",
  4: "Junio",
  5: "Julio",
  6: "Agosto",
  7: "Septiembre",
  8: "Octubre",
  9: "Noviembre",
};

function mapPago(raw: PagoRaw): PagoHistorial {
  return {
    id: raw.id,
    mes: raw.mes ? (MESES[raw.mes] ?? `Mes ${raw.mes}`) : "Matrícula",
    anio: raw.anio ?? new Date().getFullYear(),
    concepto: raw.concepto.nombre,
    monto: Number(raw.monto),
    estado: raw.estado,
    fechaPago: raw.fecha_pago,
    observaciones: raw.observaciones ?? undefined,
    anulado: raw.estado === "anulado",
  };
}

export async function obtenerPagosDeportista(
  id: number,
): Promise<PagoHistorial[]> {
  const rawList = await apiRequest<PagoRaw[]>(`/api/pagos/deportista/${id}`, {
    requiresAdmin: true,
  });
  return rawList.map(mapPago);
}
