export type EstadoDisciplina = "activa" | "inactiva";
export type FiltroEstadoDisciplina = "todas" | "activas" | "inactivas";
export type TipoDisciplina = "academia" | "clase_libre" | "competitivo";

export type Entrenador = {
  id: number;
  nombre: string;
};

export type Disciplina = {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: TipoDisciplina;
  categorias: string;
  mensualidad: number;
  estado: EstadoDisciplina;
  entrenadorId: number | null;
  entrenador?: Entrenador | null;
};

export type DisciplinaFormData = {
  nombre: string;
  descripcion: string;
  tipo: TipoDisciplina | "";
  entrenadorId: string;
  categorias: string;
  mensualidad: string;
  estado: EstadoDisciplina;
};
