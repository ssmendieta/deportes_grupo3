import { apiRequest, API_URL } from "../../../shared/services/apiClient";
import {
  FALLBACK_HORARIO_APERTURA,
  FALLBACK_HORARIO_CIERRE,
  POR_PAGINA,
} from "../constants/reservas.constants";
import type {
  BloqueOcupado,
  CreateReservaDto,
  DisponibilidadEspacio,
  DisciplinaBasica,
  Espacio,
  Reserva,
  UpdateReservaDto,
} from "../types/reserva.types";



const espaciosFallback: Espacio[] = [
  {
    id: 1,
    nombre: "Coliseo Polideportivo",
    horario_apertura: FALLBACK_HORARIO_APERTURA,
    horario_cierre: FALLBACK_HORARIO_CIERRE,
    activo: true,
  },
  {
    id: 2,
    nombre: "Cancha de Arquitectura",
    horario_apertura: FALLBACK_HORARIO_APERTURA,
    horario_cierre: FALLBACK_HORARIO_CIERRE,
    activo: true,
  },
];

const disciplinasFallback: DisciplinaBasica[] = [
  { id: 1, nombre: "Voleibol", activo: true },
  { id: 2, nombre: "Básquetbol", activo: true },
  { id: 3, nombre: "Fútbol", activo: true },
];

const reservasFallback: Reserva[] = [
  {
    id: 1,
    espacio_id: 1,
    nombre_solicitante: "Juan Pérez",
    ci: 7654321,
    complemento: null,
    correo_solicitante: null,
    fecha_reserva: "2026-04-25",
    hora_inicio: "14:00",
    hora_fin: "15:30",
    tipo_reserva: "entrenamiento",
    motivo: "Práctica deportiva",
    estado: "confirmada",
    espacio: espaciosFallback[0],
  },
];

function fechaParaAPI(semanaBase: Date, indiceDia: number): string {
  const anio = semanaBase.getFullYear();
  const mes = semanaBase.getMonth();
  const dia = semanaBase.getDate();
  const fecha = new Date(anio, mes, dia + indiceDia);
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export { fechaParaAPI };

const esDesarrollo = import.meta.env.DEV === true;

export async function getEspacios(): Promise<Espacio[]> {
  try {
    const data = await apiRequest<Espacio[]>("/api/espacios");
    return data.length ? data : [];
  } catch (error) {
    if (esDesarrollo) {
      console.warn("Usando espacios fallback (DEV)", error);
      return espaciosFallback;
    }
    throw error;
  }
}

export async function getDisciplinasReserva(): Promise<DisciplinaBasica[]> {
  try {
    const data = await apiRequest<DisciplinaBasica[]>("/api/disciplinas");
    return data.length ? data : [];
  } catch (error) {
    if (esDesarrollo) {
      console.warn("Usando disciplinas fallback (DEV)", error);
      return disciplinasFallback;
    }
    throw error;
  }
}

export async function getDisponibilidad(
  espacioId: number,
  fecha: string,
): Promise<DisponibilidadEspacio> {
  try {
    return await apiRequest<DisponibilidadEspacio>(
      `/api/horarios-disponibles/${espacioId}?fecha=${fecha}`,
    );
  } catch (error) {
    if (esDesarrollo) {
      console.warn("Usando disponibilidad fallback (DEV)", error);
      const dia = new Date(`${fecha}T12:00:00.000Z`).getUTCDay();
      const bloques: BloqueOcupado[] = [];

      if (espacioId === 1 && dia === 1) {
        bloques.push({
          hora_inicio: "14:00",
          hora_fin: "15:30",
          tipo: "clase",
          motivo: "Clase / entrenamiento",
        });
      }
      if (espacioId === 2 && dia === 2) {
        bloques.push({
          hora_inicio: "15:00",
          hora_fin: "16:30",
          tipo: "clase",
          motivo: "Clase / entrenamiento",
        });
      }
      if (espacioId === 2 && dia === 5) {
        bloques.push({
          hora_inicio: "14:30",
          hora_fin: "16:00",
          tipo: "reserva",
          motivo: "Reserva previa",
        });
      }

      return {
        espacio: {
          nombre:
            espaciosFallback.find((e) => e.id === espacioId)?.nombre || "Espacio",
          horario_apertura: FALLBACK_HORARIO_APERTURA,
          horario_cierre: FALLBACK_HORARIO_CIERRE,
        },
        bloques_ocupados: bloques,
      };
    }
    throw error;
  }
}

export async function getReservas(params?: {
  espacioId?: number;
  fecha?: string;
  page?: number;
  limit?: number;
  estado?: string;
  busqueda?: string;
}): Promise<{ data: Reserva[]; total: number; page: number; limit: number }> {
  try {
    const query = new URLSearchParams();
    if (params?.fecha) query.append("fecha", params.fecha);
    if (params?.espacioId) query.append("espacioId", String(params.espacioId));
    if (params?.estado) query.append("estado", params.estado);
    if (params?.busqueda) query.append("busqueda", params.busqueda);
    query.append("page", String(params?.page ?? 1));
    query.append("limit", String(params?.limit ?? POR_PAGINA));
    const endpoint = `/api/reservas?${query.toString()}`;
    const response = await apiRequest<{
      data: Reserva[];
      total: number;
      page: number;
      limit: number;
    }>(endpoint, { requiresAuth: true });
    return response;
  } catch (error) {
    if (esDesarrollo) {
      console.warn("Usando reservas fallback (DEV)", error);
      const page = params?.page ?? 1;
      const limit = params?.limit ?? POR_PAGINA;
      const filtradas = reservasFallback.filter((reserva) => {
        if (params?.fecha && reserva.fecha_reserva !== params.fecha) return false;
        if (params?.espacioId && reserva.espacio_id !== params.espacioId) return false;
        if (params?.estado === "confirmada" && reserva.estado === "cancelada") return false;
        if (params?.estado === "cancelada" && reserva.estado !== "cancelada") return false;
        if (params?.busqueda) {
          const texto = `${reserva.nombre_solicitante} ${reserva.ci}`.toLowerCase();
          if (!texto.includes(params.busqueda.toLowerCase())) return false;
        }
        return true;
      });
      const total = filtradas.length;
      const data = filtradas.slice((page - 1) * limit, page * limit);
      return { data, total, page, limit };
    }
    throw error;
  }
}

export async function crearReserva(datos: CreateReservaDto): Promise<Reserva> {
  return await apiRequest<Reserva>("/api/reservas", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(datos),
  });
}

