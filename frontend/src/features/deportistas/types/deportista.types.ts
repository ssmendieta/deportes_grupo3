export type EstadoCuenta = "al_dia" | "pendiente" | "no_aplica";

export type TipoDeportista = "estudiante_ucb" | "academia" | "competitivo";

export type DisciplinaRaw = {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden?: number;
};

export type InscripcionRaw = {
  id: number;
  deportista_id: number;
  disciplina_id: number;
  categoria?: string;
  nivel?: string;
  fecha_inscripcion: string;
  fecha_baja?: string | null;
  motivo_baja?: string | null;
  estado: "activo" | "inactivo";
  disciplina?: DisciplinaRaw;
};

export type DeportistaRaw = {
  id: number;
  tipo: TipoDeportista;
  ci: string;
  nombre_completo: string;
  fecha_nacimiento?: string | null;
  genero: string;
  telefono: string;
  email: string;
  direccion?: string | null;
  carrera?: string | null;
  semestre?: number | null;
  matricula_activa: boolean;
  talla_camiseta?: string;
  fecha_ingreso: string;
  activo: boolean;
  inscripciones?: InscripcionRaw[];
  estado_cuenta?: EstadoCuenta;
  deuda?: number;
};

export type DeportistasRawResponse = {
  data: DeportistaRaw[];
  total: number;
  page: number;
  limit: number;
};

export type Disciplina = {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
};

export type Inscripcion = {
  id: number;
  deportistaId: number;
  disciplinaId: number;
  categoria?: string;
  nivel?: string;
  fechaInscripcion: string;
  activo: boolean;
  disciplina?: Disciplina;
};

export type Deportista = {
  id: number;
  tipo: TipoDeportista;
  ci: string;
  nombreCompleto: string;
  fechaNacimiento?: string | null;
  genero: string;
  telefono: string;
  email: string;
  direccion?: string | null;
  carrera?: string | null;
  semestre?: number | null;
  matriculaActiva: boolean;
  tallaCamiseta?: string;
  activo: boolean;
  inscripciones?: Inscripcion[];
  estadoCuenta?: EstadoCuenta;
  deuda?: number;
};

export type DeportistaFormData = {
  nombreCompleto: string;
  ci: string;
  fechaNacimiento?: string;
  genero: string;
  telefono: string;
  email: string;
  direccion?: string;
  carrera?: string;
  semestre?: string;
  tipo: TipoDeportista;
  matriculaActiva?: boolean;
  tallaCamiseta?: string;
  activo: boolean;
  disciplinaId?: number;
  categoria?: string;
  nivel?: string;
};

export type PagoRaw = {
  id: number;
  deportista_id: number;
  concepto_id: number;
  monto: number | string;
  mes: number | null;
  anio: number | null;
  fecha_pago: string;
  comprobante: string | null;
  origen: string;
  estado: "confirmado" | "anulado";
  observaciones: string | null;
  concepto: {
    id: number;
    nombre: string;
    monto: number | string;
    periodicidad: string | null;
  };
};

export type PagoHistorial = {
  id: number;
  mes: string;
  anio: number;
  concepto: string;
  monto: number;
  estado: "confirmado" | "anulado";
  fechaPago?: string;
  observaciones?: string;
  anulado: boolean;
};
