export type Espacio = {
  id: number;
  nombre: string;
  ubicacion?: string;
  capacidad?: number;
  horario_apertura: string;
  horario_cierre: string;
  activo: boolean;
};

export type DisciplinaBasica = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
  orden?: number;
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
  nombre_solicitante: string;
  carnet: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  disciplina_id: number;
  motivo: string;
  estado: string;
  espacio?: Espacio;
  disciplina?: DisciplinaBasica;
};

export type ReservaFormData = {
  nombre_solicitante: string;
  carnet: string;
  email_solicitante: string;
  motivo: string;
  espacio_id: string;
  disciplina_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
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
  email_solicitante?: string;
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
