const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export type BloqueOcupado = {
  hora_inicio: string;
  hora_fin: string;
  tipo: "clase" | "reserva";
  estado?: string;
  motivo?: string;
};

export type DisponibilidadEspacio = {
  espacio: {
    nombre: string;
    horario_apertura: string;
    horario_cierre: string;
  };
  bloques_ocupados: BloqueOcupado[];
};

export type Espacio = {
  id: number;
  nombre: string;
  ubicacion: string;
  capacidad: number;
  horario_apertura: string;
  horario_cierre: string;
  activo: boolean;
};

export type Disciplina = {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  orden: number;
};

export type Reserva = {
  id: number;
  espacio_id: number;
  nombre_solicitante: string;
  carnet: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  disciplina_id: number;
  motivo: string;
  estado: string;
  espacio: Espacio;
  disciplina: Disciplina;
};

export type CreateReservaDto = {
  espacio_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  disciplina_id: number;
  motivo: string;
  nombre_solicitante: string;
  carnet: string;
};

const headersAdmin = {
  "Content-Type": "application/json",
  "x-rol": "admin",
};

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

// En reservaService.ts — reemplaza la función fechaParaAPI completa
export const fechaParaAPI = (semanaBase: Date, indiceDia: number): string => {
  // Extraer año, mes y día en hora LOCAL (no UTC) para evitar desfase
  const anio = semanaBase.getFullYear();
  const mes = semanaBase.getMonth();
  const dia = semanaBase.getDate();

  // Crear fecha local explícita sin conversión UTC
  const fecha = new Date(anio, mes, dia + indiceDia);

  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
export const getEspacios = async (): Promise<Espacio[]> => {
  const response = await fetch(`${API_URL}/api/espacios`);
  if (!response.ok) throw new Error("No se pudieron cargar espacios");
  return response.json();
};

export const getDisciplinas = async (): Promise<Disciplina[]> => {
  const response = await fetch(`${API_URL}/api/disciplinas`);
  if (!response.ok) throw new Error("No se pudieron cargar disciplinas");
  return response.json();
};

export const getDisponibilidad = async (
  espacioId: number,
  fecha: string,
): Promise<DisponibilidadEspacio> => {
  const response = await fetch(
    `${API_URL}/api/horarios-disponibles/${espacioId}?fecha=${fecha}`,
  );

  if (!response.ok) {
    throw new Error("No se pudo cargar disponibilidad");
  }

  return response.json();
};

export const getReservas = async (params?: {
  espacioId?: number;
  fecha?: string;
}): Promise<Reserva[]> => {
  const query = new URLSearchParams();

  if (params?.espacioId) query.append("espacioId", String(params.espacioId));
  if (params?.fecha) query.append("fecha", params.fecha);

  const response = await fetch(`${API_URL}/api/reservas?${query.toString()}`, {
    headers: headersAdmin,
  });

  if (!response.ok) throw new Error("No se pudieron cargar reservas");

  return response.json();
};

export const crearReserva = async (
  datos: CreateReservaDto,
): Promise<Reserva | null> => {
  const response = await fetch(`${API_URL}/api/reservas`, {
    method: "POST",
    headers: headersAdmin,
    body: JSON.stringify(datos),
  });

  const text = await response.text();

  if (!response.ok) {
    const error = text
      ? JSON.parse(text)
      : { message: "Error al crear la reserva" };
    throw new Error(error.message);
  }

  return text ? JSON.parse(text) : null;
};

export const cancelarReserva = async (id: number): Promise<Reserva> => {
  const response = await fetch(`${API_URL}/api/reservas/${id}`, {
    method: "PATCH",
    headers: headersAdmin,
    body: JSON.stringify({ estado: "cancelada" }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

export const descargarComprobante = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/reservas/${id}/comprobante`, {
    headers: headersAdmin,
  });

  if (!response.ok) {
    throw new Error("Error al generar el comprobante");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank");
};

export const habilitarReserva = async (id: number): Promise<Reserva> => {
  const response = await fetch(`${API_URL}/api/reservas/${id}`, {
    method: "PATCH",
    headers: headersAdmin,
    body: JSON.stringify({ estado: "confirmada" }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

export type UpdateReservaDto = {
  estado?: "confirmada" | "cancelada";
  fecha?: string;
  hora_inicio?: string;
  hora_fin?: string;
  nombre_solicitante?: string;
  carnet?: string;
  motivo?: string;
  disciplina_id?: number;
  espacio_id?: number;
};

export const editarReserva = async (
  id: number,
  datos: UpdateReservaDto,
): Promise<Reserva> => {
  const response = await fetch(`${API_URL}/api/reservas/${id}`, {
    method: "PATCH",
    headers: headersAdmin,
    body: JSON.stringify(datos),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};
