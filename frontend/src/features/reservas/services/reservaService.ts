import { apiRequest, API_URL } from "../../../shared/services/apiClient";
import type {
  BloqueOcupado,
  CreateReservaDto,
  DisponibilidadEspacio,
  DisciplinaBasica,
  Espacio,
  Reserva,
  UpdateReservaDto,
} from "../types/reserva.types";

export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const HORAS_CALENDARIO = [
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

const espaciosFallback: Espacio[] = [
  {
    id: 1,
    nombre: "Coliseo Polideportivo",
    ubicacion: "UCB",
    capacidad: 40,
    horario_apertura: "14:00",
    horario_cierre: "18:00",
    activo: true,
  },
  {
    id: 2,
    nombre: "Cancha de Arquitectura",
    ubicacion: "Arquitectura",
    capacidad: 20,
    horario_apertura: "14:00",
    horario_cierre: "18:00",
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
    carnet: "7654321",
    fecha: "2026-04-25",
    hora_inicio: "14:00",
    hora_fin: "15:30",
    disciplina_id: 3,
    motivo: "Práctica deportiva",
    estado: "confirmada",
    espacio: espaciosFallback[0],
    disciplina: disciplinasFallback[2],
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

function buildReservasQuery(params?: { espacioId?: number; fecha?: string }) {
  const query = new URLSearchParams();

  if (params?.espacioId) query.append("espacioId", String(params.espacioId));
  if (params?.fecha) query.append("fecha", params.fecha);

  const queryString = query.toString();
  return queryString ? `/api/reservas?${queryString}` : "/api/reservas";
}

export async function getEspacios(): Promise<Espacio[]> {
  try {
    const data = await apiRequest<Espacio[]>("/api/espacios");
    return data.length ? data : espaciosFallback;
  } catch (error) {
    console.warn("Usando espacios fallback", error);
    return espaciosFallback;
  }
}

export async function getDisciplinasReserva(): Promise<DisciplinaBasica[]> {
  try {
    const data = await apiRequest<DisciplinaBasica[]>("/api/disciplinas");
    return data.length ? data : disciplinasFallback;
  } catch (error) {
    console.warn("Usando disciplinas fallback para reserva", error);
    return disciplinasFallback;
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
    console.warn("Usando disponibilidad fallback", error);
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
        horario_apertura: "14:00",
        horario_cierre: "18:00",
      },
      bloques_ocupados: bloques,
    };
  }
}

export async function getReservas(params?: {
  espacioId?: number;
  fecha?: string;
}): Promise<Reserva[]> {
  try {
    return await apiRequest<Reserva[]>("/api/reservas", {
      requiresAdmin: true,
    });
  } catch (error) {
    console.warn("Usando reservas fallback", error);
    return reservasFallback.filter((reserva) => {
      const coincideFecha = params?.fecha
        ? reserva.fecha === params.fecha
        : true;
      const coincideEspacio = params?.espacioId
        ? reserva.espacio_id === params.espacioId
        : true;
      return coincideFecha && coincideEspacio;
    });
  }
}

export async function crearReserva(datos: CreateReservaDto): Promise<Reserva> {
  try {
    return await apiRequest<Reserva>("/api/reservas", {
      method: "POST",
      requiresAdmin: true,
      body: JSON.stringify(datos),
    });
  } catch (error) {
    if (error instanceof Error && error.message) {
      throw error;
    }

    console.warn(
      "Backend de reservas no disponible, se simula respuesta",
      error,
    );
    return {
      id: Date.now(),
      estado: "confirmada",
      ...datos,
      espacio: espaciosFallback.find((e) => e.id === datos.espacio_id),
      disciplina: disciplinasFallback.find((d) => d.id === datos.disciplina_id),
    };
  }
}

export async function cancelarReserva(id: number): Promise<Reserva> {
  return apiRequest<Reserva>(`/api/reservas/${id}`, {
    method: "PATCH",
    requiresAdmin: true,
    body: JSON.stringify({ estado: "cancelada" }),
  });
}

export async function habilitarReserva(id: number): Promise<Reserva> {
  return apiRequest<Reserva>(`/api/reservas/${id}`, {
    method: "PATCH",
    requiresAdmin: true,
    body: JSON.stringify({ estado: "confirmada" }),
  });
}

export async function editarReserva(
  id: number,
  datos: UpdateReservaDto,
): Promise<Reserva> {
  return apiRequest<Reserva>(`/api/reservas/${id}`, {
    method: "PATCH",
    requiresAdmin: true,
    body: JSON.stringify(datos),
  });
}

export function getComprobanteUrl(id: number): string {
  return `${API_URL}/api/reservas/${id}/comprobante`;
}

export async function descargarComprobanteReserva(
  id: number,
  nombreArchivo: string,
): Promise<void> {
  const token = localStorage.getItem("ucb_auth_token");
  const response = await fetch(getComprobanteUrl(id), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
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
