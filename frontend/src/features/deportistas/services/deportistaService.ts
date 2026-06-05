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
    fechaInscripcion: raw.fecha_inscripcion,
    activo: raw.estado === "activo",
    disciplina: raw.disciplina,
  };
}

function mapDeportista(raw: DeportistaRaw): Deportista {
  return {
    id: raw.id,
    tipo: raw.tipo as Deportista["tipo"],
    nombreCompleto: `${raw.nombres ?? ""} ${raw.ape_paterno ?? ""} ${raw.ape_materno ?? ""}`.trim(),
    nombres: raw.nombres,
    apePaterno: raw.ape_paterno,
    apeMaterno: raw.ape_materno,
    ci: String(raw.ci),
    complemento: raw.complemento,
    celular: raw.celular,
    fechaNacimiento: raw.fecha_nacimiento,
    email: raw.email,
    tallaRopa: raw.talla_ropa,
    idCarrera: raw.id_carrera,
    carrera: raw.carrera,
    semestre: raw.semestre,
    colegioInstituto: raw.colegio_instituto,
    curso: raw.curso,
    activo: raw.activo,
    inscripciones: raw.inscripciones?.map(mapInscripcion),
    estadoCuenta: raw.estado_cuenta,
    deuda: raw.deuda,
  };
}

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
    { requiresAuth: true },
  );

  const rawList = Array.isArray(res) ? res : res.data;
  return rawList.map(mapDeportista);
}

export async function buscarPorCi(ci: string): Promise<Deportista | null> {
  try {
    const raw = await apiRequest<DeportistaRaw>(
      `/api/deportistas/buscar?ci=${encodeURIComponent(ci)}`,
      { requiresAuth: true },
    );
    return mapDeportista(raw);
  } catch {
    return null;
  }
}

export async function obtenerDeportista(id: number): Promise<Deportista> {
  const raw = await apiRequest<DeportistaRaw>(`/api/deportistas/${id}`, {
    requiresAuth: true,
  });
  return mapDeportista(raw);
}

export async function crearDeportista(
  data: DeportistaFormData,
): Promise<Deportista> {
  const raw = await apiRequest<DeportistaRaw>("/api/deportistas", {
    method: "POST",
    body: JSON.stringify({
      nombres: data.nombres.trim(),
      ape_paterno: data.ape_paterno.trim(),
      ape_materno: data.ape_materno.trim(),
      ci: parseInt(data.ci),
      complemento: data.complemento?.trim() || undefined,
      celular: data.celular.trim(),
      email: data.email?.trim() || undefined,
      fecha_nacimiento: data.fechaNacimiento || undefined,
      tipo_deportista: data.tipo,
      talla_ropa: data.tallaRopa || undefined,
      disciplinaId: data.disciplinaId,
      id_categoria: data.categoria ? 1 : undefined,
      semestre: data.semestre ? Number(data.semestre) : undefined,
      id_carrera: data.idCarrera,
      colegio_instituto: data.colegioInstituto?.trim() || undefined,
      curso: data.curso?.trim() || undefined,
    }),
    requiresAuth: true,
  });

  return mapDeportista(raw);
}

export async function actualizarDeportista(
  id: number,
  data: Partial<DeportistaFormData>,
): Promise<Deportista> {
  const body: Record<string, unknown> = {};
  if (data.nombres !== undefined) body.nombres = data.nombres.trim();
  if (data.ape_paterno !== undefined) body.ape_paterno = data.ape_paterno.trim();
  if (data.ape_materno !== undefined) body.ape_materno = data.ape_materno.trim();
  if (data.ci !== undefined) body.ci = parseInt(data.ci);
  if (data.complemento !== undefined) body.complemento = data.complemento.trim() || null;
  if (data.celular !== undefined) body.celular = data.celular.trim();
  if (data.email !== undefined) body.email = data.email.trim() || null;
  if (data.fechaNacimiento !== undefined) body.fecha_nacimiento = data.fechaNacimiento || null;
  if (data.tipo !== undefined) body.tipo_deportista = data.tipo;
  if (data.tallaRopa !== undefined) body.talla_ropa = data.tallaRopa || null;
  if (data.semestre !== undefined)
    body.semestre = data.semestre ? Number(data.semestre) : undefined;
  if (data.idCarrera !== undefined) body.id_carrera = data.idCarrera;
  if (data.colegioInstituto !== undefined)
    body.colegio_instituto = data.colegioInstituto.trim() || null;
  if (data.curso !== undefined)
    body.curso = data.curso.trim() || null;
  if (data.activo !== undefined) body.activo = data.activo;
  if (data.disciplinaId !== undefined) body.disciplinaId = data.disciplinaId;
  if (data.categoria !== undefined) body.categoria = data.categoria;

  const raw = await apiRequest<DeportistaRaw>(`/api/deportistas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    requiresAuth: true,
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
    requiresAuth: true,
  });
  return mapDeportista(raw);
}

export async function inscribirDeportista(
  id: number,
  body: { disciplinaId: number; id_categoria?: number },
): Promise<Inscripcion> {
  const raw = await apiRequest<InscripcionRaw>(
    `/api/deportistas/${id}/inscripciones`,
    {
      method: "POST",
      body: JSON.stringify({
        disciplinaId: body.disciplinaId,
        id_categoria: body.id_categoria ?? 1,
      }),
      requiresAuth: true,
    },
  );
  return mapInscripcion(raw);
}

export async function obtenerInscripciones(id: number): Promise<Inscripcion[]> {
  const rawList = await apiRequest<InscripcionRaw[]>(
    `/api/deportistas/${id}/inscripciones`,
    { requiresAuth: true },
  );
  return rawList.map(mapInscripcion);
}

const MESES: Record<number, string> = {
  1: "Enero",
  2: "Febrero",
  3: "Marzo",
  4: "Abril",
  5: "Mayo",
  6: "Junio",
  7: "Julio",
  8: "Agosto",
  9: "Septiembre",
  10: "Octubre",
  11: "Noviembre",
  12: "Diciembre",
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
    requiresAuth: true,
  });
  return rawList.map(mapPago);
}
