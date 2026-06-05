export type EstadoDisciplina = "activa" | "inactiva";
export type FiltroEstadoDisciplina = "todas" | "activas" | "inactivas";

export type Disciplina = {
  id: number;
  nombre: string;
  estado: EstadoDisciplina;
};

export type DisciplinaFormData = {
  nombre: string;
  estado: EstadoDisciplina;
};
