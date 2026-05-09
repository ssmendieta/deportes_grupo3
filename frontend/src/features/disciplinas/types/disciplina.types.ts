export type EstadoDisciplina = "activa" | "inactiva";
export type FiltroEstadoDisciplina = "todas" | "activas" | "inactivas";

export type Disciplina = {
  id: number;
  nombre: string;
  descripcion: string;
  categorias: string;
  mensualidad: number;
  estado: EstadoDisciplina;
};

export type DisciplinaFormData = {
  nombre: string;
  descripcion: string;
  categorias: string;
  mensualidad: string;
  estado: EstadoDisciplina;
};
