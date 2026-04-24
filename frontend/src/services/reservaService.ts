const API_URL = "http://localhost:4000";

// ===== TIPOS =====
export type TipoEspacio = "coliseo" | "arquitectura";

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

// ===== ESPACIOS =====
export const getEspacios = async (): Promise<Espacio[]> => {
  const response = await fetch(`${API_URL}/api/espacios`);
  return response.json();
};

export const getEspacio = async (id: number): Promise<Espacio> => {
  const response = await fetch(`${API_URL}/api/espacios/${id}`);
  return response.json();
};

// ===== DISCIPLINAS =====
export const getDisciplinas = async (): Promise<Disciplina[]> => {
  const response = await fetch(`${API_URL}/api/disciplinas`);
  return response.json();
};

// ===== HORARIOS =====
export const getDisponibilidad = async (
  espacioId: number,
  fecha: string,
): Promise<DisponibilidadEspacio> => {
  const response = await fetch(
    `${API_URL}/api/horarios-disponibles/${espacioId}?fecha=${fecha}`,
  );
  return response.json();
};

// ===== RESERVAS (solo admin) =====
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
  return response.json();
};

export const getReserva = async (id: number): Promise<Reserva> => {
  const response = await fetch(`${API_URL}/api/reservas/${id}`, {
    headers: headersAdmin,
  });
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

// ===== HELPERS =====
export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const HORAS_CALENDARIO = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

export const fechaParaAPI = (semanaBase: Date, indiceDia: number): string => {
  const fecha = new Date(semanaBase);
  fecha.setDate(fecha.getDate() + indiceDia);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
