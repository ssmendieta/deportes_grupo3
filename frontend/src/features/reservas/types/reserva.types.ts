export type Espacio = {
  id: number;
  nombre: string;
  horario_apertura: string;
  horario_cierre: string;
  activo: boolean;
};

export type DisciplinaBasica = {
  id: number;
  nombre: string;
  activo?: boolean;
};

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

export type Reserva = {
  id: number;
  espacio_id: number;
  id_persona_aprobador?: number | null;
  id_solicitante?: number | null;
  nombre_solicitante: string;
  ci: number;
  complemento?: string | null;
  correo_solicitante?: string | null;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_reserva: string;
  motivo: string;
  estado: string;
  espacio?: Espacio | null;
  aprobador_nombre?: string | null;
  solicitante_nombre?: string | null;
};

export type ReservaFormData = {
  nombre_solicitante: string;
  ci: string;
  complemento?: string;
  correo_solicitante?: string;
  motivo: string;
  espacio_id: string;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_reserva: string;
};

export type CreateReservaDto = {
  espacio_id: number;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_reserva: string;
  motivo: string;
  nombre_solicitante: string;
  ci: number;
  complemento?: string;
  correo_solicitante?: string;
  id_solicitante?: number;
};

export type UpdateReservaDto = {
  estado?: "confirmada" | "cancelada";
  fecha_reserva?: string;
  hora_inicio?: string;
  hora_fin?: string;
  nombre_solicitante?: string;
  ci?: number;
  complemento?: string;
  correo_solicitante?: string;
  motivo?: string;
  tipo_reserva?: string;
  espacio_id?: number;
  id_solicitante?: number;
};