export async function cancelarReserva(id: number): Promise<Reserva> {
  try {
    return await apiRequest<Reserva>(`/api/reservas/${id}`, {
      method: "PATCH",
      requiresAuth: true,
      body: JSON.stringify({ estado: "cancelada" }),
    });
  } catch (error) {
    if (error instanceof Error && error.message) {
      throw error;
    }
    console.warn("No se pudo cancelar la reserva", error);
    throw new Error("No se pudo cancelar la reserva");
  }
}

export async function habilitarReserva(id: number): Promise<Reserva> {
  try {
    return await apiRequest<Reserva>(`/api/reservas/${id}`, {
      method: "PATCH",
      requiresAuth: true,
      body: JSON.stringify({ estado: "confirmada" }),
    });
  } catch (error) {
    if (error instanceof Error && error.message) {
      throw error;
    }
    console.warn("No se pudo habilitar la reserva", error);
    throw new Error("No se pudo habilitar la reserva");
  }
}

export async function editarReserva(
  id: number,
  datos: UpdateReservaDto,
): Promise<Reserva> {
  try {
    return await apiRequest<Reserva>(`/api/reservas/${id}`, {
      method: "PATCH",
      requiresAuth: true,
      body: JSON.stringify(datos),
    });
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Error al editar la reserva");
  }
}

export function getComprobanteUrl(id: number): string {
  return `${API_URL}/api/reservas/${id}/comprobante`;
}

export async function descargarComprobanteReserva(
  id: number,
  nombreArchivo: string,
): Promise<void> {
  const token = sessionStorage.getItem("ucb_auth_token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  const response = await fetch(getComprobanteUrl(id), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      sessionStorage.removeItem("ucb_auth_token");
      window.location.href = "/login";
      return;
    }
    throw new Error("No se pudo descargar el comprobante PDF");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo.endsWith(".pdf")
    ? nombreArchivo
    : `${nombreArchivo}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}
